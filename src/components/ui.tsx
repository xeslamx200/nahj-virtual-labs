import { useId, type ReactNode } from 'react';
import type { SourceKind } from '../curriculum/types';
import { l, useI18n } from '../i18n/i18n';
import { clamp } from '../lib/format';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  digits?: number;
  hint?: string;
}

/** Range slider paired with a number box; the value is always clamped and snapped to the step. */
export function SliderField({ label, value, min, max, step, unit, onChange, disabled, digits, hint }: SliderProps) {
  const id = useId();
  const decimals = digits ?? Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const commit = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const snapped = Math.round((raw - min) / step) * step + min;
    onChange(Number(clamp(snapped, min, max).toFixed(6)));
  };
  return (
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <span className="num-input">
          <input
            type="number"
            aria-label={`${label} (${unit})`}
            value={Number(value.toFixed(decimals))}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => commit(e.target.valueAsNumber)}
          />
          <span className="unit ltr">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={`${value} ${unit}`}
        onChange={(e) => commit(e.target.valueAsNumber)}
      />
      {hint && <span className="small muted">{hint}</span>}
    </div>
  );
}

export function Readout({
  label,
  value,
  unit,
  accent,
  title,
  text,
}: {
  label: ReactNode;
  value: string;
  unit?: string;
  accent?: 'primary' | 'purple' | 'amber';
  title?: string;
  /** The value is a word, not a number. */
  text?: boolean;
}) {
  return (
    <div className={`readout ${accent ? `accent-${accent}` : ''} ${text ? 'readout-text' : ''}`} title={title}>
      <span className="r-label">{label}</span>
      <span className="r-value" aria-live="off">
        {value}
        {unit && <small>{unit}</small>}
      </span>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SOURCE_TEXT: Record<SourceKind, { label: ReturnType<typeof l>; cls: string; title: ReturnType<typeof l> }> = {
  textbook: {
    label: l('From the textbook', 'من الكتاب المدرسي'),
    cls: 'chip-primary',
    title: l('This activity, figure or example appears in the Grade 10 textbook.', 'يرد هذا النشاط أو الشكل أو المثال في كتاب الصفّ العاشر.'),
  },
  adapted: {
    label: l('Textbook concept · lab procedure', 'مفهوم من الكتاب · إجراء المختبر'),
    cls: 'chip-navy',
    title: l('The concept and equations are in the textbook; the step-by-step procedure was designed for this lab.', 'المفهوم والمعادلات من الكتاب، أمّا خطوات الإجراء فصُمّمت لهذا المختبر.'),
  },
  enrichment: {
    label: l('Enrichment', 'محتوى إثرائي'),
    cls: 'chip-purple',
    title: l('Goes beyond the textbook.', 'يتجاوز محتوى الكتاب المدرسي.'),
  },
};

export function SourceBadge({ source }: { source: SourceKind }) {
  const { t } = useI18n();
  const s = SOURCE_TEXT[source];
  return (
    <span className={`chip ${s.cls}`} title={t(s.title)}>
      {t(s.label)}
    </span>
  );
}

export function Eq({ children }: { children: ReactNode }) {
  return <span className="eq-pill">{children}</span>;
}

export function Banner({ kind, title, children }: { kind: 'info' | 'ok' | 'warn' | 'error'; title?: string; children?: ReactNode }) {
  return (
    <div className={`banner banner-${kind}`} role={kind === 'error' || kind === 'warn' ? 'alert' : 'status'}>
      <span aria-hidden="true" style={{ fontWeight: 700 }}>
        {kind === 'ok' ? '✓' : kind === 'info' ? 'i' : '!'}
      </span>
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}
