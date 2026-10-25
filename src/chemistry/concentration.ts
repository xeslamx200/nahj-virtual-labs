/**
 * Solution concentration (textbook Lesson 3-2, equation 7-2 and Activity 3-2b).
 *
 *   M = n / V           molarity, mol/L, V = volume of SOLUTION in litres
 *   n = M × V,  V = n / M
 *   m = M × V × Mm      mass of solute for a solution of known volume and molarity
 *
 * Percentage by mass (mentioned in the unit overview; no worked example in the lesson):
 *   % by mass = m(solute) / m(solution) × 100,  m(solution) = m(solute) + m(solvent)
 *
 * Dilution is not in this textbook and is not offered.
 */
export type ConcError = { code: 'not-a-number' } | { code: 'not-positive' } | { code: 'too-large' } | { code: 'solute-exceeds-solution' };
export type ConcResult = { ok: true; value: number } | { ok: false; error: ConcError };

const LIMIT = 1e9;

function check(...xs: number[]): ConcError | null {
  for (const x of xs) {
    if (!Number.isFinite(x)) return { code: 'not-a-number' };
    if (x <= 0) return { code: 'not-positive' };
    if (x > LIMIT) return { code: 'too-large' };
  }
  return null;
}
const wrap = (err: ConcError | null, f: () => number): ConcResult => (err ? { ok: false, error: err } : { ok: true, value: f() });

export const mLToL = (mL: number) => mL / 1000;

export const molarity = (n: number, V_L: number) => wrap(check(n, V_L), () => n / V_L);
export const molesFromMolarity = (M: number, V_L: number) => wrap(check(M, V_L), () => M * V_L);
export const volumeFromMoles = (n: number, M: number) => wrap(check(n, M), () => n / M);
export const massForSolution = (M: number, V_L: number, Mm: number) => wrap(check(M, V_L, Mm), () => M * V_L * Mm);
export const molarityFromMass = (m: number, Mm: number, V_L: number) => wrap(check(m, Mm, V_L), () => m / Mm / V_L);

export function massPercent(mSolute: number, mSolution: number): ConcResult {
  const err = check(mSolute, mSolution);
  if (err) return { ok: false, error: err };
  if (mSolute > mSolution) return { ok: false, error: { code: 'solute-exceeds-solution' } };
  return { ok: true, value: (mSolute / mSolution) * 100 };
}

/** Percentage error of a prepared solution against its target. */
export const percentError = (actual: number, target: number) => ((actual - target) / target) * 100;
