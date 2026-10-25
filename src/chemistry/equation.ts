/**
 * Chemical equations: parsing, atom/charge tallies, balance checking and an exact solver.
 *
 * Learners change coefficients only. Formulas (and therefore subscripts) are fixed once an
 * equation is loaded; the checker never edits them. The solver finds the smallest whole-number
 * coefficients with exact rational arithmetic (no floating point), and is used to confirm that
 * an equation can be balanced and to reveal the answer after the hints.
 */
import { parseFormula, type FormulaError, type ParsedFormula } from './formula';

export interface Species extends ParsedFormula {
  side: 'reactant' | 'product';
}

export interface Equation {
  reactants: Species[];
  products: Species[];
}

export type EquationError =
  | { code: 'no-arrow' }
  | { code: 'many-arrows' }
  | { code: 'empty-side'; side: 'reactant' | 'product' }
  | { code: 'formula'; side: 'reactant' | 'product'; index: number; text: string; error: FormulaError }
  | { code: 'too-many-species' };

export type EquationResult = { ok: true; value: Equation; coefficients: number[] } | { ok: false; error: EquationError };

const ARROW = /\s*(?:->|→|⟶|=>|=)\s*/;
const MAX_SPECIES = 10;

/**
 * Parse "CaCO3 + 2HCl -> CaCl2 + H2O + CO2". Leading whole numbers are read as the starting
 * coefficients (default 1) and are not part of the formula.
 */
export function parseEquation(text: string): EquationResult {
  const sides = text.trim().split(ARROW);
  if (sides.length < 2) return { ok: false, error: { code: 'no-arrow' } };
  if (sides.length > 2) return { ok: false, error: { code: 'many-arrows' } };
  const coefficients: number[] = [];
  const read = (raw: string, side: 'reactant' | 'product'): Species[] | EquationError => {
    const terms = splitTerms(raw);
    if (!terms.length) return { code: 'empty-side', side };
    const out: Species[] = [];
    for (let i = 0; i < terms.length; i++) {
      const m = terms[i].match(/^(\d+)\s*(?=[A-Z(\[])/);
      const coef = m ? Number(m[1]) : 1;
      const body = m ? terms[i].slice(m[0].length) : terms[i];
      const res = parseFormula(body);
      if (!res.ok) return { code: 'formula', side, index: i, text: body, error: res.error };
      coefficients.push(Math.max(1, coef));
      out.push({ ...res.value, side });
    }
    return out;
  };
  const r = read(sides[0], 'reactant');
  if (!Array.isArray(r)) return { ok: false, error: r };
  const p = read(sides[1], 'product');
  if (!Array.isArray(p)) return { ok: false, error: p };
  if (r.length + p.length > MAX_SPECIES) return { ok: false, error: { code: 'too-many-species' } };
  return { ok: true, value: { reactants: r, products: p }, coefficients };
}

/**
 * Split one side into terms. " + " (with spaces) always separates; a "+" written without
 * spaces separates only when the next character starts a new formula ("H2+O2"), so ionic
 * charges such as "Na+ + Cl-" or "Ag^+" stay attached to their formula.
 */
export function splitTerms(raw: string): string[] {
  const out: string[] = [];
  for (const chunk of raw.split(/\s+\+\s+/)) {
    let cur = '';
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];
      if (ch === '+' && cur && cur[cur.length - 1] !== '^' && /^\s*[A-Z0-9(\[]/.test(chunk.slice(i + 1))) {
        out.push(cur.trim());
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
  }
  return out.filter(Boolean);
}

export const allSpecies = (eq: Equation) => [...eq.reactants, ...eq.products];

export interface ElementTally {
  symbol: string;
  left: number;
  right: number;
}

export interface Tally {
  elements: ElementTally[];
  chargeLeft: number;
  chargeRight: number;
  /** Elements that appear on only one side — no coefficients can fix this. */
  oneSided: string[];
}

export function validCoefficients(eq: Equation, coefficients: number[]): boolean {
  return coefficients.length === allSpecies(eq).length && coefficients.every((c) => Number.isInteger(c) && c >= 1 && c <= 999);
}

/** Count every element (and the total charge) on each side for the given coefficients. */
export function tally(eq: Equation, coefficients: number[]): Tally {
  const species = allSpecies(eq);
  const order: string[] = [];
  const left = new Map<string, number>();
  const right = new Map<string, number>();
  let chargeLeft = 0;
  let chargeRight = 0;
  species.forEach((sp, i) => {
    const c = coefficients[i] ?? 1;
    const into = sp.side === 'reactant' ? left : right;
    for (const [sym, k] of sp.counts) {
      if (!order.includes(sym)) order.push(sym);
      into.set(sym, (into.get(sym) ?? 0) + c * k);
    }
    if (sp.side === 'reactant') chargeLeft += c * sp.charge;
    else chargeRight += c * sp.charge;
  });
  const elements = order.map((symbol) => ({ symbol, left: left.get(symbol) ?? 0, right: right.get(symbol) ?? 0 }));
  return { elements, chargeLeft, chargeRight, oneSided: elements.filter((e) => e.left === 0 || e.right === 0).map((e) => e.symbol) };
}

export type BalanceStatus = 'balanced' | 'balanced-not-lowest' | 'unbalanced';

export interface BalanceCheck {
  status: BalanceStatus;
  tally: Tally;
  /** Elements whose counts differ. */
  mismatched: string[];
  chargeBalanced: boolean;
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export function checkBalance(eq: Equation, coefficients: number[]): BalanceCheck {
  const t = tally(eq, coefficients);
  const mismatched = t.elements.filter((e) => e.left !== e.right).map((e) => e.symbol);
  const chargeBalanced = t.chargeLeft === t.chargeRight;
  let status: BalanceStatus = mismatched.length || !chargeBalanced ? 'unbalanced' : 'balanced';
  if (status === 'balanced' && coefficients.reduce(gcd) > 1) status = 'balanced-not-lowest';
  return { status, tally: t, mismatched, chargeBalanced };
}

/* ------------------------------------------------- exact rational solver --- */

type Frac = [bigint, bigint]; // numerator, denominator (> 0)

const bgcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};
const norm = ([n, d]: Frac): Frac => {
  if (n === 0n) return [0n, 1n];
  const g = bgcd(n, d);
  const s = d < 0n ? -1n : 1n;
  return [(s * n) / g, (s * d) / g];
};
const sub = (a: Frac, b: Frac): Frac => norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
const mul = (a: Frac, b: Frac): Frac => norm([a[0] * b[0], a[1] * b[1]]);
const div = (a: Frac, b: Frac): Frac => norm([a[0] * b[1], a[1] * b[0]]);

export type SolveResult =
  | { ok: true; coefficients: number[] }
  | { ok: false; reason: 'one-sided' | 'impossible' | 'not-unique' | 'too-large'; elements?: string[] };

/**
 * Smallest positive whole-number coefficients that conserve every element and the charge.
 * Returns `not-unique` when the reaction is really several independent reactions combined.
 */
export function solveCoefficients(eq: Equation): SolveResult {
  const species = allSpecies(eq);
  const t = tally(eq, species.map(() => 1));
  if (t.oneSided.length) return { ok: false, reason: 'one-sided', elements: t.oneSided };
  const rows: Frac[][] = t.elements.map(({ symbol }) =>
    species.map((sp) => [BigInt((sp.counts.get(symbol) ?? 0) * (sp.side === 'reactant' ? 1 : -1)), 1n] as Frac),
  );
  if (species.some((sp) => sp.charge !== 0)) rows.push(species.map((sp) => [BigInt(sp.charge * (sp.side === 'reactant' ? 1 : -1)), 1n] as Frac));

  // Reduced row echelon form.
  const n = species.length;
  const pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < n && r < rows.length; c++) {
    const p = rows.findIndex((row, i) => i >= r && row[c][0] !== 0n);
    if (p < 0) continue;
    [rows[r], rows[p]] = [rows[p], rows[r]];
    const pv = rows[r][c];
    rows[r] = rows[r].map((x) => div(x, pv));
    for (let i = 0; i < rows.length; i++) {
      if (i === r || rows[i][c][0] === 0n) continue;
      const f = rows[i][c];
      rows[i] = rows[i].map((x, j) => sub(x, mul(f, rows[r][j])));
    }
    pivots.push(c);
    r++;
  }
  const free = [...Array(n).keys()].filter((c) => !pivots.includes(c));
  if (free.length === 0) return { ok: false, reason: 'impossible' };
  if (free.length > 1) return { ok: false, reason: 'not-unique' };

  // One free variable: set it to 1, read the pivots, then scale to whole numbers.
  const fc = free[0];
  const x: Frac[] = Array.from({ length: n }, () => [0n, 1n] as Frac);
  x[fc] = [1n, 1n];
  pivots.forEach((c, i) => {
    x[c] = norm([-rows[i][fc][0], rows[i][fc][1]]);
  });
  const lcm = x.reduce((acc, [, d]) => (acc * d) / bgcd(acc, d), 1n);
  let ints = x.map(([num, d]) => (num * lcm) / d);
  if (ints.every((v) => v <= 0n)) ints = ints.map((v) => -v);
  if (ints.some((v) => v <= 0n)) return { ok: false, reason: 'impossible' };
  const g = ints.reduce((a, b) => bgcd(a, b));
  ints = ints.map((v) => v / g);
  if (ints.some((v) => v > 999n)) return { ok: false, reason: 'too-large' };
  return { ok: true, coefficients: ints.map(Number) };
}

/** "2H2 + O2 → 2H2O" (coefficient 1 omitted, as in the textbook). */
export function equationText(eq: Equation, coefficients: number[], withStates = false): string {
  const term = (s: Species, i: number) => `${coefficients[i] === 1 ? '' : coefficients[i]}${s.formula}${chargeText(s.charge)}${withStates && s.state ? `(${s.state})` : ''}`;
  const left = eq.reactants.map((s, i) => term(s, i)).join(' + ');
  const right = eq.products.map((s, i) => term(s, i + eq.reactants.length)).join(' + ');
  return `${left} → ${right}`;
}

export function chargeText(q: number): string {
  if (q === 0) return '';
  const mag = Math.abs(q) === 1 ? '' : String(Math.abs(q));
  return `^${mag}${q > 0 ? '+' : '-'}`;
}
