/**
 * Retrieval evaluation against server/eval/retrieval-set.json.
 *   node server/eval/evaluate.js          prints a per-question report
 * Gold pages come from the book structure / docs/curriculum-mapping.md (not from retrieval output);
 * each in-scope question also names an evidence term that must occur in a gold-range passage.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieve, tokenize } from '../textbook.js';

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = join(here, '..', 'textbook', 'index.json');
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')).passages : [];
export const loadSet = (name = 'retrieval-set.json') => JSON.parse(readFileSync(join(here, name), 'utf8'));
export const SET = loadSet();

const inRange = (p, [book, a, b]) => p.book === book && p.page >= a && p.page <= b;

/** True when the gold range really contains a passage with the evidence term (guards against bogus gold). */
export function goldHasEvidence(item) {
  const evidence = [].concat(item.evidence);
  return item.gold.every((g, i) => {
    const [term] = tokenize(evidence[i] ?? evidence[0]);
    return index.some((p) => inRange(p, g) && tokenize(p.text).includes(term));
  });
}

export function evaluate(set = SET) {
  const rows = [];
  for (const item of set) {
    const got = retrieve({ question: item.q, lab: item.lab });
    if (item.kind === 'out') {
      rows.push({ ...item, got, ok: got.length === 0 });
      continue;
    }
    const rank = got.findIndex((p) => item.gold.some((g) => inRange(p, g)));
    const covered = item.gold.map((g) => got.some((p) => inRange(p, g)));
    const relevant = got.filter((p) => item.gold.some((g) => inRange(p, g))).length;
    rows.push({ ...item, got, rank, hit: rank >= 0, top1: rank === 0, allCovered: covered.every(Boolean), precision: got.length ? relevant / got.length : 0 });
  }
  return rows;
}

export function summarize(rows) {
  const inScope = rows.filter((r) => r.kind !== 'out');
  const out = rows.filter((r) => r.kind === 'out');
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const byKind = {};
  for (const r of inScope) (byKind[r.kind] ??= []).push(r);
  return {
    inScope: inScope.length,
    hitAt4: mean(inScope.map((r) => (r.hit ? 1 : 0))),
    top1: mean(inScope.map((r) => (r.top1 ? 1 : 0))),
    mrr: mean(inScope.map((r) => (r.hit ? 1 / (r.rank + 1) : 0))),
    citationPrecision: mean(inScope.map((r) => r.precision)),
    multiAllCovered: mean(inScope.filter((r) => r.kind === 'multi').map((r) => (r.allCovered ? 1 : 0))),
    outOfScope: out.length,
    outOfScopeRejected: mean(out.map((r) => (r.ok ? 1 : 0))),
    hitByKind: Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, `${v.filter((r) => r.hit).length}/${v.length}`])),
  };
}

if (process.argv[1] && process.argv[1].endsWith('evaluate.js')) {
  const set = loadSet(process.argv[2] ?? 'retrieval-set.json');
  const rows = evaluate(set);
  for (const r of rows) {
    const pages = r.got.map((p) => `${p.page}`).join(',') || '-';
    const status = r.kind === 'out' ? (r.ok ? 'OK ' : 'FP ') : r.hit ? (r.top1 ? 'OK ' : 'ok@' + (r.rank + 1)) : 'MISS';
    console.log(`${status.padEnd(5)} ${r.id.padEnd(4)} ${r.kind.padEnd(10)} got pages [${pages}]  ${r.q}`);
  }
  const bad = set.filter((i) => i.kind !== 'out' && !goldHasEvidence(i)).map((i) => i.id);
  console.log('\nGold without evidence in range:', bad.join(',') || 'none');
  console.log(JSON.stringify(summarize(rows), null, 1));
}
