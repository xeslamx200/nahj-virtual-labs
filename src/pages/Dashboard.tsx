import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAssistantStatus, providerName } from '../assistant/AssistantPanel';
import { Icon } from '../components/Icon';
import { SourceBadge } from '../components/ui';
import { LABS, LAB_ORDER } from '../curriculum';
import { l, useI18n } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { labSummary, progressStore, resetAllProgress } from '../lib/progress';
import { useStore } from '../lib/store';

const D = {
  eyebrow: l('Interactive science laboratories', 'مختبرات علوم تفاعليّة'),
  title: l('Experiment, measure and explain — in the browser.', 'جرّب، وقِس، وفسّر — في المتصفّح.'),
  lead: l(
    'Four virtual labs built on the Grade 10 Science textbooks: physics from Semester 2 and chemistry from Semester 1. Every reading comes from a tested model, every activity follows the inquiry cycle: question, hypothesis, data, interpretation and conclusion.',
    'أربعة مختبرات افتراضيّة مبنيّة على كتابَي العلوم للصفّ العاشر: الفيزياء من الفصل الدراسي الثاني والكيمياء من الفصل الدراسي الأوّل. كلّ قراءة ناتجة عن نموذج مُختبَر، وكلّ نشاط يتبع دورة الاستقصاء: السؤال، والفرضيّة، والبيانات، والتفسير، والاستنتاج.',
  ),
  startWorkshop: l('Start workshop mode', 'ابدأ وضع ورشة العمل'),
  openFlagship: l('Open the Electricity Lab', 'افتح مختبر الكهرباء'),
  labs: l('Laboratories', 'المختبرات'),
  labsLead: l('Choose a lab to start a guided activity or explore freely.', 'اختر مختبرًا لتبدأ نشاطًا موجَّهًا أو تستكشف بحرّيّة.'),
  stats: [
    { value: String(LAB_ORDER.length), label: l('Virtual labs', 'مختبرات افتراضيّة') },
    { value: String(LAB_ORDER.reduce((n, id) => n + LABS[id].activities.length, 0)), label: l('Guided activities', 'نشاطًا موجَّهًا') },
    { value: 'AR · EN', label: l('Two languages', 'لغتان') },
  ],
  activities: l('{n} guided activities', '{n} أنشطة موجَّهة'),
  pages: l('Textbook pp. {p}', 'الكتاب ص {p}'),
  flagship: l('Flagship', 'المختبر الرئيس'),
  aiTitle: l('How the learning assistant supports learning', 'كيف يدعم المساعدُ التعليميّ التعلّمَ'),
  aiPoints: [
    l('It sees the live simulation values and your recorded table — never invented measurements.', 'يطّلع على قيم المحاكاة الحيّة وجدولك المسجّل، ولا يخترع قياسات أبدًا.'),
    l('Five focused requests: explain a concept, explain why a result happened, suggest a next step, give a practice question, interpret your data.', 'خمسة طلبات محدّدة: شرح مفهوم، وتفسير سبب نتيجة، واقتراح خطوة تالية، وسؤال تدريبي، وتفسير بياناتك.'),
    l('It is grounded in the textbook lessons for the open lab, and asks you to think before giving answers.', 'يستند إلى دروس الكتاب الخاصّة بالمختبر المفتوح، ويدعوك إلى التفكير قبل تقديم الإجابات.'),
  ],
  aiLive: l('Status: live AI ({name}) is configured on this server.', 'الحالة: الذكاء الاصطناعي المباشر ({name}) مُفعّل على هذا الخادم.'),
  aiOffline: l(
    'Status: no AI key is configured, so the assistant runs as an offline guided tutor with scripted, rule-based responses. It is labelled as such wherever it appears.',
    'الحالة: لم يُضبط مفتاح ذكاء اصطناعي، لذا يعمل المساعد معلّمًا موجِّهًا غير متّصل بردود مُعدّة مسبقًا وفق قواعد ثابتة، ويُوسَم بذلك أينما ظهر.',
  ),
  aiChecking: l('Checking assistant status…', 'جارٍ التحقّق من حالة المساعد…'),
  mapTitle: l('Curriculum alignment', 'المواءمة مع المنهج'),
  mapLead: l(
    'Each activity is tagged by where it comes from. Lesson, activity and page references point to the Grade 10 Science textbooks: Semester 2 for the physics labs and Semester 1 for the Chemistry Lab.',
    'وُسم كلّ نشاط بحسب مصدره. تشير مراجع الدروس والأنشطة والصفحات إلى كتابَي العلوم للصفّ العاشر: الفصل الدراسي الثاني لمختبرات الفيزياء، والفصل الدراسي الأوّل لمختبر الكيمياء.',
  ),
  colLab: l('Lab', 'المختبر'),
  colActivity: l('Activity', 'النشاط'),
  colRef: l('Textbook reference', 'المرجع في الكتاب'),
  colOutcomes: l('Outcomes', 'المخرجات'),
  colSource: l('Source', 'المصدر'),
  privacyTitle: l('Your progress', 'تقدّمك'),
  privacy: l(
    'Hypotheses, tables and answers are saved only in this browser on this device. There are no accounts and nothing is uploaded. Clearing browser data removes them.',
    'تُحفظ الفرضيّات والجداول والإجابات في هذا المتصفّح على هذا الجهاز فقط. لا توجد حسابات ولا يُرفع أيّ شيء. يؤدّي مسح بيانات المتصفّح إلى حذفها.',
  ),
  resetAll: l('Erase all saved progress', 'امسح كلّ التقدّم المحفوظ'),
  confirmReset: l('Erase all saved hypotheses, tables and answers on this device?', 'هل تريد مسح كلّ الفرضيّات والجداول والإجابات المحفوظة على هذا الجهاز؟'),
};

export default function Dashboard() {
  const { t } = useI18n();
  const progress = useStore(progressStore);
  const [ai, setAi] = useState<boolean | null>(null);
  const [aiName, setAiName] = useState('');
  useEffect(() => {
    fetchAssistantStatus().then((s) => {
      setAi(!!s?.available);
      setAiName(providerName(s));
    });
  }, []);

  return (
    <>
      <section className="hero-band">
        <div className="container hero">
          <div className="hero-copy">
            <p className="eyebrow">{t(D.eyebrow)}</p>
            <h1>{t(D.title)}</h1>
            <p className="lead">{t(D.lead)}</p>
            <div className="hero-actions">
              <Link to="/lab/electricity" className="btn btn-gold btn-lg">
                <Icon name="bolt" /> {t(D.openFlagship)}
              </Link>
              <Link to="/workshop" className="btn btn-outline-light btn-lg">
                <Icon name="present" /> {t(D.startWorkshop)}
              </Link>
            </div>
            <dl className="hero-stats">
              {D.stats.map((st, i) => (
                <div key={i}>
                  <dt>{t(st.label)}</dt>
                  <dd>{st.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hero-visual">
            <HeroFigure />
          </div>
        </div>
      </section>

    <div className="container dashboard">
      <div className="section-head">
        <h2 className="section-title">{t(D.labs)}</h2>
        <p className="muted">{t(D.labsLead)}</p>
      </div>
      <div className="lab-cards">
        {LAB_ORDER.map((id) => {
          const { info, activities, path, icon } = LABS[id];
          const sum = labSummary(progress, id, activities.map((a) => a.id));
          const pct = Math.round((sum.completed / sum.total) * 100);
          return (
            <article key={id} className={`card lab-card accent-${info.accent}`} data-testid={`lab-card-${id}`}>
              <div className="lab-card-top">
                <span className="lab-icon">
                  <Icon name={icon} />
                </span>
                {id === 'electricity' && <span className="chip chip-gold">{t(D.flagship)}</span>}
              </div>
              <p className="small muted">{t(info.book)}</p>
              <h3>{t(info.title)}</h3>
              <p className="small lab-card-unit">{t(info.unit)}</p>
              <p>{t(info.short)}</p>
              <ul className="lab-card-lessons small">
                {info.lessons.map((ls, i) => (
                  <li key={i}>{t(ls)}</li>
                ))}
              </ul>
              <div className="lab-card-meta small muted">
                <span>{t(D.activities, { n: activities.length })}</span>
                <span>·</span>
                <span className="ltr">{t(D.pages, { p: info.pages })}</span>
              </div>
              <div className="progress-row">
                <div className="progress-bar" role="progressbar" aria-valuenow={sum.completed} aria-valuemin={0} aria-valuemax={sum.total} aria-label={t(UI.progress, { done: sum.completed, total: sum.total })}>
                  <span style={{ width: `${pct}%` }} />
                </div>
                <span className="small muted">{t(UI.progress, { done: sum.completed, total: sum.total })}</span>
              </div>
              <div className="lab-card-actions">
                <Link to={path} className="btn btn-primary">
                  {t(UI.launch)} <Icon name="arrow" className="flip-rtl" />
                </Link>
                <Link to={`/report/${id}`} className="btn btn-ghost">
                  <Icon name="print" /> {t(UI.report)}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dash-grid">
        <section className="card">
          <h2 className="card-title">
            <Icon name="sparkle" /> {t(D.aiTitle)}
          </h2>
          <ul className="guide-list">
            {D.aiPoints.map((p, i) => (
              <li key={i}>{t(p)}</li>
            ))}
          </ul>
          <p className={`small ai-status ${ai ? 'live' : ''}`} data-testid="dashboard-ai-status">
            {ai === null ? t(D.aiChecking) : ai ? t(D.aiLive, { name: aiName }) : t(D.aiOffline)}
          </p>
        </section>
        <section className="card">
          <h2 className="card-title">
            <Icon name="layers" /> {t(D.privacyTitle)}
          </h2>
          <p>{t(D.privacy)}</p>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              if (window.confirm(t(D.confirmReset))) resetAllProgress();
            }}
          >
            <Icon name="trash" /> {t(D.resetAll)}
          </button>
        </section>
      </div>

      <section className="card curriculum-map">
        <h2 className="card-title">
          <Icon name="book" /> {t(D.mapTitle)}
        </h2>
        <p className="small muted">{t(D.mapLead)}</p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t(D.colLab)}</th>
                <th scope="col">{t(D.colActivity)}</th>
                <th scope="col">{t(D.colRef)}</th>
                <th scope="col">{t(D.colOutcomes)}</th>
                <th scope="col">{t(D.colSource)}</th>
              </tr>
            </thead>
            <tbody>
              {LAB_ORDER.flatMap((id) =>
                LABS[id].activities.map((a) => (
                  <tr key={`${id}-${a.id}`}>
                    <td>{t(LABS[id].info.title)}</td>
                    <td>
                      <Link to={`${LABS[id].path}?activity=${a.id}&mode=guided`}>{t(a.title)}</Link>
                    </td>
                    <td className="small">{t(a.ref)}</td>
                    <td className="small" dir="ltr">{a.outcomes.join(', ')}</td>
                    <td>
                      <SourceBadge source={a.source} />
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </>
  );
}

/** Decorative schematic: a cell, a bulb and a v–t line, drawn with the app's palette. */
function HeroFigure() {
  return (
    <svg className="hero-figure" viewBox="0 0 320 220" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="320" height="220" rx="18" className="hf-bg" />
      <g className="hf-grid">
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`v${i}`} x1={40 + i * 40} y1={20} x2={40 + i * 40} y2={200} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`h${i}`} x1={20} y1={40 + i * 40} x2={300} y2={40 + i * 40} />
        ))}
      </g>
      <path d="M60 60 H260 V160 H60 Z" className="hf-wire" />
      <path d="M60 60 H260 V160 H60 Z" className="hf-flow" />
      <rect x="52" y="98" width="16" height="24" className="hf-gap" />
      <line x1="54" y1="102" x2="66" y2="102" className="hf-neg" />
      <line x1="48" y1="116" x2="72" y2="116" className="hf-pos" />
      <circle cx="160" cy="60" r="26" className="hf-glow" />
      <circle cx="160" cy="60" r="15" className="hf-bulb" />
      <path d="M149 49 L171 71 M149 71 L171 49" className="hf-filament" />
      <rect x="238" y="96" width="44" height="28" rx="4" className="hf-res" transform="rotate(90 260 110)" />
      <circle cx="160" cy="160" r="15" className="hf-meter" />
      <text x="160" y="165" textAnchor="middle" className="hf-letter">
        A
      </text>
    </svg>
  );
}
