import { describe, expect, it } from 'vitest';
import { buildReport, toCsv, toHtml, toMarkdown } from './reportModel';
import type { ProgressState } from '../lib/progress';
import { ohmCircuit } from '../physics/circuit/presets';
import { solveCircuit } from '../physics/circuit/solver';

const circuit = ohmCircuit(1, 10);
const state = { circuit, result: solveCircuit(circuit) };
const rows = [1, 2, 3, 4].map((V, i) => ({ id: `r${i}`, values: { V, I: V / 10, R: 10 }, createdAt: i }));
const progress: ProgressState = {
  electricity: {
    'ohm-voltage': {
      hypothesis: 'Current doubles when voltage doubles',
      records: rows,
      answers: {
        'i-at-3v': { value: '0.3', correct: true, attempts: 1, hintsShown: 0, revealed: false },
        slope: { value: '12', correct: false, attempts: 1, hintsShown: 0, revealed: false },
      },
      reflections: {},
      completed: false,
      updatedAt: 1,
    },
  },
};

describe('lab report', () => {
  const r = buildReport('electricity', progress, state, 'en', new Date('2026-10-22T10:00:00Z'));
  const a = r.activities.find((x) => x.id === 'ohm-voltage')!;

  it('fits the recorded V–I data: slope = R = 10 Ω with R² = 1', () => {
    expect(a.fit!.slope).toBeCloseTo(10, 9);
    expect(a.fit!.r2).toBeCloseTo(1, 9);
    expect(a.summary.join(' ')).toContain('slope 10 Ω');
    expect(a.summary.join(' ')).toContain('4 readings');
  });

  it('re-checks answers and hides the expected value of unattempted or wrong answers', () => {
    const [q1, q2, q3] = a.checks;
    expect(q1.status).toBe('correct');
    expect(q1.expected).toBe('0.3 A');
    expect(q2.status).toBe('incorrect');
    expect(q2.expected).toBeUndefined();
    expect(q3.status).toBe('unanswered');
    expect(q3.expected).toBeUndefined();
  });

  it('marks numeric checks that need data when no rows were recorded', () => {
    const empty = buildReport('electricity', {}, state, 'en');
    const slope = empty.activities[0].checks.find((c) => c.prompt.includes('slope'))!;
    expect(slope.status).toBe('needs-data');
  });

  it('exports Markdown, CSV and HTML containing the recorded values only', () => {
    const md = toMarkdown(r, 'en');
    expect(md).toContain('| 4 | 4 | 0.4 | 10 |');
    expect(md).toContain('Current doubles when voltage doubles');
    expect(md).not.toContain('Changing resistance'); // activities not started are left out
    const csv = toCsv(r, 'en');
    expect(csv.split('\n')[1]).toBe('#,tag,Voltage V (V),Current I (A),V / I (Ω)');
    expect(csv).toContain('4,,4,0.4,10');
    const html = toHtml(r, 'ar');
    expect(html).toContain('dir="rtl"');
    expect(html).not.toContain('<script');
  });
});
