/**
 * Local textbook retrieval for the AI assistant.
 *
 * server/textbook/index.json holds passages of the two Grade 10 science textbooks
 * (built by scripts/build-textbook-index.py). For every question the best few
 * passages are selected with BM25 and sent to Gemini as trusted curriculum
 * context. Each passage carries its book, unit, lesson and printed page, so a
 * citation is always built from retrieved metadata, never from model output.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// TEXTBOOK_INDEX_PATH lets a host keep the (private) index outside the project, e.g. on a mounted secret file.
const INDEX_PATH = process.env.TEXTBOOK_INDEX_PATH || join(dirname(fileURLToPath(import.meta.url)), 'textbook', 'index.json');
const MAX_PASSAGES = 4;
const MIN_SCORE = 2.5;
/** A passage must match at least this share of the question's term weight (stops filler words from "supporting" an unrelated topic). */
const MIN_COVERAGE = 0.5;
const MIN_RELATIVE = 0.5;
const DIVERSITY = 0.8;
const SECTION_PENALTY = 0.85;
/** Passages from the open lab's own unit(s) are favoured; other units stay reachable. */
const LAB_UNITS = { electricity: ['physics', 4], motion: ['physics', 2], heat: ['physics', 3], chemistry: ['chemistry', null] };
const LAB_BOOST = 1.35;

// Arabic letters are reduced to a skeleton so spelling variants and the extractor's
// lam-alef ligature quirks (الأمبير / األمبير) index the same way.
const ARABIC_DIACRITICS = /[ً-ٰٟـ]/g;
const CHAR_MAP = { أ: 'ا', إ: 'ا', آ: 'ا', ٱ: 'ا', ى: 'ي', ة: 'ه', ؤ: 'و', ئ: 'ي', ء: '' };

function skeleton(word) {
  let w = word.replace(ARABIC_DIACRITICS, '').replace(/[أإآٱىةؤئء]/g, (c) => CHAR_MAP[c]);
  w = w.replace(/[ال]/g, '');
  // Light stemming, applied identically to the books and to questions: a final ه (from ة), then one of ي/ت/ن
  // (so كهربائي and كهربائية, or الإزاحة and إزاحة, meet at the same stem).
  if (w.length >= 4 && w.endsWith('ه')) w = w.slice(0, -1);
  if (w.length >= 4 && /[يتن]$/.test(w)) w = w.slice(0, -1);
  return w;
}

export function tokenize(text) {
  const spaced = String(text)
    .replace(/([؀-ۿ])([A-Za-z0-9])/g, '$1 $2')
    .replace(/([A-Za-z0-9])([؀-ۿ])/g, '$1 $2');
  const out = [];
  for (const raw of spaced.split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue;
    if (/[؀-ۿ]/.test(raw)) {
      const t = skeleton(raw);
      // a conjunction prefix on a filler word (وكيف, فماذا) is filler too
      const clitic = /^[وف]/.test(raw) && STOP.has(skeleton(raw.slice(1)));
      if (t.length >= 2 && !STOP.has(t) && !clitic) out.push(t);
    } else {
      const lower = raw.toLowerCase();
      const t = lower.replace(/s$/, '');
      if (t.length >= 2 && !STOP.has(lower) && !STOP.has(t)) out.push(t);
    }
  }
  return out;
}

const STOP = new Set();
for (const w of 'ما هو هي هذا هذه ماذا لماذا كيف متى اين هل ماهو ماهي عن من في علي الي يعني تعني اشرح وضح عرف اذكر ما يمكن كل بين التي الذي ذلك ان او ثم قد لا فيه احسب تحسب يحسب نحسب اوجد جد كم the what is are how why does do did of in to and a an for with explain me about it its who whom which when where was were be been can could would should will this that these those or not as at by on from into than then there their they you your we our i he she his her has have had tell give find calculate'.split(' ')) STOP.add(skeleton(w));

// A few English science terms mapped to the textbook's Arabic terms, so English questions can retrieve Arabic passages.
const EN_AR = {
  law: 'قانون', graph: 'الرسم البياني', slope: 'الميل', formula: 'المعادلة', group: 'المجموعة', period: 'الدورة', atomic: 'الذري', ion: 'الأيون',
  ampere: 'الأمبير', amp: 'الأمبير', current: 'التيار الكهربائي', voltage: 'الجهد الكهربائي', potential: 'الجهد الكهربائي', resistance: 'المقاومة الكهربائية',
  resistor: 'المقاومة', ohm: 'أوم', circuit: 'الدائرة الكهربائية', series: 'التوالي', parallel: 'التوازي', power: 'القدرة الكهربائية', charge: 'الشحنة الكهربائية',
  speed: 'السرعة', velocity: 'السرعة المتجهة', acceleration: 'التسارع', displacement: 'الإزاحة', distance: 'المسافة', vector: 'الكميات المتجهة', scalar: 'الكميات القياسية',
  heat: 'الحرارة', temperature: 'درجة الحرارة', specific: 'السعة الحرارية النوعية', latent: 'الحرارة الكامنة', melting: 'الانصهار', boiling: 'الغليان',
  mole: 'المول', molarity: 'الموالرية', atom: 'الذرة', element: 'العنصر', periodic: 'الجدول الدوري', reactivity: 'النشاط الكيميائي', equation: 'المعادلة الكيميائية',
  balancing: 'موازنة المعادلات', stoichiometry: 'الحسابات الكيميائية', radius: 'نصف القطر الذري', measurement: 'القياسات', units: 'النظام الدولي للوحدات',
};

export const hasTextbookIndex = () => existsSync(INDEX_PATH);

let cache;
function load() {
  if (cache) return cache;
  let data = { books: {}, passages: [] };
  if (hasTextbookIndex()) data = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
  else console.warn('[textbook] server/textbook/index.json is missing: answers will not be textbook-grounded. Build it with scripts/build-textbook-index.py.');
  const docs = data.passages.map((p) => {
    const tokens = tokenize(p.text);
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { p, tf, len: tokens.length };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = docs.reduce((s, d) => s + d.len, 0) / (docs.length || 1);
  cache = { data, docs, df, avg };
  return cache;
}

export function textbookStats() {
  const { data } = load();
  return { passages: data.passages.length, books: Object.keys(data.books) };
}

/**
 * Question terms as index terms. English words are mapped to the textbook's Arabic terms; English words
 * the books never use are dropped (they say nothing about coverage). An Arabic word the books do not
 * contain is retried without a verb prefix (تحسب -> حسب) or a final letter before it is kept as unknown.
 */
function queryTokens(text) {
  const { df } = load();
  const known = (t) => df.has(t);
  const out = [];
  for (const t of tokenize(text)) {
    if (EN_AR[t]) out.push(...tokenize(EN_AR[t]));
    if (/[؀-ۿ]/.test(t)) {
      const alt = [t.slice(1), t.slice(0, -1)].find((v) => v.length >= 3 && known(v));
      out.push(known(t) ? t : (alt ?? t));
    } else if (known(t)) out.push(t);
  }
  return [...new Set(out)];
}

/**
 * The passages most relevant to `question` (or, with no question, to `hint`, e.g.
 * the activity title). Returns [] when nothing in the textbooks matches well enough,
 * so callers never present weak matches as textbook support.
 */
export function retrieve({ question = '', hint = '', lab } = {}) {
  const { docs, df, avg } = load();
  const q = queryTokens(question.trim() ? question : hint);
  if (!q.length) return [];
  const N = docs.length;
  const [labBook, labUnit] = LAB_UNITS[lab] ?? [];
  const idfOf = (t) => Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
  const total = q.reduce((s, t) => s + idfOf(t), 0);
  const scored = [];
  for (const d of docs) {
    let score = 0;
    let matched = 0;
    let nMatched = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      score += (idfOf(t) * f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.len / avg)));
      matched += idfOf(t);
      nMatched++;
    }
    if (matched / total < MIN_COVERAGE || nMatched < (q.length >= 3 ? 2 : 1)) continue;
    if (d.p.lesson == null) score *= SECTION_PENALTY; // unit introductions and reviews rank below lesson pages
    if (score > 0 && d.p.book === labBook && (labUnit == null || d.p.unit === labUnit)) score *= LAB_BOOST;
    if (score >= MIN_SCORE) scored.push({ ...d.p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0]?.score ?? 0;
  // Greedy pick that discounts passages from a lesson already represented, so a question that needs
  // two lessons (e.g. Ohm's law and series circuits) can surface both.
  const picked = [];
  const perLesson = new Map();
  let pool = scored.filter((s) => s.score >= top * MIN_RELATIVE);
  while (picked.length < MAX_PASSAGES && pool.length) {
    const key = (p) => `${p.book}-${p.unit}-${p.lesson}`;
    pool.sort((a, b) => b.score * DIVERSITY ** (perLesson.get(key(b)) ?? 0) - a.score * DIVERSITY ** (perLesson.get(key(a)) ?? 0));
    const next = pool.shift();
    picked.push(next);
    perLesson.set(key(next), (perLesson.get(key(next)) ?? 0) + 1);
  }
  // Unit introductions and reviews only summarise the lessons: keep them when they are all there is.
  const lessonPassages = picked.filter((p) => p.lesson != null);
  return lessonPassages.length >= 2 ? lessonPassages : picked;
}

/**
 * Does the cited text support the answer, or does the answer merely sit next to it? A lexical check, not
 * a proof: the answer's domain terms (words the books use, minus words repeated from the question) and
 * its numbers are looked up in the cited passages. `extra` is text that may legitimately supply numbers
 * (the question, the lab summary, the simulation state).
 */
export function supportOf({ answer, question = '', cited, extra = '' }) {
  const { df } = load();
  const asked = new Set(queryTokens(question));
  const terms = [...new Set(tokenize(answer))].filter((t) => /[؀-ۿ]/.test(t) && df.has(t) && !asked.has(t));
  const have = new Set(cited.flatMap((p) => tokenize(p.text)));
  const termScore = terms.length ? terms.filter((t) => have.has(t)).length / terms.length : 1;
  const nums = [...new Set(String(answer).match(/\d+(?:\.\d+)?/g) ?? [])];
  const pool = `${cited.map((p) => p.text).join(' ')} ${question} ${extra}`;
  const unsupportedNumbers = nums.filter((n) => !new RegExp(`(^|[^\d.])${n.replace('.', '\.')}($|[^\d])`).test(pool));
  return { termScore, terms: terms.length, unsupportedNumbers };
}

/** Source reference for a retrieved passage: built only from index metadata. */
export function citationOf(p) {
  const { data } = load();
  return {
    id: p.id,
    book: data.books[p.book].title,
    semester: p.semester,
    unit: p.unit,
    unitTitle: p.unitTitle,
    lesson: p.lesson,
    lessonTitle: p.lessonTitle,
    page: p.page,
  };
}
