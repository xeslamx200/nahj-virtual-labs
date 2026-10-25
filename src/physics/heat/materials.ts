/**
 * Material data taken from the Grade 10 textbook (Unit 3, Lesson 2-3):
 *   Table 2-3  specific heat capacity c (J/kg·°C)
 *   Table 3-3  specific latent heat of fusion Lf (kJ/kg)
 *   Table 4-3  specific latent heat of vaporization Lv (kJ/kg)
 *
 * Only materials whose parameters the model needs are listed. The phase-change
 * (heating-curve) model is restricted to water, the only substance for which
 * the textbook gives c for all three states plus Lf and Lv.
 */

export type MaterialId = 'water' | 'aluminium' | 'copper' | 'iron' | 'lead' | 'glass' | 'granite' | 'oil';

export interface Material {
  id: MaterialId;
  /** Specific heat capacity in the state used by the specific-heat model, J/(kg·°C). */
  c: number;
  /** Textbook reference for the value. */
  source: string;
}

/** Specific heat values, Table 2-3 of the textbook. */
export const MATERIALS: Record<MaterialId, Material> = {
  water: { id: 'water', c: 4184, source: 'Table 2-3' },
  oil: { id: 'oil', c: 1800, source: 'Table 2-3' },
  glass: { id: 'glass', c: 840, source: 'Table 2-3' },
  granite: { id: 'granite', c: 790, source: 'Table 2-3' },
  aluminium: { id: 'aluminium', c: 900, source: 'Table 2-3' },
  iron: { id: 'iron', c: 470, source: 'Table 2-3 (iron/steel)' },
  copper: { id: 'copper', c: 387, source: 'Table 2-3' },
  lead: { id: 'lead', c: 130, source: 'Table 2-3' },
};

export interface PhaseMaterial {
  id: 'water';
  /** Melting point at standard atmospheric pressure, °C. */
  meltingPoint: number;
  /** Boiling point at standard atmospheric pressure, °C. */
  boilingPoint: number;
  cSolid: number;
  cLiquid: number;
  cGas: number;
  /** J/kg */
  Lf: number;
  /** J/kg */
  Lv: number;
}

/**
 * Water: c(ice) = 2000, c(water) = 4184, c(steam) = 1970 J/kg·°C (Table 2-3);
 * Lf = 334 kJ/kg (Table 3-3, example 6); Lv = 2430 kJ/kg (Table 4-3, example 7).
 * Melting and boiling points 0 °C and 100 °C assume standard pressure.
 * Note: the textbook's Lv value (2430 kJ/kg) is used for curriculum fidelity;
 * many references quote ≈2260 kJ/kg at 100 °C. See docs/curriculum-mapping.md.
 */
export const WATER: PhaseMaterial = {
  id: 'water',
  meltingPoint: 0,
  boilingPoint: 100,
  cSolid: 2000,
  cLiquid: 4184,
  cGas: 1970,
  Lf: 334_000,
  Lv: 2_430_000,
};
