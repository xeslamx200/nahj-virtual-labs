/**
 * DC circuit solver (Modified Nodal Analysis).
 *
 * Model and assumptions (also shown in the app):
 *  - Batteries are ideal DC voltage sources (no internal resistance).
 *  - Wires, closed switches and ammeters are ideal conductors (0 Ω).
 *    Grid points joined by ideal conductors are merged into one electrical
 *    node before the nodal solve, so the result is exact rather than an
 *    approximation with "very small" resistances.
 *  - Voltmeters are ideal (infinite resistance): they draw no current.
 *  - Resistors and "ohmic" bulbs obey Ohm's law V = IR with constant R.
 *  - "Filament" bulbs are an enrichment model: R = R0 (1 + k|V|), solved by
 *    damped fixed-point iteration. It reproduces the textbook's qualitative
 *    non-ohmic V–I curve, not a specific commercial bulb.
 *  - Any topology of these parts is supported (series, parallel, combined,
 *    several batteries in series). Unsupported/ill-posed cases are reported
 *    instead of solved: a battery shorted by ideal conductors, and ideal
 *    batteries joined directly in parallel (no unique solution).
 *  - Current split inside a group of ideal conductors (e.g. two wires in
 *    parallel) is taken as the zero-resistance limit of equal wire segments.
 */
import { DisjointSet, solveLinear } from './linalg';
import { terminalKeys } from './geometry';
import type {
  Circuit,
  CircuitElement,
  CircuitStatus,
  CircuitWarning,
  ElementResult,
  SolveResult,
} from './types';
import { LIMITS } from './types';

/** Filament coefficient k in R = R0 (1 + k|V|), per volt. */
export const FILAMENT_K = 0.5;

const EPS_CURRENT = 1e-12;

const isConductor = (el: CircuitElement) =>
  el.kind === 'wire' || el.kind === 'ammeter' || (el.kind === 'switch' && !!el.closed);

const isResistive = (el: CircuitElement) => el.kind === 'resistor' || el.kind === 'bulb';

export function elementResistance(el: CircuitElement, voltageAcross = 0): number {
  const r0 = Math.max(el.resistance ?? 10, 1e-9);
  if (el.kind === 'bulb' && el.bulbModel === 'filament') return r0 * (1 + FILAMENT_K * Math.abs(voltageAcross));
  return r0;
}

interface CoreSolve {
  status: CircuitStatus;
  /** supernode potential */
  nodeV: Map<string, number>;
  /** delivered current per battery id (out of its + terminal) */
  batteryI: Map<string, number>;
  resistances: Map<string, number>;
  faultyIds: string[];
  iterations: number;
  supernode: DisjointSet;
  /** connectivity of supernodes through batteries/resistive parts */
  part: DisjointSet;
}

function coreSolve(elements: CircuitElement[]): CoreSolve {
  const supernode = new DisjointSet();
  for (const el of elements) {
    const { a, b } = terminalKeys(el);
    supernode.add(a);
    supernode.add(b);
    if (isConductor(el)) supernode.union(a, b);
  }

  const batteries = elements.filter((e) => e.kind === 'battery');
  const resistive = elements.filter(isResistive);
  const part = new DisjointSet();
  const base: Omit<CoreSolve, 'status'> = {
    nodeV: new Map(),
    batteryI: new Map(),
    resistances: new Map(),
    faultyIds: [],
    iterations: 0,
    supernode,
    part,
  };

  const shorted = batteries.filter((bt) => {
    const { a, b } = terminalKeys(bt);
    return supernode.same(a, b);
  });
  if (shorted.length) return { ...base, status: 'short', faultyIds: shorted.map((b) => b.id) };

  const sn = (k: string) => supernode.find(k);
  for (const el of [...batteries, ...resistive]) {
    const { a, b } = terminalKeys(el);
    part.add(sn(a));
    part.add(sn(b));
    if (!(isResistive(el) && sn(a) === sn(b))) part.union(sn(a), sn(b));
  }

  // Reference node per connected part: the negative terminal of its first battery.
  const reference = new Map<string, string>();
  for (const bt of batteries) {
    const neg = sn(terminalKeys(bt).a);
    const p = part.find(neg);
    if (!reference.has(p)) reference.set(p, neg);
  }
  const allNodes = new Set<string>();
  for (const el of [...batteries, ...resistive]) {
    const { a, b } = terminalKeys(el);
    allNodes.add(sn(a));
    allNodes.add(sn(b));
  }
  for (const n of allNodes) {
    const p = part.find(n);
    if (!reference.has(p)) reference.set(p, n);
  }
  const isRef = (n: string) => reference.get(part.find(n)) === n;
  const unknownNodes = [...allNodes].filter((n) => !isRef(n));
  const idx = new Map(unknownNodes.map((n, i) => [n, i]));
  const nV = unknownNodes.length;
  const size = nV + batteries.length;

  const resistances = new Map<string, number>();
  for (const el of resistive) resistances.set(el.id, elementResistance(el, 0));
  const hasNonlinear = resistive.some((e) => e.kind === 'bulb' && e.bulbModel === 'filament');

  let nodeV = new Map<string, number>();
  let batteryI = new Map<string, number>();
  let iterations = 0;

  const maxIter = hasNonlinear ? 500 : 1;
  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1;
    const A = Array.from({ length: size }, () => new Array<number>(size).fill(0));
    const z = new Array<number>(size).fill(0);
    for (const el of resistive) {
      const { a, b } = terminalKeys(el);
      const na = sn(a);
      const nb = sn(b);
      if (na === nb) continue;
      const g = 1 / resistances.get(el.id)!;
      const ia = idx.get(na);
      const ib = idx.get(nb);
      if (ia !== undefined) A[ia][ia] += g;
      if (ib !== undefined) A[ib][ib] += g;
      if (ia !== undefined && ib !== undefined) {
        A[ia][ib] -= g;
        A[ib][ia] -= g;
      }
    }
    batteries.forEach((bt, k) => {
      const { a, b } = terminalKeys(bt); // a = −, b = +
      const ip = idx.get(sn(b));
      const ineg = idx.get(sn(a));
      const row = nV + k;
      // Unknown j_k: current flowing from the + node into the battery.
      if (ip !== undefined) {
        A[ip][row] += 1;
        A[row][ip] += 1;
      }
      if (ineg !== undefined) {
        A[ineg][row] -= 1;
        A[row][ineg] -= 1;
      }
      z[row] = bt.voltage ?? 0;
    });

    const x = solveLinear(A, z);
    if (!x) {
      return { ...base, status: 'conflict', faultyIds: batteries.map((b) => b.id), iterations };
    }
    nodeV = new Map(allNodes.size ? [...allNodes].map((n) => [n, isRef(n) ? 0 : x[idx.get(n)!]]) : []);
    batteryI = new Map(batteries.map((bt, k) => [bt.id, -x[nV + k]]));

    if (!hasNonlinear) break;
    let maxRel = 0;
    for (const el of resistive) {
      if (!(el.kind === 'bulb' && el.bulbModel === 'filament')) continue;
      const { a, b } = terminalKeys(el);
      const v = (nodeV.get(sn(a)) ?? 0) - (nodeV.get(sn(b)) ?? 0);
      const target = elementResistance(el, v);
      const prev = resistances.get(el.id)!;
      const next = prev + 0.5 * (target - prev);
      maxRel = Math.max(maxRel, Math.abs(next - prev) / prev);
      resistances.set(el.id, next);
    }
    if (maxRel < 1e-12) break;
  }

  const anyCurrent = [...batteryI.values()].some((i) => Math.abs(i) > EPS_CURRENT);
  return {
    ...base,
    status: batteries.length === 0 ? 'no-source' : anyCurrent ? 'ok' : 'open',
    nodeV,
    batteryI,
    resistances,
    iterations,
  };
}

/** Currents inside each group of ideal conductors (zero-resistance limit of equal segments). */
function conductorCurrents(
  elements: CircuitElement[],
  supernode: DisjointSet,
  branchOut: Map<string, number>,
): Map<string, number> {
  const out = new Map<string, number>();
  const conductors = elements.filter(isConductor);
  const groups = new Map<string, CircuitElement[]>();
  for (const el of conductors) {
    const root = supernode.find(terminalKeys(el).a);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(el);
  }
  for (const group of groups.values()) {
    const pts = new Set<string>();
    for (const el of group) {
      const { a, b } = terminalKeys(el);
      pts.add(a);
      pts.add(b);
    }
    const list = [...pts];
    const ground = list[0];
    const unknown = list.slice(1);
    const id = new Map(unknown.map((p, i) => [p, i]));
    const n = unknown.length;
    const L = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    const s = unknown.map((p) => -(branchOut.get(p) ?? 0));
    for (const el of group) {
      const { a, b } = terminalKeys(el);
      if (a === b) continue;
      const ia = id.get(a);
      const ib = id.get(b);
      if (ia !== undefined) L[ia][ia] += 1;
      if (ib !== undefined) L[ib][ib] += 1;
      if (ia !== undefined && ib !== undefined) {
        L[ia][ib] -= 1;
        L[ib][ia] -= 1;
      }
    }
    const phi = solveLinear(L, s) ?? new Array<number>(n).fill(0);
    const pot = (p: string) => (p === ground ? 0 : phi[id.get(p)!]);
    for (const el of group) {
      const { a, b } = terminalKeys(el);
      const i = pot(a) - pot(b);
      out.set(el.id, Math.abs(i) < 1e-13 ? 0 : i);
    }
  }
  return out;
}

export function solveCircuit(circuit: Circuit): SolveResult {
  const elements = circuit.elements;
  const empty: SolveResult = {
    status: 'empty',
    potentials: {},
    elements: {},
    warnings: [],
    totalCurrent: 0,
    faultyIds: [],
    iterations: 0,
  };
  if (elements.length === 0) return empty;

  const core = coreSolve(elements);
  const { supernode, part } = core;
  const sn = (k: string) => supernode.find(k);
  const V = (k: string) => core.nodeV.get(sn(k)) ?? 0;
  const samePart = (a: string, b: string) => {
    const na = sn(a);
    const nb = sn(b);
    if (na === nb) return true;
    return core.nodeV.has(na) && core.nodeV.has(nb) && part.same(na, nb);
  };

  const warnings: CircuitWarning[] = [];
  const results: Record<string, ElementResult> = {};
  const solved = core.status === 'ok' || core.status === 'open' || core.status === 'no-source';

  // Current leaving each grid point through batteries / resistive parts.
  const branchOut = new Map<string, number>();
  const addOut = (p: string, i: number) => branchOut.set(p, (branchOut.get(p) ?? 0) + i);

  for (const el of elements) {
    const { a, b } = terminalKeys(el);
    let current = 0;
    let voltageDrop = solved && samePart(a, b) ? V(a) - V(b) : 0;
    let power = 0;
    const r: ElementResult = { id: el.id, current: 0, voltageDrop: 0, power: 0 };
    if (solved && isResistive(el)) {
      const R = core.resistances.get(el.id) ?? elementResistance(el);
      r.resistance = R;
      current = sn(a) === sn(b) ? 0 : voltageDrop / R;
      power = current * current * R;
      if (el.kind === 'bulb') {
        const rated = Math.max(el.ratedPower ?? 1, 1e-6);
        r.brightness = Math.min(1, Math.sqrt(power / rated));
      }
    } else if (solved && el.kind === 'battery') {
      current = core.batteryI.get(el.id) ?? 0; // − to + inside the battery = a → b
      voltageDrop = -(el.voltage ?? 0);
      power = (el.voltage ?? 0) * current;
    } else if (el.kind === 'voltmeter') {
      const connected = solved && samePart(a, b);
      r.reading = connected ? V(b) - V(a) : 0;
      if (!connected && solved) warnings.push({ code: 'meter-floating', elementId: el.id });
    } else if (el.kind === 'switch' && !el.closed) {
      // Open switch: no current, but a potential difference may appear across it.
    } else if (el.kind === 'bulb') {
      r.brightness = 0;
    }
    if (solved && (isResistive(el) || el.kind === 'battery')) {
      addOut(a, current);
      addOut(b, -current);
    }
    r.current = Math.abs(current) < 1e-13 ? 0 : current;
    r.voltageDrop = Math.abs(voltageDrop) < 1e-13 ? 0 : voltageDrop;
    r.power = power;
    results[el.id] = r;
  }

  if (solved) {
    const wireI = conductorCurrents(elements, supernode, branchOut);
    for (const [id, i] of wireI) {
      const el = elements.find((e) => e.id === id)!;
      results[id].current = i;
      if (el.kind === 'ammeter') results[id].reading = i === 0 ? 0 : -i; // current entering + (b) towards COM (a)
    }
  }

  // ---- Warnings ----------------------------------------------------------
  const degree = new Map<string, number>();
  for (const el of elements) {
    const { a, b } = terminalKeys(el);
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  for (const el of elements) {
    const { a, b } = terminalKeys(el);
    if ((degree.get(a) ?? 0) < 2 || (degree.get(b) ?? 0) < 2) {
      if (el.kind === 'voltmeter') {
        if (!warnings.some((w) => w.elementId === el.id)) warnings.push({ code: 'meter-floating', elementId: el.id });
      } else warnings.push({ code: 'dangling', elementId: el.id });
    }
  }

  // Parts bypassed by ideal conductors, and whether an ammeter caused it.
  const noAmmeter = new DisjointSet();
  for (const el of elements) {
    const { a, b } = terminalKeys(el);
    noAmmeter.add(a);
    noAmmeter.add(b);
    if (el.kind === 'wire' || (el.kind === 'switch' && el.closed)) noAmmeter.union(a, b);
  }
  const ammeterBlame = new Set<string>();
  for (const el of elements) {
    if (!(isResistive(el) || el.kind === 'battery')) continue;
    const { a, b } = terminalKeys(el);
    if (!supernode.same(a, b)) continue;
    if (isResistive(el)) warnings.push({ code: 'bypassed', elementId: el.id });
    if (!noAmmeter.same(a, b)) {
      for (const am of elements) {
        if (am.kind !== 'ammeter') continue;
        if (supernode.same(terminalKeys(am).a, a)) ammeterBlame.add(am.id);
      }
    }
  }
  for (const id of ammeterBlame) warnings.push({ code: 'ammeter-parallel', elementId: id });

  // A voltmeter placed in series blocks the current: check whether replacing it
  // by a conductor would let current flow.
  if (core.status === 'open') {
    for (const vm of elements.filter((e) => e.kind === 'voltmeter')) {
      const trial = elements.map((e) => (e.id === vm.id ? { ...e, kind: 'wire' as const } : e));
      const t = coreSolve(trial);
      if (t.status === 'ok') warnings.push({ code: 'voltmeter-series', elementId: vm.id });
    }
  }

  const batteryIds = elements.filter((e) => e.kind === 'battery').map((e) => e.id);
  const totalCurrent = solved ? batteryIds.reduce((s, id) => s + (results[id]?.current ?? 0), 0) : 0;
  for (const id of batteryIds) {
    if (Math.abs(results[id]?.current ?? 0) > LIMITS.highCurrent) warnings.push({ code: 'high-current', elementId: id });
  }

  let equivalentResistance: number | undefined;
  if (core.status === 'ok' && batteryIds.length === 1) {
    const bt = elements.find((e) => e.id === batteryIds[0])!;
    const i = results[bt.id].current;
    if (Math.abs(i) > EPS_CURRENT) equivalentResistance = (bt.voltage ?? 0) / i;
  }

  const potentials: Record<string, number> = {};
  if (solved) for (const k of degree.keys()) potentials[k] = core.nodeV.has(sn(k)) ? V(k) : 0;

  return {
    status: core.status,
    potentials,
    elements: results,
    warnings,
    totalCurrent,
    equivalentResistance,
    faultyIds: core.faultyIds,
    iterations: core.iterations,
  };
}

/* ---- Closed-form helpers used for explanations, checks and tests ---------- */

export const ohmCurrent = (voltage: number, resistance: number) => voltage / resistance;
export const seriesResistance = (rs: number[]) => rs.reduce((s, r) => s + r, 0);
export const parallelResistance = (rs: number[]) => 1 / rs.reduce((s, r) => s + 1 / r, 0);
export const powerVI = (v: number, i: number) => v * i;
