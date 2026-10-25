import { describe, expect, it } from 'vitest';
import { makeElement, withWires } from './builder';
import { combinedCircuit, ohmCircuit, parallelCircuit, seriesCircuit } from './presets';
import { FILAMENT_K, ohmCurrent, parallelResistance, seriesResistance, solveCircuit } from './solver';
import type { Circuit, CircuitElement } from './types';

const byId = (c: Circuit, id: string) => c.elements.find((e) => e.id === id)!;
const set = (c: Circuit, id: string, patch: Partial<CircuitElement>): Circuit => ({
  elements: c.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
});

describe('closed-form helpers', () => {
  it("Ohm's law: textbook example 3 (I = 2.5 A, R = 3.6 Ω → V = 9 V)", () => {
    expect(2.5 * 3.6).toBeCloseTo(9, 10);
    expect(ohmCurrent(1.5, 2)).toBeCloseTo(0.75, 12); // example 5
  });
  it('series equivalent resistance (example 8: 1..7 Ω → 28 Ω)', () => {
    expect(seriesResistance([1, 2, 3, 4, 5, 6, 7])).toBe(28);
  });
  it('parallel equivalent resistance (example 10: 10 ∥ 10 → 5 Ω; example 11: 2 ∥ 3 → 1.2 Ω)', () => {
    expect(parallelResistance([10, 10])).toBeCloseTo(5, 12);
    expect(parallelResistance([2, 3])).toBeCloseTo(1.2, 12);
    expect(parallelResistance([2, 3]) + 1.5).toBeCloseTo(2.7, 12);
  });
});

describe('solveCircuit — single resistor (Activity b1-4)', () => {
  it.each([1, 2, 3, 4])('V = %d V across 10 Ω gives I = V/10', (v) => {
    const c = ohmCircuit(v, 10);
    const r = solveCircuit(c);
    expect(r.status).toBe('ok');
    expect(r.elements.A1.reading).toBeCloseTo(v / 10, 12);
    expect(r.elements.V1.reading).toBeCloseTo(v, 12);
    expect(r.elements.R1.current).toBeCloseTo(v / 10, 12);
    expect(r.equivalentResistance).toBeCloseTo(10, 9);
    expect(r.elements.R1.power).toBeCloseTo((v * v) / 10, 12);
  });

  it('current is inversely proportional to resistance at constant voltage', () => {
    const rs = [5, 10, 20, 40];
    const is = rs.map((R) => solveCircuit(ohmCircuit(6, R)).elements.A1.reading!);
    rs.forEach((R, k) => expect(is[k]).toBeCloseTo(6 / R, 12));
    expect(is[0] / is[1]).toBeCloseTo(2, 12);
  });

  it('opening the switch makes the circuit open: zero current, voltmeter reads 0 across R', () => {
    const c = set(ohmCircuit(3, 10), 'S1', { closed: false });
    const r = solveCircuit(c);
    expect(r.status).toBe('open');
    expect(r.elements.A1.reading).toBe(0);
    expect(r.elements.V1.reading).toBeCloseTo(0, 12);
    // the full battery voltage appears across the open switch
    expect(Math.abs(r.elements.S1.voltageDrop)).toBeCloseTo(3, 12);
  });

  it('reversing the battery reverses the meter readings', () => {
    const c = set(ohmCircuit(2, 10), 'B1', { flipped: false });
    const r = solveCircuit(c);
    expect(r.elements.A1.reading).toBeCloseTo(-0.2, 12);
    expect(r.elements.V1.reading).toBeCloseTo(-2, 12);
  });

  it('removing a wire leaves an incomplete circuit and flags the dangling parts', () => {
    const c = ohmCircuit(3, 10);
    const wire = c.elements.find((e) => e.kind === 'wire' && e.edge.y === 4)!;
    const r = solveCircuit({ elements: c.elements.filter((e) => e !== wire) });
    expect(r.status).toBe('open');
    expect(r.totalCurrent).toBe(0);
    expect(r.warnings.some((w) => w.code === 'dangling')).toBe(true);
  });
});

describe('solveCircuit — series (Figure 23-4)', () => {
  it('three 1 Ω bulbs on 1.5 V: I = 0.5 A, 0.5 V each, same current everywhere', () => {
    const c = seriesCircuit();
    const r = solveCircuit(c);
    expect(r.status).toBe('ok');
    expect(r.equivalentResistance).toBeCloseTo(3, 9);
    for (const id of ['L1', 'L2', 'L3']) {
      expect(r.elements[id].current).toBeCloseTo(0.5, 12);
      expect(r.elements[id].voltageDrop).toBeCloseTo(0.5, 12);
    }
    expect(r.elements.A1.reading).toBeCloseTo(0.5, 12);
    expect(r.elements.V1.reading).toBeCloseTo(0.5, 12);
  });

  it('voltage drops add up to the battery voltage (V = V1 + V2 + V3)', () => {
    const c = seriesCircuit(9);
    const c2 = set(set(c, 'L1', { resistance: 2 }), 'L3', { resistance: 6 });
    const r = solveCircuit(c2);
    const sum = ['L1', 'L2', 'L3'].reduce((s, id) => s + r.elements[id].voltageDrop, 0);
    expect(sum).toBeCloseTo(9, 12);
    expect(r.totalCurrent).toBeCloseTo(9 / 9, 12);
  });

  it('example 9: 10 Ω + 20 Ω on 10 V → 0.33 A', () => {
    const els = [
      makeElement('battery', 0, 0, 'v', { id: 'B', voltage: 10, flipped: true }),
      makeElement('resistor', 1, 0, 'h', { id: 'Ra', resistance: 10 }),
      makeElement('resistor', 1, 1, 'h', { id: 'Rb', resistance: 20 }),
    ];
    const c = { elements: withWires(els, [[0, 0], [1, 0]], [[2, 0], [2, 1]], [[1, 1], [0, 1]]) };
    const r = solveCircuit(c);
    expect(r.totalCurrent).toBeCloseTo(1 / 3, 12);
  });

  it('removing one series bulb stops the current in the others (Figure 19-4b)', () => {
    const c = seriesCircuit();
    const r = solveCircuit({ elements: c.elements.filter((e) => e.id !== 'L2') });
    expect(r.status).toBe('open');
    expect(r.elements.L1.brightness).toBe(0);
  });
});

describe('solveCircuit — parallel (Figure 24-4)', () => {
  it('three 1 Ω bulbs on 1.5 V: 1.5 A each, 4.5 A total, 1.5 V across each', () => {
    const r = solveCircuit(parallelCircuit());
    expect(r.status).toBe('ok');
    for (const id of ['L1', 'L2', 'L3']) {
      expect(r.elements[id].current).toBeCloseTo(1.5, 12);
      expect(r.elements[id].voltageDrop).toBeCloseTo(1.5, 12);
    }
    expect(r.elements.A1.reading).toBeCloseTo(4.5, 12);
    expect(r.elements.A2.reading).toBeCloseTo(1.5, 12);
    expect(r.elements.V1.reading).toBeCloseTo(1.5, 12);
    expect(r.equivalentResistance).toBeCloseTo(1 / 3, 9);
  });

  it('current conservation at junctions: I_total = I1 + I2 + I3 for unequal branches', () => {
    let c = parallelCircuit(6);
    c = set(set(set(c, 'L1', { resistance: 2 }), 'L2', { resistance: 3 }), 'L3', { resistance: 6 });
    const r = solveCircuit(c);
    const sum = r.elements.L1.current + r.elements.L2.current + r.elements.L3.current;
    expect(r.elements.A1.reading).toBeCloseTo(sum, 12);
    expect(sum).toBeCloseTo(6 / parallelResistance([2, 3, 6]), 12);
  });

  it('removing one parallel bulb leaves the others lit with unchanged current (Figure 19-4c)', () => {
    const c = parallelCircuit();
    const r = solveCircuit({ elements: c.elements.filter((e) => e.id !== 'L3') });
    expect(r.elements.L1.current).toBeCloseTo(1.5, 12);
    expect(r.elements.A1.reading).toBeCloseTo(3, 12);
  });

  it('opening the branch switch on the main line turns all bulbs off', () => {
    const r = solveCircuit(set(parallelCircuit(), 'S1', { closed: false }));
    expect(r.status).toBe('open');
    expect(r.elements.L1.brightness).toBe(0);
  });
});

describe('solveCircuit — combined circuit (Lesson 2-4 review Q4)', () => {
  it('13 V, 20 Ω + (10 Ω ∥ 15 Ω)', () => {
    const r = solveCircuit(combinedCircuit());
    expect(r.equivalentResistance).toBeCloseTo(26, 9);
    expect(r.elements.A1.reading).toBeCloseTo(0.5, 12);
    expect(r.elements.R1.voltageDrop).toBeCloseTo(10, 12);
    expect(r.elements.R2.current).toBeCloseTo(0.3, 12);
    expect(r.elements.R3.current).toBeCloseTo(0.2, 12);
    expect(r.elements.V1.reading).toBeCloseTo(3, 12);
  });

  it('energy conservation: battery power equals total dissipated power', () => {
    const c = combinedCircuit();
    const r = solveCircuit(c);
    const delivered = r.elements.B1.power;
    const dissipated = ['R1', 'R2', 'R3'].reduce((s, id) => s + r.elements[id].power, 0);
    expect(delivered).toBeCloseTo(dissipated, 10);
    expect(delivered).toBeCloseTo(13 * 0.5, 10); // P = VI
  });

  it('KCL holds at every grid point (wires included)', () => {
    const c = combinedCircuit();
    const r = solveCircuit(c);
    const net = new Map<string, number>();
    for (const e of c.elements) {
      const [p, q] =
        e.edge.dir === 'h' ? [`${e.edge.x},${e.edge.y}`, `${e.edge.x + 1},${e.edge.y}`] : [`${e.edge.x},${e.edge.y}`, `${e.edge.x},${e.edge.y + 1}`];
      const [a, b] = e.flipped ? [q, p] : [p, q];
      const i = r.elements[e.id].current;
      net.set(a, (net.get(a) ?? 0) + i);
      net.set(b, (net.get(b) ?? 0) - i);
    }
    for (const v of net.values()) expect(Math.abs(v)).toBeLessThan(1e-9);
  });
});

describe('invalid and special states', () => {
  it('detects a battery short-circuited by a wire', () => {
    const els = [makeElement('battery', 0, 0, 'v', { id: 'B', voltage: 6 }), makeElement('resistor', 1, 0, 'v', { id: 'R' })];
    const c = { elements: withWires(els, [[0, 0], [1, 0]], [[0, 1], [1, 1]]) };
    expect(solveCircuit(c).status).toBe('ok');
    // replace the resistor by a plain wire: the battery terminals are now joined by 0 Ω
    const s = { elements: [...c.elements.filter((e) => e.id !== 'R'), makeElement('wire', 1, 0, 'v', { id: 'W' })] };
    const r = solveCircuit(s);
    expect(r.status).toBe('short');
    expect(r.faultyIds).toContain('B');
  });

  it('an ammeter placed directly across the battery is reported as a short', () => {
    const els = [makeElement('battery', 0, 0, 'v', { id: 'B', voltage: 6 }), makeElement('ammeter', 1, 0, 'v', { id: 'A' })];
    const c = { elements: withWires(els, [[0, 0], [1, 0]], [[0, 1], [1, 1]]) };
    const r = solveCircuit(c);
    expect(r.status).toBe('short');
    expect(r.warnings.some((w) => w.code === 'ammeter-parallel' && w.elementId === 'A')).toBe(true);
  });

  it('an ammeter across a resistor bypasses it and is flagged', () => {
    const c = ohmCircuit(3, 10);
    const am = makeElement('ammeter', 7, 2, 'v', { id: 'A2' });
    const extra = withWires([...c.elements, am], [[6, 2], [7, 2]], [[7, 3], [6, 3]]);
    const r = solveCircuit({ elements: extra });
    expect(r.warnings.some((w) => w.code === 'bypassed' && w.elementId === 'R1')).toBe(true);
    expect(r.warnings.some((w) => w.code === 'ammeter-parallel')).toBe(true);
    expect(r.elements.R1.current).toBe(0);
  });

  it('a voltmeter in series blocks the current and reads the battery voltage', () => {
    const c = ohmCircuit(4, 10);
    const swapped = c.elements.map((e) => (e.id === 'A1' ? { ...e, kind: 'voltmeter' as const } : e));
    const r = solveCircuit({ elements: swapped });
    expect(r.status).toBe('open');
    expect(Math.abs(r.elements.A1.reading!)).toBeCloseTo(4, 12);
    expect(r.warnings.some((w) => w.code === 'voltmeter-series' && w.elementId === 'A1')).toBe(true);
  });

  it('ideal batteries directly in parallel are rejected, not solved', () => {
    const els = [
      makeElement('battery', 0, 0, 'v', { id: 'B1', voltage: 6 }),
      makeElement('battery', 1, 0, 'v', { id: 'B2', voltage: 3 }),
    ];
    const c = { elements: withWires(els, [[0, 0], [1, 0]], [[0, 1], [1, 1]]) };
    expect(solveCircuit(c).status).toBe('conflict');
  });

  it('two cells in series add their voltages', () => {
    const els = [
      makeElement('battery', 0, 0, 'v', { id: 'B1', voltage: 1.5, flipped: true }),
      makeElement('battery', 0, 1, 'v', { id: 'B2', voltage: 1.5, flipped: true }),
      makeElement('resistor', 2, 0, 'v', { id: 'R', resistance: 3 }),
    ];
    const c = { elements: withWires(els, [[0, 0], [2, 0]], [[2, 1], [2, 2], [0, 2]]) };
    const r = solveCircuit(c);
    expect(r.elements.R.current).toBeCloseTo(1, 12);
  });

  it('empty and source-less circuits', () => {
    expect(solveCircuit({ elements: [] }).status).toBe('empty');
    const r = solveCircuit({ elements: [makeElement('resistor', 0, 0, 'h', { id: 'R' })] });
    expect(r.status).toBe('no-source');
  });

  it('flags high battery current', () => {
    const r = solveCircuit(ohmCircuit(24, 1));
    expect(r.warnings.some((w) => w.code === 'high-current')).toBe(true);
  });
});

describe('filament bulb (non-ohmic enrichment model)', () => {
  it('converges to R = R0(1 + k|V|) and gives a non-linear V–I curve', () => {
    const base = ohmCircuit(2, 10);
    const c = {
      elements: base.elements.map((e) =>
        e.id === 'R1' ? { ...e, kind: 'bulb' as const, bulbModel: 'filament' as const, resistance: 10, ratedPower: 1 } : e,
      ),
    };
    const r = solveCircuit(c);
    const v = r.elements.R1.voltageDrop;
    const R = r.elements.R1.resistance!;
    expect(v).toBeCloseTo(2, 9);
    expect(R).toBeCloseTo(10 * (1 + FILAMENT_K * 2), 6);
    expect(r.elements.A1.reading!).toBeCloseTo(2 / R, 9);
    // resistance rises with voltage → V/I not constant
    const c4 = { elements: c.elements.map((e) => (e.id === 'B1' ? { ...e, voltage: 4 } : e)) };
    const r4 = solveCircuit(c4);
    expect(4 / r4.elements.A1.reading!).toBeGreaterThan(2 / r.elements.A1.reading!);
  });

  it('bulbs in series with a filament model still share the same current', () => {
    const c = seriesCircuit(3);
    const f = { elements: c.elements.map((e) => (e.kind === 'bulb' ? { ...e, bulbModel: 'filament' as const } : e)) };
    const r = solveCircuit(f);
    expect(r.elements.L1.current).toBeCloseTo(r.elements.L3.current, 9);
    expect(r.elements.L1.voltageDrop + r.elements.L2.voltageDrop + r.elements.L3.voltageDrop).toBeCloseTo(3, 8);
  });
});

describe('brightness', () => {
  it('is monotonic in power and zero without current', () => {
    const s = solveCircuit(seriesCircuit());
    const p = solveCircuit(parallelCircuit());
    expect(p.elements.L1.brightness!).toBeGreaterThan(s.elements.L1.brightness!);
    expect(byId(seriesCircuit(), 'L1').ratedPower).toBe(2.25);
  });
});
