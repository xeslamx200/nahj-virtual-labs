import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { LineChart, SERIES_COLORS, type ChartSeries } from '../components/LineChart';
import { SourceBadge } from '../components/ui';
import { LABS } from '../curriculum';
import { l, useI18n } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { fmt } from '../lib/format';
import { progressStore, updateActivity, type LabId } from '../lib/progress';
import { useStore } from '../lib/store';
import { elecStore } from '../labs/electricity/store';
import { heatStore } from '../labs/heat/store';
import { motionStore } from '../labs/motion/store';
import { buildReport, REPORT_HEADINGS as H, statusText, toCsv, toHtml, toMarkdown, type ReportActivity } from './reportModel';

const P = {
  title: l('Lab report', 'تقرير المختبر'),
  print: l('Print / save as PDF', 'طباعة / حفظ PDF'),
  md: l('Download Markdown', 'تنزيل Markdown'),
  csv: l('Download data (CSV)', 'تنزيل البيانات (CSV)'),
  html: l('Download HTML', 'تنزيل HTML'),
  showAll: l('Include activities not started', 'تضمين الأنشطة التي لم تبدأ'),
  empty: l('No activity in this lab has been started yet. Open the lab, record readings and answer the questions — they will appear here.', 'لم يبدأ أيّ نشاط في هذا المختبر بعد. افتح المختبر وسجّل القراءات وأجب عن الأسئلة لتظهر هنا.'),
  open: l('Open the lab', 'افتح المختبر'),
  hypothesisPlaceholder: l('Write your hypothesis…', 'اكتب فرضيّتك…'),
  savedLocal: l('Saved on this device', 'محفوظ على هذا الجهاز'),
  fitLine: l('Best-fit line', 'خطّ أفضل مطابقة'),
  data: l('Recorded data', 'البيانات المسجّلة'),
};

function labState(lab: LabId): unknown {
  if (lab === 'electricity') {
    const s = elecStore.get();
    return { circuit: s.circuit, result: s.result };
  }
  if (lab === 'motion') {
    const s = motionStore.get();
    return { config: s.config, t: s.t };
  }
  const s = heatStore.get();
  return { mass: s.mass, power: s.power };
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ActivitySection({ lab, a, chart }: { lab: LabId; a: ReportActivity; chart?: { x: string; y: string } }) {
  const { t, lang } = useI18n();
  const series: ChartSeries[] = [];
  if (chart && a.rows.length) {
    series.push({ id: 'd', label: t(P.data), kind: 'points', color: SERIES_COLORS[0], points: a.rows.map((r) => ({ x: r.values[chart.x], y: r.values[chart.y] })) });
    if (a.fit) {
      const xs = a.rows.map((r) => r.values[chart.x]).filter(Number.isFinite);
      const lo = Math.min(0, ...xs);
      const hi = Math.max(...xs);
      series.push({
        id: 'f',
        label: t(P.fitLine),
        kind: 'line',
        dashed: true,
        color: '#5b6478',
        points: [
          { x: lo, y: a.fit.slope * lo + a.fit.intercept },
          { x: hi, y: a.fit.slope * hi + a.fit.intercept },
        ],
      });
    }
  }
  const xc = chart ? a.columns.find((c) => c.id === chart.x) : undefined;
  const yc = chart ? a.columns.find((c) => c.id === chart.y) : undefined;
  return (
    <article className="report-activity card" data-testid={`report-${a.id}`}>
      <header>
        <div className="guide-chips">
          <SourceBadge source={a.source} />
          {a.completed && <span className="chip chip-green">✓ {t(UI.completed)}</span>}
        </div>
        <h2>{a.title}</h2>
        <p className="small muted">
          {a.ref} · <span dir="ltr">{a.outcomes.join(', ')}</span>
        </p>
      </header>
      <p>
        <strong>{H.objective[lang]}:</strong> {a.objective}
      </p>
      <p>
        <strong>{H.question[lang]}:</strong> {a.question}
      </p>

      <h3>{H.hypothesis[lang]}</h3>
      <textarea
        className="no-print"
        defaultValue={a.hypothesis}
        key={`${a.id}-${lang}`}
        placeholder={t(P.hypothesisPlaceholder)}
        aria-label={H.hypothesis[lang]}
        onBlur={(e) => updateActivity(lab, a.id, (p) => ({ ...p, hypothesis: e.target.value }))}
      />
      <p className="print-only">{a.hypothesis || '—'}</p>

      <h3>{H.results[lang]}</h3>
      {a.rows.length ? (
        <div className="report-results">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col" className="num">
                    #
                  </th>
                  {a.columns.map((c) => (
                    <th key={c.id} scope="col" className="num">
                      {t(c.label)} <span className="muted">({c.unit})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="num">{i + 1}</td>
                    {a.columns.map((c) => (
                      <td key={c.id} className="num">
                        {fmt(r.values[c.id], c.digits ?? 3)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {chart && xc && yc && (
            <LineChart title={`${t(yc.label)} – ${t(xc.label)}`} series={series} xLabel={t(xc.label)} yLabel={t(yc.label)} xUnit={xc.unit} yUnit={yc.unit} height={220} />
          )}
        </div>
      ) : (
        <p className="empty-state">{t(UI.noRecords)}</p>
      )}

      <h3>{H.checks[lang]}</h3>
      <ol className="report-checks">
        {a.checks.map((c, i) => (
          <li key={i} className={`rc-${c.status}`}>
            <p>{c.prompt}</p>
            <p className="small">
              {H.answer[lang]}: <strong>{c.answer || '—'}</strong>
              {c.expected && (
                <>
                  {' '}
                  · {H.expected[lang]}: <strong dir="ltr">{c.expected}</strong>
                </>
              )}{' '}
              · <span className="rc-status">{statusText(c.status, lang)}</span>
            </p>
            {(c.status === 'correct' || c.status === 'revealed' || c.status === 'written') && <p className="small muted">{c.explanation}</p>}
          </li>
        ))}
      </ol>

      <h3>{H.summary[lang]}</h3>
      <p className="report-summary" data-testid="report-summary">
        {a.summary.join(' ')}
      </p>
      <h3>{H.conclusion[lang]}</h3>
      <p>{a.conclusion}</p>
    </article>
  );
}

export default function ReportPage() {
  const { lab } = useParams();
  const { t, lang } = useI18n();
  const progress = useStore(progressStore);
  const [showAll, setShowAll] = useState(false);
  const valid = lab === 'electricity' || lab === 'motion' || lab === 'heat' || lab === 'chemistry';
  const report = useMemo(() => (valid ? buildReport(lab as LabId, progress, labState(lab as LabId), lang) : null), [valid, lab, progress, lang]);
  if (!valid || !report) return <Navigate to="/" replace />;
  const id = lab as LabId;
  const shown = report.activities.filter((a) => showAll || a.started);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="container report-page">
      <div className="report-head">
        <div>
          <Link to={LABS[id].path} className="small muted back-link no-print">
            <Icon name="chevron" className="back-chevron" /> {t(LABS[id].info.title)}
          </Link>
          <h1>
            {t(P.title)}: {report.title}
          </h1>
          <p className="small muted">
            {report.unit} · {H.generated[lang]} {new Date(report.generated).toLocaleString(lang === 'ar' ? 'ar' : 'en-GB')}
          </p>
        </div>
        <div className="report-actions no-print">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            <Icon name="print" /> {t(P.print)}
          </button>
          <button type="button" className="btn" onClick={() => download(`${id}-report-${stamp}.md`, toMarkdown(report, lang, !showAll), 'text/markdown;charset=utf-8')}>
            <Icon name="download" /> {t(P.md)}
          </button>
          <button type="button" className="btn" onClick={() => download(`${id}-report-${stamp}.html`, toHtml(report, lang, !showAll), 'text/html;charset=utf-8')}>
            <Icon name="download" /> {t(P.html)}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!report.activities.some((a) => a.rows.length)}
            onClick={() => download(`${id}-data-${stamp}.csv`, '﻿' + toCsv(report, lang), 'text/csv;charset=utf-8')}
          >
            <Icon name="download" /> {t(P.csv)}
          </button>
          <label className="check-inline">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> {t(P.showAll)}
          </label>
        </div>
      </div>
      <p className="small muted">{H.note[lang]}</p>
      {shown.length === 0 ? (
        <div className="card report-empty">
          <p>{t(P.empty)}</p>
          <Link to={LABS[id].path} className="btn btn-primary" style={{ marginTop: 12 }}>
            {t(P.open)}
          </Link>
        </div>
      ) : (
        shown.map((a) => <ActivitySection key={a.id} lab={id} a={a} chart={LABS[id].activities.find((x) => x.id === a.id)?.chart} />)
      )}
    </div>
  );
}
