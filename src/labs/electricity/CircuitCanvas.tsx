import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactElement } from 'react';
import { useI18n } from '../../i18n/i18n';
import { fmt } from '../../lib/format';
import { edgeEnds, edgeKey, edgesAlong, pointKey, terminals, type Point } from '../../physics/circuit/geometry';
import type { CircuitElement, Edge, ElementKind } from '../../physics/circuit/types';
import { E, PART_NAMES, STATUS_TEXT } from './strings';
import { elecActions, elementAt, GRID, inGrid, useElec } from './store';

const S = 72; // grid spacing in SVG units
const PAD = 40;
const W = GRID.cols * S + PAD * 2;
const H = GRID.rows * S + PAD * 2;

const px = (p: Point) => ({ x: PAD + p.x * S, y: PAD + p.y * S });
const mid = (e: Edge) => {
  const [a, b] = edgeEnds(e);
  return { x: PAD + ((a.x + b.x) / 2) * S, y: PAD + ((a.y + b.y) / 2) * S };
};

/** Nearest grid edge and grid point to an SVG coordinate. */
function hit(x: number, y: number) {
  const gx = (x - PAD) / S;
  const gy = (y - PAD) / S;
  const rx = Math.round(gx);
  const ry = Math.round(gy);
  const hEdge: Edge = { x: Math.floor(gx), y: ry, dir: 'h' };
  const vEdge: Edge = { x: rx, y: Math.floor(gy), dir: 'v' };
  const edge = Math.abs(gy - ry) <= Math.abs(gx - rx) ? hEdge : vEdge;
  const point = { x: Math.max(0, Math.min(GRID.cols, rx)), y: Math.max(0, Math.min(GRID.rows, ry)) };
  const pointDist = Math.hypot(gx - rx, gy - ry);
  return { edge, point, pointDist };
}

/** L-shaped route between two grid points: horizontal first, then vertical. */
function route(p: Point, q: Point): Edge[] {
  const corner = { x: q.x, y: p.y };
  return [...edgesAlong(p, corner), ...edgesAlong(corner, q)];
}

/* ------------------------------------------------------------- symbols --- */

/** Draws a part in local coordinates: it spans x ∈ [−S/2, S/2], terminal a on the left. */
function Symbol({ el, brightness }: { el: CircuitElement; brightness: number }) {
  const h = S / 2;
  switch (el.kind) {
    case 'wire':
      return <line x1={-h} y1={0} x2={h} y2={0} className="c-wire" />;
    case 'battery':
      // a = negative (short thick plate), b = positive (long thin plate)
      return (
        <g>
          <line x1={-h} y1={0} x2={-6} y2={0} className="c-wire" />
          <line x1={6} y1={0} x2={h} y2={0} className="c-wire" />
          <rect x={-9} y={-20} width={18} height={40} className="c-hitpad" />
          <line x1={-6} y1={-9} x2={-6} y2={9} className="c-plate-neg" />
          <line x1={6} y1={-18} x2={6} y2={18} className="c-plate-pos" />
        </g>
      );
    case 'resistor':
      return (
        <g>
          <line x1={-h} y1={0} x2={-17} y2={0} className="c-wire" />
          <line x1={17} y1={0} x2={h} y2={0} className="c-wire" />
          <rect x={-17} y={-8} width={34} height={16} rx={2} className="c-body" />
        </g>
      );
    case 'bulb':
      return (
        <g>
          <line x1={-h} y1={0} x2={-14} y2={0} className="c-wire" />
          <line x1={14} y1={0} x2={h} y2={0} className="c-wire" />
          {brightness > 0.01 && <circle r={14 + 16 * brightness} className="c-glow" style={{ opacity: 0.25 + 0.6 * brightness }} />}
          <circle r={14} className="c-body c-bulb" style={{ fill: brightness > 0.01 ? `rgba(255, 214, 92, ${0.25 + 0.7 * brightness})` : undefined }} />
          <line x1={-9.9} y1={-9.9} x2={9.9} y2={9.9} className="c-filament" />
          <line x1={-9.9} y1={9.9} x2={9.9} y2={-9.9} className="c-filament" />
        </g>
      );
    case 'switch':
      return (
        <g>
          <line x1={-h} y1={0} x2={-14} y2={0} className="c-wire" />
          <line x1={14} y1={0} x2={h} y2={0} className="c-wire" />
          <rect x={-16} y={-20} width={32} height={26} className="c-hitpad" />
          <line x1={-14} y1={0} x2={el.closed ? 14 : 10} y2={el.closed ? 0 : -15} className="c-lever" />
          <circle cx={-14} cy={0} r={3.5} className="c-contact" />
          <circle cx={14} cy={0} r={3.5} className="c-contact" />
        </g>
      );
    case 'ammeter':
    case 'voltmeter':
      return (
        <g>
          <line x1={-h} y1={0} x2={-15} y2={0} className="c-wire" />
          <line x1={15} y1={0} x2={h} y2={0} className="c-wire" />
          <circle r={15} className={`c-body c-meter c-${el.kind}`} />
        </g>
      );
  }
}

/** Upright text / polarity marks for a part (drawn without rotation so they stay readable). */
function Marks({ el, reading }: { el: CircuitElement; reading?: number }) {
  const m = mid(el.edge);
  const t = terminals(el);
  const pa = px(t.a);
  const pb = px(t.b);
  // unit vector a→b and its normal
  const ux = Math.sign(pb.x - pa.x);
  const uy = Math.sign(pb.y - pa.y);
  const nx = -uy;
  const ny = ux;
  const out: ReactElement[] = [];
  if (el.kind === 'ammeter' || el.kind === 'voltmeter') {
    out.push(
      <text key="sym" x={m.x} y={m.y + 5} className="c-meter-letter" textAnchor="middle">
        {el.kind === 'ammeter' ? 'A' : 'V'}
      </text>,
    );
    // + and COM marks near the terminals
    out.push(
      <text key="p" x={m.x + ux * 22 + (nx || 0) * 13} y={m.y + uy * 22 + (ny || 0) * 13 + 4} className="c-pol" textAnchor="middle">
        +
      </text>,
      <text key="n" x={m.x - ux * 22 + (nx || 0) * 13} y={m.y - uy * 22 + (ny || 0) * 13 + 4} className="c-pol" textAnchor="middle">
        −
      </text>,
    );
  }
  if (el.kind === 'battery') {
    out.push(
      <text key="p" x={m.x + ux * 16 + nx * 22} y={m.y + uy * 16 + ny * 22 + 4} className="c-pol" textAnchor="middle">
        +
      </text>,
      <text key="n" x={m.x - ux * 16 + nx * 22} y={m.y - uy * 16 + ny * 22 + 4} className="c-pol" textAnchor="middle">
        −
      </text>,
    );
  }
  const vertical = el.edge.dir === 'v';
  const labelText =
    el.kind === 'battery'
      ? `${fmt(el.voltage ?? 0, 3)} V`
      : el.kind === 'resistor' || el.kind === 'bulb'
        ? `${el.label ?? ''} ${fmt(el.resistance ?? 0, 3)} Ω`
        : el.kind === 'switch'
          ? (el.label ?? 'S')
          : undefined;
  if (labelText) {
    out.push(
      <text
        key="lbl"
        x={vertical ? m.x - 22 : m.x}
        y={vertical ? m.y + 4 : m.y - 24}
        className="c-label"
        textAnchor={vertical ? 'end' : 'middle'}
      >
        {labelText}
      </text>,
    );
  }
  if (reading !== undefined) {
    const unit = el.kind === 'ammeter' ? 'A' : 'V';
    const tx = vertical ? m.x + 22 : m.x;
    const ty = vertical ? m.y + 5 : m.y + 36;
    const text = `${fmt(reading, 3)} ${unit}`;
    const w = text.length * 8.6 + 14;
    out.push(
      <g key="rd" className="c-reading">
        <rect x={vertical ? tx : tx - w / 2} y={ty - 15} width={w} height={22} rx={6} />
        <text x={vertical ? tx + 6 : tx} y={ty + 1} textAnchor={vertical ? 'start' : 'middle'}>
          {text}
        </text>
      </g>,
    );
  }
  return <g aria-hidden="true">{out}</g>;
}

/* -------------------------------------------------------------- canvas --- */

type Drag =
  | { mode: 'wire'; from: Point; to: Point; moved: boolean }
  | { mode: 'move'; id: string; to: Edge; moved: boolean; startEdge: Edge }
  | { mode: 'click'; edge: Edge };

export function CircuitCanvas() {
  const { t } = useI18n();
  const { circuit, result, selectedId, tool, showFlow } = useElec();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Edge | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [cursor, setCursor] = useState<Edge>({ x: 2, y: 1, dir: 'h' });
  const [focused, setFocused] = useState(false);

  const faulty = useMemo(() => {
    const ids = new Set(result.faultyIds);
    for (const w of result.warnings) ids.add(w.elementId);
    return ids;
  }, [result]);

  /** Grid points where three or more parts meet get a junction dot. */
  const junctions = useMemo(() => {
    const count = new Map<string, number>();
    for (const el of circuit.elements) for (const p of edgeEnds(el.edge)) count.set(pointKey(p), (count.get(pointKey(p)) ?? 0) + 1);
    return [...count.entries()].filter(([, n]) => n >= 3).map(([k]) => k);
  }, [circuit]);

  const toSvg = (e: PointerEvent) => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const activate = (edge: Edge) => {
    if (!inGrid(edge)) return;
    const el = elementAt(circuit, edge);
    if (tool === 'select') {
      if (el && el.kind === 'switch' && el.id === selectedId) elecActions.toggleSwitch(el.id);
      else elecActions.select(el?.id ?? null);
      return;
    }
    if (el && !(el.kind === 'wire' && tool !== 'wire')) {
      elecActions.select(el.id);
      return;
    }
    elecActions.place(tool as ElementKind, edge);
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const p = toSvg(e);
    const h = hit(p.x, p.y);
    const el = inGrid(h.edge) ? elementAt(circuit, h.edge) : undefined;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    if ((tool === 'wire' || tool === 'select') && h.pointDist < 0.24) {
      setDrag({ mode: 'wire', from: h.point, to: h.point, moved: false });
    } else if (tool === 'select' && el && el.kind !== 'wire') {
      setDrag({ mode: 'move', id: el.id, to: h.edge, moved: false, startEdge: h.edge });
    } else {
      setDrag({ mode: 'click', edge: h.edge });
    }
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const p = toSvg(e);
    const h = hit(p.x, p.y);
    setHover(inGrid(h.edge) ? h.edge : null);
    if (!drag) return;
    if (drag.mode === 'wire') {
      if (pointKey(h.point) !== pointKey(drag.to)) setDrag({ ...drag, to: h.point, moved: true });
    } else if (drag.mode === 'move') {
      if (edgeKey(h.edge) !== edgeKey(drag.to)) setDrag({ ...drag, to: h.edge, moved: edgeKey(h.edge) !== edgeKey(drag.startEdge) });
    }
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag;
    setDrag(null);
    if (!d) return;
    const p = toSvg(e);
    const h = hit(p.x, p.y);
    if (d.mode === 'wire') {
      if (d.moved && pointKey(d.from) !== pointKey(d.to)) {
        elecActions.wireEdges(route(d.from, d.to));
      } else activate(h.edge);
    } else if (d.mode === 'move') {
      if (d.moved) elecActions.move(d.id, d.to);
      else activate(d.startEdge);
    } else {
      activate(d.edge);
    }
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const k = e.key;
    const move = (dx: number, dy: number) => {
      // Arrows along an edge step to the next edge; arrows across it turn onto the edge below/above (or right/left).
      let next: Edge;
      if (cursor.dir === 'h') {
        if (dx) next = { ...cursor, x: cursor.x + dx };
        else next = { x: cursor.x, y: dy > 0 ? cursor.y : cursor.y - 1, dir: 'v' };
      } else {
        if (dy) next = { ...cursor, y: cursor.y + dy };
        else next = { x: dx > 0 ? cursor.x : cursor.x - 1, y: cursor.y, dir: 'h' };
      }
      if (inGrid(next)) setCursor(next);
    };
    const rtl = document.documentElement.dir === 'rtl';
    if (k === 'ArrowRight') move(rtl ? -1 : 1, 0);
    else if (k === 'ArrowLeft') move(rtl ? 1 : -1, 0);
    else if (k === 'ArrowUp') move(0, -1);
    else if (k === 'ArrowDown') move(0, 1);
    else if (k === 'Enter') activate(cursor);
    else if ((k === 'Delete' || k === 'Backspace') && selectedId) elecActions.remove(selectedId);
    else if (k === ' ') {
      const el = elementAt(circuit, cursor) ?? circuit.elements.find((x) => x.id === selectedId);
      if (el?.kind === 'switch') elecActions.toggleSwitch(el.id);
      else return;
    } else if (k === 'Escape') {
      elecActions.setTool('select');
      elecActions.select(null);
    } else if ((k === 'z' || k === 'Z') && (e.ctrlKey || e.metaKey)) elecActions.undo();
    else return;
    e.preventDefault();
  };

  const wires = circuit.elements.filter((el) => el.kind === 'wire');
  const parts = circuit.elements.filter((el) => el.kind !== 'wire');
  const flowing = showFlow && result.status === 'ok';

  const transformFor = (el: CircuitElement) => {
    const m = mid(el.edge);
    const rot = (el.edge.dir === 'v' ? 90 : 0) + (el.flipped ? 180 : 0);
    return `translate(${m.x} ${m.y}) rotate(${rot})`;
  };

  const previewEdges: Edge[] = drag?.mode === 'wire' && drag.moved ? route(drag.from, drag.to) : [];
  const ghostEdge = drag?.mode === 'move' && drag.moved ? drag.to : !drag && hover && tool !== 'select' && tool !== 'wire' ? hover : null;
  const ghostKind: ElementKind | null =
    drag?.mode === 'move' ? (circuit.elements.find((x) => x.id === drag.id)?.kind ?? null) : tool !== 'select' && tool !== 'wire' ? tool : null;
  const ghostOk = ghostEdge ? (() => {
    const at = elementAt(circuit, ghostEdge);
    return !at || at.kind === 'wire' || (drag?.mode === 'move' && at.id === drag.id);
  })() : false;

  const statusLine = t(STATUS_TEXT[result.status].title);

  return (
    <div className={`circuit-canvas tool-${tool}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="application"
        aria-label={t(E.canvasLabel)}
        aria-describedby="circuit-desc"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHover(null)}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        data-testid="circuit-canvas"
        direction="ltr"
      >
        <defs>
          <pattern id="grid-dots" x={PAD - S} y={PAD - S} width={S} height={S} patternUnits="userSpaceOnUse">
            <circle cx={S} cy={S} r={2.2} className="c-dot" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={W} height={H} className="c-bg" />
        <rect x={PAD - 6} y={PAD - 6} width={GRID.cols * S + 12} height={GRID.rows * S + 12} fill="url(#grid-dots)" />

        {/* wires */}
        {wires.map((el) => (
          <g key={el.id} transform={transformFor(el)} className={selectedId === el.id ? 'c-selected' : ''}>
            <Symbol el={el} brightness={0} />
          </g>
        ))}

        {/* current flow overlay: conventional current from a to b when current > 0 */}
        {flowing &&
          circuit.elements.map((el) => {
            const r = result.elements[el.id];
            if (!r || Math.abs(r.current) < 1e-6) return null;
            const t2 = terminals(el);
            const [from, to] = r.current > 0 ? [px(t2.a), px(t2.b)] : [px(t2.b), px(t2.a)];
            const dur = Math.min(3, Math.max(0.35, 1.2 / Math.sqrt(Math.abs(r.current))));
            return (
              <line
                key={`f-${el.id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className="c-flow"
                style={{ animationDuration: `${dur}s` }}
              />
            );
          })}

        {junctions.map((k) => {
          const [x, y] = k.split(',').map(Number);
          const p = px({ x, y });
          return <circle key={`j-${k}`} cx={p.x} cy={p.y} r={4.5} className="c-junction" />;
        })}

        {/* parts */}
        {parts.map((el) => {
          const r = result.elements[el.id];
          return (
            <g
              key={el.id}
              className={`c-part c-${el.kind} ${selectedId === el.id ? 'c-selected' : ''} ${faulty.has(el.id) ? 'c-fault' : ''} ${drag?.mode === 'move' && drag.id === el.id && drag.moved ? 'c-dragging' : ''}`}
              data-part={el.id}
            >
              <g transform={transformFor(el)}>
                <rect x={-S / 2 + 4} y={-22} width={S - 8} height={44} rx={8} className="c-select-ring" />
                <Symbol el={el} brightness={result.status === 'ok' ? (r?.brightness ?? 0) : 0} />
              </g>
              <Marks el={el} reading={el.kind === 'ammeter' || el.kind === 'voltmeter' ? (r?.reading ?? 0) : undefined} />
            </g>
          );
        })}

        {/* wire drawing preview */}
        {previewEdges.map((e) => {
          const [a, b] = edgeEnds(e).map(px);
          return <line key={`p-${edgeKey(e)}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="c-preview" />;
        })}
        {drag?.mode === 'wire' && (
          <circle cx={px(drag.from).x} cy={px(drag.from).y} r={7} className="c-anchor" />
        )}

        {/* placement ghost */}
        {ghostEdge && ghostKind && inGrid(ghostEdge) && (
          <g transform={transformFor({ id: 'ghost', kind: ghostKind, edge: ghostEdge, closed: true })} className={`c-ghost ${ghostOk ? '' : 'c-ghost-bad'}`}>
            <Symbol el={{ id: 'ghost', kind: ghostKind, edge: ghostEdge, closed: true }} brightness={0} />
          </g>
        )}
        {hover && !drag && tool === 'wire' && !elementAt(circuit, hover) && (
          (() => {
            const [a, b] = edgeEnds(hover).map(px);
            return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="c-preview" />;
          })()
        )}

        {/* keyboard cursor */}
        {focused && (
          <g transform={`translate(${mid(cursor).x} ${mid(cursor).y}) rotate(${cursor.dir === 'v' ? 90 : 0})`}>
            <rect x={-S / 2 + 2} y={-25} width={S - 4} height={50} rx={9} className="c-cursor" />
          </g>
        )}
      </svg>
      <p id="circuit-desc" className="sr-only" aria-live="polite">
        {statusLine}.{' '}
        {parts.map((el) => `${el.label ?? t(PART_NAMES[el.kind])}`).join(', ')}
        {focused && elementAt(circuit, cursor) ? `. ${t(PART_NAMES[elementAt(circuit, cursor)!.kind])}` : ''}
      </p>
    </div>
  );
}
