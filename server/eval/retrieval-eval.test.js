import { describe, expect, it } from 'vitest';
import { hasTextbookIndex } from '../textbook.js';
import { evaluate, goldHasEvidence, loadSet, summarize } from './evaluate.js';

const dev = loadSet('retrieval-set.json');
const heldout = loadSet('retrieval-heldout.json');

const needsIndex = describe.skipIf(!hasTextbookIndex());

needsIndex('retrieval evaluation set', () => {
  it('has gold pages that really contain the evidence term (gold is not invented)', () => {
    const bad = [...dev, ...heldout].filter((i) => i.kind !== 'out' && !goldHasEvidence(i)).map((i) => i.id);
    expect(bad).toEqual([]);
  });
  it('covers Arabic and English, paraphrased, ambiguous, multi-lesson and out-of-curriculum questions', () => {
    const kinds = new Set(dev.map((i) => i.kind));
    expect([...kinds].sort()).toEqual(['ambiguous', 'direct', 'multi', 'out', 'paraphrase']);
    expect(dev.some((i) => /^[A-Za-z]/.test(i.q))).toBe(true);
    expect(new Set(dev.map((i) => i.lab))).toEqual(new Set(['electricity', 'motion', 'heat', 'chemistry']));
  });
});

// Floors sit below the measured values so ordinary changes do not break the build, but a real regression does.
needsIndex('retrieval quality', () => {
  it('finds a gold-range passage in the top 4 for in-scope questions (dev set)', () => {
    const s = summarize(evaluate(dev));
    expect(s.hitAt4).toBeGreaterThanOrEqual(0.95);
    expect(s.mrr).toBeGreaterThanOrEqual(0.8);
    expect(s.outOfScopeRejected).toBeGreaterThanOrEqual(0.8);
  });
  it('generalises to held-out questions written before tuning', () => {
    const s = summarize(evaluate(heldout));
    expect(s.hitAt4).toBeGreaterThanOrEqual(0.9);
    expect(s.top1).toBeGreaterThanOrEqual(0.85);
    expect(s.outOfScopeRejected).toBe(1);
  });
  it('returns nothing for clearly out-of-curriculum questions', () => {
    for (const r of evaluate(dev).filter((x) => ['X1', 'X2', 'X4', 'X6', 'X7'].includes(x.id))) expect(r.got, r.q).toEqual([]);
  });
});
