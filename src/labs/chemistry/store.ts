import { CHEM_PRESETS, type ChemModule } from '../../curriculum/chemistry';
import { BOOK_REACTIONS } from '../../chemistry/reactions';
import { parseEquation } from '../../chemistry/equation';
import type { MassMode } from '../../chemistry/molarMass';
import type { Quantity } from '../../chemistry/stoichiometry';
import { createStore, useStore } from '../../lib/store';

export type TrendSet = 'period2' | 'period3' | 'group1' | 'group17';
export type ColorBy = 'class' | 'family';
export type SolStep = 'empty' | 'weighed' | 'dissolved' | 'filled';

export interface ChemUiState {
  module: ChemModule;
  /* periodic table */
  element: string;
  compareWith: string | null;
  trendSet: TrendSet;
  colorBy: ColorBy;
  /* reactions */
  reactionId: string; // a BOOK_REACTIONS id or 'custom'
  equationText: string;
  customDraft: string;
  coefficients: number[];
  hintsShown: number;
  revealed: boolean;
  massMode: MassMode;
  mmFormula: string;
  conv: { formula: string; amount: string; from: Quantity; to: Quantity };
  stoich: { given: number; amount: string; givenQ: Quantity; target: number; targetQ: Quantity };
  /* solutions */
  solute: string;
  flaskmL: number;
  targetM: string;
  weighed: string;
  solStep: SolStep;
  pct: { solute: string; solvent: string };
  calcN: string;
  calcV: string;
  /* shell */
  activityId: string;
  labMode: 'guided' | 'free';
}

const reaction = (id: string) => BOOK_REACTIONS.find((r) => r.id === id) ?? BOOK_REACTIONS[0];

function onesFor(text: string): number[] {
  const r = parseEquation(text);
  return r.ok ? r.coefficients : [];
}

function fromPreset(id: string): Partial<ChemUiState> {
  const p = CHEM_PRESETS[id] ?? CHEM_PRESETS.bohr;
  const rx = reaction(p.reaction ?? 'ethane');
  return {
    module: p.module,
    element: p.element ?? 'Na',
    compareWith: null,
    trendSet: p.trendSet ?? 'period3',
    reactionId: rx.id,
    equationText: rx.skeleton,
    coefficients: onesFor(rx.skeleton),
    hintsShown: 0,
    revealed: false,
    stoich: {
      given: p.given?.index ?? 0,
      amount: String(p.given?.amount ?? 1),
      givenQ: p.given?.quantity ?? 'mass',
      target: p.target?.index ?? 1,
      targetQ: p.target?.quantity ?? 'mass',
    },
    solute: p.solute ?? 'CuSO4·5H2O',
    flaskmL: p.flaskmL ?? 250,
    targetM: String(p.targetM ?? 0.0865),
    weighed: '',
    solStep: 'empty',
  };
}

function initial(): ChemUiState {
  return {
    module: 'periodic',
    element: 'N',
    compareWith: null,
    trendSet: 'period3',
    colorBy: 'class',
    reactionId: 'ethane',
    equationText: reaction('ethane').skeleton,
    customDraft: '',
    coefficients: onesFor(reaction('ethane').skeleton),
    hintsShown: 0,
    revealed: false,
    massMode: 'book',
    mmFormula: 'CuSO4·5H2O',
    conv: { formula: 'CO2', amount: '4', from: 'moles', to: 'particles' },
    stoich: { given: 0, amount: '1', givenQ: 'mass', target: 1, targetQ: 'mass' },
    solute: 'CuSO4·5H2O',
    flaskmL: 250,
    targetM: '0.0865',
    weighed: '',
    solStep: 'empty',
    pct: { solute: '5', solvent: '95' },
    calcN: '1.5',
    calcV: '0.5',
    activityId: 'bohr-table',
    labMode: 'guided',
    ...fromPreset('bohr'),
  };
}

export const chemStore = createStore<ChemUiState>(initial);
export const useChem = () => useStore(chemStore);

const patch = (p: Partial<ChemUiState>) => chemStore.set((s) => ({ ...s, ...p }));

export const chemActions = {
  set: patch,
  setModule: (module: ChemModule) => patch({ module }),
  selectElement: (element: string) => patch({ element }),
  setActivity: (activityId: string) => patch({ activityId }),
  setLabMode: (labMode: 'guided' | 'free') => patch({ labMode }),
  loadPreset: (id: string) => chemStore.set((s) => ({ ...s, ...fromPreset(id) })),
  /** Load a textbook reaction (unbalanced) — formulas are fixed from here on. */
  loadReaction: (id: string) => {
    const rx = reaction(id);
    patch({ reactionId: rx.id, equationText: rx.skeleton, coefficients: onesFor(rx.skeleton), hintsShown: 0, revealed: false, stoich: { ...chemStore.get().stoich, given: 0, target: 1 } });
  },
  /** Load a learner-typed equation; leading numbers become the starting coefficients. Returns false if it cannot be parsed. */
  loadCustom: (text: string) => {
    const r = parseEquation(text);
    if (!r.ok) return false;
    patch({ reactionId: 'custom', equationText: text, coefficients: r.coefficients, hintsShown: 0, revealed: false, stoich: { ...chemStore.get().stoich, given: 0, target: 1 } });
    return true;
  },
  setCoefficient: (i: number, value: number) =>
    chemStore.set((s) => {
      if (!Number.isFinite(value)) return s;
      const c = [...s.coefficients];
      c[i] = Math.min(99, Math.max(1, Math.round(value)));
      return { ...s, coefficients: c };
    }),
  resetCoefficients: () => chemStore.set((s) => ({ ...s, coefficients: s.coefficients.map(() => 1), hintsShown: 0, revealed: false })),
  /** Reset the workspace of the current module without touching recorded data. */
  rewind: () =>
    chemStore.set((s) => {
      if (s.module === 'reactions') return { ...s, coefficients: s.coefficients.map(() => 1), hintsShown: 0, revealed: false };
      if (s.module === 'solutions') return { ...s, weighed: '', solStep: 'empty' };
      return { ...s, compareWith: null };
    }),
};
