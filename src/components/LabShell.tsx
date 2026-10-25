import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ALL_STEPS, ELECTRICITY_SEQUENCE, stepLink } from '../workshop/scenarios';
import { l } from '../i18n/i18n';
import { AssistantPanel } from '../assistant/AssistantPanel';
import type { AssistantSnapshot } from '../assistant/types';
import type { ActivityDef, LabInfo } from '../curriculum/types';
import { useI18n } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { useActivityProgress } from '../lib/progress';
import { Icon } from './Icon';
import { Segmented } from './ui';

export type LabMode = 'guided' | 'free';

const LAB_ICONS = { electricity: 'bolt', motion: 'motion', heat: 'flame', chemistry: 'flask' } as const;

interface Props {
  lab: LabInfo;
  activities: Pick<ActivityDef, 'id' | 'title'>[];
  activityId: string;
  onActivity: (id: string) => void;
  mode: LabMode;
  onMode: (m: LabMode) => void;
  onReset: () => void;
  /** Built only while the assistant is open, from the live simulation state. */
  snapshot: () => AssistantSnapshot;
  guide: ReactNode;
  children: ReactNode;
  /** Optional banner shown above the workspace (e.g. workshop scenario). */
  banner?: ReactNode;
}

const WS = {
  label: l('Workshop step', 'خطوة ورشة العمل'),
  explain: l('Explanation', 'الشرح'),
  next: l('Next step', 'الخطوة التالية'),
  back: l('All scenarios', 'كلّ السيناريوهات'),
};

/** Shown when a lab is opened from workshop mode: objective, on-screen actions and the explanation. */
function WorkshopBanner() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const step = ALL_STEPS.find((s) => s.id === params.get('ws'));
  if (!step) return null;
  const i = ELECTRICITY_SEQUENCE.indexOf(step);
  const next = i >= 0 ? ELECTRICITY_SEQUENCE[i + 1] : undefined;
  return (
    <div className="ws-banner" data-testid="workshop-banner">
      <div className="ws-banner-main">
        <p className="small ws-banner-label">
          {t(WS.label)}
          {i >= 0 ? ` ${i + 1}/${ELECTRICITY_SEQUENCE.length}` : ''}
        </p>
        <h2>{t(step.title)}</h2>
        <p className="ws-objective">
          <Icon name="target" /> {t(step.objective)}
        </p>
        <ul className="guide-list small">
          {step.actions.map((a, k) => (
            <li key={k}>{t(a)}</li>
          ))}
        </ul>
        <details>
          <summary className="small">{t(WS.explain)}</summary>
          <p className="small">{t(step.explain)}</p>
        </details>
      </div>
      <div className="ws-banner-actions">
        {next && (
          <Link to={stepLink(next)} className="btn btn-primary btn-sm">
            {t(WS.next)}: {t(next.title)} <Icon name="arrow" className="flip-rtl" />
          </Link>
        )}
        <Link to="/workshop" className="btn btn-sm">
          {t(WS.back)}
        </Link>
      </div>
    </div>
  );
}

function ActivityOption({ lab, a }: { lab: LabInfo; a: Pick<ActivityDef, 'id' | 'title'> }) {
  const { t } = useI18n();
  const p = useActivityProgress(lab.id, a.id);
  return (
    <option value={a.id}>
      {p.completed ? '✓ ' : ''}
      {t(a.title)}
    </option>
  );
}

export function LabShell({ lab, activities, activityId, onActivity, mode, onMode, onReset, snapshot, guide, children, banner }: Props) {
  const { t } = useI18n();
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className={`lab-page accent-${lab.accent}`}>
      <div className="lab-head">
        <div className="lab-head-title">
          <span className="lab-head-icon" aria-hidden="true">
            <Icon name={LAB_ICONS[lab.id]} />
          </span>
          <div>
            <Link to="/" className="small back-link">
              <Icon name="chevron" className="back-chevron" /> {t(UI.back)}
            </Link>
            <h1>{t(lab.title)}</h1>
            <p className="small lab-head-unit">{t(lab.unit)}</p>
          </div>
        </div>
        <div className="lab-head-controls">
          <Segmented
            label={t(UI.activity)}
            value={mode}
            onChange={onMode}
            options={[
              { value: 'guided', label: t(UI.guided) },
              { value: 'free', label: t(UI.free) },
            ]}
          />
          {mode === 'guided' && (
            <label className="inline-select">
              <span className="sr-only">{t(UI.activity)}</span>
              <select value={activityId} onChange={(e) => onActivity(e.target.value)} data-testid="activity-select">
                {activities.map((a) => (
                  <ActivityOption key={a.id} lab={lab} a={a} />
                ))}
              </select>
            </label>
          )}
          <button type="button" className="btn" onClick={onReset} data-testid="reset">
            <Icon name="reset" /> {t(UI.resetExperiment)}
          </button>
          <Link to={`/report/${lab.id}`} className="btn">
            <Icon name="print" /> {t(UI.report)}
          </Link>
          <button type="button" className="btn btn-navy" aria-pressed={assistantOpen} onClick={() => setAssistantOpen((o) => !o)} data-testid="assistant-toggle">
            <Icon name="sparkle" /> {t(UI.assistant)}
          </button>
        </div>
      </div>

      {banner}
      <WorkshopBanner />

      <div className={`lab-body ${mode === 'guided' ? 'with-guide' : 'free'} ${assistantOpen ? 'with-assistant' : ''}`}>
        {mode === 'guided' && (
          <aside className="lab-guide panel" aria-label={t(UI.guided)}>
            {guide}
          </aside>
        )}
        <div className="lab-work">
          {mode === 'free' && (
            <div className="panel free-objectives">
              <div className="panel-title">
                <span>{t(UI.free)}</span>
              </div>
              <ul className="guide-list">
                {lab.objectives.map((o, i) => (
                  <li key={i}>{t(o)}</li>
                ))}
              </ul>
            </div>
          )}
          {children}
        </div>
        {assistantOpen && <AssistantPanel snapshot={snapshot()} onClose={() => setAssistantOpen(false)} />}
      </div>

      <details className="panel lab-notes">
        <summary>
          {t(UI.assumptions)} · {t(UI.safety)}
        </summary>
        <div className="lab-notes-grid">
          <div>
            <h3>{t(UI.assumptions)}</h3>
            <ul className="guide-list">
              {lab.assumptions.map((a, i) => (
                <li key={i}>{t(a)}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{t(UI.safety)}</h3>
            <ul className="guide-list">
              {lab.safety.map((a, i) => (
                <li key={i}>{t(a)}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}
