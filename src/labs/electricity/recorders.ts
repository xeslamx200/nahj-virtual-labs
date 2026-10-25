/**
 * Turns the current solved circuit into one row of an activity's results table.
 * Every value comes from the solver; nothing is typed in or estimated.
 */
import type { L } from '../../i18n/i18n';
import type { AssistantSnapshot } from '../../assistant/types';
import { ELECTRICITY_ACTIVITIES } from '../../curriculum/electricity';
import type { RecordRow } from '../../lib/progress';
import { fmt } from '../../lib/format';
import type { Circuit, SolveResult } from '../../physics/circuit/types';
import { E, PART_NAMES } from './strings';
import type { ElecState } from './store';

export type Recording = { values: Record<string, number>; tag?: string } | { blocked: L };

const find = (c: Circuit, id: string) => c.elements.find((e) => e.id === id);

function baseCheck(result: SolveResult): L | null {
  if (result.status === 'short' || result.status === 'conflict') return E.needFault;
  if (result.status !== 'ok') return E.needClosed;
  return null;
}

export function recordFor(activityId: string, s: Pick<ElecState, 'circuit' | 'result' | 'presetId'>): Recording {
  const { circuit, result } = s;
  const blocked = baseCheck(result);
  const r = (id: string) => result.elements[id];
  switch (activityId) {
    case 'ohm-voltage':
    case 'ohm-resistance': {
      const am = find(circuit, 'A1');
      const vm = find(circuit, 'V1');
      const res = find(circuit, 'R1');
      if (am?.kind !== 'ammeter' || vm?.kind !== 'voltmeter' || !res) return { blocked: E.needMeters };
      if (blocked) return { blocked };
      const I = r('A1').reading ?? 0;
      const V = r('V1').reading ?? 0;
      if (activityId === 'ohm-voltage') return { values: { V, I, R: I !== 0 ? V / I : NaN } };
      const R = res.resistance ?? 0;
      return { values: { R, I, V, IR: I * R } };
    }
    case 'series-parallel': {
      if (find(circuit, 'L1')?.kind !== 'bulb') return { blocked: E.needBulb };
      if (blocked) return { blocked };
      const l1 = r('L1');
      const tag = s.presetId === 'series' || s.presetId === 'parallel' ? s.presetId : 'custom';
      return {
        values: {
          Itotal: Math.abs(result.totalCurrent),
          Vbulb: Math.abs(l1.voltageDrop),
          Ibulb: Math.abs(l1.current),
          Req: result.equivalentResistance ?? NaN,
          P: l1.power,
        },
        tag,
      };
    }
    case 'combined-power': {
      if (!['R1', 'R2', 'R3'].every((id) => find(circuit, id)?.kind === 'resistor')) return { blocked: E.needCombined };
      if (blocked) return { blocked };
      const Ptotal = circuit.elements
        .filter((e) => e.kind === 'resistor' || e.kind === 'bulb')
        .reduce((sum, e) => sum + (r(e.id)?.power ?? 0), 0);
      return {
        values: {
          Req: result.equivalentResistance ?? NaN,
          Itotal: Math.abs(result.totalCurrent),
          Vpar: Math.abs(r('R2').voltageDrop),
          P1: r('R1').power,
          Ptotal,
        },
      };
    }
  }
  return { blocked: E.needClosed };
}

export const ELEC_TAGS: Record<string, Record<string, L>> = {
  'series-parallel': { series: E.tagSeries, parallel: E.tagParallel, custom: E.tagCustom },
};

/** Facts and a plain-text description of the circuit for the assistant (all values from the solver). */
export function elecSnapshot(s: ElecState, records: RecordRow[]): AssistantSnapshot {
  const { circuit, result } = s;
  const activity = ELECTRICITY_ACTIVITIES.find((a) => a.id === s.activityId);
  const batteries = circuit.elements.filter((e) => e.kind === 'battery');
  const sel = circuit.elements.find((e) => e.id === s.selectedId);
  const selR = sel ? result.elements[sel.id] : undefined;
  const facts = {
    status: result.status,
    batteryV: batteries.length === 1 ? batteries[0].voltage : undefined,
    totalI: result.status === 'ok' ? Math.abs(result.totalCurrent) : 0,
    Req: result.equivalentResistance,
    selectedLabel: sel && sel.kind !== 'wire' ? (sel.label ?? sel.id) : undefined,
    selectedV: selR && sel?.kind !== 'wire' ? Math.abs(selR.voltageDrop) : undefined,
    selectedI: selR && sel?.kind !== 'wire' && Math.abs(selR.current) > 1e-9 ? Math.abs(selR.current) : undefined,
  };
  const lines = [`Circuit status: ${result.status}.`];
  for (const el of circuit.elements) {
    if (el.kind === 'wire') continue;
    const r = result.elements[el.id];
    const name = `${PART_NAMES[el.kind].en} ${el.label ?? el.id}`;
    const props =
      el.kind === 'battery'
        ? `${el.voltage} V`
        : el.kind === 'resistor'
          ? `${el.resistance} ohm`
          : el.kind === 'bulb'
            ? `${el.bulbModel === 'filament' ? 'filament, cold ' : ''}${el.resistance} ohm`
            : el.kind === 'switch'
              ? el.closed
                ? 'closed'
                : 'open'
              : '';
    const meas =
      el.kind === 'ammeter' || el.kind === 'voltmeter'
        ? `reads ${fmt(r?.reading ?? 0, 4)} ${el.kind === 'ammeter' ? 'A' : 'V'}`
        : `V = ${fmt(Math.abs(r?.voltageDrop ?? 0), 4)} V, I = ${fmt(Math.abs(r?.current ?? 0), 4)} A, P = ${fmt(r?.power ?? 0, 4)} W`;
    lines.push(`- ${name}${props ? ` (${props})` : ''}: ${meas}`);
  }
  if (result.status === 'ok') {
    lines.push(`Total battery current ${fmt(Math.abs(result.totalCurrent), 4)} A.`);
    if (result.equivalentResistance !== undefined) lines.push(`Equivalent resistance ${fmt(result.equivalentResistance, 4)} ohm.`);
  }
  for (const w of result.warnings) lines.push(`Warning: ${w.code} on ${w.elementId}.`);
  if (sel && sel.kind !== 'wire') lines.push(`The learner has selected ${sel.label ?? sel.id}.`);
  return { lab: 'electricity', activity: activity as AssistantSnapshot['activity'], facts, stateText: lines.join('\n'), records, columns: activity?.columns };
}
