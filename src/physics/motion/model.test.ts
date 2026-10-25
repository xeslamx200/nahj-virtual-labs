import { describe, expect, it } from 'vitest';
import {
  areaUnderVelocity,
  finalPosition,
  finalVelocity,
  finalVelocitySquared,
  kmhToMs,
  motionAt,
  pathLength,
  positionRange,
  sampleMotion,
  sanitizeMotion,
  slope,
  totalDuration,
  type MotionConfig,
} from './model';

describe('textbook worked examples (Unit 2)', () => {
  it('example 14: 150 m in 12 s → 12.5 m/s', () => {
    const cfg: MotionConfig = { x0: 0, v0: 12.5, stages: [{ duration: 12, a: 0 }] };
    expect(motionAt(cfg, 12).x).toBeCloseTo(150, 12);
  });
  it('example 25a: vi = 1 m/s, a = 0.5 m/s², t = 3 s → 2.5 m/s', () => {
    expect(finalVelocity(1, 0.5, 3)).toBeCloseTo(2.5, 12);
    expect(motionAt({ x0: 0, v0: 1, stages: [{ duration: 3, a: 0.5 }] }, 3).v).toBeCloseTo(2.5, 12);
  });
  it('example 25b: vi = 2 m/s, a = −0.5 m/s², t = 3 s → 0.5 m/s', () => {
    expect(finalVelocity(2, -0.5, 3)).toBeCloseTo(0.5, 12);
  });
  it('example 26: from rest, 1.4 m in 1.6 s → a ≈ 1.09 m/s²', () => {
    const a = (2 * 1.4) / (1.6 * 1.6);
    expect(a).toBeCloseTo(1.09, 2);
    expect(finalPosition(0, 0, a, 1.6)).toBeCloseTo(1.4, 12);
  });
  it('example 29: 0 → 25 m/s over 150 m → a ≈ 2.1 m/s²', () => {
    const a = (25 * 25 - 0) / (2 * 150);
    expect(a).toBeCloseTo(2.08, 2);
    expect(finalVelocitySquared(0, a, 150)).toBeCloseTo(625, 9);
  });
  it('example 24: robot 2 m/s² for 5 s, 0 for 5 s, −2 m/s² for 5 s → 100 m', () => {
    const cfg: MotionConfig = {
      x0: 0,
      v0: 0,
      stages: [
        { duration: 5, a: 2 },
        { duration: 5, a: 0 },
        { duration: 5, a: -2 },
      ],
    };
    expect(motionAt(cfg, 5).v).toBeCloseTo(10, 12);
    expect(motionAt(cfg, 5).x).toBeCloseTo(25, 12);
    expect(motionAt(cfg, 10).x).toBeCloseTo(75, 12);
    expect(motionAt(cfg, 15).x).toBeCloseTo(100, 12);
    expect(motionAt(cfg, 15).v).toBeCloseTo(0, 12);
    expect(areaUnderVelocity(sampleMotion(cfg, 0.1))).toBeCloseTo(100, 9);
  });
  it('example 16: robot 0.5 m/s right for 15 s, then 0.3 m/s left for 18 s → xf = 2.1 m', () => {
    const cfg: MotionConfig = { x0: 0, v0: 0.5, stages: [{ duration: 15, a: 0 }, { duration: 18, a: 0, v: -0.3 }] };
    const end = motionAt(cfg, 33);
    expect(end.x).toBeCloseTo(2.1, 12);
    expect(end.distance).toBeCloseTo(12.9, 12);
    expect(end.v).toBeCloseTo(-0.3, 12);
  });
  it('unit conversion: 80 km/h ≈ 22.2 m/s', () => {
    expect(kmhToMs(80)).toBeCloseTo(22.22, 2);
  });
});

describe('speed vs velocity, distance vs displacement', () => {
  const cfg: MotionConfig = { x0: 0, v0: 10, stages: [{ duration: 8, a: -2 }] };
  it('velocity becomes negative after turning around; speed stays positive', () => {
    const s = motionAt(cfg, 8);
    expect(s.v).toBeCloseTo(-6, 12);
    expect(s.speed).toBeCloseTo(6, 12);
  });
  it('distance counts both legs, displacement is net', () => {
    const s = motionAt(cfg, 8);
    // 0–5 s: 25 m forward; 5–8 s: 9 m back
    expect(s.displacement).toBeCloseTo(16, 12);
    expect(s.distance).toBeCloseTo(34, 12);
    expect(pathLength(10, -2, 8)).toBeCloseTo(34, 12);
  });
});

describe('graph consistency', () => {
  const cfg: MotionConfig = { x0: -10, v0: 3, stages: [{ duration: 4, a: 1.5 }, { duration: 4, a: -1 }] };
  const samples = sampleMotion(cfg, 0.1);

  it('samples cover the whole run and start/end at exact model values', () => {
    expect(samples[0].t).toBe(0);
    expect(samples.at(-1)!.t).toBeCloseTo(totalDuration(cfg), 12);
    expect(samples[0].x).toBe(-10);
    expect(samples.at(-1)!.x).toBeCloseTo(motionAt(cfg, 8).x, 12);
  });

  it('slope of the v–t graph equals the acceleration in each stage', () => {
    const i1 = samples.findIndex((s) => s.t >= 1);
    const i2 = samples.findIndex((s) => s.t >= 2);
    expect(slope(samples[i1].t, samples[i1].v, samples[i2].t, samples[i2].v)).toBeCloseTo(1.5, 9);
    const j1 = samples.findIndex((s) => s.t >= 5);
    const j2 = samples.findIndex((s) => s.t >= 7);
    expect(slope(samples[j1].t, samples[j1].v, samples[j2].t, samples[j2].v)).toBeCloseTo(-1, 9);
  });

  it('slope of the x–t graph (central difference) matches the plotted velocity', () => {
    for (let k = 1; k < samples.length - 1; k++) {
      if (Math.abs(samples[k].t - 4) < 0.15) continue; // skip the stage boundary kink
      const d = slope(samples[k - 1].t, samples[k - 1].x, samples[k + 1].t, samples[k + 1].x);
      expect(d).toBeCloseTo(samples[k].v, 6);
    }
  });

  it('area under v–t equals the displacement', () => {
    expect(areaUnderVelocity(samples)).toBeCloseTo(motionAt(cfg, 8).displacement, 9);
  });

  it('vf² = vi² + 2aΔx holds within a stage', () => {
    const s = motionAt(cfg, 4);
    expect(s.v * s.v).toBeCloseTo(finalVelocitySquared(3, 1.5, s.x - -10), 9);
  });

  it('position range spans the run', () => {
    const [lo, hi] = positionRange(cfg);
    expect(lo).toBeCloseTo(-10, 6);
    expect(hi).toBeGreaterThan(motionAt(cfg, 4).x);
  });
});

describe('input boundaries', () => {
  it('clamps out-of-range and invalid values', () => {
    const s = sanitizeMotion({ x0: 999, v0: Number.NaN, stages: [{ duration: -3, a: 99 }] });
    expect(s.x0).toBe(50);
    expect(s.v0).toBe(0);
    expect(s.stages[0].duration).toBe(0.5);
    expect(s.stages[0].a).toBe(5);
  });
  it('limits the number of stages and supplies a default', () => {
    const many = { x0: 0, v0: 0, stages: Array.from({ length: 9 }, () => ({ duration: 1, a: 0 })) };
    expect(sanitizeMotion(many).stages).toHaveLength(4);
    expect(sanitizeMotion({ x0: 0, v0: 0, stages: [] }).stages).toHaveLength(1);
  });
  it('time is clamped to the run (reset → t = 0 gives initial state)', () => {
    const cfg: MotionConfig = { x0: 5, v0: 2, stages: [{ duration: 3, a: 1 }] };
    expect(motionAt(cfg, -1)).toMatchObject({ t: 0, x: 5, v: 2, distance: 0 });
    expect(motionAt(cfg, 99).t).toBe(3);
  });
});
