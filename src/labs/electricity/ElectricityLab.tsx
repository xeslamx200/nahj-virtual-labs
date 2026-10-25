import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ActivityGuide } from '../../components/ActivityGuide';
import { LabShell } from '../../components/LabShell';
import { RecordsPanel } from '../../components/RecordsPanel';
import { ELECTRICITY_ACTIVITIES, ELECTRICITY_LAB } from '../../curriculum/electricity';
import { useI18n } from '../../i18n/i18n';
import { addRecord, getActivity, progressStore } from '../../lib/progress';
import type { PresetId } from '../../physics/circuit/presets';
import { CircuitCanvas } from './CircuitCanvas';
import { Inspector } from './Inspector';
import { Palette } from './Palette';
import { Readings } from './Readings';
import { ELEC_TAGS, elecSnapshot, recordFor } from './recorders';
import { E } from './strings';
import { elecActions, elecStore, useElec } from './store';

export default function ElectricityLab() {
  const { t } = useI18n();
  const s = useElec();
  const [params] = useSearchParams();

  // Deep links from workshop mode: ?activity=…&mode=guided|free&preset=…
  useEffect(() => {
    const act = ELECTRICITY_ACTIVITIES.find((a) => a.id === params.get('activity'));
    const mode = params.get('mode');
    const preset = params.get('preset') as PresetId | null;
    if (act) elecActions.setActivity(act.id);
    if (mode === 'guided' || mode === 'free') elecActions.setMode(mode);
    if (preset && preset in E.presetNames) elecActions.loadPreset(preset);
    else if (act) elecActions.loadPreset(act.preset as PresetId);
  }, [params]);

  const activity = ELECTRICITY_ACTIVITIES.find((a) => a.id === s.activityId) ?? ELECTRICITY_ACTIVITIES[0];
  const rec = recordFor(activity.id, s);
  const blocked = 'blocked' in rec ? t(rec.blocked) : undefined;

  const reset = () => {
    elecActions.loadPreset(s.mode === 'guided' ? (activity.preset as PresetId) : s.presetId);
  };

  return (
    <LabShell
      lab={ELECTRICITY_LAB}
      activities={ELECTRICITY_ACTIVITIES}
      activityId={activity.id}
      onActivity={(id) => {
        const next = ELECTRICITY_ACTIVITIES.find((a) => a.id === id);
        if (!next) return;
        elecActions.setActivity(id);
        elecActions.loadPreset(next.preset as PresetId);
      }}
      mode={s.mode}
      onMode={(m) => elecActions.setMode(m)}
      onReset={reset}
      snapshot={() => elecSnapshot(elecStore.get(), getActivity(progressStore.get(), 'electricity', activity.id).records)}
      guide={<ActivityGuide activity={activity} state={{ circuit: s.circuit, result: s.result }} onSetup={() => elecActions.loadPreset(activity.preset as PresetId)} />}
    >
      <div className="elec-layout">
        <div className="panel elec-stage">
          <Palette />
          {s.mode === 'guided' && activity.id === 'series-parallel' && (
            <div className="quick-switch" role="group" aria-label={t(E.switchTo)}>
              <span className="small muted">{t(E.switchTo)}:</span>
              <button type="button" className="btn btn-sm" aria-pressed={s.presetId === 'series'} onClick={() => elecActions.loadPreset('series')}>
                {t(E.presetNames.series)}
              </button>
              <button type="button" className="btn btn-sm" aria-pressed={s.presetId === 'parallel'} onClick={() => elecActions.loadPreset('parallel')}>
                {t(E.presetNames.parallel)}
              </button>
            </div>
          )}
          <CircuitCanvas />
        </div>
        <div className="elec-side">
          <Readings />
          <Inspector />
        </div>
      </div>
      {s.mode === 'guided' && (
        <RecordsPanel
          activity={activity}
          onRecord={() => {
            if ('values' in rec) addRecord('electricity', activity.id, rec.values, rec.tag);
          }}
          recordDisabled={blocked}
          tagLabels={ELEC_TAGS[activity.id]}
        />
      )}
    </LabShell>
  );
}
