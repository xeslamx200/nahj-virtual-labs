import { edgeKey, edgesAlong } from './geometry';
import type { CircuitElement, EdgeDir, ElementKind } from './types';

let counter = 0;
export const newId = (kind: ElementKind) => `${kind}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function makeElement(
  kind: ElementKind,
  x: number,
  y: number,
  dir: EdgeDir,
  props: Partial<CircuitElement> = {},
): CircuitElement {
  const defaults: Partial<CircuitElement> =
    kind === 'battery'
      ? { voltage: 6 }
      : kind === 'resistor'
        ? { resistance: 10 }
        : kind === 'bulb'
          ? { resistance: 10, bulbModel: 'ohmic', ratedPower: 3.6 }
          : kind === 'switch'
            ? { closed: true }
            : {};
  return { id: props.id ?? newId(kind), kind, edge: { x, y, dir }, ...defaults, ...props };
}

/**
 * Fill wires along a path of grid points (straight runs between consecutive
 * points), skipping edges already used by another element.
 */
export function withWires(elements: CircuitElement[], ...paths: [number, number][][]): CircuitElement[] {
  const used = new Set(elements.map((e) => edgeKey(e.edge)));
  const out = [...elements];
  for (const path of paths) {
    for (let i = 0; i + 1 < path.length; i++) {
      const [x1, y1] = path[i];
      const [x2, y2] = path[i + 1];
      for (const e of edgesAlong({ x: x1, y: y1 }, { x: x2, y: y2 })) {
        const k = edgeKey(e);
        if (used.has(k)) continue;
        used.add(k);
        out.push(makeElement('wire', e.x, e.y, e.dir, { id: `w-${k}` }));
      }
    }
  }
  return out;
}
