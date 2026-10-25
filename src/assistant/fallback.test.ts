import { describe, expect, it } from 'vitest';
import { offlineReply } from './fallback';
import { M } from '../chemistry/molarMass';
import type { AssistantSnapshot } from './types';

const snap = (facts: AssistantSnapshot['facts']): AssistantSnapshot => ({ lab: 'chemistry', facts, stateText: '', records: [] });

describe('offline tutor — chemistry', () => {
  it('explains an unbalanced equation without giving coefficients or suggesting subscript changes', () => {
    const out = offlineReply('why', snap({ module: 'reactions', equation: 'HgO(s) → Hg(l) + O2(g)', status: 'unbalanced', mismatched: 'O' }), 'en');
    expect(out.text).toMatch(/atom counts differ for O/);
    expect(out.text).toMatch(/never the subscripts/);
    expect(out.text).not.toMatch(/2HgO/);
  });

  it('explains a Bohr distribution from the engine facts', () => {
    const out = offlineReply('why', snap({ module: 'periodic', element: 'Na', elementName: 'Sodium', Z: 11, bohr: '2,8,1', levels: 3, period: 3, group: 1, valence: 1 }), 'ar');
    expect(out.text).toContain('2,8,1');
    expect(out.text).toContain('الدورة 3');
  });

  it('explains the obtained concentration of a prepared solution', () => {
    const out = offlineReply('why', snap({ module: 'solutions', step: 'filled', weighed: 5.4, solute: 'CuSO4·5H2O', Mm: 249.7, flaskmL: 250, actual: 0.0865, target: 0.0865, error: 0 }), 'en');
    expect(out.text).toMatch(/0\.0865 M/);
  });

  it('computes practice answers with the calculation engine', () => {
    const answers = Array.from({ length: 3 }, () => offlineReply('practice', snap({ module: 'reactions', massMode: 'book' }), 'en'));
    const all = answers.map((a) => `${a.text} ${a.answer}`).join('\n');
    // every practice comes with an engine-computed answer
    answers.forEach((a) => expect(a.answer).toBeTruthy());
    expect(all).toMatch(/g\/mol|mol|M/);
    expect(M('H2SO4', 'book')).toBeCloseTo(98.1, 1);
  });

  it('suggests a chemistry next step', () => {
    expect(offlineReply('next', snap({ module: 'periodic' }), 'en').text).toMatch(/coefficients/);
  });
});
