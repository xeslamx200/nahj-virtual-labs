import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { fmt } from '../lib/format';

/** Categorical series colours (validated for colour-vision deficiency on the light surface). */
export const SERIES_COLORS = ['#9b1b42', '#2f6fd0', '#c27a12', '#0a8f7f'];

export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartSeries {
  id: string;
  label: string;
  points: ChartPoint[];
  color?: string;
  /** 'line' draws a 2px line; 'points' draws markers only (recorded data). */
  kind?: 'line' | 'points' | 'line+points';
  dashed?: boolean;
}

interface Props {
  series: ChartSeries[];
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  xDomain?: [number, number];
  yDomain?: [number, number];
  /** Vertical marker at this x (current simulation time). */
  cursorX?: number;
  height?: number;
  title: string;
  /** Horizontal shaded bands (e.g. phase-change plateaus), drawn behind the data. */
  bands?: { y: number; label: string }[];
  emptyText?: string;
}

function niceStep(span: number, target: number) {
  const raw = span / Math.max(1, target);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const step = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
  return step * mag;
}

function ticks(lo: number, hi: number, target: number) {
  const step = niceStep(hi - lo || 1, target);
  const start = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

function niceDomain(lo: number, hi: number): [number, number] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) {
    const pad = Math.abs(lo) * 0.2 || 1;
    return [lo - pad, hi + pad];
  }
  const step = niceStep(hi - lo, 5);
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
}

/**
 * Responsive SVG line/scatter chart. Charts always use left-to-right
 * mathematical axes, also in the Arabic interface (as in the textbook).
 */
export function LineChart({
  series,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  xDomain,
  yDomain,
  cursorX,
  height = 240,
  title,
  bands,
  emptyText,
}: Props) {
  // The SVG is drawn at its real pixel width so text keeps the same size on every screen.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setW(Math.max(260, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const m = { l: 56, r: 16, t: 14, b: 44 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const clipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const all = series.flatMap((s) => s.points);
  const [x0, x1] = useMemo(() => {
    if (xDomain) return xDomain;
    if (!all.length) return [0, 1] as [number, number];
    return niceDomain(Math.min(0, ...all.map((p) => p.x)), Math.max(...all.map((p) => p.x)));
  }, [xDomain, all]);
  const [y0, y1] = useMemo(() => {
    if (yDomain) return yDomain;
    if (!all.length) return [0, 1] as [number, number];
    const ys = all.map((p) => p.y).concat(bands?.map((b) => b.y) ?? []);
    return niceDomain(Math.min(0, ...ys), Math.max(0, ...ys));
  }, [yDomain, all, bands]);

  const sx = (x: number) => m.l + ((x - x0) / (x1 - x0 || 1)) * iw;
  const sy = (y: number) => m.t + ih - ((y - y0) / (y1 - y0 || 1)) * ih;
  const xt = ticks(x0, x1, 6);
  const yt = ticks(y0, y1, 5);

  const lineSeries = series.filter((s) => s.kind !== 'points' && s.points.length);
  const hoverX = hover === null ? null : x0 + ((hover - m.l) / iw) * (x1 - x0);

  // nearest point per series for the tooltip
  const hoverRows =
    hoverX === null
      ? []
      : series
          .filter((s) => s.points.length)
          .map((s, i) => {
            let best = s.points[0];
            for (const p of s.points) if (Math.abs(p.x - hoverX) < Math.abs(best.x - hoverX)) best = p;
            return { s, p: best, color: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] };
          });

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(px >= m.l && px <= m.l + iw ? px : null);
  };

  const summary = `${title}. ${series
    .map((s) => `${s.label}: ${s.points.length} points${s.points.length ? `, last (${fmt(s.points.at(-1)!.x)}, ${fmt(s.points.at(-1)!.y)})` : ''}`)
    .join('; ')}`;

  return (
    <figure className="chart" dir="ltr" style={{ margin: 0 }}>
      {series.length > 1 && (
        <div className="chart-legend" aria-hidden="true">
          {series.map((s, i) => (
            <span key={s.id} className="legend-item">
              <svg width="18" height="10">
                {s.kind === 'points' ? (
                  <circle cx="9" cy="5" r="4" fill={s.color ?? SERIES_COLORS[i % 4]} />
                ) : (
                  <line x1="1" x2="17" y1="5" y2="5" stroke={s.color ?? SERIES_COLORS[i % 4]} strokeWidth="2" strokeDasharray={s.dashed ? '4 3' : undefined} />
                )}
              </svg>
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div style={{ position: 'relative' }} ref={wrapRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={summary}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          style={{ display: 'block', touchAction: 'pan-y' }}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={m.l} y={m.t} width={iw} height={ih} />
            </clipPath>
          </defs>
          {yt.map((v) => (
            <g key={`y${v}`}>
              <line x1={m.l} x2={m.l + iw} y1={sy(v)} y2={sy(v)} stroke={v === 0 ? '#b9b2a3' : '#ece8df'} strokeWidth={1} />
              <text x={m.l - 8} y={sy(v)} textAnchor="end" dominantBaseline="middle" className="chart-tick">
                {fmt(v, 4)}
              </text>
            </g>
          ))}
          {xt.map((v) => (
            <g key={`x${v}`}>
              <line x1={sx(v)} x2={sx(v)} y1={m.t} y2={m.t + ih} stroke={v === 0 ? '#b9b2a3' : '#f2efe8'} strokeWidth={1} />
              <text x={sx(v)} y={m.t + ih + 16} textAnchor="middle" className="chart-tick">
                {fmt(v, 4)}
              </text>
            </g>
          ))}
          <text x={m.l + iw / 2} y={H - 6} textAnchor="middle" className="chart-axis-label">
            {xLabel}
            {xUnit ? ` (${xUnit})` : ''}
          </text>
          <text transform={`translate(13 ${m.t + ih / 2}) rotate(-90)`} textAnchor="middle" className="chart-axis-label">
            {yLabel}
            {yUnit ? ` (${yUnit})` : ''}
          </text>

          <g clipPath={`url(#${clipId})`}>
            {bands?.map((b) => (
              <g key={b.label}>
                <line x1={m.l} x2={m.l + iw} y1={sy(b.y)} y2={sy(b.y)} stroke="#c9c2b3" strokeDasharray="3 4" />
                <text x={m.l + iw - 4} y={sy(b.y) - 5} textAnchor="end" className="chart-tick">
                  {b.label}
                </text>
              </g>
            ))}
            {lineSeries.map((s) => {
              const i = series.indexOf(s);
              const d = s.points.map((p, k) => `${k ? 'L' : 'M'}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join('');
              return (
                <path
                  key={s.id}
                  d={d}
                  fill="none"
                  stroke={s.color ?? SERIES_COLORS[i % 4]}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '6 5' : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}
            {series.map((s, i) =>
              s.kind === 'points' || s.kind === 'line+points'
                ? s.points.map((p, k) => (
                    <circle
                      key={`${s.id}-${k}`}
                      cx={sx(p.x)}
                      cy={sy(p.y)}
                      r={4.5}
                      fill={s.color ?? SERIES_COLORS[i % 4]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))
                : null,
            )}
          </g>
          {cursorX !== undefined && cursorX >= x0 && cursorX <= x1 && (
            <line x1={sx(cursorX)} x2={sx(cursorX)} y1={m.t} y2={m.t + ih} stroke="#14213d" strokeOpacity={0.35} strokeWidth={1} />
          )}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={hover} x2={hover} y1={m.t} y2={m.t + ih} stroke="#14213d" strokeOpacity={0.25} />
              {hoverRows.map(({ s, p, color }) => (
                <circle key={s.id} cx={sx(p.x)} cy={sy(p.y)} r={5} fill={color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}
          {!all.length && (
            <text x={m.l + iw / 2} y={m.t + ih / 2} textAnchor="middle" className="chart-empty">
              {emptyText ?? ''}
            </text>
          )}
        </svg>
        {hover !== null && hoverRows.length > 0 && (
          <div
            className="chart-tooltip"
            style={{ left: `${(hover / W) * 100}%`, transform: hover > W * 0.6 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}
          >
            {hoverRows.map(({ s, p, color }) => (
              <div key={s.id} className="tt-row">
                <span className="tt-swatch" style={{ background: color }} />
                <span className="tt-label">{s.label}</span>
                <span className="mono">
                  {fmt(p.x, 4)}
                  {xUnit ? ` ${xUnit}` : ''}, {fmt(p.y, 4)}
                  {yUnit ? ` ${yUnit}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
