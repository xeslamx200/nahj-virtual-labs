import { MOTION_PRESETS } from '../../curriculum/motion';
import { createStore, useStore } from '../../lib/store';
import { MOTION_LIMITS, motionAt, sanitizeMotion, totalDuration, type MotionConfig, type MotionStage } from '../../physics/motion/model';

export interface MotionUiState {
  config: MotionConfig;
  presetId: string;
  t: number;
  playing: boolean;
  /** Simulation seconds per real second. */
  rate: number;
  activityId: string;
  mode: 'guided' | 'free';
}

const clone = (c: MotionConfig): MotionConfig => ({ ...c, stages: c.stages.map((s) => ({ ...s })) });

export const motionStore = createStore<MotionUiState>(() => ({
  config: clone(MOTION_PRESETS.uniform),
  presetId: 'uniform',
  t: 0,
  playing: false,
  rate: 1,
  activityId: 'uniform',
  mode: 'guided',
}));
export const useMotion = () => useStore(motionStore);

/** Changing the set-up always rewinds to t = 0 so graphs and table stay consistent with one run. */
function setConfig(config: MotionConfig, extra: Partial<MotionUiState> = {}) {
  const clean = sanitizeMotion(config);
  if (totalDuration(clean) > MOTION_LIMITS.totalDuration + 1e-9) return false; // keep the previous valid set-up
  motionStore.set((s) => ({ ...s, config: clean, t: 0, playing: false, ...extra }));
  return true;
}

export const motionActions = {
  play() {
    motionStore.set((s) => ({ ...s, playing: true, t: s.t >= totalDuration(s.config) - 1e-9 ? 0 : s.t }));
  },
  pause() {
    motionStore.set((s) => ({ ...s, playing: false }));
  },
  /** Advance by exactly `dt` seconds (snapped to the step grid) and pause. */
  step(dt = 1) {
    motionStore.set((s) => {
      const T = totalDuration(s.config);
      const next = Math.min(T, Math.round((s.t + dt) / dt) * dt);
      return { ...s, playing: false, t: next };
    });
  },
  rewind() {
    motionStore.set((s) => ({ ...s, playing: false, t: 0 }));
  },
  seek(t: number) {
    motionStore.set((s) => ({ ...s, playing: false, t: Math.max(0, Math.min(totalDuration(s.config), t)) }));
  },
  /** Called by the animation loop. Stops at the end of the run. */
  tick(realDt: number) {
    motionStore.set((s) => {
      if (!s.playing) return s;
      const T = totalDuration(s.config);
      const t = s.t + realDt * s.rate;
      return t >= T ? { ...s, t: T, playing: false } : { ...s, t };
    });
  },
  setRate(rate: number) {
    motionStore.set((s) => ({ ...s, rate }));
  },
  loadPreset(id: string) {
    const p = MOTION_PRESETS[id];
    if (p) setConfig(clone(p), { presetId: id });
  },
  setStart(patch: Partial<Pick<MotionConfig, 'x0' | 'v0'>>) {
    const c = motionStore.get().config;
    setConfig({ ...c, ...patch }, { presetId: 'custom' });
  },
  setStage(i: number, patch: Partial<MotionStage> & { v?: number | undefined }) {
    const c = motionStore.get().config;
    const stages = c.stages.map((s, k) => {
      if (k !== i) return s;
      const next = { ...s, ...patch };
      if ('v' in patch && patch.v === undefined) delete next.v;
      return next;
    });
    setConfig({ ...c, stages }, { presetId: 'custom' });
  },
  addStage() {
    const c = motionStore.get().config;
    if (c.stages.length >= 4) return;
    setConfig({ ...c, stages: [...c.stages, { duration: 5, a: 0 }] }, { presetId: 'custom' });
  },
  removeStage(i: number) {
    const c = motionStore.get().config;
    if (c.stages.length <= 1) return;
    setConfig({ ...c, stages: c.stages.filter((_, k) => k !== i) }, { presetId: 'custom' });
  },
  setActivity(activityId: string) {
    motionStore.set((s) => ({ ...s, activityId }));
  },
  setMode(mode: MotionUiState['mode']) {
    motionStore.set((s) => ({ ...s, mode }));
  },
};

export const currentMotion = (s: MotionUiState) => motionAt(s.config, s.t);
