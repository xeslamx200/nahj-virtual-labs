/**
 * Lab-level logic: what gets recorded, store actions and reset, and the
 * energy accounting shown in the heat lab. Values are checked against the
 * textbook figures quoted in the curriculum files.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { recordFor } from '../electricity/recorders';
import { elecActions, elecStore, sweepCharacteristic } from '../electricity/store';
import { energyBudget, heatRecordFor } from '../heat/HeatLab';
import { heatActions, heatStore, runEnd } from '../heat/store';
import { recordValues } from '../motion/MotionLab';
import { currentMotion, motionActions, motionStore } from '../motion/store';
import { WATER } from '../../physics/heat/materials';

const values = (r: ReturnType<typeof recordFor>) => {
  if (!('values' in r)) throw new Error(`blocked: ${r.blocked.en}`);
  return r.values;
};

describe('electricity lab', () => {
  beforeEach(() => elecStore.reset());

  it('records positive meter readings for the Ohm’s-law circuit at 1–4 V (Activity b1-4)', () => {
    for (const V of [1, 2, 3, 4]) {
      elecActions.update('B1', { voltage: V });
      const v = values(recordFor('ohm-voltage', elecStore.get()));
      expect(v.V).toBeCloseTo(V, 9);
      expect(v.I).toBeCloseTo(V / 10, 9);
      expect(v.R).toBeCloseTo(10, 9);
    }
  });

  it('blocks recording when the switch is open and explains why', () => {
    elecActions.toggleSwitch('S1');
    expect(elecStore.get().result.status).toBe('open');
    const r = recordFor('ohm-voltage', elecStore.get());
    expect('blocked' in r).toBe(true);
  });

  it('records the series and parallel bulb circuits of Figures 23-4 and 24-4', () => {
    elecActions.loadPreset('series');
    const s = recordFor('series-parallel', elecStore.get());
    expect(values(s).Itotal).toBeCloseTo(0.5, 9);
    expect(values(s).Vbulb).toBeCloseTo(0.5, 9);
    expect(values(s).Req).toBeCloseTo(3, 9);
    expect('tag' in s && s.tag).toBe('series');
    elecActions.loadPreset('parallel');
    const p = recordFor('series-parallel', elecStore.get());
    expect(values(p).Itotal).toBeCloseTo(4.5, 9);
    expect(values(p).Ibulb).toBeCloseTo(1.5, 9);
    expect(values(p).Req).toBeCloseTo(1 / 3, 9);
  });

  it('records the combined circuit of Lesson 2-4 review question 4', () => {
    elecActions.loadPreset('combined');
    const v = values(recordFor('combined-power', elecStore.get()));
    expect(v.Req).toBeCloseTo(26, 9);
    expect(v.Itotal).toBeCloseTo(0.5, 9);
    expect(v.Vpar).toBeCloseTo(3, 9);
    expect(v.P1).toBeCloseTo(5, 9); // 0.5² × 20
    expect(v.Ptotal).toBeCloseTo(6.5, 9); // = V × I = 13 × 0.5
  });

  it('detects the workshop short circuit (wire around the resistor) and recovers with undo', () => {
    elecActions.wireEdges([
      { x: 6, y: 2, dir: 'h' },
      { x: 7, y: 2, dir: 'v' },
      { x: 6, y: 3, dir: 'h' },
    ]);
    expect(elecStore.get().result.status).toBe('short');
    elecActions.undo();
    expect(elecStore.get().result.status).toBe('ok');
  });

  it('places, moves, rotates and removes parts; a part replaces a wire', () => {
    elecActions.loadPreset('blank');
    const id = elecActions.place('resistor', { x: 2, y: 2, dir: 'h' })!;
    expect(id).toBe('R1');
    elecActions.wire({ x: 0, y: 0 }, { x: 4, y: 0 });
    expect(elecStore.get().circuit.elements.filter((e) => e.kind === 'wire')).toHaveLength(4);
    const bulb = elecActions.place('bulb', { x: 1, y: 0, dir: 'h' });
    expect(bulb).toBe('L1');
    expect(elecStore.get().circuit.elements.filter((e) => e.kind === 'wire')).toHaveLength(3);
    // cannot place on top of another part
    expect(elecActions.place('switch', { x: 2, y: 2, dir: 'h' })).toBeNull();
    elecActions.move('R1', { x: 5, y: 3, dir: 'h' });
    expect(elecStore.get().circuit.elements.find((e) => e.id === 'R1')!.edge).toEqual({ x: 5, y: 3, dir: 'h' });
    elecActions.rotate('R1');
    expect(elecStore.get().circuit.elements.find((e) => e.id === 'R1')!.edge.dir).toBe('v');
    elecActions.remove('R1');
    expect(elecStore.get().circuit.elements.some((e) => e.id === 'R1')).toBe(false);
    // out-of-grid placement is refused
    expect(elecActions.place('battery', { x: 10, y: 0, dir: 'h' })).toBeNull();
  });

  it('clamps out-of-range values typed by the learner', () => {
    elecActions.update('B1', { voltage: 500 });
    expect(elecStore.get().circuit.elements.find((e) => e.id === 'B1')!.voltage).toBe(24);
    elecActions.update('R1', { resistance: -3 });
    expect(elecStore.get().circuit.elements.find((e) => e.id === 'R1')!.resistance).toBe(1);
  });

  it('builds a straight I–V characteristic for a resistor and a curved one for a filament bulb', () => {
    const iv = sweepCharacteristic(elecStore.get().circuit, 'R1', 'B1')!;
    for (const p of iv.slice(1)) expect(p.v / p.i).toBeCloseTo(10, 9);
    elecActions.loadPreset('series');
    elecActions.update('L1', { bulbModel: 'filament' });
    const lamp = sweepCharacteristic(elecStore.get().circuit, 'L1', 'B1')!;
    const r = lamp.slice(1).map((p) => p.v / p.i);
    for (let i = 1; i < r.length; i++) expect(r[i]).toBeGreaterThan(r[i - 1]);
  });

  it('reset reloads the activity set-up', () => {
    elecActions.clear();
    expect(elecStore.get().result.status).toBe('empty');
    elecActions.loadPreset('ohm');
    expect(elecStore.get().result.status).toBe('ok');
  });
});

describe('motion lab', () => {
  beforeEach(() => motionStore.reset());

  it('steps in whole seconds and records values consistent with the equations', () => {
    motionActions.loadPreset('accelerated'); // vi = 1 m/s, a = 0.5 m/s² (Example 25)
    for (let k = 0; k < 3; k++) motionActions.step(1);
    const st = currentMotion(motionStore.get());
    expect(st.t).toBe(3);
    const v = recordValues('accelerated', st);
    expect(v.v).toBeCloseTo(2.5, 12);
    expect(v.x).toBeCloseTo(1 * 3 + 0.5 * 0.5 * 9, 12);
  });

  it('play/tick stops exactly at the end of the run', () => {
    motionActions.loadPreset('uniform');
    motionActions.play();
    for (let i = 0; i < 200; i++) motionActions.tick(0.1);
    const s = motionStore.get();
    expect(s.playing).toBe(false);
    expect(s.t).toBe(10);
    expect(currentMotion(s).x).toBeCloseTo(50, 12);
  });

  it('turnaround: distance exceeds displacement after the cart reverses', () => {
    motionActions.loadPreset('turnaround');
    motionActions.seek(8);
    const v = recordValues('turnaround', currentMotion(motionStore.get()));
    expect(v.dx).toBeCloseTo(16, 12);
    expect(v.d).toBeCloseTo(34, 12);
    expect(v.speed).toBeCloseTo(Math.abs(v.v), 12);
  });

  it('refuses set-ups longer than the 40 s limit and rewinds on any change', () => {
    motionActions.loadPreset('robot');
    motionActions.seek(7);
    motionActions.setStage(0, { duration: 20 });
    motionActions.addStage(); // 20 + 5 + 5 + 5 = 35 s, allowed
    motionActions.setStage(3, { duration: 20 }); // would be 50 s
    const c = motionStore.get().config;
    expect(c.stages.reduce((s, x) => s + x.duration, 0)).toBeLessThanOrEqual(40);
    expect(motionStore.get().t).toBe(0);
  });
});

describe('heat & matter lab', () => {
  beforeEach(() => heatStore.reset());

  it('specific heat: after 600 s at 100 W, water rises 14.3 °C and aluminium 66.7 °C, and c is recovered exactly', () => {
    heatActions.loadPreset('specific');
    heatActions.seek(600);
    const r = heatRecordFor('specific-heat', heatStore.get());
    if (!('values' in r)) throw new Error('blocked');
    expect(r.values.Q).toBe(60000);
    expect(r.values.TA - 20).toBeCloseTo(60000 / 4184, 9);
    expect(r.values.TB - 20).toBeCloseTo(60000 / 900, 9);
    expect(r.values.cA).toBeCloseTo(4184, 6);
    expect(r.values.cB).toBeCloseTo(900, 6);
  });

  it('specific heat: recording is blocked at t = 0 and once a sample reaches the 90 °C model limit', () => {
    heatActions.loadPreset('specific');
    expect('blocked' in heatRecordFor('specific-heat', heatStore.get())).toBe(true);
    heatActions.seek(700); // aluminium reaches 90 °C at 630 s
    expect('blocked' in heatRecordFor('specific-heat', heatStore.get())).toBe(true);
  });

  it('latent heat of fusion: Q / m melted equals Lf at any time during melting', () => {
    heatActions.loadPreset('fusion');
    for (const t of [60, 120, 180]) {
      heatActions.seek(t);
      const r = heatRecordFor('latent-fusion', heatStore.get());
      if (!('values' in r)) throw new Error('blocked');
      expect(r.values.Lf).toBeCloseTo(WATER.Lf, 6);
      expect(r.values.T).toBe(0);
      expect(r.values.melted).toBeCloseTo((200 * t) / WATER.Lf, 12);
    }
  });

  it('energy accounting: stage energies add up to P × t across the whole heating curve', () => {
    heatActions.loadPreset('curve');
    const end = runEnd(heatStore.get());
    for (const t of [10, 100, 300, 500, end]) {
      heatActions.seek(t);
      const s = heatStore.get();
      const b = energyBudget(s);
      const sum = b.rows.reduce((acc, r) => acc + r.Q, 0);
      expect(sum).toBeCloseTo(b.total, 6);
      expect(b.total).toBeCloseTo(Math.min(t, end) * s.power, 6);
    }
    // the melting row is exactly m·Lf once melting is over
    heatActions.seek(300);
    expect(energyBudget(heatStore.get()).rows[1].Q).toBeCloseTo(0.2 * WATER.Lf, 6);
  });

  it('cooling removes energy and the run ends at the −40 °C model limit', () => {
    heatActions.loadPreset('scales');
    heatActions.set({ cooling: true });
    const end = runEnd(heatStore.get());
    heatActions.seek(end + 100);
    const r = heatRecordFor('temperature-scales', heatStore.get());
    if (!('values' in r)) throw new Error('blocked');
    expect(r.values.T).toBeCloseTo(-40, 9);
    expect(r.values.F).toBeCloseTo(-40, 9); // −40 is the same on both scales
    expect(r.values.K).toBeCloseTo(233.15, 9);
  });
});
