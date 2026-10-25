/**
 * Heat and change of state (Grade 10, Unit 3).
 *
 *   Q = m c ΔT   (4-3)  temperature change within one state
 *   Q = m Lf     (5-3)  melting / freezing at constant temperature
 *   Q = m Lv     (6-3)  boiling / condensing at constant temperature
 *   TF = 9/5 TC + 32,  TC = 5/9 (TF − 32),  TK = TC + 273.15   (1-3 … 3-3)
 *
 * Model assumptions:
 *  - Pure substance at constant (standard) pressure, uniform temperature.
 *  - Heater energy goes entirely into the sample (no losses, ideal insulation).
 *  - Constant c within each state; during melting or boiling the temperature
 *    stays exactly at the transition temperature until the change is complete.
 *  - The particle picture is qualitative.
 */
import { WATER, type PhaseMaterial } from './materials';

export type Phase = 'solid' | 'solid-liquid' | 'liquid' | 'liquid-gas' | 'gas';

export interface PhaseState {
  /** Temperature, °C */
  T: number;
  phase: Phase;
  /** Mass fractions (sum to 1). */
  solid: number;
  liquid: number;
  gas: number;
}

export const HEAT_LIMITS = {
  mass: { min: 0.1, max: 2, step: 0.1 }, // kg
  power: { min: 50, max: 2000, step: 50 }, // W
  tMin: -40, // °C, lowest temperature represented
  tMax: 140, // °C, highest temperature represented
  specificTMax: 90, // °C, upper limit of the single-state (specific heat) model
  specificTMin: 10,
} as const;

/** Energy content relative to the solid at its melting point, J. */
export function enthalpy(mat: PhaseMaterial, m: number, s: PhaseState): number {
  const { meltingPoint: Tm, boilingPoint: Tb } = mat;
  switch (s.phase) {
    case 'solid':
      return m * mat.cSolid * (s.T - Tm);
    case 'solid-liquid':
      return m * mat.Lf * s.liquid;
    case 'liquid':
      return m * mat.Lf + m * mat.cLiquid * (s.T - Tm);
    case 'liquid-gas':
      return m * mat.Lf + m * mat.cLiquid * (Tb - Tm) + m * mat.Lv * s.gas;
    case 'gas':
      return m * mat.Lf + m * mat.cLiquid * (Tb - Tm) + m * mat.Lv + m * mat.cGas * (s.T - Tb);
  }
}

/** Inverse of `enthalpy`. */
export function stateFromEnthalpy(mat: PhaseMaterial, m: number, H: number): PhaseState {
  const { meltingPoint: Tm, boilingPoint: Tb } = mat;
  const meltEnd = m * mat.Lf;
  const boilStart = meltEnd + m * mat.cLiquid * (Tb - Tm);
  const boilEnd = boilStart + m * mat.Lv;
  if (H < 0) return { T: Tm + H / (m * mat.cSolid), phase: 'solid', solid: 1, liquid: 0, gas: 0 };
  if (H === 0) return { T: Tm, phase: 'solid', solid: 1, liquid: 0, gas: 0 };
  if (H < meltEnd) {
    const f = H / meltEnd;
    return { T: Tm, phase: 'solid-liquid', solid: 1 - f, liquid: f, gas: 0 };
  }
  if (H <= boilStart) return { T: Tm + (H - meltEnd) / (m * mat.cLiquid), phase: 'liquid', solid: 0, liquid: 1, gas: 0 };
  if (H < boilEnd) {
    const g = (H - boilStart) / (boilEnd - boilStart);
    return { T: Tb, phase: 'liquid-gas', solid: 0, liquid: 1 - g, gas: g };
  }
  return { T: Tb + (H - boilEnd) / (m * mat.cGas), phase: 'gas', solid: 0, liquid: 0, gas: 1 };
}

/** Single-state starting condition for a temperature: ice ≤ 0 °C, water ≤ 100 °C, steam above. */
export function initialState(mat: PhaseMaterial, T: number): PhaseState {
  if (T <= mat.meltingPoint) return { T, phase: 'solid', solid: 1, liquid: 0, gas: 0 };
  if (T <= mat.boilingPoint) return { T, phase: 'liquid', solid: 0, liquid: 1, gas: 0 };
  return { T, phase: 'gas', solid: 0, liquid: 0, gas: 1 };
}

export interface HeatingRun {
  mass: number;
  /** Initial temperature, °C */
  T0: number;
  /** Signed heater power: positive heats, negative cools (W = J/s). */
  power: number;
}

export interface HeatingSample extends PhaseState {
  t: number;
  /** Energy added since t = 0 (negative when cooling), J. */
  Q: number;
  /** True when the model limit was reached and the run stopped. */
  atLimit: boolean;
}

export function enthalpyBounds(mat: PhaseMaterial, m: number): [number, number] {
  return [
    enthalpy(mat, m, initialState(mat, HEAT_LIMITS.tMin)),
    enthalpy(mat, m, initialState(mat, HEAT_LIMITS.tMax)),
  ];
}

/** Exact state of the sample t seconds after the heater was switched on. */
export function heatingAt(run: HeatingRun, t: number, mat: PhaseMaterial = WATER): HeatingSample {
  const H0 = enthalpy(mat, run.mass, initialState(mat, run.T0));
  const [lo, hi] = enthalpyBounds(mat, run.mass);
  const raw = H0 + run.power * Math.max(0, t);
  const H = Math.min(hi, Math.max(lo, raw));
  const s = stateFromEnthalpy(mat, run.mass, H);
  return { ...s, t, Q: H - H0, atLimit: raw !== H };
}

/** Time needed to reach the model limit in the current direction. */
export function timeToLimit(run: HeatingRun, mat: PhaseMaterial = WATER): number {
  if (run.power === 0) return Infinity;
  const H0 = enthalpy(mat, run.mass, initialState(mat, run.T0));
  const [lo, hi] = enthalpyBounds(mat, run.mass);
  return run.power > 0 ? (hi - H0) / run.power : (lo - H0) / run.power;
}

export function sampleHeating(run: HeatingRun, duration: number, dt: number, mat: PhaseMaterial = WATER): HeatingSample[] {
  const n = Math.max(1, Math.round(duration / dt));
  return Array.from({ length: n + 1 }, (_, k) => heatingAt(run, (k * duration) / n, mat));
}

/* ---- Single-state (specific heat) model --------------------------------- */

export interface SpecificRun {
  mass: number;
  c: number;
  T0: number;
  power: number;
}

/** T(t) = T0 + P t / (m c), stopped at the model's upper temperature. */
export function specificAt(run: SpecificRun, t: number) {
  const Q = run.power * Math.max(0, t);
  const Traw = run.T0 + Q / (run.mass * run.c);
  const T = Math.min(Traw, HEAT_LIMITS.specificTMax);
  const Qused = (T - run.T0) * run.mass * run.c;
  return { t, T, Q: Qused, atLimit: Traw > HEAT_LIMITS.specificTMax };
}

/* ---- Equations ----------------------------------------------------------- */

export const heatForTemperatureChange = (m: number, c: number, dT: number) => m * c * dT;
export const heatForPhaseChange = (m: number, L: number) => m * L;
export const specificHeatFrom = (Q: number, m: number, dT: number) => Q / (m * dT);
export const latentHeatFrom = (Q: number, m: number) => Q / m;

export const celsiusToFahrenheit = (c: number) => (9 / 5) * c + 32;
export const fahrenheitToCelsius = (f: number) => (5 / 9) * (f - 32);
export const celsiusToKelvin = (c: number) => c + 273.15;
export const kelvinToCelsius = (k: number) => k - 273.15;

/** Energy budget from T1 to T2 for water, split by stage (for explanations and tests). */
export function waterEnergyBudget(m: number, T1: number, T2: number, mat: PhaseMaterial = WATER) {
  const H1 = enthalpy(mat, m, initialState(mat, T1));
  const H2 = enthalpy(mat, m, initialState(mat, T2));
  return { total: H2 - H1 };
}
