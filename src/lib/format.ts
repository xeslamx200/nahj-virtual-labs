/**
 * Number formatting. Both interfaces use Western digits and SI symbols,
 * matching the textbook's own notation.
 */
export function fmt(value: number | undefined | null, digits = 3): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e9 || abs < 1e-3) return value.toExponential(Math.max(0, digits - 1)).replace('e+', 'e');
  // significant figures, but never more than 4 decimals, and no trailing zeros noise
  const decimals = Math.min(4, Math.max(0, digits - 1 - Math.floor(Math.log10(abs))));
  return Number(value.toFixed(decimals)).toString();
}

/** Fixed decimals (for meter-style displays). */
export function fixed(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—';
  const v = Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value;
  return v.toFixed(decimals);
}

/** Meter display: choose mA for small currents. */
export function current(amps: number): { value: string; unit: string } {
  if (Math.abs(amps) > 0 && Math.abs(amps) < 0.1) return { value: fixed(amps * 1000, 1), unit: 'mA' };
  return { value: fixed(amps, 3), unit: 'A' };
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Linear least-squares fit y = m x + b. */
export function linearFit(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    sxy += p.x * p.y;
  }
  const den = n * sxx - sx * sx;
  if (Math.abs(den) < 1e-15) return null;
  const m = (n * sxy - sx * sy) / den;
  const b = (sy - m * sx) / n;
  return { m, b };
}

/** Least-squares slope of a line through the origin, y = m x. */
export function originSlope(points: { x: number; y: number }[]) {
  let sxx = 0, sxy = 0;
  for (const p of points) {
    sxx += p.x * p.x;
    sxy += p.x * p.y;
  }
  return sxx > 0 ? sxy / sxx : null;
}

/** Relative closeness test used by the automated answer checks. */
export function isClose(answer: number, expected: number, relTol = 0.03, absTol = 1e-9) {
  return Math.abs(answer - expected) <= Math.max(absTol, relTol * Math.abs(expected));
}

/** Parse a learner's numeric answer: accepts "0.5", "0,5", Arabic-Indic digits, and units after the number. */
export function parseNumber(input: string): number | null {
  const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
  const easternIndic = '۰۱۲۳۴۵۶۷۸۹';
  let s = input.trim();
  s = s.replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d))).replace(/[۰-۹]/g, (d) => String(easternIndic.indexOf(d)));
  s = s.replace('٫', '.').replace(/(\d),(\d)/, '$1.$2').replace('−', '-');
  const m = s.match(/^[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
  if (!m) return null;
  const v = Number(m[0]);
  return Number.isFinite(v) ? v : null;
}
