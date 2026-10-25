import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { LABS } from '../curriculum';
import { l, useI18n } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { resetAllProgress } from '../lib/progress';
import { setPresenting, usePresenting } from '../lib/presenting';
import { chemStore } from '../labs/chemistry/store';
import { elecStore } from '../labs/electricity/store';
import { heatStore } from '../labs/heat/store';
import { motionStore } from '../labs/motion/store';
import { ELECTRICITY_SEQUENCE, SCENARIOS, stepLink, type WorkshopStep } from './scenarios';

const W = {
  title: l('Workshop mode', 'وضع ورشة العمل'),
  lead: l(
    'Prepared scenarios for a live demonstration. Each one opens a lab with the right set-up, shows its objective on screen and keeps the explanation at hand. No accounts or sign-in are needed.',
    'سيناريوهات جاهزة للعرض المباشر. يفتح كلّ منها المختبر بالإعداد المناسب، ويعرض هدفه على الشاشة، ويُبقي الشرح في متناول اليد. لا حاجة إلى حسابات أو تسجيل دخول.',
  ),
  presenter: l('Presenter view (larger text)', 'عرض المقدّم (نصّ أكبر)'),
  sequence: l('Electricity in 5 minutes', 'الكهرباء في 5 دقائق'),
  sequenceLead: l('Four short steps in the flagship lab. The timer is a guide for the presenter only.', 'أربع خطوات قصيرة في المختبر الرئيس. المؤقّت دليل للمقدّم فقط.'),
  scenarios: l('More scenarios', 'سيناريوهات أخرى'),
  launch: l('Launch', 'ابدأ'),
  launchFree: l('Open in free mode', 'افتح في وضع الاستكشاف الحرّ'),
  doThis: l('On screen', 'على الشاشة'),
  say: l('Explanation', 'الشرح'),
  timer: l('Presenter timer', 'مؤقّت المقدّم'),
  start: l('Start', 'ابدأ'),
  pause: l('Pause', 'إيقاف مؤقّت'),
  resetTimer: l('Reset timer', 'إعادة المؤقّت'),
  quickReset: l('Quick reset', 'إعادة ضبط سريعة'),
  resetLabs: l('Reset all labs to their starting set-ups', 'أعد جميع المختبرات إلى إعداداتها الابتدائيّة'),
  resetLabsDone: l('All labs reset.', 'أُعيد ضبط جميع المختبرات.'),
  clearData: l('Also erase saved tables and answers on this device', 'امسح أيضًا الجداول والإجابات المحفوظة على هذا الجهاز'),
  confirmClear: l('Erase all saved tables, hypotheses and answers on this device?', 'هل تريد مسح كلّ الجداول والفرضيّات والإجابات المحفوظة على هذا الجهاز؟'),
  durationNote: l('Durations are suggestions for each step; plan the session length yourself.', 'المدد المذكورة اقتراحات لكلّ خطوة؛ خطّط لطول الجلسة بنفسك.'),
};

function Timer({ seconds }: { seconds: number }) {
  const { t } = useI18n();
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (left === 0) setRunning(false);
  }, [left]);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className="ws-timer" role="timer" aria-label={t(W.timer)}>
      <span className={`mono ws-time ${left === 0 ? 'done' : ''}`}>
        {mm}:{ss}
      </span>
      <button type="button" className="btn btn-sm" onClick={() => setRunning((r) => !r)} disabled={left === 0}>
        <Icon name={running ? 'pause' : 'play'} /> {running ? t(W.pause) : t(W.start)}
      </button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => (setRunning(false), setLeft(seconds))}>
        <Icon name="reset" /> {t(W.resetTimer)}
      </button>
    </div>
  );
}

function StepCard({ step, index }: { step: WorkshopStep; index?: number }) {
  const { t } = useI18n();
  const free = { ...step, query: { ...step.query, mode: 'free' } };
  return (
    <article className="card ws-step" data-testid={`ws-${step.id}`}>
      <div className="ws-step-head">
        {index !== undefined && <span className="ws-num">{index + 1}</span>}
        <div>
          <p className="small muted">
            {t(LABS[step.lab].info.title)} · {t(UI.minutes, { n: step.minutes })}
          </p>
          <h3>{t(step.title)}</h3>
        </div>
      </div>
      <p className="ws-objective">
        <Icon name="target" /> {t(step.objective)}
      </p>
      <h4>{t(W.doThis)}</h4>
      <ul className="guide-list">
        {step.actions.map((a, i) => (
          <li key={i}>{t(a)}</li>
        ))}
      </ul>
      <h4>{t(W.say)}</h4>
      <p className="small">{t(step.explain)}</p>
      <div className="ws-actions">
        <Link to={stepLink(step)} className="btn btn-primary">
          <Icon name="play" /> {t(W.launch)}
        </Link>
        {step.query.mode !== 'free' && (
          <Link to={stepLink(free)} className="btn btn-ghost">
            {t(W.launchFree)}
          </Link>
        )}
      </div>
    </article>
  );
}

export default function WorkshopPage() {
  const { t } = useI18n();
  const presenting = usePresenting();
  const [done, setDone] = useState(false);
  const total = ELECTRICITY_SEQUENCE.reduce((s, x) => s + x.minutes, 0);

  return (
    <div className="container workshop">
      <section className="ws-hero">
        <div>
          <h1>{t(W.title)}</h1>
          <p className="lead">{t(W.lead)}</p>
          <p className="small muted">{t(W.durationNote)}</p>
        </div>
        <div className="ws-controls card">
          <label className="check-inline">
            <input type="checkbox" checked={presenting} onChange={(e) => setPresenting(e.target.checked)} /> {t(W.presenter)}
          </label>
          <h2 className="sub-title">{t(W.quickReset)}</h2>
          <button
            type="button"
            className="btn"
            data-testid="reset-labs"
            onClick={() => {
              elecStore.reset();
              motionStore.reset();
              heatStore.reset();
              chemStore.reset();
              setDone(true);
              setTimeout(() => setDone(false), 2500);
            }}
          >
            <Icon name="reset" /> {t(W.resetLabs)}
          </button>
          {done && (
            <p className="small" role="status">
              ✓ {t(W.resetLabsDone)}
            </p>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (window.confirm(t(W.confirmClear))) resetAllProgress();
            }}
          >
            <Icon name="trash" /> {t(W.clearData)}
          </button>
        </div>
      </section>

      <section>
        <div className="ws-section-head">
          <div>
            <h2 className="section-title">
              <Icon name="bolt" /> {t(W.sequence)}
            </h2>
            <p className="small muted">{t(W.sequenceLead)}</p>
          </div>
          <Timer seconds={total * 60} />
        </div>
        <div className="ws-grid">
          {ELECTRICITY_SEQUENCE.map((s, i) => (
            <StepCard key={s.id} step={s} index={i} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title" style={{ marginTop: 28 }}>
          {t(W.scenarios)}
        </h2>
        <div className="ws-grid">
          {SCENARIOS.map((s) => (
            <StepCard key={s.id} step={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
