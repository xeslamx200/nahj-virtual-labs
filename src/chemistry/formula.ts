/**
 * Chemical formula parser.
 *
 * Accepts textbook-style formulas: H2O, Ca(OH)2, Al(NO3)3, Fe2(SO4)3, hydrates written with
 * a dot (CuSO4·5H2O, CuSO4.5H2O or CuSO4*5H2O), an optional ionic charge (SO4^2-, Ag^+,
 * NH4^+, or Unicode SO₄²⁻) and an optional state symbol: (s), (l), (g), (aq).
 * Unicode subscript digits are accepted. Nothing is ever "corrected" silently: an input
 * that cannot be read returns an error that names the problem and its position.
 */
import { elementBySymbol } from './elements';

export type StateSymbol = 's' | 'l' | 'g' | 'aq';

export interface ParsedFormula {
  /** The formula as typed, trimmed, without state symbol. */
  formula: string;
  /** Atom counts in order of first appearance. */
  counts: Map<string, number>;
  charge: number;
  state: StateSymbol | null;
}

export type FormulaErrorCode =
  | 'empty'
  | 'unknown-element'
  | 'lowercase-start'
  | 'unexpected-char'
  | 'unclosed-bracket'
  | 'unopened-bracket'
  | 'zero-count'
  | 'too-large'
  | 'bad-charge'
  | 'leading-coefficient';

export interface FormulaError {
  code: FormulaErrorCode;
  /** 0-based index in the cleaned formula. */
  at: number;
  /** The offending text, e.g. the unknown symbol. */
  token?: string;
}

export type FormulaResult = { ok: true; value: ParsedFormula } | { ok: false; error: FormulaError };

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const MAX_COUNT = 9999;
const MAX_LEN = 80;

function normalise(input: string): string {
  let s = '';
  for (const ch of input) {
    const i = SUB.indexOf(ch);
    if (i >= 0) {
      s += String(i);
      continue;
    }
    s += ch;
  }
  return s;
}

/** Split off a trailing charge, returning [body, charge] or an error. */
function splitCharge(s: string): [string, number] | FormulaError {
  // Unicode superscript charge: SO₄²⁻
  const uni = s.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/);
  if (uni) {
    const mag = uni[1] ? Number([...uni[1]].map((c) => SUP.indexOf(c)).join('')) : 1;
    if (mag === 0) return { code: 'bad-charge', at: s.length - uni[0].length };
    return [s.slice(0, -uni[0].length), uni[2] === '⁺' ? mag : -mag];
  }
  const caret = s.indexOf('^');
  if (caret >= 0) {
    const m = s.slice(caret + 1).match(/^(\d*)([+-])$|^([+-])(\d*)$/);
    if (!m) return { code: 'bad-charge', at: caret };
    const digits = m[1] ?? m[4] ?? '';
    const sign = m[2] ?? m[3];
    const mag = digits ? Number(digits) : 1;
    if (mag === 0) return { code: 'bad-charge', at: caret };
    return [s.slice(0, caret), sign === '+' ? mag : -mag];
  }
  // Bare trailing sign after a letter, digit or bracket, e.g. "Na+", "Cl-", "OH-".
  const bare = s.match(/^(.*[A-Za-z0-9)\]])([+-])$/);
  if (bare) return [bare[1], bare[2] === '+' ? 1 : -1];
  return [s, 0];
}

export function parseFormula(input: string): FormulaResult {
  let s = normalise(input).trim();
  if (!s) return { ok: false, error: { code: 'empty', at: 0 } };
  if (s.length > MAX_LEN) return { ok: false, error: { code: 'too-large', at: MAX_LEN } };

  let state: StateSymbol | null = null;
  const st = s.match(/\s*\((s|l|g|aq)\)$/);
  if (st) {
    state = st[1] as StateSymbol;
    s = s.slice(0, -st[0].length).trim();
    if (!s) return { ok: false, error: { code: 'empty', at: 0 } };
  }

  const split = splitCharge(s);
  if (!Array.isArray(split)) return { ok: false, error: split };
  const [body, charge] = split;
  if (!body) return { ok: false, error: { code: 'empty', at: 0 } };

  const counts = new Map<string, number>();
  const add = (into: Map<string, number>, sym: string, k: number) => into.set(sym, (into.get(sym) ?? 0) + k);

  // Hydrates: split on the dot; each later part may start with a whole-number multiplier.
  const parts = body.split(/[·.*•]/);
  let offset = 0;
  for (let p = 0; p < parts.length; p++) {
    let part = parts[p];
    let mult = 1;
    if (p > 0) {
      const m = part.match(/^\d+/);
      if (m) {
        mult = Number(m[0]);
        if (mult === 0) return { ok: false, error: { code: 'zero-count', at: offset } };
        part = part.slice(m[0].length);
        offset += m[0].length;
      }
    }
    if (!part) return { ok: false, error: { code: 'empty', at: offset } };
    const res = parseGroup(part, offset);
    if ('code' in res) return { ok: false, error: res };
    for (const [sym, k] of res) add(counts, sym, k * mult);
    offset += part.length + 1;
  }
  for (const k of counts.values()) if (k > MAX_COUNT) return { ok: false, error: { code: 'too-large', at: 0 } };
  return { ok: true, value: { formula: body, counts, charge, state } };
}

/** Parse a bracket-free or bracketed formula fragment with a stack. */
function parseGroup(s: string, base: number): Map<string, number> | FormulaError {
  const stack: { counts: Map<string, number>; open: string; at: number }[] = [{ counts: new Map(), open: '', at: 0 }];
  let i = 0;
  const readCount = (): number | FormulaError => {
    const m = s.slice(i).match(/^\d+/);
    if (!m) return 1;
    const k = Number(m[0]);
    if (k === 0) return { code: 'zero-count', at: base + i };
    i += m[0].length;
    return k;
  };
  while (i < s.length) {
    const ch = s[i];
    if (ch === '(' || ch === '[') {
      stack.push({ counts: new Map(), open: ch, at: i });
      i++;
      continue;
    }
    if (ch === ')' || ch === ']') {
      const top = stack.pop()!;
      if (stack.length === 0 || top.open !== (ch === ')' ? '(' : '[')) return { code: 'unopened-bracket', at: base + i };
      i++;
      const k = readCount();
      if (typeof k !== 'number') return k;
      if (top.counts.size === 0) return { code: 'empty', at: base + top.at };
      const into = stack[stack.length - 1].counts;
      for (const [sym, n] of top.counts) into.set(sym, (into.get(sym) ?? 0) + n * k);
      continue;
    }
    if (/[A-Z]/.test(ch)) {
      const sym = s[i + 1] && /[a-z]/.test(s[i + 1]) ? s.slice(i, i + 2) : ch;
      if (!elementBySymbol(sym)) return { code: 'unknown-element', at: base + i, token: sym };
      i += sym.length;
      const k = readCount();
      if (typeof k !== 'number') return k;
      const into = stack[stack.length - 1].counts;
      into.set(sym, (into.get(sym) ?? 0) + k);
      continue;
    }
    if (/[a-z]/.test(ch)) return { code: 'lowercase-start', at: base + i, token: s.slice(i, i + 2) };
    if (/\d/.test(ch) && base + i === 0) return { code: 'leading-coefficient', at: 0, token: s.match(/^\d+/)![0] };
    return { code: 'unexpected-char', at: base + i, token: ch };
  }
  if (stack.length > 1) return { code: 'unclosed-bracket', at: base + stack[stack.length - 1].at };
  return stack[0].counts;
}

/** Total number of atoms in one formula unit. */
export const atomTotal = (counts: Map<string, number>) => [...counts.values()].reduce((a, b) => a + b, 0);
