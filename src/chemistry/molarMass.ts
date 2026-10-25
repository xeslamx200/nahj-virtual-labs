/**
 * Molar mass, percentage composition and textbook-style working.
 *
 * Two sets of atomic masses are offered:
 *  - `precise`: IUPAC standard atomic weights (elements.ts), as in textbook examples that
 *    use H 1.008, N 14.007, O 15.999, K 39.098, I 126.904 …
 *  - `book`: one decimal place (H 1.0, C 12.0, O 16.0, Na 23.0, Cl 35.5, Fe 55.8), as in most
 *    worked examples of Lesson 3-2.
 */
import { elementBySymbol, roundedMass } from './elements';
import { parseFormula, type FormulaError } from './formula';

export type MassMode = 'precise' | 'book';

export interface MassPart {
  symbol: string;
  count: number;
  atomicMass: number;
  subtotal: number;
  percent: number;
  /** The element has no standard atomic weight; the mass number of a long-lived isotope is used. */
  massNumberOnly: boolean;
}

export interface MolarMass {
  formula: string;
  total: number;
  parts: MassPart[];
  mode: MassMode;
}

export function atomicMass(symbol: string, mode: MassMode): number {
  const e = elementBySymbol(symbol);
  if (!e) throw new Error(`Unknown element ${symbol}`);
  return mode === 'book' ? roundedMass(e) : e.mass;
}

export function molarMassOfCounts(formula: string, counts: Map<string, number>, mode: MassMode = 'precise'): MolarMass {
  const raw = [...counts].map(([symbol, count]) => {
    const atomic = atomicMass(symbol, mode);
    return { symbol, count, atomicMass: atomic, subtotal: atomic * count, massNumberOnly: elementBySymbol(symbol)!.massNumberOnly };
  });
  const total = raw.reduce((a, p) => a + p.subtotal, 0);
  return { formula, total, mode, parts: raw.map((p) => ({ ...p, percent: (p.subtotal / total) * 100 })) };
}

export function molarMass(formula: string, mode: MassMode = 'precise'): { ok: true; value: MolarMass } | { ok: false; error: FormulaError } {
  const res = parseFormula(formula);
  if (!res.ok) return res;
  return { ok: true, value: molarMassOfCounts(res.value.formula, res.value.counts, mode) };
}

/** Molar mass in g/mol, or throws for an invalid formula (for internal, known-good formulas). */
export function M(formula: string, mode: MassMode = 'precise'): number {
  const r = molarMass(formula, mode);
  if (!r.ok) throw new Error(`Invalid formula ${formula}: ${r.error.code}`);
  return r.value.total;
}
