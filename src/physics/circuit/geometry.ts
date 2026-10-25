import type { CircuitElement, Edge } from './types';

export type Point = { x: number; y: number };

export const pointKey = (p: Point): string => `${p.x},${p.y}`;

export const parsePointKey = (k: string): Point => {
  const [x, y] = k.split(',').map(Number);
  return { x, y };
};

export const edgeKey = (e: Edge): string => `${e.x},${e.y},${e.dir}`;

/** End points of an edge: left/top first. */
export function edgeEnds(e: Edge): [Point, Point] {
  return e.dir === 'h'
    ? [{ x: e.x, y: e.y }, { x: e.x + 1, y: e.y }]
    : [{ x: e.x, y: e.y }, { x: e.x, y: e.y + 1 }];
}

/** Terminal a and b of an element, after applying `flipped`. */
export function terminals(el: CircuitElement): { a: Point; b: Point } {
  const [p, q] = edgeEnds(el.edge);
  return el.flipped ? { a: q, b: p } : { a: p, b: q };
}

export function terminalKeys(el: CircuitElement): { a: string; b: string } {
  const t = terminals(el);
  return { a: pointKey(t.a), b: pointKey(t.b) };
}

/** Edge joining two neighbouring grid points, or null if they are not neighbours. */
export function edgeBetween(p: Point, q: Point): Edge | null {
  if (p.y === q.y && Math.abs(p.x - q.x) === 1) return { x: Math.min(p.x, q.x), y: p.y, dir: 'h' };
  if (p.x === q.x && Math.abs(p.y - q.y) === 1) return { x: p.x, y: Math.min(p.y, q.y), dir: 'v' };
  return null;
}

/** Unit edges along a straight horizontal or vertical run between two points. */
export function edgesAlong(p: Point, q: Point): Edge[] {
  const out: Edge[] = [];
  if (p.y === q.y) {
    for (let x = Math.min(p.x, q.x); x < Math.max(p.x, q.x); x++) out.push({ x, y: p.y, dir: 'h' });
  } else if (p.x === q.x) {
    for (let y = Math.min(p.y, q.y); y < Math.max(p.y, q.y); y++) out.push({ x: p.x, y, dir: 'v' });
  }
  return out;
}
