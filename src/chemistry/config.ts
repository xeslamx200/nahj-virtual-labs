/**
 * Electron shells ("Bohr distribution") for every element.
 *
 * The textbook (Semester 1, Lesson 1-1) writes the Bohr distribution as the number of
 * electrons in each main energy level, e.g. K = 2,8,8,1, and states that the model locates
 * elements correctly only in the first four periods. For larger atoms the shell counts here
 * come from the ground-state configuration (Aufbau/Madelung order plus the known exceptions),
 * so they agree with the book for every element it lists (Br 2,8,18,7; Rb 2,8,18,8,1;
 * Cs 2,8,18,18,8,1). Configurations for Z ≥ 104 are predictions.
 */
import { elementByZ, isMainGroup, typicalCharge, type Element } from './elements';

/** Sub-shells in filling (Madelung) order: [n, l]. */
const ORDER: [number, number][] = [
  [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2], [5, 1], [6, 0],
  [4, 3], [5, 2], [6, 1], [7, 0], [5, 3], [6, 2], [7, 1],
];
const CAPACITY = [2, 6, 10, 14];

/** Ground-state exceptions to the Madelung order, as [n, l, electrons] adjustments. */
const EXCEPTIONS: Record<number, [number, number, number][]> = {
  24: [[3, 2, 1], [4, 0, -1]], // Cr 3d5 4s1
  29: [[3, 2, 1], [4, 0, -1]], // Cu 3d10 4s1
  41: [[4, 2, 1], [5, 0, -1]], // Nb 4d4 5s1
  42: [[4, 2, 1], [5, 0, -1]], // Mo 4d5 5s1
  44: [[4, 2, 1], [5, 0, -1]], // Ru 4d7 5s1
  45: [[4, 2, 1], [5, 0, -1]], // Rh 4d8 5s1
  46: [[4, 2, 2], [5, 0, -2]], // Pd 4d10
  47: [[4, 2, 1], [5, 0, -1]], // Ag 4d10 5s1
  57: [[5, 2, 1], [4, 3, -1]], // La 5d1 6s2
  58: [[5, 2, 1], [4, 3, -1]], // Ce 4f1 5d1 6s2
  64: [[5, 2, 1], [4, 3, -1]], // Gd 4f7 5d1 6s2
  78: [[5, 2, 1], [6, 0, -1]], // Pt 5d9 6s1
  79: [[5, 2, 1], [6, 0, -1]], // Au 5d10 6s1
  89: [[6, 2, 1], [5, 3, -1]], // Ac 6d1 7s2
  90: [[6, 2, 2], [5, 3, -2]], // Th 6d2 7s2
  91: [[6, 2, 1], [5, 3, -1]], // Pa 5f2 6d1 7s2
  92: [[6, 2, 1], [5, 3, -1]], // U 5f3 6d1 7s2
  93: [[6, 2, 1], [5, 3, -1]], // Np 5f4 6d1 7s2
  96: [[6, 2, 1], [5, 3, -1]], // Cm 5f7 6d1 7s2
  103: [[7, 1, 1], [6, 2, -1]], // Lr 5f14 7s2 7p1
};

function subshells(Z: number): Map<string, number> {
  const occ = new Map<string, number>();
  let left = Z;
  for (const [n, l] of ORDER) {
    if (left <= 0) break;
    const k = Math.min(left, CAPACITY[l]);
    occ.set(`${n},${l}`, k);
    left -= k;
  }
  for (const [n, l, d] of EXCEPTIONS[Z] ?? []) {
    const key = `${n},${l}`;
    occ.set(key, (occ.get(key) ?? 0) + d);
  }
  return occ;
}

/** Electrons in each main energy level, innermost first — e.g. 19 → [2, 8, 8, 1]. */
export function shells(Z: number): number[] {
  if (!Number.isInteger(Z) || Z < 1 || Z > 118) throw new RangeError(`Atomic number must be an integer 1–118 (got ${Z})`);
  const out: number[] = [];
  for (const [key, k] of subshells(Z)) {
    const n = Number(key.split(',')[0]);
    while (out.length < n) out.push(0);
    out[n - 1] += k;
  }
  while (out.length && out[out.length - 1] === 0) out.pop();
  return out;
}

/** Textbook notation: "2,8,8,1". */
export const bohrNotation = (s: number[]) => s.join(',');

/**
 * The book's statement holds for the representative elements: valence electrons are the
 * electrons in the outer level, and that number matches the group (1, 2, 13→3 … 18→8; He 2).
 */
export function valenceElectrons(e: Element): number | null {
  if (!isMainGroup(e)) return null;
  const s = shells(e.Z);
  return s[s.length - 1];
}

/** Whether the textbook's Bohr treatment covers this element (main-group elements of periods 1–4, plus the alkali metals it tabulates). */
export function inBookScope(e: Element): boolean {
  return (isMainGroup(e) && e.period <= 4) || ['Rb', 'Cs'].includes(e.symbol);
}

/**
 * Shells of the element's common ion (main-group only): a cation loses its outer level,
 * an anion fills its outer level to eight — e.g. Na 2,8,1 → Na⁺ 2,8 and F 2,7 → F⁻ 2,8.
 */
export function ionShells(e: Element): { charge: number; shells: number[] } | null {
  const q = typicalCharge(e);
  if (q === null || q === 0 || !isMainGroup(e) || e.Z > 56) return null;
  if (e.symbol === 'H') return { charge: 1, shells: [] };
  const s = shells(e.Z);
  if (q > 0) {
    if (s[s.length - 1] !== q) return null;
    return { charge: q, shells: s.slice(0, -1) };
  }
  const out = [...s];
  out[out.length - 1] -= q; // q is negative: gains |q| electrons
  return { charge: q, shells: out };
}

export function shellsOfSymbol(symbol: string): number[] | null {
  for (let Z = 1; Z <= 118; Z++) if (elementByZ(Z)?.symbol === symbol) return shells(Z);
  return null;
}
