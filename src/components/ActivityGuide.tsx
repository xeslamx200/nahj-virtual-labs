import { useState } from 'react';
import type { ActivityDef, CheckContext } from '../curriculum/types';
import { useI18n } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { updateActivity, useActivityProgress } from '../lib/progress';
import { Icon } from './Icon';
import { QuestionCard } from './QuestionCard';
import { Eq, SourceBadge } from './ui';

export function ActivityGuide<S>({
  activity,
  state,
  onSetup,
}: {
  activity: ActivityDef<S>;
  state: S;
  onSetup: () => void;
}) {
  const { t } = useI18n();
  const progress = useActivityProgress(activity.lab, activity.id);
  const [showConclusion, setShowConclusion] = useState(false);
  const ctx: CheckContext<S> = { records: progress.records, state };
  const answered = activity.questions.filter((q) => {
    const a = progress.answers[q.id];
    return q.kind === 'open' ? !!progress.reflections[q.id]?.trim() : a?.correct || a?.revealed;
  }).length;

  return (
    <div className="guide">
      <div className="guide-head">
        <div className="guide-chips">
          <SourceBadge source={activity.source} />
          <span className="chip">
            <Icon name="clock" /> {t(UI.minutes, { n: activity.minutes })}
          </span>
          {progress.completed && <span className="chip chip-green">✓ {t(UI.completed)}</span>}
        </div>
        <h2 className="guide-title">{t(activity.title)}</h2>
        <p className="small muted guide-ref">
          <Icon name="book" /> {t(activity.ref)} · <span className="ltr">{activity.outcomes.join(', ')}</span>
        </p>
      </div>

      <section className="guide-sec">
        <h3>{t(UI.objective)}</h3>
        <p>{t(activity.objective)}</p>
        <div className="eq-block" aria-label={t(UI.equations)}>
          {activity.equations.map((e) => (
            <Eq key={e}>{e}</Eq>
          ))}
        </div>
      </section>

      <section className="guide-sec">
        <h3>{t(UI.question)}</h3>
        <p className="guide-question">{t(activity.question)}</p>
        <label className="field" style={{ marginTop: 10 }}>
          <span className="label">
            {t(UI.hypothesis)} — <span className="muted">{t(activity.hypothesisPrompt)}</span>
          </span>
          <textarea
            defaultValue={progress.hypothesis}
            key={`${activity.id}-hyp`}
            onBlur={(e) => updateActivity(activity.lab, activity.id, (p) => ({ ...p, hypothesis: e.target.value }))}
          />
        </label>
      </section>

      <section className="guide-sec">
        <h3>{t(UI.setup)}</h3>
        <ul className="guide-list">
          {activity.setup.map((s, i) => (
            <li key={i}>{t(s)}</li>
          ))}
        </ul>
        <button type="button" className="btn btn-primary" onClick={onSetup} style={{ marginTop: 10 }}>
          <Icon name="target" /> {t(UI.setupButton)}
        </button>
      </section>

      <section className="guide-sec">
        <h3>{t(UI.steps)}</h3>
        <ol className="guide-steps">
          {activity.steps.map((s, i) => (
            <li key={i}>{t(s)}</li>
          ))}
        </ol>
      </section>

      <section className="guide-sec">
        <h3>
          {t(UI.interpret)}{' '}
          <span className="muted small ltr">
            {answered}/{activity.questions.length}
          </span>
        </h3>
        <div className="questions">
          {activity.questions.map((q, i) => (
            <QuestionCard
              key={`${activity.id}-${q.id}`}
              q={q}
              index={i}
              lab={activity.lab}
              activityId={activity.id}
              answer={progress.answers[q.id]}
              reflection={progress.reflections[q.id]}
              ctx={ctx}
            />
          ))}
        </div>
      </section>

      <section className="guide-sec">
        {!showConclusion && !progress.completed ? (
          <button type="button" className="btn" onClick={() => setShowConclusion(true)}>
            {t(UI.showConclusion)}
          </button>
        ) : (
          <>
            <h3>{t(UI.conclusion)}</h3>
            <p>{t(activity.conclusion)}</p>
            <div className="principle">
              <strong>
                <Icon name="lightbulb" /> {t(UI.principle)}
              </strong>
              <p>{t(activity.principle)}</p>
            </div>
          </>
        )}
        <button
          type="button"
          className={`btn ${progress.completed ? '' : 'btn-navy'}`}
          style={{ marginTop: 12 }}
          aria-pressed={progress.completed}
          onClick={() => {
            setShowConclusion(true);
            updateActivity(activity.lab, activity.id, (p) => ({ ...p, completed: !p.completed }));
          }}
        >
          {progress.completed ? `✓ ${t(UI.completed)}` : t(UI.markComplete)}
        </button>
      </section>
    </div>
  );
}
