import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, parseAssistantRequest, parseModelAnswer } from './assistant.js';
import { citationOf, hasTextbookIndex, retrieve, textbookStats } from './textbook.js';

// The index is private (copyrighted text, git-ignored): without it these tests have nothing to retrieve.
const needsIndex = describe.skipIf(!hasTextbookIndex());

const top = (question, lab = 'electricity') => retrieve({ question, lab });
const pages = (r) => r.map((p) => `${p.book}:${p.page}`);

needsIndex('textbook index', () => {
  it('holds passages from both books with unit, lesson and page metadata', () => {
    const { passages, books } = textbookStats();
    expect(passages).toBeGreaterThan(300);
    expect(books).toEqual(['physics', 'chemistry']);
    for (const p of top('ما هو الأمبير؟')) {
      expect(p).toMatchObject({ unit: expect.any(Number), lesson: expect.toBeOneOf([null, expect.stringMatching(/^\d-\d$/)]), page: expect.any(Number) });
    }
  });
});

needsIndex('textbook retrieval', () => {
  it('finds the ampere definition (Lesson 1-4, p. 122) for the Arabic question', () => {
    const r = top('ما هو الأمبير؟');
    expect(pages(r)).toContain('physics:122');
    expect(r.every((p) => p.text.length > 0)).toBe(true);
  });
  it('finds it for an English question too', () => {
    expect(pages(top('what is an ampere'))).toContain('physics:122');
  });
  it('finds lab-specific concepts in the right unit', () => {
    expect(top('كيف أحسب المقاومة المكافئة للتوالي؟')[0]).toMatchObject({ book: 'physics', unit: 4, lesson: '2-4' });
    expect(top('ما الفرق بين السرعة والسرعة المتجهة؟', 'motion')[0]).toMatchObject({ unit: 2 });
    expect(top('ما هي السعة الحرارية النوعية؟', 'heat')[0]).toMatchObject({ unit: 3 });
    expect(top('ما هو المول؟', 'chemistry')[0]).toMatchObject({ book: 'chemistry' });
  });
  it('returns nothing for topics the textbooks do not cover', () => {
    expect(top('كيف تتم عملية البناء الضوئي في النبات؟')).toEqual([]);
    expect(top('من هو نابليون بونابرت؟')).toEqual([]);
    expect(top('')).toEqual([]);
  });
  it('uses the activity hint when there is no question', () => {
    expect(retrieve({ hint: 'قانون أوم', lab: 'electricity' }).length).toBeGreaterThan(0);
  });
});

needsIndex('answer sources', () => {
  const base = { lab: 'electricity', intent: 'ask', lang: 'ar', question: 'ما هو الأمبير؟' };
  const withPassages = (extra = {}) => ({ ...parseAssistantRequest({ ...base, ...extra }), passages: top('ما هو الأمبير؟') });
  const raw = (o) => JSON.stringify({ answer: 'نص', textbook_ids: [], used_experiment: false, used_general_knowledge: false, ...o });

  const AMPERE = 'الأمبير هو وحدة قياس شدة التيار الكهربائي، ويعرف بأنه المعدل الذي تتحرك فيه الشحنات الكهربائية عبر مقطع الموصل، فالتيار 1 أمبير يعني مرور كولوم واحد من الشحنة في كل ثانية.';
  const idOf = (req, page) => `T${req.passages.findIndex((p) => p.book === 'physics' && p.page === page) + 1}`;

  it('cites only passages that were retrieved and reported as used', () => {
    const req = withPassages();
    const t = idOf(req, 122);
    const out = parseModelAnswer(raw({ answer: AMPERE, textbook_ids: [t, 'T99'] }), req);
    expect(out.sources.textbook).toHaveLength(1);
    expect(out.sources.textbook[0]).toEqual(citationOf(req.passages[Number(t.slice(1)) - 1]));
    expect(out.sources.textbook[0]).toMatchObject({ page: 122, unit: 4, lesson: '1-4' });
    expect(['full', 'partial']).toContain(out.sources.support);
  });
  it('drops a citation whose passage does not support the answer and says the answer is general knowledge', () => {
    const req = withPassages();
    const other = { ...req, passages: [...req.passages, ...top('ما هو المول؟', 'chemistry').slice(0, 1)] };
    const out = parseModelAnswer(raw({ answer: AMPERE, textbook_ids: [`T${other.passages.length}`] }), other);
    expect(out.sources).toMatchObject({ textbook: [], support: 'none', general: true });
  });
  it('downgrades to partial when the answer adds numbers the cited text does not contain', () => {
    const req = withPassages();
    const out = parseModelAnswer(raw({ answer: `${AMPERE} ويساوي 777 كولوم في الدقيقة.`, textbook_ids: [idOf(req, 122)] }), req);
    expect(out.sources.support).not.toBe('full');
  });
  it('is only partial when the model also used general knowledge', () => {
    const req = withPassages();
    const out = parseModelAnswer(raw({ answer: AMPERE, textbook_ids: [idOf(req, 122)], used_general_knowledge: true }), req);
    expect(out.sources).toMatchObject({ support: 'partial', general: true });
    expect(out.sources.textbook).toHaveLength(1);
  });
  it('ignores invented ids and does not invent a general-knowledge label either', () => {
    const out = parseModelAnswer(raw({ answer: AMPERE, textbook_ids: ['T42', 'phy-p1-1'] }), withPassages());
    expect(out.sources).toMatchObject({ textbook: [], general: false, verified: true });
    expect(parseModelAnswer(raw({ used_general_knowledge: true }), withPassages()).sources.general).toBe(true);
  });
  it('never labels textbook support when nothing was retrieved', () => {
    const req = { ...parseAssistantRequest(base), passages: [] };
    expect(parseModelAnswer(raw({ textbook_ids: ['T1'] }), req).sources.textbook).toEqual([]);
  });
  it('labels experiment use only when simulation state was supplied', () => {
    expect(parseModelAnswer(raw({ used_experiment: true }), withPassages()).sources.experiment).toBe(false);
    expect(parseModelAnswer(raw({ used_experiment: true }), withPassages({ state: 'I = 0.5 A' })).sources.experiment).toBe(true);
  });
  it('treats a non-JSON reply as unverified rather than claiming any source', () => {
    const out = parseModelAnswer('plain text', withPassages());
    expect(out).toMatchObject({ text: 'plain text', sources: { textbook: [], experiment: false, general: false, verified: false } });
  });
  it('puts retrieved passages and the not-in-textbook rule in the system prompt', () => {
    const prompt = buildSystemPrompt(withPassages({ curriculum: 'summary' }));
    expect(prompt).toContain('[T1]');
    expect(prompt).toContain('do not cover it');
    expect(buildSystemPrompt({ ...parseAssistantRequest(base), passages: [] })).toContain('No textbook passage matched');
  });
});
