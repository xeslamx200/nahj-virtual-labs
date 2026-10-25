import { describe, expect, it } from 'vitest';
import { bohrNotation, inBookScope, ionShells, shells, valenceElectrons } from './config';
import { BOOK_RADII, ELEMENTS, elementBySymbol, elementByZ, gridPosition, groupOf, periodOf, roundedMass } from './elements';
import { checkBalance, equationText, parseEquation, solveCoefficients, splitTerms, tally } from './equation';
import { atomTotal, parseFormula } from './formula';
import { M, molarMass } from './molarMass';
import { AVOGADRO, convert, sideMasses, stoichiometry } from './stoichiometry';
import { massForSolution, massPercent, molarity, molarityFromMass, molesFromMolarity, percentError, volumeFromMoles } from './concentration';
import { BOOK_REACTIONS } from './reactions';

const el = (s: string) => elementBySymbol(s)!;
const counts = (f: string) => {
  const r = parseFormula(f);
  if (!r.ok) throw new Error(r.error.code);
  return Object.fromEntries(r.value.counts);
};
const eq = (text: string) => {
  const r = parseEquation(text);
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r;
};

describe('element dataset', () => {
  it('has all 118 elements in order with unique symbols', () => {
    expect(ELEMENTS).toHaveLength(118);
    ELEMENTS.forEach((e, i) => expect(e.Z).toBe(i + 1));
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(118);
    expect(elementByZ(117)!.symbol).toBe('Ts');
    expect(elementByZ(0)).toBeUndefined();
    expect(elementByZ(119)).toBeUndefined();
    expect(elementBySymbol('Xx')).toBeUndefined();
  });

  it('places elements in the right period and group', () => {
    expect([periodOf(1), groupOf(1)]).toEqual([1, 1]);
    expect([periodOf(2), groupOf(2)]).toEqual([1, 18]);
    expect([el('Na').period, el('Na').group]).toEqual([3, 1]);
    expect([el('Cl').period, el('Cl').group]).toEqual([3, 17]);
    expect([el('Fe').period, el('Fe').group]).toEqual([4, 8]);
    expect([el('Hf').period, el('Hf').group]).toEqual([6, 4]);
    expect([el('Tl').period, el('Tl').group]).toEqual([6, 13]);
    expect([el('Rn').period, el('Rn').group]).toEqual([6, 18]);
    expect([el('Og').period, el('Og').group]).toEqual([7, 18]);
    expect(el('La').group).toBeNull();
    expect(el('Lr').group).toBeNull();
    expect(gridPosition(el('Ce'))).toEqual({ row: 9, col: 4 });
    expect(gridPosition(el('U'))).toEqual({ row: 10, col: 6 });
    // No two elements share a cell.
    expect(new Set(ELEMENTS.map((e) => JSON.stringify(gridPosition(e)))).size).toBe(118);
  });

  it('classifies metals, non-metals and the six textbook metalloids', () => {
    expect(ELEMENTS.filter((e) => e.cls === 'metalloid').map((e) => e.symbol)).toEqual(['B', 'Si', 'Ge', 'As', 'Sb', 'Te']);
    expect(el('Na').cls).toBe('metal');
    expect(el('Cl').family).toBe('halogen');
    expect(el('Ar').family).toBe('noble');
    expect(el('Hg').state).toBe('liquid');
    expect(el('Br').state).toBe('liquid');
    expect(el('N').state).toBe('gas');
  });

  it('uses the textbook atomic radii and only those', () => {
    expect(el('Na').radius).toBe(190);
    expect(el('Cl').radius).toBe(79);
    expect(el('K').radius).toBe(243);
    expect(el('Cs').radius).toBe(298);
    expect(el('Ba').radius).toBeNull();
    expect(Object.keys(BOOK_RADII)).toHaveLength(55);
    // Trends stated in Lesson 2-1: radius decreases across period 3, increases down group 1.
    const p3 = ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'].map((s) => el(s).radius!);
    p3.slice(1).forEach((r, i) => expect(r).toBeLessThan(p3[i]));
    const g1 = ['Li', 'Na', 'K', 'Rb', 'Cs'].map((s) => el(s).radius!);
    g1.slice(1).forEach((r, i) => expect(r).toBeGreaterThan(g1[i]));
  });

  it('rounds masses the way the worked examples do', () => {
    expect(['H', 'C', 'N', 'O', 'Na', 'Al', 'Cl', 'K', 'Fe', 'Li', 'Cu', 'Zn'].map((s) => roundedMass(el(s)))).toEqual([1.0, 12.0, 14.0, 16.0, 23.0, 27.0, 35.5, 39.1, 55.8, 6.9, 63.5, 65.4]);
    expect(el('Tc').massNumberOnly).toBe(true);
    expect(el('U').massNumberOnly).toBe(false);
  });
});

describe('Bohr distribution (textbook notation)', () => {
  it('matches the textbook examples', () => {
    expect(bohrNotation(shells(7))).toBe('2,5'); // N, Example 1
    expect(bohrNotation(shells(14))).toBe('2,8,4'); // Si
    expect(bohrNotation(shells(35))).toBe('2,8,18,7'); // Br
    expect(bohrNotation(shells(19))).toBe('2,8,8,1'); // K, Figure 6-1
    expect(bohrNotation(shells(20))).toBe('2,8,8,2'); // Ca
  });

  it('matches Table 5-1 for the alkali metals', () => {
    expect(['Li', 'Na', 'K', 'Rb', 'Cs'].map((s) => bohrNotation(shells(el(s).Z)))).toEqual(['2,1', '2,8,1', '2,8,8,1', '2,8,18,8,1', '2,8,18,18,8,1']);
  });

  it('sums to Z for every element and handles exceptions', () => {
    for (const e of ELEMENTS) expect(shells(e.Z).reduce((a, b) => a + b, 0)).toBe(e.Z);
    expect(shells(24)).toEqual([2, 8, 13, 1]); // Cr
    expect(shells(29)).toEqual([2, 8, 18, 1]); // Cu
    expect(shells(46)).toEqual([2, 8, 18, 18]); // Pd
    expect(shells(79)).toEqual([2, 8, 18, 32, 18, 1]); // Au
    expect(shells(118)).toEqual([2, 8, 18, 32, 32, 18, 8]);
    expect(shells(26)).toEqual([2, 8, 14, 2]); // Fe
  });

  it('rejects invalid atomic numbers', () => {
    expect(() => shells(0)).toThrow(RangeError);
    expect(() => shells(119)).toThrow(RangeError);
    expect(() => shells(2.5)).toThrow(RangeError);
  });

  it('gives valence electrons equal to the group for main-group elements', () => {
    expect(valenceElectrons(el('Na'))).toBe(1);
    expect(valenceElectrons(el('Mg'))).toBe(2);
    expect(valenceElectrons(el('Al'))).toBe(3);
    expect(valenceElectrons(el('C'))).toBe(4);
    expect(valenceElectrons(el('Cl'))).toBe(7);
    expect(valenceElectrons(el('Ar'))).toBe(8);
    expect(valenceElectrons(el('He'))).toBe(2);
    expect(valenceElectrons(el('Fe'))).toBeNull();
    expect(inBookScope(el('Kr'))).toBe(true);
    expect(inBookScope(el('Fe'))).toBe(false);
  });

  it('builds ion distributions as in Lesson 2-1', () => {
    expect(ionShells(el('Li'))).toEqual({ charge: 1, shells: [2] });
    expect(ionShells(el('F'))).toEqual({ charge: -1, shells: [2, 8] });
    expect(ionShells(el('Na'))).toEqual({ charge: 1, shells: [2, 8] });
    expect(ionShells(el('O'))).toEqual({ charge: -2, shells: [2, 8] });
    expect(ionShells(el('Cl'))).toEqual({ charge: -1, shells: [2, 8, 8] });
    expect(ionShells(el('Ne'))).toBeNull();
  });
});

describe('formula parser', () => {
  it('counts atoms', () => {
    expect(counts('H2O')).toEqual({ H: 2, O: 1 });
    expect(counts('CO2')).toEqual({ C: 1, O: 2 });
    expect(counts('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(counts('Al(NO3)3')).toEqual({ Al: 1, N: 3, O: 9 });
    expect(counts('Fe2(SO4)3')).toEqual({ Fe: 2, S: 3, O: 12 });
    expect(counts('C6H12O6')).toEqual({ C: 6, H: 12, O: 6 });
    expect(counts('(NH4)3PO4')).toEqual({ N: 3, H: 12, P: 1, O: 4 });
    expect(counts('K4[Fe(CN)6]')).toEqual({ K: 4, Fe: 1, C: 6, N: 6 });
    expect(counts('C2H5OH')).toEqual({ C: 2, H: 6, O: 1 });
    expect(atomTotal(parseFormula('Fe2(SO4)3').ok ? (parseFormula('Fe2(SO4)3') as { ok: true; value: { counts: Map<string, number> } }).value.counts : new Map())).toBe(17);
  });

  it('reads hydrates, charges, states and subscript characters', () => {
    expect(counts('CuSO4·5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
    expect(counts('CuSO4.5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
    expect(counts('H₂O')).toEqual({ H: 2, O: 1 });
    const so4 = parseFormula('SO4^2-');
    expect(so4.ok && so4.value.charge).toBe(-2);
    const nh4 = parseFormula('NH4^+');
    expect(nh4.ok && nh4.value.charge).toBe(1);
    const uni = parseFormula('SO₄²⁻');
    expect(uni.ok && uni.value.charge).toBe(-2);
    const bare = parseFormula('Cl-');
    expect(bare.ok && bare.value.charge).toBe(-1);
    const aq = parseFormula('NaCl(aq)');
    expect(aq.ok && aq.value.state).toBe('aq');
    expect(aq.ok && aq.value.formula).toBe('NaCl');
  });

  it('reports errors instead of guessing', () => {
    const code = (f: string) => {
      const r = parseFormula(f);
      return r.ok ? 'ok' : r.error.code;
    };
    expect(code('')).toBe('empty');
    expect(code('   ')).toBe('empty');
    expect(code('Xy2')).toBe('unknown-element');
    expect(code('h2o')).toBe('lowercase-start');
    expect(code('Ca(OH2')).toBe('unclosed-bracket');
    expect(code('CaOH)2')).toBe('unopened-bracket');
    expect(code('H0')).toBe('zero-count');
    expect(code('2H2O')).toBe('leading-coefficient');
    expect(code('H2O$')).toBe('unexpected-char');
    expect(code('()2')).toBe('empty');
    expect(code('SO4^0-')).toBe('bad-charge');
    expect(code('H'.repeat(100))).toBe('too-large');
    const unk = parseFormula('NaQ');
    expect(!unk.ok && unk.error.token).toBe('Q');
    // "Co" is cobalt, "CO" carbon monoxide — both valid and different.
    expect(counts('Co')).toEqual({ Co: 1 });
    expect(counts('CO')).toEqual({ C: 1, O: 1 });
  });
});

describe('equations and balancing', () => {
  it('splits terms without breaking ionic charges', () => {
    expect(splitTerms('Ag^+ + Cl^-')).toEqual(['Ag^+', 'Cl^-']);
    expect(splitTerms('Na+ + Cl-')).toEqual(['Na+', 'Cl-']);
    expect(splitTerms('H2+O2')).toEqual(['H2', 'O2']);
  });

  it('parses coefficients and detects unbalanced equations', () => {
    const r = eq('H2 + O2 -> H2O');
    expect(r.coefficients).toEqual([1, 1, 1]);
    const c = checkBalance(r.value, r.coefficients);
    expect(c.status).toBe('unbalanced');
    expect(c.mismatched).toEqual(['O']);
    expect(c.tally.elements).toEqual([
      { symbol: 'H', left: 2, right: 2 },
      { symbol: 'O', left: 2, right: 1 },
    ]);
    expect(checkBalance(r.value, [2, 1, 2]).status).toBe('balanced');
    expect(checkBalance(r.value, [4, 2, 4]).status).toBe('balanced-not-lowest');
    const typed = eq('2H2 + O2 → 2H2O');
    expect(typed.coefficients).toEqual([2, 1, 2]);
    expect(equationText(typed.value, typed.coefficients)).toBe('2H2 + O2 → 2H2O');
  });

  it('balancing never changes formulas (subscripts stay as typed)', () => {
    const r = eq('H2 + O2 -> H2O');
    const before = r.value.products.map((s) => s.formula);
    solveCoefficients(r.value);
    checkBalance(r.value, [2, 1, 2]);
    expect(r.value.products.map((s) => s.formula)).toEqual(before);
    expect(Object.fromEntries(r.value.products[0].counts)).toEqual({ H: 2, O: 1 });
  });

  it('solves every textbook reaction to the coefficients printed in the book', () => {
    for (const rx of BOOK_REACTIONS) {
      const r = eq(rx.skeleton);
      const s = solveCoefficients(r.value);
      expect(s, rx.id).toEqual({ ok: true, coefficients: rx.answer });
      expect(checkBalance(r.value, rx.answer).status, rx.id).toBe('balanced');
    }
  });

  it('conserves charge in net ionic equations', () => {
    const r = eq('Ag^+(aq) + Cl^-(aq) -> AgCl(s)');
    const t = tally(r.value, [1, 1, 1]);
    expect([t.chargeLeft, t.chargeRight]).toEqual([0, 0]);
    const bad = eq('Fe^3+ + Cu -> Fe^2+ + Cu^2+');
    expect(checkBalance(bad.value, [1, 1, 1, 1]).chargeBalanced).toBe(false);
    expect(solveCoefficients(bad.value)).toEqual({ ok: true, coefficients: [2, 1, 2, 1] });
  });

  it('reports equations that cannot be balanced', () => {
    expect(solveCoefficients(eq('H2 + O2 -> NaCl').value)).toMatchObject({ ok: false, reason: 'one-sided' });
    expect(solveCoefficients(eq('H2O -> H2O2').value)).toMatchObject({ ok: false, reason: 'impossible' });
    expect(solveCoefficients(eq('H2 + O2 -> H2O + H2O2').value)).toMatchObject({ ok: false, reason: 'not-unique' });
  });

  it('rejects malformed equations', () => {
    const code = (t: string) => {
      const r = parseEquation(t);
      return r.ok ? 'ok' : r.error.code;
    };
    expect(code('H2 + O2')).toBe('no-arrow');
    expect(code('A -> B -> C')).toBe('many-arrows');
    expect(code(' -> H2O')).toBe('empty-side');
    expect(code('H2 + Q2 -> H2O')).toBe('formula');
  });

  it('conserves mass when balanced (HgO, textbook p. 70)', () => {
    const r = eq(BOOK_REACTIONS.find((x) => x.id === 'hgo')!.skeleton);
    const bal = sideMasses(r.value, [2, 2, 1], 'precise');
    expect(bal.left).toBeCloseTo(bal.right, 9);
    const unbal = sideMasses(r.value, [1, 1, 1], 'precise');
    expect(unbal.left).not.toBeCloseTo(unbal.right, 1);
    // 100 g HgO → 92.6 g Hg + 7.4 g O2 (the book rounds to 93 g + 7 g).
    const hg = stoichiometry(r.value, [2, 2, 1], { given: { index: 0, amount: 100, quantity: 'mass' }, target: { index: 1, quantity: 'mass' }, mode: 'precise' });
    expect(hg.ok && hg.value).toBeCloseTo(92.6, 1);
  });
});

describe('molar mass', () => {
  it('reproduces the textbook values', () => {
    expect(M('NO2')).toBeCloseTo(46.005, 3); // Example 22
    expect(M('F2')).toBeCloseTo(37.996, 3); // Example 22 (book prints 37.997)
    expect(M('C6H12O6', 'book')).toBeCloseTo(180.0, 6); // Example 24
    expect(M('Al(NO3)3', 'book')).toBeCloseTo(213.0, 6); // Example 25
    expect(M('Fe2O3', 'book')).toBeCloseTo(159.6, 6); // Example 30
    expect(M('Fe(OH)3', 'book')).toBeCloseTo(106.8, 6); // Example 31
    expect(M('KCl', 'book')).toBeCloseTo(74.6, 6); // Example 31
    expect(M('Li2CO3', 'book')).toBeCloseTo(73.8, 6); // Example 37
    expect(M('KOH', 'book')).toBeCloseTo(56.1, 6); // Example 38
    expect(M('KI')).toBeCloseTo(166.002, 3); // Example 39
    expect(M('CH4', 'book')).toBeCloseTo(16.0, 6);
    expect(M('H2O', 'book')).toBeCloseTo(18.0, 6);
  });

  it('gives percentage composition summing to 100 % (Cr2(SO4)3, textbook)', () => {
    const r = molarMass('Cr2(SO4)3');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const pct = Object.fromEntries(r.value.parts.map((p) => [p.symbol, p.percent]));
    // The book uses S = 32.065 and gets 26.51 / 24.53 / 48.95 %; IUPAC S = 32.06 gives the same to 0.01.
    expect(pct.Cr).toBeCloseTo(26.52, 1);
    expect(pct.S).toBeCloseTo(24.53, 1);
    expect(pct.O).toBeCloseTo(48.95, 1);
    expect(r.value.parts.reduce((a, p) => a + p.percent, 0)).toBeCloseTo(100, 9);
    expect(r.value.total).toBeCloseTo(392.16, 1);
  });

  it('propagates formula errors', () => {
    const r = molarMass('Zz');
    expect(r.ok).toBe(false);
  });
});

describe('mole conversions', () => {
  it('reproduces the worked examples', () => {
    const molecules = convert(4, 'moles', 'particles', M('CO2'));
    // Example 21: the book uses NA = 6.02 × 10²³ and gets 2.408 × 10²⁴; with 6.022 × 10²³ it is 2.409 × 10²⁴.
    expect(molecules.ok && molecules.value / 1e24).toBeCloseTo(2.409, 3);
    const c = convert(100, 'mass', 'moles', M('C'));
    expect(c.ok && c.value).toBeCloseTo(8.326, 3); // Example 23 (book prints 8.325, i.e. truncated)
    const ch4 = convert(45.7, 'mass', 'moles', M('CH4', 'book'));
    expect(ch4.ok && ch4.value).toBeCloseTo(2.86, 2);
    const glucose = convert(10, 'moles', 'mass', M('C6H12O6', 'book'));
    expect(glucose.ok && glucose.value).toBeCloseTo(1800, 6); // Example 24
    const aln = convert(25.0, 'mass', 'moles', M('Al(NO3)3', 'book'));
    expect(aln.ok && aln.value).toBeCloseTo(0.117, 3); // Example 25
    const h2 = convert(3.75, 'moles', 'volume', M('H2'));
    expect(h2.ok && h2.value).toBeCloseTo(84.0, 6); // Example 26
    const he = convert(10.0, 'volume', 'moles', M('He'));
    expect(he.ok && he.value).toBeCloseTo(0.446, 3); // Example 27
    const ne = convert(90, 'mass', 'volume', M('Ne'));
    expect(ne.ok && ne.value).toBeCloseTo(99.9, 1); // Example 28
    expect(ne.ok && ne.steps.map((s) => s.kind)).toEqual(['to-moles', 'from-moles']);
  });

  it('validates inputs', () => {
    expect(convert(0, 'mass', 'moles', 18)).toEqual({ ok: false, error: { code: 'not-positive' } });
    expect(convert(-2, 'mass', 'moles', 18)).toEqual({ ok: false, error: { code: 'not-positive' } });
    expect(convert(NaN, 'mass', 'moles', 18)).toEqual({ ok: false, error: { code: 'not-a-number' } });
    expect(convert(1e31, 'mass', 'moles', 18)).toEqual({ ok: false, error: { code: 'too-large' } });
    expect(AVOGADRO).toBe(6.022e23);
  });
});

describe('stoichiometry', () => {
  const book = (id: string) => eq(BOOK_REACTIONS.find((x) => x.id === id)!.skeleton).value;

  it('Example 29: 0.750 mol CaCl2 gives 1.50 mol HCl', () => {
    const r = eq('CaCl2(aq) + HNO3(aq) -> Ca(NO3)2(aq) + HCl(aq)');
    const res = stoichiometry(r.value, [1, 2, 1, 2], { given: { index: 0, amount: 0.75, quantity: 'moles' }, target: { index: 3, quantity: 'moles' }, mode: 'precise' });
    expect(res.ok && res.value).toBeCloseTo(1.5, 9);
  });

  it('Example 30: 4.35 mol Al gives 347 g Fe2O3 used', () => {
    const res = stoichiometry(book('thermite'), [1, 2, 1, 2], { given: { index: 1, amount: 4.35, quantity: 'moles' }, target: { index: 0, quantity: 'mass' }, mode: 'book' });
    expect(res.ok && res.value).toBeCloseTo(347.1, 1); // book: 347.3 using 159.7 g/mol
  });

  it('Example 31: 20.0 g Fe(OH)3 → 41.9 g KCl', () => {
    const res = stoichiometry(book('fecl3-koh'), [1, 3, 1, 3], { given: { index: 2, amount: 20.0, quantity: 'mass' }, target: { index: 3, quantity: 'mass' }, mode: 'book' });
    expect(res.ok && res.value).toBeCloseTo(41.9, 1);
    expect(res.ok && res.steps.map((s) => s.kind)).toEqual(['molar-mass', 'molar-mass', 'to-moles', 'ratio', 'from-moles']);
  });

  it('Example 32: 100.0 L SO2 reacts with 50.0 L O2 at STP', () => {
    const res = stoichiometry(book('so2'), [2, 1, 2], { given: { index: 0, amount: 100, quantity: 'volume' }, target: { index: 1, quantity: 'volume' }, mode: 'precise' });
    expect(res.ok && res.value).toBeCloseTo(50, 9);
  });

  it('Example 33: 45.0 g Fe gives about 27.1 L H2 at STP', () => {
    const res = stoichiometry(book('fe-steam'), [2, 3, 1, 3], { given: { index: 0, amount: 45.0, quantity: 'mass' }, target: { index: 3, quantity: 'volume' }, mode: 'book' });
    expect(res.ok && res.value).toBeCloseTo(27.1, 1); // book: 27.08 after rounding n to 1.209 mol
  });

  it('Activity 3-2a: 2.50 g NaHCO3 → 1.74 g NaCl (theoretical)', () => {
    const res = stoichiometry(book('nahco3'), [1, 1, 1, 1, 1], { given: { index: 0, amount: 2.5, quantity: 'mass' }, target: { index: 2, quantity: 'mass' }, mode: 'book' });
    expect(res.ok && res.value).toBeCloseTo(1.741, 2);
  });

  it('refuses unbalanced equations, non-gas volumes and bad input', () => {
    const rx = book('thermite');
    expect(stoichiometry(rx, [1, 1, 1, 1], { given: { index: 0, amount: 1, quantity: 'moles' }, target: { index: 3, quantity: 'moles' }, mode: 'precise' })).toEqual({ ok: false, error: { code: 'unbalanced' } });
    expect(stoichiometry(rx, [1, 2, 1, 2], { given: { index: 0, amount: 1, quantity: 'volume' }, target: { index: 3, quantity: 'moles' }, mode: 'precise' })).toEqual({ ok: false, error: { code: 'not-gas', formula: 'Fe2O3' } });
    expect(stoichiometry(rx, [1, 2, 1, 2], { given: { index: 0, amount: 0, quantity: 'moles' }, target: { index: 3, quantity: 'moles' }, mode: 'precise' })).toEqual({ ok: false, error: { code: 'not-positive' } });
    expect(stoichiometry(rx, [1, 2, 1, 2], { given: { index: 0, amount: 1, quantity: 'moles' }, target: { index: 0, quantity: 'moles' }, mode: 'precise' })).toEqual({ ok: false, error: { code: 'same-species' } });
    expect(stoichiometry(rx, [1, 2, 1, 2], { given: { index: 9, amount: 1, quantity: 'moles' }, target: { index: 0, quantity: 'moles' }, mode: 'precise' })).toEqual({ ok: false, error: { code: 'bad-index' } });
  });
});

describe('concentration', () => {
  const v = (r: { ok: boolean; value?: number }): number => (r.ok && r.value !== undefined ? r.value : NaN);
  it('reproduces Examples 34–40', () => {
    expect(v(molarity(1.5, 0.5))).toBeCloseTo(3.0, 9); // 34
    expect(v(molesFromMolarity(0.163, 1.5))).toBeCloseTo(0.2445, 4); // 35 (book rounds to 0.245)
    expect(v(volumeFromMoles(0.0625, 0.125))).toBeCloseTo(0.5, 9); // 36
    expect(v(molarityFromMass(1.1, M('Li2CO3', 'book'), 0.1))).toBeCloseTo(0.149, 3); // 37
    expect(v(massForSolution(0.1, 0.5, M('KOH', 'book')))).toBeCloseTo(2.805, 3); // 38
    expect(v(volumeFromMoles(1500 / M('KI'), 2.75))).toBeCloseTo(3.286, 3); // 39
    expect(v(volumeFromMoles(0.88, 3.4)) * 1000).toBeCloseTo(259, 0); // 40
  });

  it('Activity 3-2b: 250.0 mL of 0.0865 M CuSO4·5H2O needs about 5.40 g', () => {
    expect(M('CuSO4·5H2O')).toBeCloseTo(249.68, 1);
    expect(v(massForSolution(0.0865, 0.25, M('CuSO4·5H2O')))).toBeCloseTo(5.4, 2);
  });

  it('lesson-review questions', () => {
    expect(v(massForSolution(1.0, 1, 74.6))).toBeCloseTo(74.6, 9);
    expect(v(massForSolution(2.0, 2.0, 189.4))).toBeCloseTo(757.6, 6);
  });

  it('mass percentage and percentage error', () => {
    expect(v(massPercent(5, 100))).toBeCloseTo(5, 9);
    expect(massPercent(120, 100)).toEqual({ ok: false, error: { code: 'solute-exceeds-solution' } });
    expect(percentError(0.088, 0.0865)).toBeCloseTo(1.734, 2);
  });

  it('validates inputs', () => {
    expect(molarity(1, 0)).toEqual({ ok: false, error: { code: 'not-positive' } });
    expect(molarity(-1, 1)).toEqual({ ok: false, error: { code: 'not-positive' } });
    expect(molarity(NaN, 1)).toEqual({ ok: false, error: { code: 'not-a-number' } });
    expect(molarity(1, Infinity)).toEqual({ ok: false, error: { code: 'not-a-number' } });
    expect(molarity(1e10, 1)).toEqual({ ok: false, error: { code: 'too-large' } });
  });
});

describe('periodic trends (Lessons 2-1 and 3-1)', () => {
  it('predicts reactivity only where the textbook rule applies', async () => {
    const { compareElements, trendMembers } = await import('./trends');
    expect(compareElements(el('Na'), el('K'))).toMatchObject({ rule: 'same-group', largerRadius: 'K', moreMetallic: 'K', moreReactive: 'K' });
    expect(compareElements(el('F'), el('I'))).toMatchObject({ rule: 'same-group', largerRadius: 'I', moreReactive: 'F' });
    expect(compareElements(el('Na'), el('Mg'))).toMatchObject({ rule: 'same-period', largerRadius: 'Na', moreMetallic: 'Na', moreReactive: 'Na' });
    expect(compareElements(el('S'), el('Cl'))).toMatchObject({ rule: 'same-period', moreReactive: 'Cl' });
    expect(compareElements(el('Na'), el('Cl'))).toMatchObject({ rule: 'same-period', moreReactive: null, reactivityNote: 'metal-vs-nonmetal' });
    expect(compareElements(el('Ne'), el('Ar'))).toMatchObject({ rule: 'same-group', moreReactive: null, reactivityNote: 'noble-gas' });
    expect(compareElements(el('Na'), el('Cl')).moreMetallic).toBe('Na');
    expect(compareElements(el('Na'), el('Br'))).toMatchObject({ rule: 'none', moreReactive: null });
    expect(compareElements(el('Fe'), el('Cu'))).toMatchObject({ rule: 'none' });
    expect(trendMembers('period3').map((e) => e.symbol)).toEqual(['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar']);
    expect(trendMembers('group1').map((e) => e.symbol)).toEqual(['Li', 'Na', 'K', 'Rb', 'Cs']);
    expect(trendMembers('group17').map((e) => e.symbol)).toEqual(['F', 'Cl', 'Br', 'I']);
  });
});

describe('balancing hints', () => {
  it('follow the textbook strategy without giving the coefficients', async () => {
    const { balanceHints } = await import('./hints');
    const r = eq('C2H6(g) + O2(g) -> CO2(g) + H2O(l)');
    const h = balanceHints(r.value, [1, 1, 1, 1]);
    expect(h.map((x) => x.code)).toEqual(['start-with', 'o-last', 'mismatch', 'halves']);
    expect(h[0]).toEqual({ code: 'start-with', element: 'C' });
    expect(h[2]).toEqual({ code: 'mismatch', element: 'C', left: 2, right: 1 });
    expect(JSON.stringify(h)).not.toContain('7');
    const pb = eq('Pb(NO3)2(aq) + KI(aq) -> PbI2(s) + KNO3(aq)');
    expect(balanceHints(pb.value, [1, 1, 1, 1]).find((x) => x.code === 'polyatomic')).toEqual({ code: 'polyatomic', ion: 'NO3' });
    const done = eq('2H2 + O2 -> 2H2O');
    expect(balanceHints(done.value, [4, 2, 4]).map((x) => x.code)).toContain('lowest');
  });
});
