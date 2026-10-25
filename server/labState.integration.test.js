import { describe, expect, it } from 'vitest';
import { elecSnapshot } from '../src/labs/electricity/recorders';
import { presetCircuit } from '../src/physics/circuit/presets';
import { solveCircuit } from '../src/physics/circuit/solver';
import { checkLabState } from './labState.js';

const snapshotOf = (circuit) =>
  elecSnapshot({ circuit, result: solveCircuit(circuit), selectedId: null, tool: 'select', presetId: 'blank', activityId: 'ohm-voltage', mode: 'guided', showFlow: true, undo: [] }, []);

// The validator must never reject what the real Electricity lab sends, or the assistant would silently lose context.
describe('state validation against the real Electricity lab', () => {
  for (const id of ['ohm', 'resistance', 'series', 'parallel', 'combined']) {
    it(`accepts the prepared circuit "${id}"`, () => {
      const out = checkLabState('electricity', snapshotOf(presetCircuit(id)).stateText);
      expect(out.status, id).toBe('consistent');
    });
  }
  it('accepts a circuit after the learner changes the battery voltage and a resistance', () => {
    const c = presetCircuit('combined');
    for (const el of c.elements) {
      if (el.kind === 'battery') el.voltage = 9;
      if (el.kind === 'resistor') el.resistance = el.resistance * 1.5;
    }
    expect(checkLabState('electricity', snapshotOf(c).stateText).status).toBe('consistent');
  });
  it('accepts a circuit with a filament bulb and an open switch', () => {
    const c = presetCircuit('series');
    for (const el of c.elements) {
      if (el.kind === 'bulb') el.bulbModel = 'filament';
      if (el.kind === 'switch') el.closed = false;
    }
    expect(['consistent', 'format-only']).toContain(checkLabState('electricity', snapshotOf(c).stateText).status);
  });
  it('rejects the same circuit once a displayed value is tampered with', () => {
    const text = snapshotOf(presetCircuit('series')).stateText.replace('Total battery current 0.5 A', 'Total battery current 3 A');
    expect(checkLabState('electricity', text).status).toBe('rejected');
  });
});
