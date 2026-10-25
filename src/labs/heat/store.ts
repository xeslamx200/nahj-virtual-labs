import { HEAT_PRESETS, type HeatMode } from '../../curriculum/heat';
import { createStore, useStore } from '../../lib/store';
import { MATERIALS, WATER, type MaterialId } from '../../physics/heat/materials';
import { HEAT_LIMITS, heatingAt, specificAt, timeToLimit, type HeatingRun } from '../../physics/heat/model';

export interface HeatUiState {
  mode: HeatMode;
  mass: number;
  T0: number;
  /** Heater power magnitude, W. */
  power: number;
  /** Phase mode only: true = remove energy at the same rate (cooling). */
  cooling: boolean;
  materialA: MaterialId;
  materialB: MaterialId;
  t: number;
  playing: boolean;
  /** Simulated seconds per real second. */
  speed: number;
  /** Seconds added by the Step button. */
  stepSize: number;
  presetId: string;
  activityId: string;
  labMode: 'guided' | 'free';
}

/** Longest run in the specific-heat comparison (20 min). */
export const SPECIFIC_MAX_TIME = 1200;

export const heatStore = createStore<HeatUiState>(() => ({
  ...fromPreset('specific'),
  t: 0,
  playing: false,
  activityId: 'specific-heat',
  labMode: 'guided',
}));
export const useHeat = () => useStore(heatStore);

function fromPreset(id: string) {
  const p = HEAT_PRESETS[id] ?? HEAT_PRESETS.curve;
  return {
    mode: p.mode,
    mass: p.mass,
    T0: p.T0,
    power: p.power,
    cooling: false,
    materialA: (p.materialA as MaterialId) ?? 'water',
    materialB: (p.materialB as MaterialId) ?? 'aluminium',
    speed: p.speed,
    stepSize: p.mode === 'specific' || id === 'fusion' ? 60 : 10,
    presetId: id,
  };
}

export const phaseRun = (s: Pick<HeatUiState, 'mass' | 'T0' | 'power' | 'cooling'>): HeatingRun => ({
  mass: s.mass,
  T0: s.T0,
  power: s.cooling ? -s.power : s.power,
});

/** Length of the current run: until the model limit (phase) or both samples reach 90 °C / 20 min (specific). */
export function runEnd(s: HeatUiState): number {
  if (s.mode === 'phase') {
    const end = timeToLimit(phaseRun(s), WATER);
    return Number.isFinite(end) ? Math.max(0, end) : 0;
  }
  const tFor = (c: number) => ((HEAT_LIMITS.specificTMax - s.T0) * s.mass * c) / s.power;
  return Math.min(SPECIFIC_MAX_TIME, Math.max(tFor(MATERIALS[s.materialA].c), tFor(MATERIALS[s.materialB].c)));
}

export function phaseNow(s: HeatUiState) {
  return heatingAt(phaseRun(s), s.t, WATER);
}

export function specificNow(s: HeatUiState) {
  const run = (id: MaterialId) => specificAt({ mass: s.mass, c: MATERIALS[id].c, T0: s.T0, power: s.power }, s.t);
  return { A: run(s.materialA), B: run(s.materialB) };
}

const configure = (patch: Partial<HeatUiState>) => heatStore.set((s) => ({ ...s, ...patch, t: 0, playing: false }));

export const heatActions = {
  play() {
    heatStore.set((s) => ({ ...s, playing: true, t: s.t >= runEnd(s) - 1e-9 ? 0 : s.t }));
  },
  pause() {
    heatStore.set((s) => ({ ...s, playing: false }));
  },
  rewind() {
    heatStore.set((s) => ({ ...s, t: 0, playing: false }));
  },
  step() {
    heatStore.set((s) => {
      const end = runEnd(s);
      const next = Math.round((s.t + s.stepSize) / s.stepSize) * s.stepSize;
      return { ...s, playing: false, t: Math.min(end, next) };
    });
  },
  seek(t: number) {
    heatStore.set((s) => ({ ...s, playing: false, t: Math.max(0, Math.min(runEnd(s), t)) }));
  },
  tick(realDt: number) {
    heatStore.set((s) => {
      if (!s.playing) return s;
      const end = runEnd(s);
      const t = s.t + realDt * s.speed;
      return t >= end ? { ...s, t: end, playing: false } : { ...s, t };
    });
  },
  setSpeed(speed: number) {
    heatStore.set((s) => ({ ...s, speed }));
  },
  setStepSize(stepSize: number) {
    heatStore.set((s) => ({ ...s, stepSize }));
  },
  loadPreset(id: string) {
    configure({ ...fromPreset(id) });
  },
  setMode(mode: HeatMode) {
    const s = heatStore.get();
    if (mode === s.mode) return;
    // Specific-heat runs must start inside the single-state range.
    const T0 = mode === 'specific' ? Math.min(Math.max(s.T0, HEAT_LIMITS.specificTMin), HEAT_LIMITS.specificTMax - 10) : s.T0;
    configure({ mode, T0, cooling: false, presetId: 'custom', stepSize: mode === 'specific' ? 60 : 10 });
  },
  set(patch: Partial<Pick<HeatUiState, 'mass' | 'T0' | 'power' | 'cooling' | 'materialA' | 'materialB'>>) {
    configure({ ...patch, presetId: 'custom' });
  },
  setActivity(activityId: string) {
    heatStore.set((s) => ({ ...s, activityId }));
  },
  setLabMode(labMode: HeatUiState['labMode']) {
    heatStore.set((s) => ({ ...s, labMode }));
  },
};
