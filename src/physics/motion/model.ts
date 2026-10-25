/**
 * One-dimensional kinematics with piecewise-constant acceleration.
 *
 * Textbook equations (Grade 10, Unit 2, Lesson 2-2):
 *   v = d / t              (5-2)  speed
 *   v⃗ = Δx⃗ / Δt            (6-2)  velocity
 *   a = Δv / Δt            (7-2)  acceleration
 *   vf = vi + a t          (8-2)
 *   xf = xi + vi t + ½ a t² (9-2)
 *   vf² = vi² + 2a(xf − xi) (10-2)
 *
 * Sign convention: motion to the right of the origin is positive (Figure 28-2).
 * Units: x in m, v in m/s, a in m/s², t in s.
 * Assumptions: point object on a straight track, acceleration constant within
 * each stage, no friction or air resistance unless it is part of the given a.
 */

export interface MotionStage {
  /** Duration of the stage in seconds (> 0). */
  duration: number;
  /** Constant acceleration in m/s². */
  a: number;
  /**
   * Optional velocity at the start of the stage (m/s). When given, the velocity
   * changes instantly to this value — the idealisation used in textbook
   * example 16 (a robot that reverses direction).
   */
  v?: number;
}

export interface MotionConfig {
  x0: number;
  v0: number;
  stages: MotionStage[];
}

export interface MotionState {
  t: number;
  x: number;
  v: number;
  a: number;
  /** |v| — speed is a scalar. */
  speed: number;
  /** Total path length travelled since t = 0 (scalar). */
  distance: number;
  /** x − x0 (vector, sign gives direction). */
  displacement: number;
  stage: number;
}

export const MOTION_LIMITS = {
  x0: { min: -50, max: 50, step: 1 },
  v0: { min: -20, max: 20, step: 0.5 },
  a: { min: -5, max: 5, step: 0.1 },
  duration: { min: 0.5, max: 20, step: 0.5 },
  totalDuration: 40,
  maxStages: 4,
} as const;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Validate and clamp a configuration to the supported ranges. */
export function sanitizeMotion(cfg: MotionConfig): MotionConfig {
  const L = MOTION_LIMITS;
  const fin = (n: number, d = 0) => (Number.isFinite(n) ? n : d);
  const stages = cfg.stages.slice(0, L.maxStages).map((s) => ({
    duration: clamp(fin(s.duration, 1), L.duration.min, L.duration.max),
    a: clamp(fin(s.a), L.a.min, L.a.max),
    ...(s.v !== undefined ? { v: clamp(fin(s.v), L.v0.min, L.v0.max) } : {}),
  }));
  return {
    x0: clamp(fin(cfg.x0), L.x0.min, L.x0.max),
    v0: clamp(fin(cfg.v0), L.v0.min, L.v0.max),
    stages: stages.length ? stages : [{ duration: 10, a: 0 }],
  };
}

export const totalDuration = (cfg: MotionConfig) => cfg.stages.reduce((s, st) => s + st.duration, 0);

/** Path length covered in time τ starting with velocity v and constant acceleration a. */
export function pathLength(v: number, a: number, tau: number): number {
  if (tau <= 0) return 0;
  const disp = (t: number) => v * t + 0.5 * a * t * t;
  if (a !== 0) {
    const tStop = -v / a; // instant where the velocity changes sign
    if (tStop > 0 && tStop < tau) return Math.abs(disp(tStop)) + Math.abs(disp(tau) - disp(tStop));
  }
  return Math.abs(disp(tau));
}

/** Exact state at time t (clamped to [0, total duration]). */
export function motionAt(cfg: MotionConfig, tRaw: number): MotionState {
  const T = totalDuration(cfg);
  const t = clamp(tRaw, 0, T);
  let x = cfg.x0;
  let v = cfg.v0;
  let distance = 0;
  let elapsed = 0;
  for (let i = 0; i < cfg.stages.length; i++) {
    const { duration, a } = cfg.stages[i];
    if (cfg.stages[i].v !== undefined) v = cfg.stages[i].v!;
    const tau = Math.min(duration, t - elapsed);
    const last = i === cfg.stages.length - 1;
    if (tau < duration || last) {
      const tt = Math.max(0, tau);
      const xf = x + v * tt + 0.5 * a * tt * tt; // (9-2)
      const vf = v + a * tt; // (8-2)
      distance += pathLength(v, a, tt);
      return { t, x: xf, v: vf, a, speed: Math.abs(vf), distance, displacement: xf - cfg.x0, stage: i };
    }
    distance += pathLength(v, a, duration);
    x = x + v * duration + 0.5 * a * duration * duration;
    v = v + a * duration;
    elapsed += duration;
  }
  return { t, x, v, a: 0, speed: Math.abs(v), distance, displacement: x - cfg.x0, stage: 0 };
}

/** Uniform samples of the motion, used for graphs and tables. */
export function sampleMotion(cfg: MotionConfig, dt = 0.1): MotionState[] {
  const T = totalDuration(cfg);
  const n = Math.max(1, Math.round(T / dt));
  const out: MotionState[] = [];
  for (let k = 0; k <= n; k++) out.push(motionAt(cfg, (k * T) / n));
  return out;
}

/** Positions reached during the run — used to size the track view. */
export function positionRange(cfg: MotionConfig): [number, number] {
  const samples = sampleMotion(cfg, 0.05);
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of samples) {
    lo = Math.min(lo, s.x);
    hi = Math.max(hi, s.x);
  }
  return [lo, hi];
}

/* Closed-form helpers for checks and explanations */
export const finalVelocity = (vi: number, a: number, t: number) => vi + a * t;
export const finalPosition = (xi: number, vi: number, a: number, t: number) => xi + vi * t + 0.5 * a * t * t;
export const finalVelocitySquared = (vi: number, a: number, dx: number) => vi * vi + 2 * a * dx;
export const averageVelocity = (dx: number, dt: number) => dx / dt;
export const kmhToMs = (kmh: number) => kmh / 3.6;
export const msToKmh = (ms: number) => ms * 3.6;

/** Slope between two samples — numerical derivative used to verify graph consistency. */
export const slope = (t1: number, y1: number, t2: number, y2: number) => (y2 - y1) / (t2 - t1);

/** Trapezoidal area under v–t samples (equals displacement for piecewise-linear v). */
export function areaUnderVelocity(samples: MotionState[]): number {
  let s = 0;
  for (let i = 1; i < samples.length; i++) s += 0.5 * (samples[i].v + samples[i - 1].v) * (samples[i].t - samples[i - 1].t);
  return s;
}
