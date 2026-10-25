import { useI18n } from '../../i18n/i18n';
import { fmt } from '../../lib/format';
import { LIMITS } from '../../physics/circuit/types';
import { Icon } from '../../components/Icon';
import { Segmented, SliderField } from '../../components/ui';
import { E, PART_NAMES } from './strings';
import { elecActions, useElec } from './store';

export function Inspector() {
  const { t } = useI18n();
  const { circuit, result, selectedId } = useElec();
  const el = circuit.elements.find((e) => e.id === selectedId);
  const parts = circuit.elements.filter((e) => e.kind !== 'wire');
  const wireCount = circuit.elements.length - parts.length;
  const name = el ? `${t(PART_NAMES[el.kind])}${el.label ? ` ${el.label}` : ''}` : '';

  return (
    <section className="panel inspector" aria-label={t(E.inspector)}>
      <div className="panel-title">
        <span>{t(E.inspector)}</span>
        {el && <span className="chip chip-primary ltr">{el.label ?? t(PART_NAMES[el.kind])}</span>}
      </div>
      {!el ? (
        <p className="small muted">{t(E.noSelection)}</p>
      ) : (
        <div className="inspector-body" data-testid="inspector">
          <strong>{name}</strong>
          {el.kind === 'battery' && (
            <SliderField
              label={t(E.voltage)}
              value={el.voltage ?? 0}
              min={LIMITS.voltage.min}
              max={LIMITS.voltage.max}
              step={LIMITS.voltage.step}
              unit="V"
              onChange={(v) => elecActions.update(el.id, { voltage: v })}
            />
          )}
          {el.kind === 'resistor' && (
            <SliderField
              label={t(E.resistance)}
              value={el.resistance ?? 10}
              min={LIMITS.resistance.min}
              max={LIMITS.resistance.max}
              step={LIMITS.resistance.step}
              unit="Ω"
              onChange={(v) => elecActions.update(el.id, { resistance: v })}
            />
          )}
          {el.kind === 'bulb' && (
            <>
              <Segmented
                label={t(E.bulbModel)}
                value={el.bulbModel ?? 'ohmic'}
                onChange={(v) => elecActions.update(el.id, { bulbModel: v })}
                options={[
                  { value: 'ohmic', label: t(E.ohmic) },
                  { value: 'filament', label: t(E.filament) },
                ]}
              />
              <SliderField
                label={el.bulbModel === 'filament' ? t(E.coldResistance) : t(E.resistance)}
                value={el.resistance ?? 10}
                min={LIMITS.bulbResistance.min}
                max={LIMITS.bulbResistance.max}
                step={LIMITS.bulbResistance.step}
                unit="Ω"
                onChange={(v) => elecActions.update(el.id, { resistance: v })}
              />
              <SliderField
                label={t(E.ratedPower)}
                value={el.ratedPower ?? 3.6}
                min={LIMITS.ratedPower.min}
                max={LIMITS.ratedPower.max}
                step={LIMITS.ratedPower.step}
                unit="W"
                onChange={(v) => elecActions.update(el.id, { ratedPower: v })}
              />
              {el.bulbModel === 'filament' && result.elements[el.id]?.resistance !== undefined && (
                <p className="small muted ltr">
                  {t(E.rNow)}: {fmt(result.elements[el.id].resistance, 3)} Ω
                </p>
              )}
            </>
          )}
          {el.kind === 'switch' && (
            <Segmented
              label={t(E.switchState)}
              value={el.closed ? 'closed' : 'open'}
              onChange={(v) => elecActions.update(el.id, { closed: v === 'closed' })}
              options={[
                { value: 'closed', label: t(E.closed) },
                { value: 'open', label: t(E.open) },
              ]}
            />
          )}
          <div className="inspector-actions">
            {(el.kind === 'battery' || el.kind === 'ammeter' || el.kind === 'voltmeter') && (
              <button type="button" className="btn btn-sm" onClick={() => elecActions.update(el.id, { flipped: !el.flipped })}>
                <Icon name="flip" /> {t(E.flip)}
              </button>
            )}
            <button type="button" className="btn btn-sm" onClick={() => elecActions.rotate(el.id)}>
              <Icon name="reset" /> {t(E.rotate)}
            </button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => elecActions.remove(el.id)}>
              <Icon name="trash" /> {t(E.remove)}
            </button>
          </div>
        </div>
      )}

      <h3 className="sub-title">{t(E.components)}</h3>
      <ul className="part-list">
        {parts.map((p) => (
          <li key={p.id}>
            <button type="button" className="part-chip" aria-pressed={p.id === selectedId} onClick={() => elecActions.select(p.id)}>
              <span>{t(PART_NAMES[p.kind])}</span>
              <span className="ltr muted">{p.label ?? ''}</span>
            </button>
          </li>
        ))}
      </ul>
      {wireCount > 0 && <p className="small muted">{t(E.wires, { n: wireCount })}</p>}
    </section>
  );
}
