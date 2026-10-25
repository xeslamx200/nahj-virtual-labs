import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AssistantSnapshot } from '../../assistant/types';
import { ActivityGuide } from '../../components/ActivityGuide';
import { Icon } from '../../components/Icon';
import { LabShell } from '../../components/LabShell';
import { LineChart, SERIES_COLORS } from '../../components/LineChart';
import { RecordsPanel } from '../../components/RecordsPanel';
import { Readout, Segmented, SliderField } from '../../components/ui';
import { MOTION_ACTIVITIES, MOTION_LAB, MOTION_PRESETS } from '../../curriculum/motion';
import { l, useI18n, type L } from '../../i18n/i18n';
import { UI } from '../../i18n/ui';
import { fmt } from '../../lib/format';
import { addRecord, getActivity, progressStore, type RecordRow } from '../../lib/progress';
import { MOTION_LIMITS, motionAt, positionRange, sampleMotion, totalDuration, type MotionState } from '../../physics/motion/model';
import { currentMotion, motionActions, motionStore, useMotion, type MotionUiState } from './store';

const M = {
  presets: l('Prepared motions', 'حركات جاهزة'),
  presetNames: {
    uniform: l('Uniform: 5 m/s for 10 s', 'منتظمة: 5 m/s لمدّة 10 s'),
    accelerated: l('Accelerated: Example 25', 'متسارعة: المثال 25'),
    robot: l('Robot: Example 24', 'الروبوت: المثال 24'),
    turnaround: l('Slows down and turns back', 'تتباطأ ثمّ تعود'),
    reverse: l('Robot changes direction: Example 16', 'الروبوت يغيّر اتّجاهه: المثال 16'),
    custom: l('My own set-up', 'إعداد خاصّ'),
  } as Record<string, L>,
  setupTitle: l('Set-up', 'الإعداد'),
  x0: l('Start position x₀', 'الموقع الابتدائي x₀'),
  v0: l('Start velocity v₀', 'السرعة المتّجهة الابتدائيّة v₀'),
  stage: l('Stage {n}', 'المرحلة {n}'),
  duration: l('Duration', 'المدّة'),
  accel: l('Acceleration a', 'التسارع a'),
  newV: l('Set velocity at start of stage', 'تحديد سرعة متّجهة جديدة عند بداية المرحلة'),
  newVValue: l('Velocity at stage start', 'السرعة المتّجهة عند بداية المرحلة'),
  addStage: l('Add stage', 'أضف مرحلة'),
  removeStage: l('Remove stage', 'احذف المرحلة'),
  totalTime: l('Run time {T} s (max {max} s)', 'زمن الحركة {T} s (الحدّ الأقصى {max} s)'),
  position: l('Position x', 'الموقع x'),
  velocity: l('Velocity v (vector)', 'السرعة المتّجهة v (متّجهة)'),
  speed: l('Speed |v| (scalar)', 'السرعة |v| (قياسيّة)'),
  accelR: l('Acceleration a', 'التسارع a'),
  distance: l('Distance travelled', 'المسافة المقطوعة'),
  displacement: l('Displacement Δx', 'الإزاحة Δx'),
  xt: l('Position – time (x–t)', 'الموقع – الزمن'),
  vt: l('Velocity – time (v–t)', 'السرعة المتّجهة – الزمن'),
  trackLabel: l('Track: the cart is at x = {x} m, moving {dir} at {s} m/s.', 'المسار: العربة عند x = {x} m، تتحرّك {dir} بسرعة {s} m/s.'),
  right: l('to the right (+)', 'نحو اليمين (+)'),
  left: l('to the left (−)', 'نحو اليسار (−)'),
  still: l('— at rest', '— ساكنة'),
  markers: l('Dots: position at each whole second', 'النقاط: موقع العربة عند كلّ ثانية كاملة'),
  vArrow: l('velocity', 'السرعة المتّجهة'),
  aArrow: l('acceleration', 'التسارع'),
  step: l('+1 s', '+1 s'),
  scrub: l('Time', 'الزمن'),
  rate: l('Playback', 'سرعة العرض'),
  needStopped: l('Pause the motion to record a reading.', 'أوقف الحركة مؤقّتًا لتسجيل قراءة.'),
  speedVsVelocity: l(
    'Speed is the size of the velocity: it is never negative. The sign of the velocity shows the direction (right = +, left = −).',
    'السرعة هي مقدار السرعة المتّجهة ولا تكون سالبة أبدًا. أمّا إشارة السرعة المتّجهة فتبيّن الاتّجاه (اليمين +، اليسار −).',
  ),
};

/* ------------------------------------------------------------- track --- */

function Track({ s, state }: { s: MotionUiState; state: MotionState }) {
  const { t } = useI18n();
  const W = 900;
  const H = 170;
  const pad = 46;
  const [lo0, hi0] = useMemo(() => positionRange(s.config), [s.config]);
  // Always include the origin and leave a margin so the cart never touches the ends.
  const lo = Math.min(0, lo0);
  const hi = Math.max(0, hi0, lo + 1);
  const span = hi - lo;
  const step = span > 200 ? 50 : span > 80 ? 20 : span > 30 ? 10 : span > 12 ? 5 : span > 5 ? 2 : 1;
  const xLo = Math.floor(lo / step) * step - step;
  const xHi = Math.ceil(hi / step) * step + step;
  const sx = (x: number) => pad + ((x - xLo) / (xHi - xLo)) * (W - 2 * pad);
  const T = totalDuration(s.config);
  const seconds = Array.from({ length: Math.floor(T + 1e-9) + 1 }, (_, k) => k).filter((k) => k <= s.t + 1e-9);
  const ticks: number[] = [];
  for (let x = xLo; x <= xHi + 1e-9; x += step) ticks.push(x);
  const cx = sx(state.x);
  const vMax = Math.max(1, ...sampleMotion(s.config, 0.25).map((m) => Math.abs(m.v)));
  const vLen = (state.v / vMax) * 110;
  const aLen = (state.a / MOTION_LIMITS.a.max) * 80;
  const dir = Math.abs(state.v) < 1e-9 ? t(M.still) : state.v > 0 ? t(M.right) : t(M.left);

  return (
    <figure className="track" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(M.trackLabel, { x: fmt(state.x, 3), dir, s: fmt(state.speed, 3) })}>
        <defs>
          <marker id="arr-v" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={SERIES_COLORS[0]} />
          </marker>
          <marker id="arr-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={SERIES_COLORS[1]} />
          </marker>
        </defs>
        <rect x={0} y={0} width={W} height={H} rx={10} className="tr-bg" />
        <line x1={pad - 20} x2={W - pad + 20} y1={112} y2={112} className="tr-rail" />
        {ticks.map((x) => (
          <g key={x}>
            <line x1={sx(x)} x2={sx(x)} y1={112} y2={x === 0 ? 126 : 120} className={x === 0 ? 'tr-origin' : 'tr-tick'} />
            <text x={sx(x)} y={142} textAnchor="middle" className={x === 0 ? 'tr-label tr-label-origin' : 'tr-label'}>
              {fmt(x, 4)}
            </text>
          </g>
        ))}
        <text x={W - pad + 22} y={100} textAnchor="end" className="tr-unit">
          x (m)
        </text>
        {seconds.map((k) => {
          const m = motionAt(s.config, k);
          return (
            <g key={k}>
              <circle cx={sx(m.x)} cy={112} r={4} className="tr-marker" />
              {k > 0 && k % (T > 20 ? 5 : T > 10 ? 2 : 1) === 0 && (
                <text x={sx(m.x)} y={160} textAnchor="middle" className="tr-sec">
                  {k}s
                </text>
              )}
            </g>
          );
        })}
        {/* cart */}
        <g transform={`translate(${cx} 0)`}>
          <rect x={-24} y={78} width={48} height={24} rx={6} className="tr-cart" />
          <circle cx={-13} cy={104} r={6} className="tr-wheel" />
          <circle cx={13} cy={104} r={6} className="tr-wheel" />
          <line x1={0} x2={0} y1={74} y2={112} className="tr-pointer" />
        </g>
        {Math.abs(vLen) > 2 && (
          <g>
            <line x1={cx} x2={cx + vLen} y1={50} y2={50} stroke={SERIES_COLORS[0]} strokeWidth={4} markerEnd="url(#arr-v)" />
            <text x={cx + vLen + (vLen > 0 ? 8 : -8)} y={54} textAnchor={vLen > 0 ? 'start' : 'end'} className="tr-vec" fill={SERIES_COLORS[0]}>
              v = {fmt(state.v, 3)} m/s
            </text>
          </g>
        )}
        {Math.abs(aLen) > 1 && (
          <g>
            <line x1={cx} x2={cx + aLen} y1={24} y2={24} stroke={SERIES_COLORS[1]} strokeWidth={3} markerEnd="url(#arr-a)" />
            <text x={cx + aLen + (aLen > 0 ? 8 : -8)} y={28} textAnchor={aLen > 0 ? 'start' : 'end'} className="tr-vec" fill={SERIES_COLORS[1]}>
              a = {fmt(state.a, 3)} m/s²
            </text>
          </g>
        )}
      </svg>
      <figcaption className="small muted">{t(M.markers)}</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------ records --- */

export function recordValues(activityId: string, st: MotionState): Record<string, number> {
  switch (activityId) {
    case 'uniform':
      return { t: st.t, x: st.x, v: st.v, speed: st.speed };
    case 'accelerated':
      return { t: st.t, x: st.x, v: st.v, a: st.a };
    case 'robot-area':
      return { t: st.t, v: st.v, x: st.x, d: st.distance };
    default:
      return { t: st.t, v: st.v, speed: st.speed, dx: st.displacement, d: st.distance };
  }
}

function motionSnapshot(s: MotionUiState, records: RecordRow[]): AssistantSnapshot {
  const st = currentMotion(s);
  const activity = MOTION_ACTIVITIES.find((a) => a.id === s.activityId);
  const stages = s.config.stages
    .map((g, i) => `stage ${i + 1}: ${g.duration} s at a = ${g.a} m/s²${g.v !== undefined ? `, starting with v = ${g.v} m/s` : ''}`)
    .join('; ');
  return {
    lab: 'motion',
    activity: activity as AssistantSnapshot['activity'],
    facts: { t: st.t, x: st.x, v: st.v, a: st.a, distance: st.distance, displacement: st.displacement },
    stateText: [
      `Set-up: x0 = ${s.config.x0} m, v0 = ${s.config.v0} m/s; ${stages}. Total run ${totalDuration(s.config)} s.`,
      `Now t = ${fmt(st.t, 4)} s: x = ${fmt(st.x, 4)} m, v = ${fmt(st.v, 4)} m/s, speed = ${fmt(st.speed, 4)} m/s, a = ${fmt(st.a, 4)} m/s², distance = ${fmt(st.distance, 4)} m, displacement = ${fmt(st.displacement, 4)} m.`,
    ].join('\n'),
    records,
    columns: activity?.columns,
  };
}

/* ---------------------------------------------------------------- page --- */

export default function MotionLab() {
  const { t } = useI18n();
  const s = useMotion();
  const [params] = useSearchParams();
  const st = currentMotion(s);
  const T = totalDuration(s.config);

  useEffect(() => {
    const act = MOTION_ACTIVITIES.find((a) => a.id === params.get('activity'));
    const mode = params.get('mode');
    if (act) {
      motionActions.setActivity(act.id);
      motionActions.loadPreset(act.preset);
    }
    if (mode === 'guided' || mode === 'free') motionActions.setMode(mode);
  }, [params]);

  // Animation loop: real time × playback rate, stopped automatically at the end of the run.
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!s.playing) return;
    let last = performance.now();
    const loop = (now: number) => {
      motionActions.tick(Math.min(0.1, (now - last) / 1000));
      last = now;
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [s.playing]);

  // Pause when leaving the page.
  useEffect(() => () => motionActions.pause(), []);

  const samples = useMemo(() => sampleMotion(s.config, Math.max(0.05, T / 400)), [s.config, T]);
  const shown = samples.filter((m) => m.t <= s.t + 1e-9).concat(s.t > 0 ? [st] : []);
  const xRange = useMemo(() => {
    const xs = samples.map((m) => m.x);
    return [Math.min(0, ...xs), Math.max(0, ...xs)] as [number, number];
  }, [samples]);
  const vRange = useMemo(() => {
    const vs = samples.map((m) => m.v);
    return [Math.min(0, ...vs), Math.max(0, ...vs)] as [number, number];
  }, [samples]);
  const pad = (r: [number, number]): [number, number] => {
    const d = r[1] - r[0] || 1;
    return [r[0] === 0 ? 0 : r[0] - d * 0.08, r[1] === 0 ? 0 : r[1] + d * 0.08];
  };

  const activity = MOTION_ACTIVITIES.find((a) => a.id === s.activityId) ?? MOTION_ACTIVITIES[0];
  const otherStagesTime = (i: number) => T - s.config.stages[i].duration;

  return (
    <LabShell
      lab={MOTION_LAB}
      activities={MOTION_ACTIVITIES}
      activityId={activity.id}
      onActivity={(id) => {
        const next = MOTION_ACTIVITIES.find((a) => a.id === id);
        if (!next) return;
        motionActions.setActivity(id);
        motionActions.loadPreset(next.preset);
      }}
      mode={s.mode}
      onMode={motionActions.setMode}
      onReset={() => (s.mode === 'guided' ? motionActions.loadPreset(activity.preset) : motionActions.rewind())}
      snapshot={() => motionSnapshot(motionStore.get(), getActivity(progressStore.get(), 'motion', activity.id).records)}
      guide={<ActivityGuide activity={activity} state={{ config: s.config, t: s.t }} onSetup={() => motionActions.loadPreset(activity.preset)} />}
    >
      <div className="panel motion-stage">
        <Track s={s} state={st} />
        <div className="transport" role="group" aria-label={t(UI.time)}>
          {s.playing ? (
            <button type="button" className="btn btn-navy" onClick={motionActions.pause} data-testid="pause">
              <Icon name="pause" /> {t(UI.pause)}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={motionActions.play} data-testid="play">
              <Icon name="play" /> {t(UI.play)}
            </button>
          )}
          <button type="button" className="btn" onClick={() => motionActions.step(1)} disabled={st.t >= T - 1e-9} data-testid="step">
            <Icon name="step" /> {t(M.step)}
          </button>
          <button type="button" className="btn" onClick={motionActions.rewind} data-testid="rewind">
            <Icon name="reset" /> t = 0
          </button>
          <label className="scrub">
            <span className="small muted">{t(M.scrub)}</span>
            <input
              type="range"
              min={0}
              max={T}
              step={0.1}
              value={s.t}
              onChange={(e) => motionActions.seek(e.target.valueAsNumber)}
              aria-valuetext={`${fmt(s.t, 3)} s`}
            />
            <span className="mono time-label" data-testid="time">
              {s.t.toFixed(1)} / {T.toFixed(1)} s
            </span>
          </label>
          <Segmented
            label={t(M.rate)}
            value={String(s.rate)}
            onChange={(v) => motionActions.setRate(Number(v))}
            options={['0.5', '1', '2', '4'].map((v) => ({ value: v, label: `×${v}` }))}
          />
        </div>
        <div className="readouts motion-readouts" data-testid="motion-readouts">
          <Readout label={t(UI.time)} value={fmt(st.t, 3)} unit="s" />
          <Readout label={t(M.position)} value={fmt(st.x, 4)} unit="m" />
          <Readout label={t(M.velocity)} value={fmt(st.v, 3)} unit="m/s" accent="primary" />
          <Readout label={t(M.speed)} value={fmt(st.speed, 3)} unit="m/s" />
          <Readout label={t(M.accelR)} value={fmt(st.a, 3)} unit="m/s²" accent="purple" />
          <Readout label={t(M.displacement)} value={fmt(st.displacement, 4)} unit="m" />
          <Readout label={t(M.distance)} value={fmt(st.distance, 4)} unit="m" accent="amber" />
        </div>
        <p className="small muted">{t(M.speedVsVelocity)}</p>
      </div>

      <div className="motion-charts">
        <div className="panel">
          <div className="panel-title">
            <span>{t(M.xt)}</span>
          </div>
          <LineChart
            title={t(M.xt)}
            series={[{ id: 'x', label: 'x', kind: 'line', color: SERIES_COLORS[0], points: shown.map((m) => ({ x: m.t, y: m.x })) }]}
            xLabel="t"
            yLabel="x"
            xUnit="s"
            yUnit="m"
            xDomain={[0, T]}
            yDomain={pad(xRange)}
            cursorX={s.t}
            height={230}
          />
        </div>
        <div className="panel">
          <div className="panel-title">
            <span>{t(M.vt)}</span>
          </div>
          <LineChart
            title={t(M.vt)}
            series={[{ id: 'v', label: 'v', kind: 'line', color: SERIES_COLORS[1], points: shown.map((m) => ({ x: m.t, y: m.v })) }]}
            xLabel="t"
            yLabel="v"
            xUnit="s"
            yUnit="m/s"
            xDomain={[0, T]}
            yDomain={pad(vRange)}
            cursorX={s.t}
            height={230}
          />
        </div>
      </div>

      <details className="panel motion-setup" open={s.mode === 'free'}>
        <summary className="panel-title">
          <span>{t(M.setupTitle)}</span>
          <span className="small muted">{t(M.totalTime, { T: fmt(T, 3), max: MOTION_LIMITS.totalDuration })}</span>
        </summary>
        <label className="inline-select" style={{ marginBottom: 12 }}>
          <span className="small muted">{t(M.presets)}</span>
          <select value={s.presetId} onChange={(e) => motionActions.loadPreset(e.target.value)} data-testid="motion-preset">
            {Object.keys(MOTION_PRESETS).map((id) => (
              <option key={id} value={id}>
                {t(M.presetNames[id])}
              </option>
            ))}
            {s.presetId === 'custom' && <option value="custom">{t(M.presetNames.custom)}</option>}
          </select>
        </label>
        <div className="setup-grid">
          <SliderField label={t(M.x0)} value={s.config.x0} {...MOTION_LIMITS.x0} unit="m" onChange={(v) => motionActions.setStart({ x0: v })} />
          <SliderField label={t(M.v0)} value={s.config.v0} {...MOTION_LIMITS.v0} unit="m/s" onChange={(v) => motionActions.setStart({ v0: v })} />
        </div>
        {s.config.stages.map((g, i) => (
          <fieldset key={i} className="stage-box">
            <legend>{t(M.stage, { n: i + 1 })}</legend>
            <div className="setup-grid">
              <SliderField
                label={t(M.duration)}
                value={g.duration}
                min={MOTION_LIMITS.duration.min}
                max={Math.min(MOTION_LIMITS.duration.max, MOTION_LIMITS.totalDuration - otherStagesTime(i))}
                step={MOTION_LIMITS.duration.step}
                unit="s"
                onChange={(v) => motionActions.setStage(i, { duration: v })}
              />
              <SliderField label={t(M.accel)} value={g.a} {...MOTION_LIMITS.a} unit="m/s²" onChange={(v) => motionActions.setStage(i, { a: v })} />
            </div>
            {i > 0 && (
              <label className="check-inline">
                <input
                  type="checkbox"
                  checked={g.v !== undefined}
                  onChange={(e) => motionActions.setStage(i, { v: e.target.checked ? 0 : undefined })}
                />
                {t(M.newV)}
              </label>
            )}
            {i > 0 && g.v !== undefined && (
              <SliderField label={t(M.newVValue)} value={g.v} {...MOTION_LIMITS.v0} unit="m/s" onChange={(v) => motionActions.setStage(i, { v })} />
            )}
            {s.config.stages.length > 1 && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => motionActions.removeStage(i)}>
                <Icon name="trash" /> {t(M.removeStage)}
              </button>
            )}
          </fieldset>
        ))}
        <button
          type="button"
          className="btn btn-sm"
          onClick={motionActions.addStage}
          disabled={s.config.stages.length >= MOTION_LIMITS.maxStages || T + 5 > MOTION_LIMITS.totalDuration}
        >
          + {t(M.addStage)}
        </button>
      </details>

      {s.mode === 'guided' && (
        <RecordsPanel
          activity={activity}
          onRecord={() => addRecord('motion', activity.id, recordValues(activity.id, st))}
          recordDisabled={s.playing ? t(M.needStopped) : undefined}
        />
      )}
    </LabShell>
  );
}
