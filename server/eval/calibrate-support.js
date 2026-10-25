/**
 * Live calibration of the citation-support thresholds (needs GEMINI_API_KEY; not part of `npm test`).
 *   node --env-file=.env server/eval/calibrate-support.js
 * Runs every in-scope evaluation question through the real assistant and prints, for each answer, which
 * passages the model cited, whether they fall in the gold page range, and the support score.
 */
import { askAssistant, parseAssistantRequest, parseModelAnswer } from '../assistant.js';
import { supportOf } from '../textbook.js';
import { loadSet } from './evaluate.js';

const inRange = (c, [book, a, b]) => c.id.startsWith(book.slice(0, 3)) && c.page >= a && c.page <= b;
const rows = [];
for (const item of [...loadSet('retrieval-set.json'), ...loadSet('retrieval-heldout.json')].filter((i) => i.kind !== 'out')) {
  const lang = /^[A-Za-z]/.test(item.q) ? 'en' : 'ar';
  const req = parseAssistantRequest({ lab: item.lab, intent: 'ask', lang, question: item.q, curriculum: '', hint: '' });
  await new Promise((res) => setTimeout(res, 6500)); // stay under the free-tier request rate
  try {
    const r = await askAssistant(req);
    r.sources &&= { ...r.sources };
    const cited = r.sources?.textbook ?? [];
    rows.push({ id: item.id, q: item.q, pages: cited.map((c) => c.page), inGold: cited.every((c) => item.gold.some((g) => inRange(c, g))), support: r.sources?.support, score: r.sources?.score, text: r.text.slice(0, 110).replace(/\n/g, ' ') });
  } catch (e) {
    rows.push({ id: item.id, q: item.q, error: e.category ?? e.status });
  }
}
for (const r of rows) console.log(r.id.padEnd(5), String(r.support ?? r.error).padEnd(8), String(r.score ?? '').padEnd(5), 'cited', JSON.stringify(r.pages), 'allInGold', r.inGold, '|', r.text ?? '');
const by = (k) => rows.filter((r) => r.support === k).length;
console.log({ total: rows.length, full: by('full'), partial: by('partial'), none: by('none') });
void parseModelAnswer;
void supportOf;
