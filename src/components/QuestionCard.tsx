import { useState } from 'react';
import type { CheckContext, CheckQuestion } from '../curriculum/types';
import { useI18n } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { fmt, isClose, parseNumber } from '../lib/format';
import { updateActivity, type AnswerState, type LabId } from '../lib/progress';
import { Icon } from './Icon';

const emptyAnswer: AnswerState = { value: '', correct: null, attempts: 0, hintsShown: 0, revealed: false };

export function checkAnswer<S>(q: CheckQuestion<S>, value: string, ctx: CheckContext<S>): boolean | null {
  if (q.kind === 'open') return null;
  if (q.kind === 'choice') return Number(value) === q.correctChoice;
  const expected = q.expected?.(ctx);
  if (expected === null || expected === undefined) return null;
  const n = parseNumber(value);
  if (n === null) return false;
  return isClose(n, expected, q.tolerance ?? 0.03);
}

export function QuestionCard<S>({
  q,
  index,
  lab,
  activityId,
  answer,
  reflection,
  ctx,
}: {
  q: CheckQuestion<S>;
  index: number;
  lab: LabId;
  activityId: string;
  answer?: AnswerState;
  reflection?: string;
  ctx: CheckContext<S>;
}) {
  const { t } = useI18n();
  const a = answer ?? emptyAnswer;
  const [draft, setDraft] = useState(a.value);
  const expected = q.kind === 'numeric' ? q.expected?.(ctx) : undefined;
  const blocked = q.kind === 'numeric' && (expected === null || expected === undefined);

  const save = (patch: Partial<AnswerState>) =>
    updateActivity(lab, activityId, (p) => ({ ...p, answers: { ...p.answers, [q.id]: { ...(p.answers[q.id] ?? emptyAnswer), ...patch } } }));

  const submit = (value: string) => {
    const correct = checkAnswer(q, value, ctx);
    save({ value, correct, attempts: a.attempts + 1 });
  };

  const showHint = () => save({ hintsShown: Math.min(q.hints.length, a.hintsShown + 1) });
  const canReveal = a.attempts > 0 || a.hintsShown > 0;
  const done = a.correct === true || a.revealed;

  return (
    <div className={`question ${a.correct === true ? 'is-correct' : a.correct === false ? 'is-wrong' : ''}`}>
      <div className="q-head">
        <span className="q-num">{index + 1}</span>
        <p className="q-prompt">{t(q.prompt)}</p>
      </div>

      {q.kind === 'numeric' && (
        <form
          className="q-answer"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <input
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t(q.prompt)}
            placeholder="0.0"
            disabled={blocked}
          />
          {q.unit && <span className="unit ltr">{q.unit}</span>}
          <button type="submit" className="btn btn-sm btn-navy" disabled={blocked || !draft.trim()}>
            {t(UI.check)}
          </button>
        </form>
      )}
      {blocked && q.needs && <p className="small muted">{t(q.needs)}</p>}

      {q.kind === 'choice' && q.choices && (
        <div className="q-choices" role="radiogroup" aria-label={t(q.prompt)}>
          {q.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={a.value === String(i)}
              className={`choice ${a.value === String(i) ? (a.correct ? 'right' : 'wrong') : ''} ${a.revealed && i === q.correctChoice ? 'right' : ''}`}
              onClick={() => {
                setDraft(String(i));
                submit(String(i));
              }}
            >
              {t(c)}
            </button>
          ))}
        </div>
      )}

      {q.kind === 'open' && (
        <textarea
          aria-label={t(UI.saveReflection)}
          placeholder={t(UI.saveReflection)}
          defaultValue={reflection ?? ''}
          onBlur={(e) => updateActivity(lab, activityId, (p) => ({ ...p, reflections: { ...p.reflections, [q.id]: e.target.value } }))}
        />
      )}

      <div className="q-feedback" aria-live="polite">
        {a.correct === true && (
          <p className="fb fb-ok">
            <Icon name="check" /> {t(UI.correct)}
          </p>
        )}
        {a.correct === false && !a.revealed && (
          <p className="fb fb-bad">
            <Icon name="x" /> {t(UI.incorrect)} — {q.wrongFeedback ? t(q.wrongFeedback) : t(UI.tryAgain)}
          </p>
        )}
        {q.hints.slice(0, a.hintsShown).map((h, i) => (
          <p key={i} className="fb fb-hint">
            <Icon name="lightbulb" /> {t(h)}
          </p>
        ))}
        {done && (
          <p className="fb fb-explain">
            {q.kind === 'numeric' && expected !== null && expected !== undefined && (
              <strong className="ltr" style={{ marginInlineEnd: 6 }}>
                {fmt(expected, 4)} {q.unit}
              </strong>
            )}
            {t(q.explanation)}
          </p>
        )}
      </div>

      {!done && (
        <div className="q-actions">
          {a.hintsShown < q.hints.length && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={showHint}>
              <Icon name="lightbulb" /> {a.hintsShown ? t(UI.nextHint) : t(UI.hint)}
            </button>
          )}
          {(q.kind !== 'open' ? canReveal && !blocked : true) && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => save({ revealed: true })}>
              {t(UI.reveal)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
