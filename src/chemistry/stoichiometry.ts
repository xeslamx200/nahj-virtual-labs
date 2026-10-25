/**
 * Mole relationships (textbook Lesson 3-2) and stoichiometry for a balanced equation.
 *
 *   N = n × NA                (NA = 6.022 × 10²³ mol⁻¹; examples round to 6.02)
 *   n = m / Mm                (relation 5-2)
 *   n = V / Vm                (relation 6-2, Vm = 22.4 L/mol for a gas at STP: 0 °C, 1 atm)
 *   n(B) = n(A) × (coef B / coef A)   — the mole ratio from the balanced equation
 *
 * Every function validates its inputs and returns the intermediate steps it used, so the UI
 * can show the working exactly as computed.
 */
import { allSpecies, checkBalance, type Equation } from './equation';
import { molarMassOfCounts, type MassMode } from './molarMass';

export const AVOGADRO = 6.022e23;
export const MOLAR_VOLUME_STP = 22.4;

export type Quantity = 'mass' | 'moles' | 'particles' | 'volume';
export const UNIT: Record<Quantity, string> = { mass: 'g', moles: 'mol', particles: 'particles', volume: 'L' };

export interface Step {
  /** What the step computes. */
  kind: 'molar-mass' | 'to-moles' | 'ratio' | 'from-moles';
  /** Working in plain math notation, e.g. "n = m / Mm = 45.0 / 55.845". */
  expr: string;
  value: number;
  unit: string;
}

export type CalcError =
  | { code: 'not-a-number' }
  | { code: 'not-positive' }
  | { code: 'too-large' }
  | { code: 'unbalanced' }
  | { code: 'not-gas'; formula: string }
  | { code: 'same-species' }
  | { code: 'bad-index' };

export type CalcResult = { ok: true; value: number; unit: string; steps: Step[] } | { ok: false; error: CalcError };

const MAX_INPUT = 1e30;

function checkAmount(x: number): CalcError | null {
  if (!Number.isFinite(x)) return { code: 'not-a-number' };
  if (x <= 0) return { code: 'not-positive' };
  if (x > MAX_INPUT) return { code: 'too-large' };
  return null;
}

const g = (x: number) => Number(x.toPrecision(6)).toString();

function toMoles(amount: number, q: Quantity, Mm: number): Step {
  switch (q) {
    case 'moles':
      return { kind: 'to-moles', expr: `n = ${g(amount)} mol`, value: amount, unit: 'mol' };
    case 'mass':
      return { kind: 'to-moles', expr: `n = m / Mm = ${g(amount)} g ÷ ${g(Mm)} g/mol`, value: amount / Mm, unit: 'mol' };
    case 'particles':
      return { kind: 'to-moles', expr: `n = N / NA = ${amount.toExponential(3)} ÷ ${AVOGADRO.toExponential(3)}`, value: amount / AVOGADRO, unit: 'mol' };
    case 'volume':
      return { kind: 'to-moles', expr: `n = V / Vm = ${g(amount)} L ÷ ${MOLAR_VOLUME_STP} L/mol`, value: amount / MOLAR_VOLUME_STP, unit: 'mol' };
  }
}

function fromMoles(n: number, q: Quantity, Mm: number): Step {
  switch (q) {
    case 'moles':
      return { kind: 'from-moles', expr: `n = ${g(n)} mol`, value: n, unit: 'mol' };
    case 'mass':
      return { kind: 'from-moles', expr: `m = n × Mm = ${g(n)} mol × ${g(Mm)} g/mol`, value: n * Mm, unit: 'g' };
    case 'particles':
      return { kind: 'from-moles', expr: `N = n × NA = ${g(n)} mol × ${AVOGADRO.toExponential(3)}`, value: n * AVOGADRO, unit: 'particles' };
    case 'volume':
      return { kind: 'from-moles', expr: `V = n × Vm = ${g(n)} mol × ${MOLAR_VOLUME_STP} L/mol`, value: n * MOLAR_VOLUME_STP, unit: 'L' };
  }
}

/** Convert between mass, moles, particles and gas volume at STP for one substance. */
export function convert(amount: number, from: Quantity, to: Quantity, molarMassValue: number): CalcResult {
  const bad = checkAmount(amount);
  if (bad) return { ok: false, error: bad };
  if (!(molarMassValue > 0)) return { ok: false, error: { code: 'not-positive' } };
  const a = toMoles(amount, from, molarMassValue);
  const steps = [a];
  if (to !== 'moles') steps.push(fromMoles(a.value, to, molarMassValue));
  const last = steps[steps.length - 1];
  return { ok: true, value: last.value, unit: last.unit, steps };
}

export interface StoichQuery {
  given: { index: number; amount: number; quantity: Quantity };
  target: { index: number; quantity: Quantity };
  mode: MassMode;
}

/**
 * Amount of one substance from the amount of another, using the balanced equation's
 * mole ratio (the textbook's "mole map": mass/volume → moles A → moles B → mass/volume).
 */
export function stoichiometry(eq: Equation, coefficients: number[], q: StoichQuery): CalcResult {
  const species = allSpecies(eq);
  const A = species[q.given.index];
  const B = species[q.target.index];
  if (!A || !B) return { ok: false, error: { code: 'bad-index' } };
  if (q.given.index === q.target.index) return { ok: false, error: { code: 'same-species' } };
  if (checkBalance(eq, coefficients).status === 'unbalanced') return { ok: false, error: { code: 'unbalanced' } };
  const bad = checkAmount(q.given.amount);
  if (bad) return { ok: false, error: bad };
  for (const [sp, quantity] of [
    [A, q.given.quantity],
    [B, q.target.quantity],
  ] as const) {
    // The molar volume applies to gases only (textbook note to Example 33).
    if (quantity === 'volume' && sp.state !== 'g') return { ok: false, error: { code: 'not-gas', formula: sp.formula } };
  }
  const MA = molarMassOfCounts(A.formula, A.counts, q.mode).total;
  const MB = molarMassOfCounts(B.formula, B.counts, q.mode).total;
  const steps: Step[] = [];
  if (q.given.quantity === 'mass') steps.push({ kind: 'molar-mass', expr: `Mm(${A.formula}) = ${g(MA)} g/mol`, value: MA, unit: 'g/mol' });
  if (q.target.quantity === 'mass') steps.push({ kind: 'molar-mass', expr: `Mm(${B.formula}) = ${g(MB)} g/mol`, value: MB, unit: 'g/mol' });
  const nA = toMoles(q.given.amount, q.given.quantity, MA);
  steps.push(nA);
  const cA = coefficients[q.given.index];
  const cB = coefficients[q.target.index];
  const nB = (nA.value * cB) / cA;
  steps.push({ kind: 'ratio', expr: `n(${B.formula}) = ${g(nA.value)} mol ${A.formula} × (${cB} mol ${B.formula} / ${cA} mol ${A.formula})`, value: nB, unit: 'mol' });
  if (q.target.quantity !== 'moles') steps.push(fromMoles(nB, q.target.quantity, MB));
  const last = steps[steps.length - 1];
  return { ok: true, value: last.value, unit: last.unit, steps };
}

/** Total mass of each side for the given coefficients (one "mole-equation" worth). */
export function sideMasses(eq: Equation, coefficients: number[], mode: MassMode): { left: number; right: number } {
  let left = 0;
  let right = 0;
  allSpecies(eq).forEach((sp, i) => {
    const m = coefficients[i] * molarMassOfCounts(sp.formula, sp.counts, mode).total;
    if (sp.side === 'reactant') left += m;
    else right += m;
  });
  return { left, right };
}
