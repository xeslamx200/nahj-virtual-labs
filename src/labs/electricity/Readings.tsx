import { useMemo } from 'react';
import { useI18n } from '../../i18n/i18n';
import { fmt } from '../../lib/format';
import { Banner, Readout } from '../../components/ui';
import { LineChart, SERIES_COLORS } from '../../components/LineChart';
import { E, PART_NAMES, STATUS_TEXT, WARNING_TEXT } from './strings';
import { sweepCharacteristic, useElec } from './store';

export function Readings() {
  const { t } = useI18n();
  const { circuit, result, selectedId } = useElec();
  const status = STATUS_TEXT[result.status];
  const nameOf = (id: string) => {
    const el = circuit.elements.find((e) => e.id === id);
    return el ? `${t(PART_NAMES[el.kind])} ${el.label ?? ''}`.trim() : id;
  };
  const batteries = circuit.elements.filter((e) => e.kind === 'battery');
  const meters = circuit.elements.filter((e) => e.kind === 'ammeter' || e.kind === 'voltmeter');
  const sel = circuit.elements.find((e) => e.id === selectedId && e.kind !== 'wire');
  const selR = sel ? result.elements[sel.id] : undefined;
  const ok = result.status === 'ok';
  const totalP = ok
    ? circuit.elements.filter((e) => e.kind === 'resistor' || e.kind === 'bulb').reduce((s, e) => s + (result.elements[e.id]?.power ?? 0), 0)
    : 0;

  // I–V sweep for a selected resistor or bulb when exactly one battery drives the circuit
  const sweep = useMemo(() => {
    if (!sel || (sel.kind !== 'resistor' && sel.kind !== 'bulb') || batteries.length !== 1) return null;
    if (result.status === 'short' || result.status === 'conflict') return null;
    return sweepCharacteristic(circuit, sel.id, batteries[0].id);
  }, [circuit, sel, batteries, result.status]);

  return (
    <section className="panel readings" aria-label={t(E.readings)}>
      <div className="panel-title">
        <span>{t(E.readings)}</span>
      </div>
      <div data-testid="circuit-status" data-status={result.status}>
        <Banner kind={status.kind} title={t(status.title)}>
          <p className="small">{t(status.body)}</p>
        </Banner>
      </div>
      {result.warnings.length > 0 && (
        <ul className="warning-list" data-testid="circuit-warnings">
          {result.warnings.map((w, i) => (
            <li key={`${w.code}-${w.elementId}-${i}`}>
              <span aria-hidden="true">!</span> {t(WARNING_TEXT[w.code], { name: nameOf(w.elementId) })}
            </li>
          ))}
        </ul>
      )}

      <div className="readouts">
        {batteries.length === 1 && <Readout label={t(E.batteryV)} value={fmt(batteries[0].voltage ?? 0, 3)} unit="V" />}
        <Readout label={t(E.totalI)} value={fmt(ok ? Math.abs(result.totalCurrent) : 0, 3)} unit="A" accent="primary" />
        <Readout label={t(E.req)} value={ok && result.equivalentResistance !== undefined ? fmt(result.equivalentResistance, 4) : '—'} unit="Ω" accent="purple" />
        <Readout label={t(E.totalP)} value={fmt(totalP, 3)} unit="W" accent="amber" />
      </div>

      {meters.length > 0 && (
        <>
          <h3 className="sub-title">{t(E.meters)}</h3>
          <div className="readouts" data-testid="meter-readings">
            {meters.map((m) => (
              <Readout
                key={m.id}
                label={<span className="ltr">{m.label ?? m.id}</span>}
                value={fmt(ok || result.status === 'open' ? (result.elements[m.id]?.reading ?? 0) : 0, 3)}
                unit={m.kind === 'ammeter' ? 'A' : 'V'}
                accent={m.kind === 'ammeter' ? 'primary' : 'purple'}
              />
            ))}
          </div>
        </>
      )}

      {sel && selR && (
        <>
          <h3 className="sub-title">{t(E.partValues, { name: sel.label ?? t(PART_NAMES[sel.kind]) })}</h3>
          <div className="readouts">
            <Readout label={t(E.across)} value={fmt(Math.abs(selR.voltageDrop), 3)} unit="V" />
            <Readout label={t(E.through)} value={fmt(Math.abs(selR.current), 3)} unit="A" />
            {(sel.kind === 'resistor' || sel.kind === 'bulb') && <Readout label={t(E.power)} value={fmt(selR.power, 3)} unit="W" />}
          </div>
        </>
      )}

      {sel && (sel.kind === 'resistor' || sel.kind === 'bulb') && (
        <div className="iv-chart">
          {sweep ? (
            <>
              <LineChart
                title={t(E.ivTitle, { name: sel.label ?? '' })}
                series={[
                  {
                    id: 'iv',
                    label: sel.label ?? '',
                    kind: 'line',
                    color: SERIES_COLORS[0],
                    points: sweep.map((p) => ({ x: p.i, y: p.v })),
                  },
                ]}
                xLabel="I"
                yLabel="V"
                xUnit="A"
                yUnit="V"
                height={190}
                cursorX={ok ? Math.abs(selR?.current ?? 0) : undefined}
              />
              <p className="small muted">{t(E.ivNote)}</p>
            </>
          ) : (
            <p className="small muted">{t(E.ivNeed)}</p>
          )}
        </div>
      )}
    </section>
  );
}
