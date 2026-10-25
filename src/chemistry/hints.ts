/**
 * Balancing hints that follow the textbook's strategy (Lesson 2-2). They describe the next
 * move; they never contain the coefficients themselves.
 */
import { allSpecies, checkBalance, type Equation } from './equation';

export type Hint =
  | { code: 'start-with'; element: string }
  | { code: 'polyatomic'; ion: string }
  | { code: 'o-last' }
  | { code: 'elements-last'; formulas: string[] }
  | { code: 'mismatch'; element: string; left: number; right: number }
  | { code: 'charge'; left: number; right: number }
  | { code: 'halves' }
  | { code: 'lowest' };

const IONS = ['SO4', 'NO3', 'CO3', 'PO4', 'HCO3', 'ClO3', 'MnO4', 'NH4', 'OH'];

export function balanceHints(eq: Equation, coefficients: number[]): Hint[] {
  const species = allSpecies(eq);
  const check = checkBalance(eq, coefficients);
  const hints: Hint[] = [];
  const isElement = (f: string) => /^[A-Z][a-z]?\d*$/.test(f);
  // 1. An element (not O or H) found in exactly one reactant and one product.
  const start = check.tally.elements
    .map((e) => e.symbol)
    .filter((sym) => sym !== 'O' && sym !== 'H')
    .find((sym) => eq.reactants.filter((s) => s.counts.has(sym)).length === 1 && eq.products.filter((s) => s.counts.has(sym)).length === 1);
  if (start) hints.push({ code: 'start-with', element: start });
  // 2. A polyatomic ion that appears unchanged on both sides.
  const ion = IONS.find((x) => eq.reactants.some((s) => s.formula.includes(x)) && eq.products.some((s) => s.formula.includes(x)) && !(x === 'OH' && species.some((s) => s.formula === 'H2O')));
  if (ion) hints.push({ code: 'polyatomic', ion });
  // 3. Combustion: balance oxygen last. Otherwise free elements are easiest to adjust last.
  if (eq.reactants.some((s) => s.formula === 'O2') && species.some((s) => s.formula === 'CO2' || s.formula === 'H2O')) hints.push({ code: 'o-last' });
  else {
    const free = species.filter((s) => isElement(s.formula)).map((s) => s.formula);
    if (free.length) hints.push({ code: 'elements-last', formulas: free });
  }
  // 4. What is still wrong right now.
  const bad = check.tally.elements.find((e) => e.left !== e.right);
  if (bad) hints.push({ code: 'mismatch', element: bad.symbol, left: bad.left, right: bad.right });
  else if (!check.chargeBalanced) hints.push({ code: 'charge', left: check.tally.chargeLeft, right: check.tally.chargeRight });
  else if (check.status === 'balanced-not-lowest') hints.push({ code: 'lowest' });
  // 5. Halves appear when a diatomic element must supply an odd number of atoms.
  if (species.some((s) => ['O2', 'H2', 'N2', 'Cl2', 'F2', 'Br2', 'I2'].includes(s.formula))) hints.push({ code: 'halves' });
  return hints;
}
