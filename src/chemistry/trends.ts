/**
 * Periodic trends as stated in the textbook (Lessons 2-1 and 3-1), applied to a pair of
 * elements. A prediction is made only where the book's rule applies: two representative
 * elements in the same group, or in the same period. Otherwise the result says so.
 */
import { ELEMENTS, isMainGroup, type Element } from './elements';

export type TrendRule = 'same-group' | 'same-period' | 'none';

export interface Comparison {
  rule: TrendRule;
  /** Symbol with the larger textbook radius (null when either radius is not in the book). */
  largerRadius: string | null;
  /** Symbol with the stronger metallic character. */
  moreMetallic: string | null;
  /** Symbol predicted to be more reactive, or null when the rule does not decide it. */
  moreReactive: string | null;
  /** Why reactivity is not predicted. */
  reactivityNote: 'noble-gas' | 'metal-vs-nonmetal' | 'metalloid' | null;
}

export function compareElements(a: Element, b: Element): Comparison {
  const largerRadius = a.radius !== null && b.radius !== null && a.radius !== b.radius ? (a.radius > b.radius ? a.symbol : b.symbol) : null;
  const none: Comparison = { rule: 'none', largerRadius, moreMetallic: null, moreReactive: null, reactivityNote: null };
  if (a.Z === b.Z || !isMainGroup(a) || !isMainGroup(b)) return none;
  if (a.group === b.group) {
    const lower = a.period > b.period ? a : b; // further down the group
    const upper = lower === a ? b : a;
    const res: Comparison = { rule: 'same-group', largerRadius, moreMetallic: lower.symbol, moreReactive: null, reactivityNote: null };
    if (a.group === 18) res.reactivityNote = 'noble-gas';
    else if (a.cls === 'metal' && b.cls === 'metal') res.moreReactive = lower.symbol; // e.g. K > Na
    else if (a.cls === 'nonmetal' && b.cls === 'nonmetal') res.moreReactive = upper.symbol; // e.g. F2 > Cl2
    else res.reactivityNote = a.cls === 'metalloid' || b.cls === 'metalloid' ? 'metalloid' : 'metal-vs-nonmetal';
    return res;
  }
  if (a.period === b.period) {
    const left = a.group! < b.group! ? a : b;
    const right = left === a ? b : a;
    const res: Comparison = { rule: 'same-period', largerRadius, moreMetallic: left.symbol, moreReactive: null, reactivityNote: null };
    if (a.group === 18 || b.group === 18) res.reactivityNote = 'noble-gas';
    else if (a.cls === 'metal' && b.cls === 'metal') res.moreReactive = left.symbol; // e.g. Na > Mg
    else if (a.cls === 'nonmetal' && b.cls === 'nonmetal') res.moreReactive = right.symbol; // e.g. Cl > S
    else res.reactivityNote = a.cls === 'metalloid' || b.cls === 'metalloid' ? 'metalloid' : 'metal-vs-nonmetal';
    return res;
  }
  return none;
}

export type TrendSetId = 'period2' | 'period3' | 'group1' | 'group17';

/** Elements of a trend set that have a textbook radius, in order of Z. */
export function trendMembers(set: TrendSetId): Element[] {
  const pick = (e: Element) =>
    set === 'period2' ? e.period === 2 : set === 'period3' ? e.period === 3 : set === 'group1' ? e.group === 1 && e.symbol !== 'H' : e.group === 17;
  return ELEMENTS.filter((e) => pick(e) && e.radius !== null);
}
