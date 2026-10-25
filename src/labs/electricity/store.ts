import { makeElement, newId } from '../../physics/circuit/builder';
import { edgeKey, edgesAlong, type Point } from '../../physics/circuit/geometry';
import { presetCircuit, type PresetId } from '../../physics/circuit/presets';
import { solveCircuit } from '../../physics/circuit/solver';
import type { Circuit, CircuitElement, Edge, ElementKind, SolveResult } from '../../physics/circuit/types';
import { LIMITS } from '../../physics/circuit/types';
import { clamp } from '../../lib/format';
import { createStore, useStore } from '../../lib/store';

export const GRID = { cols: 10, rows: 6 } as const; // points 0..cols, 0..rows

export type Tool = 'select' | ElementKind;

export interface ElecState {
  circuit: Circuit;
  result: SolveResult;
  selectedId: string | null;
  tool: Tool;
  presetId: PresetId;
  activityId: string;
  mode: 'guided' | 'free';
  showFlow: boolean;
  undo: Circuit[];
}

const solved = (circuit: Circuit) => ({ circuit, result: solveCircuit(circuit) });

function initial(): ElecState {
  const circuit = presetCircuit('ohm');
  return {
    ...solved(circuit),
    selectedId: null,
    tool: 'select',
    presetId: 'ohm',
    activityId: 'ohm-voltage',
    mode: 'guided',
    showFlow: true,
    undo: [],
  };
}

export const elecStore = createStore<ElecState>(initial);
export const useElec = () => useStore(elecStore);

export const inGrid = (e: Edge) =>
  e.x >= 0 && e.y >= 0 && (e.dir === 'h' ? e.x < GRID.cols && e.y <= GRID.rows : e.x <= GRID.cols && e.y < GRID.rows);

function commit(next: Circuit, extra: Partial<ElecState> = {}) {
  elecStore.set((s) => ({ ...s, ...solved(next), undo: [...s.undo.slice(-30), s.circuit], ...extra }));
}

export const elementAt = (circuit: Circuit, e: Edge) => circuit.elements.find((el) => edgeKey(el.edge) === edgeKey(e));

/** Next free label like R2, L3 for a new part. */
function nextLabel(circuit: Circuit, kind: ElementKind): string | undefined {
  const prefix = kind === 'resistor' ? 'R' : kind === 'bulb' ? 'L' : kind === 'ammeter' ? 'A' : kind === 'voltmeter' ? 'V' : kind === 'switch' ? 'S' : kind === 'battery' ? 'B' : '';
  if (!prefix) return undefined;
  const used = new Set(circuit.elements.map((e) => e.label ?? e.id));
  for (let i = 1; i < 99; i++) if (!used.has(`${prefix}${i}`)) return `${prefix}${i}`;
  return undefined;
}

export const elecActions = {
  setTool(tool: Tool) {
    elecStore.set((s) => ({ ...s, tool, selectedId: tool === 'select' ? s.selectedId : null }));
  },
  select(id: string | null) {
    elecStore.set((s) => ({ ...s, selectedId: id }));
  },
  /** Place a part on an edge. A plain wire already there is replaced by the part. */
  place(kind: ElementKind, edge: Edge): string | null {
    const s = elecStore.get();
    if (!inGrid(edge)) return null;
    const existing = elementAt(s.circuit, edge);
    if (existing && !(existing.kind === 'wire' && kind !== 'wire')) return null;
    const label = nextLabel(s.circuit, kind);
    const id = label && !s.circuit.elements.some((e) => e.id === label) ? label : newId(kind);
    const el = makeElement(kind, edge.x, edge.y, edge.dir, { id, label, ...(kind === 'battery' ? { flipped: edge.dir === 'v' } : {}) });
    const elements = s.circuit.elements.filter((e) => e !== existing).concat(el);
    commit({ elements }, { selectedId: kind === 'wire' ? s.selectedId : id });
    return id;
  },
  /** Draw wires along a straight run between two grid points. */
  wire(from: Point, to: Point) {
    elecActions.wireEdges(edgesAlong(from, to));
  },
  /** Add wires on the given edges (free edges only) as one undo step. */
  wireEdges(list: Edge[]) {
    const s = elecStore.get();
    const seen = new Set<string>();
    const edges = list.filter((e) => {
      const k = edgeKey(e);
      if (seen.has(k) || !inGrid(e) || elementAt(s.circuit, e)) return false;
      seen.add(k);
      return true;
    });
    if (!edges.length) return;
    const added = edges.map((e) => makeElement('wire', e.x, e.y, e.dir));
    commit({ elements: [...s.circuit.elements, ...added] });
  },
  move(id: string, edge: Edge) {
    const s = elecStore.get();
    if (!inGrid(edge)) return;
    const el = s.circuit.elements.find((e) => e.id === id);
    if (!el || edgeKey(el.edge) === edgeKey(edge)) return;
    const target = elementAt(s.circuit, edge);
    if (target && target.kind !== 'wire') return;
    const elements = s.circuit.elements
      .filter((e) => e !== target)
      .map((e) => (e.id === id ? { ...e, edge: { ...edge }, flipped: e.kind === 'battery' && edge.dir !== e.edge.dir ? edge.dir === 'v' : e.flipped } : e));
    commit({ elements });
  },
  /** Turn a part through 90° about its first terminal. */
  rotate(id: string) {
    const el = elecStore.get().circuit.elements.find((e) => e.id === id);
    if (!el) return;
    const next: Edge = el.edge.dir === 'h' ? { x: el.edge.x, y: el.edge.y, dir: 'v' } : { x: el.edge.x, y: el.edge.y, dir: 'h' };
    const alt: Edge = el.edge.dir === 'h' ? { x: el.edge.x, y: el.edge.y - 1, dir: 'v' } : { x: el.edge.x - 1, y: el.edge.y, dir: 'h' };
    const free = (e: Edge) => inGrid(e) && (!elementAt(elecStore.get().circuit, e) || elementAt(elecStore.get().circuit, e)!.kind === 'wire');
    if (free(next)) elecActions.move(id, next);
    else if (free(alt)) elecActions.move(id, alt);
  },
  remove(id: string) {
    const s = elecStore.get();
    if (!s.circuit.elements.some((e) => e.id === id)) return;
    commit({ elements: s.circuit.elements.filter((e) => e.id !== id) }, { selectedId: s.selectedId === id ? null : s.selectedId });
  },
  update(id: string, patch: Partial<CircuitElement>) {
    const s = elecStore.get();
    const safe: Partial<CircuitElement> = { ...patch };
    if (safe.voltage !== undefined) safe.voltage = clamp(safe.voltage, LIMITS.voltage.min, LIMITS.voltage.max);
    if (safe.resistance !== undefined) {
      const el = s.circuit.elements.find((e) => e.id === id);
      const lim = el?.kind === 'bulb' ? LIMITS.bulbResistance : LIMITS.resistance;
      safe.resistance = clamp(safe.resistance, lim.min, lim.max);
    }
    if (safe.ratedPower !== undefined) safe.ratedPower = clamp(safe.ratedPower, LIMITS.ratedPower.min, LIMITS.ratedPower.max);
    const elements = s.circuit.elements.map((e) => (e.id === id ? { ...e, ...safe } : e));
    // value changes are not pushed to undo individually to keep slider drags cheap
    elecStore.set((st) => ({ ...st, ...solved({ elements }) }));
  },
  toggleSwitch(id: string) {
    const el = elecStore.get().circuit.elements.find((e) => e.id === id);
    if (el?.kind === 'switch') elecActions.update(id, { closed: !el.closed });
  },
  loadPreset(presetId: PresetId) {
    const circuit = presetCircuit(presetId);
    elecStore.set((s) => ({ ...s, ...solved(circuit), presetId, selectedId: null, tool: 'select', undo: [...s.undo.slice(-30), s.circuit] }));
  },
  clear() {
    commit({ elements: [] }, { selectedId: null, presetId: 'blank' });
  },
  undo() {
    elecStore.set((s) => {
      const prev = s.undo.at(-1);
      if (!prev) return s;
      return { ...s, ...solved(prev), undo: s.undo.slice(0, -1), selectedId: null };
    });
  },
  setMode(mode: ElecState['mode']) {
    elecStore.set((s) => ({ ...s, mode }));
  },
  setActivity(activityId: string) {
    elecStore.set((s) => ({ ...s, activityId }));
  },
  toggleFlow() {
    elecStore.set((s) => ({ ...s, showFlow: !s.showFlow }));
  },
};

/** I–V characteristic of one part, computed by re-solving the circuit for a sweep of battery voltages. */
export function sweepCharacteristic(circuit: Circuit, partId: string, batteryId: string, vMax = 12, steps = 24) {
  const pts: { v: number; i: number; batteryV: number }[] = [];
  for (let k = 0; k <= steps; k++) {
    const batteryV = (k * vMax) / steps;
    const c = { elements: circuit.elements.map((e) => (e.id === batteryId ? { ...e, voltage: batteryV } : e)) };
    const r = solveCircuit(c);
    if (r.status !== 'ok' && r.status !== 'open') return null;
    const er = r.elements[partId];
    pts.push({ v: Math.abs(er.voltageDrop), i: Math.abs(er.current), batteryV });
  }
  return pts;
}
