import type { ReactNode } from 'react';

/**
 * Renders a formula with real subscripts and superscripts, always left-to-right so it stays
 * legible inside Arabic text: "Fe2(SO4)3" → Fe₂(SO₄)₃, "SO4^2-" → SO₄²⁻, "CuSO4·5H2O".
 * The text is never altered, only typeset.
 */
export function Formula({ f, state, className }: { f: string; state?: string | null; className?: string }) {
  const out: ReactNode[] = [];
  let body = f;
  let charge = '';
  const caret = f.indexOf('^');
  if (caret >= 0) {
    body = f.slice(0, caret);
    charge = f.slice(caret + 1);
  } else {
    const bare = f.match(/^(.*[A-Za-z0-9)\]])([+-])$/);
    if (bare) {
      body = bare[1];
      charge = bare[2];
    }
  }
  // Digits right after a letter or a closing bracket are subscripts; digits after a hydrate dot are a multiplier.
  const re = /(\d+)|([·.*•])|([^\d·.*•]+)/g;
  let m: RegExpExecArray | null;
  let prev = '';
  let k = 0;
  while ((m = re.exec(body))) {
    if (m[1]) {
      if (/[A-Za-z)\]]$/.test(prev)) out.push(<sub key={k++}>{m[1]}</sub>);
      else out.push(<span key={k++}>{m[1]}</span>);
    } else if (m[2]) out.push(<span key={k++}>·</span>);
    else out.push(<span key={k++}>{m[3]}</span>);
    prev = m[0] === '·' || m[0] === '.' ? '·' : m[0];
  }
  if (charge) {
    const sign = charge.includes('+') ? '+' : '−';
    const mag = charge.replace(/[+-]/g, '');
    out.push(<sup key={k++}>{`${mag}${sign}`}</sup>);
  }
  return (
    <bdi dir="ltr" className={`chem ${className ?? ''}`}>
      {out}
      {state ? <span className="chem-state">({state})</span> : null}
    </bdi>
  );
}

/** Plain-text version with Unicode sub/superscripts (for titles, aria labels and the assistant). */
export function formulaText(f: string): string {
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  let body = f;
  let charge = '';
  const caret = f.indexOf('^');
  if (caret >= 0) {
    body = f.slice(0, caret);
    charge = f.slice(caret + 1);
  }
  const s = body.replace(/([A-Za-z)\]])(\d+)/g, (_, a: string, d: string) => a + [...d].map((c) => SUB[Number(c)]).join('')).replace(/[.*•]/g, '·');
  if (!charge) return s;
  const mag = [...charge.replace(/[+-]/g, '')].map((c) => SUP[Number(c)]).join('');
  return s + mag + (charge.includes('+') ? '⁺' : '⁻');
}

/** Typesets a whole equation string such as "2Na + 2H2O → 2NaOH + H2". */
export function EqText({ text }: { text: string }) {
  const parts = text.split(/(\s+\+\s+|\s*(?:→|->)\s*)/);
  return (
    <bdi dir="ltr" className="chem-eq">
      {parts.map((p, i) => {
        if (/^\s*\+\s*$/.test(p)) return <span key={i}> + </span>;
        if (/^\s*(→|->)\s*$/.test(p)) return <span key={i}> → </span>;
        const m = p.match(/^(\d+)(.*)$/);
        return m ? (
          <span key={i}>
            {m[1]}
            <Formula f={m[2]} />
          </span>
        ) : (
          <Formula key={i} f={p} />
        );
      })}
    </bdi>
  );
}
