"""
Build server/textbook/index.json from the two Grade 10 science textbook PDFs.

Usage (needs PyMuPDF: pip install pymupdf):
    python scripts/build-textbook-index.py <physics-s2.pdf> <chemistry-s1.pdf>

Each PDF page inside a lesson is split into short passages that keep the book,
unit, lesson and printed page number. Nothing is invented: titles and page
ranges come from the books' own tables of contents (printed page = PDF page - 12
in both PDFs). The text is the PDF's own text layer with Arabic diacritics and
tatweel removed; it keeps the extractor's letter-order quirks (e.g. lam-alef
ligatures), so it is used as retrieval context, never quoted verbatim to students.
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

PDF_OFFSET = 12  # printed page N is PDF page N + 12 in both books
MAX_CHARS = 900

BOOKS = {
    'physics': {
        'book': {
            'en': 'Science · Grade 10 · Semester 2 · Part 1 (Physics) · 2025–2026',
            'ar': 'العلوم · الصف العاشر · الفصل الدراسي الثاني · الجزء الأول (الفيزياء) · 2025–2026',
        },
        'semester': 2,
        # (unit, unit title en/ar, lesson, lesson title en/ar, first printed page, last printed page)
        'lessons': [
            (1, 'Physical Quantities', 'الكميات الفيزيائية', '1-1', 'The International System of Units (SI)', 'النظام الدولي للوحدات (SI)', 4, 17),
            (1, 'Physical Quantities', 'الكميات الفيزيائية', '2-1', 'Measurements', 'القياسات', 18, 35),
            (2, 'Kinematics', 'علم الحركة (الكينماتيكا)', '1-2', 'Vectors and Scalars', 'الكميات المتجهة والكميات القياسية', 38, 55),
            (2, 'Kinematics', 'علم الحركة (الكينماتيكا)', '2-2', 'Motion Description', 'وصف الحركة', 56, 87),
            (3, 'Heat and Changes in States of Matter', 'الحرارة وتغير حالات المادة', '1-3', 'Temperature and Heat', 'درجة الحرارة والحرارة', 90, 99),
            (3, 'Heat and Changes in States of Matter', 'الحرارة وتغير حالات المادة', '2-3', 'Specific Heat Capacity and Specific Latent Heat', 'السعة الحرارية النوعية والحرارة الكامنة النوعية', 100, 117),
            (4, 'Fundamentals of Electricity', 'أساسيات الكهرباء التيارية', '1-4', 'Current, Voltage and Resistance', 'التيار الكهربائي، والجهد الكهربائي، والمقاومة الكهربائية', 120, 135),
            (4, 'Fundamentals of Electricity', 'أساسيات الكهرباء التيارية', '2-4', 'Complex Circuits', 'الدوائر الكهربائية المركبة', 136, 148),
        ],
    },
    'chemistry': {
        'book': {
            'en': 'Science · Grade 10 · Semester 1 (Chemistry) · 2025–2026',
            'ar': 'العلوم · الصف العاشر · الفصل الدراسي الأول (الكيمياء) · 2025–2026',
        },
        'semester': 1,
        'lessons': [
            (1, 'Periodicity in the Properties of Elements', 'الدورية في خصائص العناصر', '1-1', 'The Periodic Table', 'الجدول الدوري للعناصر', 4, 21),
            (1, 'Periodicity in the Properties of Elements', 'الدورية في خصائص العناصر', '2-1', 'Gradation of Periodic Properties', 'تدرج الخواص الدورية للعناصر', 22, 31),
            (1, 'Periodicity in the Properties of Elements', 'الدورية في خصائص العناصر', '3-1', 'Chemical Reactivity', 'النشاط الكيميائي للعناصر', 32, 49),
            (2, 'The Mole Concept and Stoichiometry', 'مفهوم المول والحسابات الكيميائية', '1-2', 'Mass of Atoms and Compounds', 'كتلة الذرات والمركبات الكيميائية', 52, 65),
            (2, 'The Mole Concept and Stoichiometry', 'مفهوم المول والحسابات الكيميائية', '2-2', 'Chemical Equations', 'المعادلات الكيميائية', 66, 79),
            (2, 'The Mole Concept and Stoichiometry', 'مفهوم المول والحسابات الكيميائية', '3-2', 'Stoichiometry', 'الحسابات الكيميائية', 80, 101),
        ],
    },
}

# Unit introductions and unit reviews (no lesson number). Assessment pages (exercises) are not indexed.
SECTIONS = {
    'physics': [
        (1, 'Physical Quantities', 'الكميات الفيزيائية', 'intro', 2, 3),
        (2, 'Kinematics', 'علم الحركة (الكينماتيكا)', 'intro', 36, 37),
        (3, 'Heat and Changes in States of Matter', 'الحرارة وتغير حالات المادة', 'intro', 88, 89),
        (4, 'Fundamentals of Electricity', 'أساسيات الكهرباء التيارية', 'intro', 118, 119),
        (4, 'Fundamentals of Electricity', 'أساسيات الكهرباء التيارية', 'review', 149, 149),
    ],
    'chemistry': [
        (1, 'Periodicity in the Properties of Elements', 'الدورية في خصائص العناصر', 'intro', 2, 3),
        (2, 'The Mole Concept and Stoichiometry', 'مفهوم المول والحسابات الكيميائية', 'intro', 50, 51),
        (2, 'The Mole Concept and Stoichiometry', 'مفهوم المول والحسابات الكيميائية', 'review', 102, 102),
    ],
}
SECTION_TITLES = {'intro': ('Unit introduction', 'مقدمة الوحدة'), 'review': ('Unit review', 'مراجعة الوحدة')}

DIACRITICS = re.compile('[ً-ٰٟـ]')  # harakat, shadda, superscript alef, tatweel


def clean_line(line: str) -> str:
    line = DIACRITICS.sub('', line)
    line = re.sub(r'[­�■•]', ' ', line)
    return re.sub(r'\s+', ' ', line).strip()


def passages(text: str):
    """Split a page into passages of about MAX_CHARS, breaking only between lines."""
    lines = [clean_line(l) for l in text.splitlines()]
    lines = [l for l in lines if len(l) > 1 and not re.fullmatch(r'[0-9IVX]{1,4}', l)]
    out, cur = [], ''
    for l in lines:
        if cur and len(cur) + len(l) > MAX_CHARS:
            out.append(cur)
            cur = ''
        cur = f'{cur} {l}'.strip()
    if len(cur) >= 40:
        out.append(cur)
    elif cur and out:
        out[-1] += ' ' + cur
    return out


def add_page(doc, items, key, spec, printed, unit, unit_en, unit_ar, lesson, les_en, les_ar):
    idx = printed + PDF_OFFSET - 1
    if idx >= len(doc):
        return
    for n, text in enumerate(passages(doc[idx].get_text())):
        items.append({
            'id': f'{key[:3]}-p{printed}-{n + 1}',
            'book': key,
            'semester': spec['semester'],
            'unit': unit,
            'unitTitle': {'en': unit_en, 'ar': unit_ar},
            'lesson': lesson,
            'lessonTitle': {'en': les_en, 'ar': les_ar},
            'page': printed,
            'text': text,
        })


def build(key: str, pdf_path: str, items: list):
    spec = BOOKS[key]
    doc = pymupdf.open(pdf_path)
    for unit, unit_en, unit_ar, kind, first, last in SECTIONS[key]:
        for printed in range(first, last + 1):
            add_page(doc, items, key, spec, printed, unit, unit_en, unit_ar, None, *SECTION_TITLES[kind])
    for unit, unit_en, unit_ar, lesson, les_en, les_ar, first, last in spec['lessons']:
        for printed in range(first, last + 1):
            add_page(doc, items, key, spec, printed, unit, unit_en, unit_ar, lesson, les_en, les_ar)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    items = []
    build('physics', sys.argv[1], items)
    build('chemistry', sys.argv[2], items)
    out = Path(__file__).resolve().parent.parent / 'server' / 'textbook' / 'index.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    data = {'books': {k: {'title': v['book'], 'semester': v['semester']} for k, v in BOOKS.items()}, 'passages': items}
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(items)} passages, {out.stat().st_size // 1024} KB -> {out}')


if __name__ == '__main__':
    main()
