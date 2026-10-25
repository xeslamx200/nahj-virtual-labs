/**
 * Circuit data model.
 *
 * The builder uses a square grid of connection points. Every element occupies
 * exactly one grid edge (between two neighbouring points), so the topology is
 * unambiguous: two elements are connected when they share a grid point.
 *
 * Terminal convention (before `flipped` is applied):
 *   a = left / top point, b = right / bottom point.
 *   battery:   a = negative (−), b = positive (+)
 *   ammeter:   a = COM (−),      b = + (current entering + reads positive)
 *   voltmeter: a = COM (−),      b = + (reading = V(b) − V(a))
 */
export type ElementKind = 'battery' | 'resistor' | 'bulb' | 'switch' | 'wire' | 'ammeter' | 'voltmeter';

export type EdgeDir = 'h' | 'v';

export interface Edge {
  x: number;
  y: number;
  dir: EdgeDir;
}

export type BulbModel = 'ohmic' | 'filament';

export interface CircuitElement {
  id: string;
  kind: ElementKind;
  edge: Edge;
  /** Swap the a/b terminals (reverses polarity of batteries and meters). */
  flipped?: boolean;
  /** Battery EMF in volts. */
  voltage?: number;
  /** Resistor or bulb resistance in ohms (for a filament bulb: cold resistance). */
  resistance?: number;
  /** Switch state. */
  closed?: boolean;
  /** Bulb electrical model. */
  bulbModel?: BulbModel;
  /** Bulb rated power in watts, used only to scale the brightness display. */
  ratedPower?: number;
  /** Optional short display label, e.g. "R1", "L2". */
  label?: string;
}

export interface Circuit {
  elements: CircuitElement[];
}

export type CircuitStatus =
  | 'empty' // nothing placed
  | 'no-source' // no battery in the circuit
  | 'open' // a battery exists but no current flows anywhere
  | 'ok' // current flows
  | 'short' // a battery is short-circuited by ideal conductors
  | 'conflict'; // ideal sources directly in parallel / loop of sources (unsupported)

export type WarningCode =
  | 'dangling' // element terminal not connected to anything else
  | 'bypassed' // resistor/bulb with both ends joined by ideal conductors
  | 'voltmeter-series' // voltmeter is the only path for the current
  | 'ammeter-parallel' // ammeter placed across a resistive element
  | 'high-current' // battery current above the safe display limit
  | 'meter-floating'; // a meter terminal is not part of the circuit

export interface CircuitWarning {
  code: WarningCode;
  elementId: string;
}

export interface ElementResult {
  id: string;
  /** Signed current through the element from terminal a to terminal b (A). */
  current: number;
  /** Potential difference V(a) − V(b) across the element (V). */
  voltageDrop: number;
  /** Power dissipated (resistors, bulbs) or delivered (battery), W. Always ≥ 0 for passive parts. */
  power: number;
  /** Effective resistance used in the final solve (bulbs/resistors). */
  resistance?: number;
  /** Meter reading in its own unit (A for ammeters, V for voltmeters). */
  reading?: number;
  /** 0..1 brightness for bulbs. */
  brightness?: number;
}

export interface SolveResult {
  status: CircuitStatus;
  /** Potential of each grid point (key "x,y"), relative to the reference of its connected part. */
  potentials: Record<string, number>;
  elements: Record<string, ElementResult>;
  warnings: CircuitWarning[];
  /** Total current delivered by the battery set (sum over batteries, A). */
  totalCurrent: number;
  /** Equivalent resistance seen by a single battery, if exactly one battery drives current. */
  equivalentResistance?: number;
  /** Battery ids involved in a short or a conflict. */
  faultyIds: string[];
  /** Iterations used by the non-linear (filament) solve. 1 when all parts are ohmic. */
  iterations: number;
}

export const LIMITS = {
  voltage: { min: 0, max: 24, step: 0.5 },
  resistance: { min: 1, max: 1000, step: 1 },
  bulbResistance: { min: 1, max: 100, step: 1 },
  ratedPower: { min: 0.1, max: 20, step: 0.1 },
  /** Above this battery current the UI warns (ideal sources can deliver any current). */
  highCurrent: 10,
} as const;
