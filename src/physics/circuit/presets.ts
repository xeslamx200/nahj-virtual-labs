/**
 * Prepared circuits. Values reproduce textbook figures and worked examples
 * (Grade 10 Science, Semester 2, Unit 4) wherever noted.
 */
import { makeElement, withWires } from './builder';
import type { Circuit } from './types';

export type PresetId = 'ohm' | 'resistance' | 'series' | 'parallel' | 'combined' | 'blank';

/**
 * Single resistor with switch, ammeter in series and voltmeter in parallel —
 * the set-up of Activity b1-4 (Figure 16-4a): variable supply, 10 Ω resistor.
 */
export function ohmCircuit(voltage = 1, resistance = 10): Circuit {
  const els = [
    makeElement('battery', 1, 2, 'v', { id: 'B1', voltage, flipped: true, label: 'V' }),
    makeElement('switch', 2, 1, 'h', { id: 'S1', closed: true }),
    makeElement('ammeter', 4, 1, 'h', { id: 'A1', flipped: true }),
    makeElement('resistor', 6, 2, 'v', { id: 'R1', resistance, label: 'R' }),
    makeElement('voltmeter', 8, 2, 'v', { id: 'V1', flipped: true }),
  ];
  return {
    elements: withWires(els, [[1, 3], [1, 4], [6, 4], [6, 3]], [[1, 2], [1, 1], [6, 1], [6, 2]], [[6, 1], [8, 1], [8, 2]], [[8, 3], [8, 4], [6, 4]]),
  };
}

/** Three 1 Ω bulbs in series on a 1.5 V cell — textbook Figure 23-4. */
export function seriesCircuit(voltage = 1.5, r = 1): Circuit {
  const els = [
    makeElement('battery', 1, 2, 'v', { id: 'B1', voltage, flipped: true }),
    makeElement('bulb', 2, 1, 'h', { id: 'L1', resistance: r, ratedPower: 2.25, label: 'L1' }),
    makeElement('bulb', 4, 1, 'h', { id: 'L2', resistance: r, ratedPower: 2.25, label: 'L2' }),
    makeElement('bulb', 6, 1, 'h', { id: 'L3', resistance: r, ratedPower: 2.25, label: 'L3' }),
    makeElement('ammeter', 4, 4, 'h', { id: 'A1' }),
    makeElement('switch', 2, 4, 'h', { id: 'S1', closed: true }),
    makeElement('voltmeter', 2, 0, 'h', { id: 'V1', flipped: true }),
  ];
  return {
    elements: withWires(els, [[1, 2], [1, 1], [8, 1], [8, 4], [1, 4], [1, 3]], [[2, 1], [2, 0]], [[3, 0], [3, 1]]),
  };
}

/** Three 1 Ω bulbs in parallel on a 1.5 V cell — textbook Figure 24-4. */
export function parallelCircuit(voltage = 1.5, r = 1): Circuit {
  const els = [
    makeElement('battery', 1, 3, 'v', { id: 'B1', voltage, flipped: true }),
    makeElement('ammeter', 1, 1, 'h', { id: 'A1', flipped: true }),
    makeElement('switch', 1, 5, 'h', { id: 'S1', closed: true }),
    makeElement('bulb', 3, 3, 'v', { id: 'L1', resistance: r, ratedPower: 2.25, label: 'L1' }),
    makeElement('bulb', 5, 3, 'v', { id: 'L2', resistance: r, ratedPower: 2.25, label: 'L2' }),
    makeElement('bulb', 7, 3, 'v', { id: 'L3', resistance: r, ratedPower: 2.25, label: 'L3' }),
    makeElement('ammeter', 3, 1, 'v', { id: 'A2', flipped: true }),
    makeElement('voltmeter', 8, 3, 'v', { id: 'V1', flipped: true }),
  ];
  return {
    elements: withWires(
      els,
      [[1, 3], [1, 1], [8, 1], [8, 3]],
      [[1, 4], [1, 5], [8, 5], [8, 4]],
      [[3, 1], [3, 3]],
      [[3, 4], [3, 5]],
      [[5, 1], [5, 3]],
      [[5, 4], [5, 5]],
      [[7, 1], [7, 3]],
      [[7, 4], [7, 5]],
    ),
  };
}

/**
 * 20 Ω in series with (10 Ω ∥ 15 Ω) on 13 V — Lesson 2-4 review, question 4.
 * Expected: Req = 26 Ω, I = 0.5 A, V20 = 10 V, V∥ = 3 V, I10 = 0.3 A, I15 = 0.2 A.
 */
export function combinedCircuit(voltage = 13): Circuit {
  const els = [
    makeElement('battery', 1, 3, 'v', { id: 'B1', voltage, flipped: true }),
    makeElement('resistor', 3, 1, 'h', { id: 'R1', resistance: 20, label: 'R1' }),
    makeElement('ammeter', 1, 1, 'h', { id: 'A1', flipped: true }),
    makeElement('resistor', 6, 3, 'v', { id: 'R2', resistance: 10, label: 'R2' }),
    makeElement('resistor', 8, 3, 'v', { id: 'R3', resistance: 15, label: 'R3' }),
    makeElement('voltmeter', 4, 3, 'v', { id: 'V1', flipped: true }),
  ];
  return {
    elements: withWires(
      els,
      [[1, 3], [1, 1], [6, 1], [8, 1], [8, 3]],
      [[1, 4], [1, 5], [8, 5], [8, 4]],
      [[6, 1], [6, 3]],
      [[6, 4], [6, 5]],
      [[6, 2], [4, 2], [4, 3]],
      [[4, 4], [4, 5]],
    ),
  };
}

export function presetCircuit(id: PresetId): Circuit {
  switch (id) {
    case 'ohm':
      return ohmCircuit(1, 10);
    case 'resistance':
      return ohmCircuit(6, 10);
    case 'series':
      return seriesCircuit();
    case 'parallel':
      return parallelCircuit();
    case 'combined':
      return combinedCircuit();
    case 'blank':
      return { elements: [] };
  }
}
