/**
 * Builds a lab report from the learner's saved progress. Every number in the
 * report is either a recorded simulation value, a value computed from those
 * records (fits), or the learner's own answer — nothing is invented.
 */
import { checkAnswer } from '../components/QuestionCard';
import { LABS } from '../curriculum';
import type { ActivityDef, ColumnDef, SourceKind } from '../curriculum/types';
import { interpolate, l, type L, type Lang } from '../i18n/i18n';
import { fmt, linearFit, originSlope, parseNumber } from '../lib/format';
import { getActivity, type LabId, type ProgressState } from '../lib/progress';

export type CheckStatus = 'correct' | 'incorrect' | 'revealed' | 'unanswered' | 'needs-data' | 'written';

export interface ReportCheck {
  prompt: string;
  kind: 'numeric' | 'choice' | 'open';
  answer: string;
  expected?: string;
  status: CheckStatus;
  explanation: string;
}

export interface ReportFit {
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
  slopeUnit: string;
  slope: number;
  intercept: number;
  r2: number | null;
  throughOrigin: boolean;
  n: number;
}

export interface ReportActivity {
  id: string;
  title: string;
  ref: string;
  source: SourceKind;
  outcomes: string[];
  objective: string;
  question: string;
  hypothesis: string;
  columns: ColumnDef[];
  rows: { values: Record<string, number>; tag?: string }[];
  fit: ReportFit | null;
  checks: ReportCheck[];
  summary: string[];
  conclusion: string;
  completed: boolean;
  started: boolean;
}

export interface Report {
  lab: LabId;
  title: string;
  unit: string;
  generated: string;
  activities: ReportActivity[];
}

const R = {
  noRows: l('No readings were recorded for this activity.', 'لم تُسجَّل قراءات في هذا النشاط.'),
  rows: l('{n} readings were recorded from the simulation.', 'سُجّلت {n} قراءات من المحاكاة.'),
  fit: l(
    'The best-fit line of {y} against {x} has slope {m} {u}{b}.',
    'ميل خطّ أفضل مطابقة لـ {y} مقابل {x} يساوي {m} {u}{b}.',
  ),
  fitIntercept: l(' and intercept {b} {yu}', ' والمقطع {b} {yu}'),
  r2: l('The points fit the line closely (R² = {r}).', 'تقع النقاط قريبة جدًّا من الخطّ (R² = {r}).'),
  r2weak: l('The points scatter about the line (R² = {r}); check for readings taken in different set-ups.', 'تتشتّت النقاط حول الخطّ (R² = {r})؛ تحقّق من وجود قراءات أُخذت في إعدادات مختلفة.'),
  checks: l('Numeric and multiple-choice checks: {c} correct, {w} still incorrect, {r} answers revealed, {u} not attempted.', 'أسئلة التحقّق العدديّة والاختيار من متعدّد: {c} صحيحة، و{w} غير صحيحة بعد، و{r} كُشفت إجاباتها، و{u} لم تُحاوَل.'),
  reflections: l('{n} written reflection(s) saved.', 'حُفظت {n} إجابة كتابيّة.'),
  completed: l('Marked complete.', 'تمّ تحديد النشاط كمكتمل.'),
  notCompleted: l('Not yet marked complete.', 'لم يُحدَّد النشاط كمكتمل بعد.'),
  hypothesisMissing: l('No hypothesis written.', 'لم تُكتب فرضيّة.'),
  expectedFromData: l('computed from the simulation / your data', 'محسوبة من المحاكاة أو من بياناتك'),
};

function rSquared(points: { x: number; y: number }[], m: number, b: number) {
  if (points.length < 3) return null;
  const mean = points.reduce((s, p) => s + p.y, 0) / points.length;
  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    ssRes += (p.y - (m * p.x + b)) ** 2;
    ssTot += (p.y - mean) ** 2;
  }
  return ssTot > 0 ? 1 - ssRes / ssTot : null;
}

export function fitFor(activity: ActivityDef<unknown>, rows: { values: Record<string, number> }[], lang: Lang): ReportFit | null {
  const c = activity.chart;
  if (!c?.fit) return null;
  const pts = rows.map((r) => ({ x: r.values[c.x], y: r.values[c.y] })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (pts.length < 2) return null;
  const xc = activity.columns.find((k) => k.id === c.x)!;
  const yc = activity.columns.find((k) => k.id === c.y)!;
  let m: number;
  let b = 0;
  if (c.fit === 'origin') {
    const s = originSlope(pts);
    if (s === null) return null;
    m = s;
  } else {
    const f = linearFit(pts);
    if (!f) return null;
    m = f.m;
    b = f.b;
  }
  return { xLabel: xc.label[lang], yLabel: yc.label[lang], xUnit: xc.unit, yUnit: yc.unit, slopeUnit: c.slopeUnit ?? `${yc.unit}/${xc.unit}`, slope: m, intercept: b, r2: rSquared(pts, m, b), throughOrigin: c.fit === 'origin', n: pts.length };
}

export function buildReport(lab: LabId, progress: ProgressState, labState: unknown, lang: Lang, now = new Date()): Report {
  const { info, activities } = LABS[lab];
  const t = (s: L, v?: Record<string, string | number>) => interpolate(s[lang], v);
  return {
    lab,
    title: info.title[lang],
    unit: info.unit[lang],
    generated: now.toISOString(),
    activities: activities.map((a) => {
      const p = getActivity(progress, lab, a.id);
      const ctx = { records: p.records, state: labState };
      const checks: ReportCheck[] = a.questions.map((q) => {
        const ans = p.answers[q.id];
        if (q.kind === 'open') {
          const text = p.reflections[q.id]?.trim() ?? '';
          return { prompt: q.prompt[lang], kind: 'open', answer: text, status: text ? 'written' : 'unanswered', explanation: q.explanation[lang] };
        }
        let expected: string | undefined;
        if (q.kind === 'numeric') {
          const e = q.expected?.(ctx);
          expected = e === null || e === undefined ? undefined : `${fmt(e, 4)}${q.unit ? ` ${q.unit}` : ''}`;
        } else if (q.correctChoice !== undefined && q.choices) expected = q.choices[q.correctChoice][lang];
        const answerText =
          q.kind === 'choice' && ans?.value !== undefined && ans.value !== '' && q.choices?.[Number(ans.value)] ? q.choices[Number(ans.value)][lang] : (ans?.value ?? '');
        // Re-check against current data so the report never shows a stale verdict.
        const verdict = ans?.value ? checkAnswer(q as never, ans.value, ctx as never) : null;
        let status: CheckStatus;
        if (q.kind === 'numeric' && expected === undefined) status = 'needs-data';
        else if (verdict === true) status = 'correct';
        else if (ans?.revealed) status = 'revealed';
        else if (ans?.value) status = 'incorrect';
        else status = 'unanswered';
        if (q.kind === 'numeric' && answerText && parseNumber(answerText) === null) status = 'incorrect';
        // The expected answer is only shown once the learner has tried (or revealed) it.
        const shownExpected = status === 'correct' || status === 'revealed' ? expected : undefined;
        return { prompt: q.prompt[lang], kind: q.kind, answer: answerText, expected: shownExpected, status, explanation: q.explanation[lang] };
      });
      const rows = p.records.map((r) => ({ values: r.values, tag: r.tag }));
      const fit = fitFor(a, rows, lang);

      const summary: string[] = [];
      summary.push(rows.length ? t(R.rows, { n: rows.length }) : t(R.noRows));
      if (fit) {
        const u = fit.slopeUnit;
        summary.push(
          t(R.fit, {
            y: fit.yLabel,
            x: fit.xLabel,
            m: fmt(fit.slope, 4),
            u,
            b: fit.throughOrigin ? '' : t(R.fitIntercept, { b: fmt(fit.intercept, 3), yu: fit.yUnit }),
          }),
        );
        if (fit.r2 !== null) summary.push(t(fit.r2 > 0.98 ? R.r2 : R.r2weak, { r: fit.r2.toFixed(4) }));
      }
      const graded = checks.filter((c) => c.kind !== 'open');
      if (graded.length)
        summary.push(
          t(R.checks, {
            c: graded.filter((c) => c.status === 'correct').length,
            w: graded.filter((c) => c.status === 'incorrect').length,
            r: graded.filter((c) => c.status === 'revealed').length,
            u: graded.filter((c) => c.status === 'unanswered' || c.status === 'needs-data').length,
          }),
        );
      const refl = checks.filter((c) => c.kind === 'open' && c.answer).length;
      if (refl) summary.push(t(R.reflections, { n: refl }));
      summary.push(p.completed ? t(R.completed) : t(R.notCompleted));

      return {
        id: a.id,
        title: a.title[lang],
        ref: a.ref[lang],
        source: a.source,
        outcomes: a.outcomes,
        objective: a.objective[lang],
        question: a.question[lang],
        hypothesis: p.hypothesis,
        columns: a.columns,
        rows,
        fit,
        checks,
        summary,
        conclusion: a.conclusion[lang],
        completed: p.completed,
        started: p.updatedAt > 0,
      };
    }),
  };
}

/* ---------------------------------------------------------- exports --- */

const STATUS_TEXT: Record<CheckStatus, L> = {
  correct: l('✓ correct', '✓ صحيحة'),
  incorrect: l('✗ not yet correct', '✗ غير صحيحة بعد'),
  revealed: l('answer revealed', 'كُشفت الإجابة'),
  unanswered: l('not attempted', 'لم تُحاوَل'),
  'needs-data': l('needs recorded data', 'تحتاج إلى بيانات مسجّلة'),
  written: l('written answer saved', 'حُفظت الإجابة الكتابيّة'),
};
export const statusText = (s: CheckStatus, lang: Lang) => STATUS_TEXT[s][lang];

const H = {
  hypothesis: l('Hypothesis', 'الفرضيّة'),
  results: l('Results', 'النتائج'),
  checks: l('Checks', 'التحقّق'),
  summary: l('Summary', 'الملخّص'),
  conclusion: l('Textbook conclusion', 'استنتاج الكتاب'),
  answer: l('Your answer', 'إجابتك'),
  expected: l('Expected', 'المتوقّع'),
  question: l('Inquiry question', 'سؤال الاستقصاء'),
  objective: l('Objective', 'الهدف'),
  generated: l('Generated', 'أُنشئ في'),
  note: l('Values come from the Virtual Science Labs simulation. Progress is stored only on this device.', 'القيم مأخوذة من محاكاة مختبرات علمية افتراضية. يُحفظ التقدّم على هذا الجهاز فقط.'),
};
export const REPORT_HEADINGS = H;

const cell = (v: number | undefined, c: ColumnDef) => fmt(v, c.digits ?? 3);

export function toMarkdown(r: Report, lang: Lang, onlyStarted = true): string {
  const out: string[] = [`# ${r.title} — ${r.unit}`, '', `${H.generated[lang]}: ${new Date(r.generated).toLocaleString(lang === 'ar' ? 'ar' : 'en-GB')}`, ''];
  for (const a of r.activities.filter((x) => !onlyStarted || x.started)) {
    out.push(`## ${a.title}`, '', `_${a.ref}_ · ${a.outcomes.join(', ')}`, '');
    out.push(`**${H.objective[lang]}:** ${a.objective}`, '', `**${H.question[lang]}:** ${a.question}`, '');
    out.push(`### ${H.hypothesis[lang]}`, '', a.hypothesis.trim() || R.hypothesisMissing[lang], '');
    out.push(`### ${H.results[lang]}`, '');
    if (a.rows.length) {
      out.push(`| # | ${a.columns.map((c) => `${c.label[lang]} (${c.unit})`).join(' | ')} |`);
      out.push(`|---|${a.columns.map(() => '---:').join('|')}|`);
      a.rows.forEach((row, i) => out.push(`| ${i + 1} | ${a.columns.map((c) => cell(row.values[c.id], c)).join(' | ')} |`));
    } else out.push(R.noRows[lang]);
    out.push('', `### ${H.checks[lang]}`, '');
    a.checks.forEach((c, i) => {
      out.push(`${i + 1}. ${c.prompt}`);
      out.push(`   - ${H.answer[lang]}: ${c.answer || '—'}${c.expected ? ` · ${H.expected[lang]}: ${c.expected}` : ''} · ${statusText(c.status, lang)}`);
      if (c.status === 'correct' || c.status === 'revealed') out.push(`   - ${c.explanation}`);
    });
    out.push('', `### ${H.summary[lang]}`, '', a.summary.join(' '), '', `### ${H.conclusion[lang]}`, '', a.conclusion, '');
  }
  out.push('---', H.note[lang]);
  return out.join('\n');
}

const csvEscape = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function toCsv(r: Report, lang: Lang): string {
  const lines: string[] = [];
  for (const a of r.activities) {
    if (!a.rows.length) continue;
    lines.push(csvEscape(a.title));
    lines.push(['#', 'tag', ...a.columns.map((c) => `${c.label[lang]} (${c.unit})`)].map(csvEscape).join(','));
    a.rows.forEach((row, i) => lines.push([String(i + 1), row.tag ?? '', ...a.columns.map((c) => (Number.isFinite(row.values[c.id]) ? String(row.values[c.id]) : ''))].map(csvEscape).join(',')));
    lines.push('');
  }
  return lines.join('\n');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function toHtml(r: Report, lang: Lang, onlyStarted = true): string {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const parts: string[] = [];
  for (const a of r.activities.filter((x) => !onlyStarted || x.started)) {
    parts.push(`<section><h2>${esc(a.title)}</h2><p class="ref">${esc(a.ref)} · ${esc(a.outcomes.join(', '))}</p>`);
    parts.push(`<p><b>${H.objective[lang]}:</b> ${esc(a.objective)}</p><p><b>${H.question[lang]}:</b> ${esc(a.question)}</p>`);
    parts.push(`<h3>${H.hypothesis[lang]}</h3><p>${esc(a.hypothesis.trim() || R.hypothesisMissing[lang])}</p><h3>${H.results[lang]}</h3>`);
    if (a.rows.length) {
      parts.push(`<table><thead><tr><th>#</th>${a.columns.map((c) => `<th>${esc(c.label[lang])} (${esc(c.unit)})</th>`).join('')}</tr></thead><tbody>`);
      a.rows.forEach((row, i) => parts.push(`<tr><td>${i + 1}</td>${a.columns.map((c) => `<td class="n">${cell(row.values[c.id], c)}</td>`).join('')}</tr>`));
      parts.push('</tbody></table>');
    } else parts.push(`<p>${R.noRows[lang]}</p>`);
    parts.push(`<h3>${H.checks[lang]}</h3><ol>`);
    a.checks.forEach((c) =>
      parts.push(
        `<li>${esc(c.prompt)}<br><small>${H.answer[lang]}: ${esc(c.answer || '—')}${c.expected ? ` · ${H.expected[lang]}: ${esc(c.expected)}` : ''} · ${statusText(c.status, lang)}</small>${c.status === 'correct' || c.status === 'revealed' ? `<br><small>${esc(c.explanation)}</small>` : ''}</li>`,
      ),
    );
    parts.push(`</ol><h3>${H.summary[lang]}</h3><p>${esc(a.summary.join(' '))}</p><h3>${H.conclusion[lang]}</h3><p>${esc(a.conclusion)}</p></section>`);
  }
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>${esc(r.title)}</title>
<style>body{font-family:system-ui,'Segoe UI',Tahoma,sans-serif;max-width:860px;margin:32px auto;padding:0 16px;color:#14213d;line-height:1.55}h1{font-size:26px}h2{font-size:20px;border-top:1px solid #ddd;padding-top:18px}h3{font-size:15px;color:#8a1538}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #ddd;padding:5px 8px}td.n{direction:ltr;text-align:right;font-family:ui-monospace,monospace}.ref{color:#5b6478;font-size:13px}</style></head>
<body><h1>${esc(r.title)} — ${esc(r.unit)}</h1><p class="ref">${H.generated[lang]}: ${esc(new Date(r.generated).toLocaleString(lang === 'ar' ? 'ar' : 'en-GB'))}</p>${parts.join('\n')}<hr><p class="ref">${H.note[lang]}</p></body></html>`;
}
