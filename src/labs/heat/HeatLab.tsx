import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AssistantSnapshot } from '../../assistant/types';
import { ActivityGuide } from '../../components/ActivityGuide';
import { Icon } from '../../components/Icon';
import { LabShell } from '../../components/LabShell';
import { LineChart, SERIES_COLORS } from '../../components/LineChart';
import { RecordsPanel } from '../../components/RecordsPanel';
import { Banner, Readout, Segmented, SliderField } from '../../components/ui';
import { HEAT_ACTIVITIES, HEAT_LAB } from '../../curriculum/heat';
import { l, useI18n, type L } from '../../i18n/i18n';
import { UI } from '../../i18n/ui';
import { fmt } from '../../lib/format';
import { addRecord, getActivity, progressStore, type RecordRow } from '../../lib/progress';
import { MATERIALS, WATER, type MaterialId } from '../../physics/heat/materials';
import {
  celsiusToFahrenheit,
  celsiusToKelvin,
  enthalpy,
  HEAT_LIMITS,
  heatingAt,
  initialState,
  specificAt,
  type Phase,
} from '../../physics/heat/model';
import { Particles } from './Particles';
import { heatActions, heatStore, phaseNow, phaseRun, runEnd, specificNow, useHeat, type HeatUiState } from './store';

export const MATERIAL_NAMES: Record<MaterialId, L> = {
  water: l('Water', 'الماء'),
  oil: l('Oil', 'الزيت'),
  glass: l('Glass', 'الزجاج'),
  granite: l('Granite', 'الجرانيت'),
  aluminium: l('Aluminium', 'الألومنيوم'),
  iron: l('Iron / steel', 'الحديد / الفولاذ'),
  copper: l('Copper', 'النحاس'),
  lead: l('Lead', 'الرصاص'),
};

export const PHASE_NAMES: Record<Phase, L> = {
  solid: l('Solid (ice)', 'صلب (جليد)'),
  'solid-liquid': l('Melting', 'انصهار'),
  liquid: l('Liquid (water)', 'سائل (ماء)'),
  'liquid-gas': l('Boiling', 'غليان'),
  gas: l('Gas (steam)', 'غاز (بخار)'),
};

const H = {
  modeLabel: l('Experiment', 'التجربة'),
  phaseMode: l('Heating curve (water)', 'منحنى التسخين (الماء)'),
  specificMode: l('Compare specific heat', 'مقارنة السعة الحراريّة'),
  mass: l('Mass m', 'الكتلة m'),
  T0: l('Starting temperature', 'درجة الحرارة الابتدائيّة'),
  power: l('Heater power P', 'قدرة السخّان P'),
  direction: l('Energy flow', 'اتّجاه الطاقة'),
  heating: l('Heating', 'تسخين'),
  coolingL: l('Cooling', 'تبريد'),
  sampleA: l('Sample A', 'العيّنة A'),
  sampleB: l('Sample B', 'العيّنة B'),
  waterOnly: l('The change-of-state model uses water only: the textbook gives c for ice, water and steam and Lf, Lv only for water.', 'يستخدم نموذج تغيّر الحالة الماء فقط، لأنّ الكتاب يعطي c للجليد والماء والبخار و Lf و Lv للماء فقط.'),
  cFrom: l('c = {c} J/kg·°C (Table 2-3)', 'c = {c} J/kg·°C (الجدول 2-3)'),
  temperature: l('Temperature', 'درجة الحرارة'),
  energy: l('Energy added Q', 'الطاقة المضافة Q'),
  energyRemoved: l('Energy removed', 'الطاقة المنزوعة'),
  state: l('State', 'الحالة'),
  plateau: l('Temperature constant: the energy is changing the state, not the temperature (Q = mL).', 'درجة الحرارة ثابتة: تُستخدم الطاقة في تغيير الحالة لا في رفع درجة الحرارة (Q = mL).'),
  limit: l('Model limit reached ({T} °C). Reset or change the set-up.', 'بلغ النموذج حدّه ({T} °C). أعد الضبط أو غيّر الإعداد.'),
  specLimit: l('{name} reached 90 °C, the upper limit of this comparison, so its heater stopped.', 'بلغت {name} ‏90 °C، وهو الحدّ الأعلى لهذه المقارنة، فتوقّف سخّانها.'),
  tt: l('Temperature – time', 'درجة الحرارة – الزمن'),
  melting: l('melting 0 °C', 'انصهار 0 °C'),
  boiling: l('boiling 100 °C', 'غليان 100 °C'),
  particles: l('Particle model', 'نموذج الجسيمات'),
  particleNote: l('Qualitative: particles move faster at higher temperature. Blue = solid, green = liquid, purple = gas.', 'وصفيّ: تتحرّك الجسيمات أسرع عند درجة حرارة أعلى. الأزرق صلب، والأخضر سائل، والبنفسجي غاز.'),
  particleLabel: l('Particle model: {state} at {T} °C', 'نموذج الجسيمات: {state} عند {T} °C'),
  budget: l('Energy accounting', 'حساب الطاقة'),
  stage: l('Stage', 'المرحلة'),
  formula: l('Equation', 'المعادلة'),
  stages: [l('Warming ice', 'تسخين الجليد'), l('Melting', 'الانصهار'), l('Warming water', 'تسخين الماء'), l('Boiling', 'الغليان'), l('Warming steam', 'تسخين البخار')],
  total: l('Total = P × t', 'المجموع = P × t'),
  solidL: l('Solid', 'صلب'),
  liquidL: l('Liquid', 'سائل'),
  gasL: l('Gas', 'غاز'),
  stepSize: l('Step', 'الخطوة'),
  rate: l('Time speed', 'تسريع الزمن'),
  needT: l('Let some time pass before recording (ΔT = 0 at t = 0).', 'دع بعض الوقت يمرّ قبل التسجيل (ΔT = 0 عند t = 0).'),
  needSpecific: l('Switch to “Compare specific heat” (press “Set up experiment”).', 'انتقل إلى «مقارنة السعة الحراريّة» (اضغط «تجهيز التجربة»).'),
  needPhase: l('Switch to the heating-curve experiment (press “Set up experiment”).', 'انتقل إلى تجربة منحنى التسخين (اضغط «تجهيز التجربة»).'),
  needLimitSpec: l('A sample has reached the 90 °C limit; record earlier readings.', 'بلغت إحدى العيّنتين حدّ 90 °C؛ سجّل قراءات أبكر.'),
  needMelting: l('Record while the ice is melting (some ice and some water present).', 'سجّل أثناء انصهار الجليد (وجود جليد وماء معًا).'),
  needStopped: l('Pause the heater to record a reading.', 'أوقف السخّان مؤقّتًا لتسجيل قراءة.'),
  bothSame: l('Both samples get the same energy: same heater power for the same time.', 'تحصل العيّنتان على الطاقة نفسها: قدرة السخّان نفسها للمدّة نفسها.'),
};

/* ------------------------------------------------------------ visuals --- */

function Thermometer({ T, min, max }: { T: number; min: number; max: number }) {
  const top = 16;
  const bottom = 196;
  const y = (v: number) => bottom - ((v - min) / (max - min)) * (bottom - top);
  const ticks: number[] = [];
  const step = max - min > 120 ? 20 : 10;
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return (
    <svg viewBox="0 0 70 230" className="thermo" aria-hidden="true">
      <rect x={26} y={top - 6} width={14} height={bottom - top + 12} rx={7} className="th-glass" />
      <rect x={30} y={y(T)} width={6} height={bottom - y(T) + 8} className="th-fluid" />
      <circle cx={33} cy={bottom + 14} r={12} className="th-bulb" />
      {ticks.map((v) => (
        <g key={v}>
          <line x1={40} x2={47} y1={y(v)} y2={y(v)} className="th-tick" />
          <text x={50} y={y(v) + 4} className="th-label">
            {v}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Beaker({ phase, solid, liquid, gas, heaterOn, cooling }: { phase: Phase; solid: number; liquid: number; gas: number; heaterOn: boolean; cooling: boolean }) {
  const level = 150 - 70 * Math.max(0, 1 - gas); // water level drops as it boils away
  return (
    <svg viewBox="0 0 200 230" className="beaker" aria-hidden="true">
      {gas > 0 && (
        <g className="steam">
          {[50, 80, 110, 140].map((x, i) => (
            <path key={x} d={`M${x} ${level - 8} q-8 -14 0 -28 q8 -14 0 -28`} style={{ opacity: Math.min(1, gas * 2 + 0.2), animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
      )}
      <path d="M30 40 V200 a10 10 0 0 0 10 10 H160 a10 10 0 0 0 10 -10 V40" className="bk-glass" />
      {liquid > 0 && <rect x={32} y={level} width={136} height={208 - level} rx={8} className="bk-water" />}
      {solid > 0 &&
        Array.from({ length: Math.max(1, Math.round(solid * 6)) }, (_, i) => (
          <rect key={i} x={44 + (i % 3) * 40} y={180 - Math.floor(i / 3) * 34 - (liquid > 0 ? 10 : 0)} width={30} height={26} rx={5} className="bk-ice" transform={`rotate(${(i % 2 ? 6 : -5)} ${59 + (i % 3) * 40} ${193 - Math.floor(i / 3) * 34})`} />
        ))}
      {phase === 'liquid-gas' &&
        [60, 95, 130, 75, 115].map((x, i) => <circle key={i} cx={x} cy={196 - i * 9} r={3 + (i % 3)} className="bk-bubble" style={{ animationDelay: `${i * 0.25}s` }} />)}
      <path d="M100 30 V196 h-22 v-10 h44 v-10 h-44 v-10 h44" className={`bk-heater ${heaterOn ? (cooling ? 'cooling' : 'on') : ''}`} />
    </svg>
  );
}

/** Sample block for the specific-heat comparison, tinted by temperature. */
function Block({ name, T }: { name: string; T: number }) {
  const f = Math.max(0, Math.min(1, (T - 10) / 80));
  const fill = `rgb(${Math.round(226 + 26 * f)}, ${Math.round(232 - 120 * f)}, ${Math.round(240 - 170 * f)})`;
  return (
    <svg viewBox="0 0 160 120" className="block-svg" aria-hidden="true">
      <rect x={20} y={30} width={120} height={80} rx={10} fill={fill} stroke="#14213d" strokeWidth={2} />
      <path d="M80 6 V60" stroke="#14213d" strokeWidth={4} strokeLinecap="round" />
      <text x={80} y={92} textAnchor="middle" className="block-name">
        {name}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------ helpers --- */

/** Energy split over the five stages of the heating curve, from the start state up to the current state. */
export function energyBudget(s: HeatUiState) {
  const m = s.mass;
  const H0 = enthalpy(WATER, m, initialState(WATER, s.T0));
  const now = phaseNow(s);
  const H1 = H0 + now.Q;
  const lo = Math.min(H0, H1);
  const hi = Math.max(H0, H1);
  const meltEnd = m * WATER.Lf;
  const boilStart = meltEnd + m * WATER.cLiquid * (WATER.boilingPoint - WATER.meltingPoint);
  const boilEnd = boilStart + m * WATER.Lv;
  const seg: [number, number][] = [
    [-Infinity, 0],
    [0, meltEnd],
    [meltEnd, boilStart],
    [boilStart, boilEnd],
    [boilEnd, Infinity],
  ];
  const formulas = ['m·c(ice)·ΔT', 'm·Lf', 'm·c(water)·ΔT', 'm·Lv', 'm·c(steam)·ΔT'];
  const rows = seg.map(([a, b], i) => ({ i, Q: Math.max(0, Math.min(hi, b) - Math.max(lo, a)), formula: formulas[i] }));
  return { rows, total: hi - lo, sign: H1 >= H0 ? 1 : -1 };
}

function heatSnapshot(s: HeatUiState, records: RecordRow[], lang: 'en' | 'ar'): AssistantSnapshot {
  const activity = HEAT_ACTIVITIES.find((a) => a.id === s.activityId);
  if (s.mode === 'specific') {
    const { A, B } = specificNow(s);
    return {
      lab: 'heat',
      activity: activity as AssistantSnapshot['activity'],
      facts: { mode: 'specific', Q: s.power * s.t, materialA: MATERIAL_NAMES[s.materialA][lang], materialB: MATERIAL_NAMES[s.materialB][lang], dTA: A.T - s.T0, dTB: B.T - s.T0 },
      stateText: `Specific heat comparison. Two samples, ${s.mass} kg each, start at ${s.T0} °C, each heated by a ${s.power} W heater. t = ${fmt(s.t, 4)} s, energy supplied to each Q = ${fmt(s.power * s.t, 5)} J.
Sample A ${s.materialA} (c = ${MATERIALS[s.materialA].c} J/kg°C): T = ${fmt(A.T, 4)} °C${A.atLimit ? ' (stopped at the 90 °C model limit)' : ''}.
Sample B ${s.materialB} (c = ${MATERIALS[s.materialB].c} J/kg°C): T = ${fmt(B.T, 4)} °C${B.atLimit ? ' (stopped at the 90 °C model limit)' : ''}.`,
      records,
      columns: activity?.columns,
    };
  }
  const now = phaseNow(s);
  return {
    lab: 'heat',
    activity: activity as AssistantSnapshot['activity'],
    facts: { mode: 'phase', Q: now.Q, phase: now.phase, phaseLabel: PHASE_NAMES[now.phase][lang], T: now.T, liquid: now.liquid, gas: now.gas },
    stateText: `Heating curve of water. Mass ${s.mass} kg, start ${s.T0} °C, heater ${s.cooling ? 'removing' : 'supplying'} ${s.power} W. t = ${fmt(s.t, 4)} s.
Now: T = ${fmt(now.T, 4)} °C, state ${now.phase}, solid ${fmt(now.solid * 100, 3)} %, liquid ${fmt(now.liquid * 100, 3)} %, gas ${fmt(now.gas * 100, 3)} %. Energy added since start Q = ${fmt(now.Q, 5)} J.${now.atLimit ? ' The model limit has been reached.' : ''}
Water data used: c(ice) 2000, c(water) 4184, c(steam) 1970 J/kg°C, Lf 334 kJ/kg, Lv 2430 kJ/kg (textbook values).`,
    records,
    columns: activity?.columns,
  };
}

type Rec = { values: Record<string, number> } | { blocked: L };

export function heatRecordFor(activityId: string, s: HeatUiState): Rec {
  if (s.playing) return { blocked: H.needStopped };
  if (activityId === 'specific-heat') {
    if (s.mode !== 'specific') return { blocked: H.needSpecific };
    if (s.t <= 0) return { blocked: H.needT };
    const { A, B } = specificNow(s);
    if (A.atLimit || B.atLimit) return { blocked: H.needLimitSpec };
    return {
      values: {
        t: s.t,
        Q: s.power * s.t,
        TA: A.T,
        TB: B.T,
        cA: A.Q / (s.mass * (A.T - s.T0)),
        cB: B.Q / (s.mass * (B.T - s.T0)),
      },
    };
  }
  if (s.mode !== 'phase') return { blocked: H.needPhase };
  const now = phaseNow(s);
  switch (activityId) {
    case 'heating-curve':
      return { values: { t: s.t, T: now.T, Q: now.Q, liquid: now.liquid * 100, gas: now.gas * 100 } };
    case 'latent-fusion': {
      if (now.phase !== 'solid-liquid' || s.cooling) return { blocked: H.needMelting };
      const melted = s.mass * now.liquid;
      return { values: { t: s.t, Q: now.Q, melted, Lf: now.Q / melted, T: now.T } };
    }
    default:
      return { values: { T: now.T, F: celsiusToFahrenheit(now.T), K: celsiusToKelvin(now.T) } };
  }
}

/* --------------------------------------------------------------- page --- */

export default function HeatLab() {
  const { t, lang } = useI18n();
  const s = useHeat();
  const [params] = useSearchParams();
  const end = runEnd(s);

  useEffect(() => {
    const act = HEAT_ACTIVITIES.find((a) => a.id === params.get('activity'));
    const mode = params.get('mode');
    if (act) {
      heatActions.setActivity(act.id);
      heatActions.loadPreset(act.preset);
    }
    if (mode === 'guided' || mode === 'free') heatActions.setLabMode(mode);
  }, [params]);

  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!s.playing) return;
    let last = performance.now();
    const loop = (now: number) => {
      heatActions.tick(Math.min(0.1, (now - last) / 1000));
      last = now;
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [s.playing]);
  useEffect(() => () => heatActions.pause(), []);

  const activity = HEAT_ACTIVITIES.find((a) => a.id === s.activityId) ?? HEAT_ACTIVITIES[0];
  const rec = heatRecordFor(activity.id, s);

  // Full-run samples for the chart domain; the trace is drawn up to the current time only.
  const curve = useMemo(() => {
    const n = 300;
    const pts: { t: number; T: number; TB?: number }[] = [];
    for (let k = 0; k <= n; k++) {
      const tt = (k * end) / n;
      if (s.mode === 'phase') pts.push({ t: tt, T: heatingAt(phaseRun(s), tt, WATER).T });
      else {
        const run = (id: MaterialId) => specificAt({ mass: s.mass, c: MATERIALS[id].c, T0: s.T0, power: s.power }, tt).T;
        pts.push({ t: tt, T: run(s.materialA), TB: run(s.materialB) });
      }
    }
    return pts;
  }, [s.mode, s.mass, s.T0, s.power, s.cooling, s.materialA, s.materialB, end]); // eslint-disable-line react-hooks/exhaustive-deps -- `s` is read only through these fields

  const shown = curve.filter((p) => p.t <= s.t + 1e-9);
  const now = s.mode === 'phase' ? phaseNow(s) : null;
  const spec = s.mode === 'specific' ? specificNow(s) : null;
  const T = now ? now.T : spec!.A.T;
  const yDomain: [number, number] =
    s.mode === 'phase'
      ? [Math.min(-20, Math.floor(Math.min(...curve.map((p) => p.T)) / 20) * 20), Math.max(120, Math.ceil(Math.max(...curve.map((p) => p.T)) / 20) * 20)]
      : [0, 100];
  const tUnitMin = end > 300;
  const series =
    s.mode === 'phase'
      ? [{ id: 'T', label: t(H.temperature), kind: 'line' as const, color: SERIES_COLORS[0], points: shown.map((p) => ({ x: p.t, y: p.T })).concat(s.t > 0 ? [{ x: s.t, y: T }] : []) }]
      : [
          { id: 'A', label: `${t(H.sampleA)}: ${t(MATERIAL_NAMES[s.materialA])}`, kind: 'line' as const, color: SERIES_COLORS[0], points: shown.map((p) => ({ x: p.t, y: p.T })).concat(s.t > 0 ? [{ x: s.t, y: spec!.A.T }] : []) },
          { id: 'B', label: `${t(H.sampleB)}: ${t(MATERIAL_NAMES[s.materialB])}`, kind: 'line' as const, color: SERIES_COLORS[1], points: shown.map((p) => ({ x: p.t, y: p.TB! })).concat(s.t > 0 ? [{ x: s.t, y: spec!.B.T }] : []) },
        ];
  const budget = s.mode === 'phase' ? energyBudget(s) : null;
  const materialOptions = (Object.keys(MATERIALS) as MaterialId[]).map((id) => (
    <option key={id} value={id}>
      {t(MATERIAL_NAMES[id])} — {MATERIALS[id].c}
    </option>
  ));

  return (
    <LabShell
      lab={HEAT_LAB}
      activities={HEAT_ACTIVITIES}
      activityId={activity.id}
      onActivity={(id) => {
        const next = HEAT_ACTIVITIES.find((a) => a.id === id);
        if (!next) return;
        heatActions.setActivity(id);
        heatActions.loadPreset(next.preset);
      }}
      mode={s.labMode}
      onMode={heatActions.setLabMode}
      onReset={() => (s.labMode === 'guided' ? heatActions.loadPreset(activity.preset) : heatActions.rewind())}
      snapshot={() => heatSnapshot(heatStore.get(), getActivity(progressStore.get(), 'heat', activity.id).records, lang)}
      guide={<ActivityGuide activity={activity} state={{ mass: s.mass, power: s.power }} onSetup={() => heatActions.loadPreset(activity.preset)} />}
    >
      <div className="heat-layout">
        <div className="panel heat-stage">
          <div className="heat-visual">
            {s.mode === 'phase' && now ? (
              <>
                <Beaker phase={now.phase} solid={now.solid} liquid={now.liquid} gas={now.gas} heaterOn={s.playing || s.t > 0} cooling={s.cooling} />
                <Thermometer T={now.T} min={HEAT_LIMITS.tMin} max={HEAT_LIMITS.tMax} />
              </>
            ) : (
              spec && (
                <div className="blocks">
                  {(['A', 'B'] as const).map((k) => {
                    const id = k === 'A' ? s.materialA : s.materialB;
                    const r = spec[k];
                    return (
                      <div key={k} className="block-col">
                        <Block name={t(MATERIAL_NAMES[id])} T={r.T} />
                        <Thermometer T={r.T} min={0} max={100} />
                        <div className="block-reading">
                          <span className="small muted">{k === 'A' ? t(H.sampleA) : t(H.sampleB)}</span>
                          <strong className="mono" data-testid={`temp-${k}`}>
                            {fmt(r.T, 4)} °C
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          <div className="transport" role="group" aria-label={t(UI.time)}>
            {s.playing ? (
              <button type="button" className="btn btn-navy" onClick={heatActions.pause} data-testid="pause">
                <Icon name="pause" /> {t(UI.pause)}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={heatActions.play} disabled={end <= 0} data-testid="play">
                <Icon name="play" /> {t(UI.play)}
              </button>
            )}
            <button type="button" className="btn" onClick={heatActions.step} disabled={s.t >= end - 1e-9} data-testid="step">
              <Icon name="step" /> +{s.stepSize} s
            </button>
            <button type="button" className="btn" onClick={heatActions.rewind}>
              <Icon name="reset" /> t = 0
            </button>
            <label className="scrub">
              <span className="small muted">{t(UI.time)}</span>
              <input type="range" min={0} max={end || 1} step={1} value={s.t} onChange={(e) => heatActions.seek(e.target.valueAsNumber)} aria-valuetext={`${fmt(s.t, 4)} s`} />
              <span className="mono time-label" data-testid="time">
                {s.t.toFixed(0)} s
              </span>
            </label>
          </div>
          <div className="transport">
            <Segmented label={t(H.rate)} value={String(s.speed)} onChange={(v) => heatActions.setSpeed(Number(v))} options={['1', '10', '20', '30', '60'].map((v) => ({ value: v, label: `×${v}` }))} />
            <Segmented label={t(H.stepSize)} value={String(s.stepSize)} onChange={(v) => heatActions.setStepSize(Number(v))} options={['1', '10', '60'].map((v) => ({ value: v, label: `${v} s` }))} />
          </div>

          {s.mode === 'phase' && now && (
            <>
              <ol className="phase-steps" aria-label={t(H.state)}>
                {(['solid', 'solid-liquid', 'liquid', 'liquid-gas', 'gas'] as Phase[]).map((p) => (
                  <li key={p} className={p === now.phase ? 'current' : ''} aria-current={p === now.phase ? 'step' : undefined}>
                    {t(PHASE_NAMES[p])}
                  </li>
                ))}
              </ol>
              {(now.phase === 'solid-liquid' || now.phase === 'liquid-gas') && (
                <div data-testid="plateau">
                  <Banner kind="info">{t(H.plateau)}</Banner>
                </div>
              )}
              {now.atLimit && <Banner kind="warn">{t(H.limit, { T: fmt(now.T, 3) })}</Banner>}
              <div className="readouts" data-testid="heat-readouts">
                <Readout label={t(UI.time)} value={fmt(s.t, 4)} unit="s" />
                <Readout label={t(H.temperature)} value={fmt(now.T, 4)} unit="°C" accent="primary" />
                <Readout label="K" value={fmt(celsiusToKelvin(now.T), 5)} unit="K" />
                <Readout label="°F" value={fmt(celsiusToFahrenheit(now.T), 4)} unit="°F" />
                <Readout label={s.cooling ? t(H.energyRemoved) : t(H.energy)} value={fmt(Math.abs(now.Q), 5)} unit="J" accent="purple" />
                <Readout label={t(H.state)} value={t(PHASE_NAMES[now.phase])} accent="amber" text />
              </div>
              <div className="fractions" aria-label={t(H.state)}>
                {(
                  [
                    ['solid', now.solid, H.solidL],
                    ['liquid', now.liquid, H.liquidL],
                    ['gas', now.gas, H.gasL],
                  ] as const
                ).map(([k, v, label]) => (
                  <div key={k} className={`fraction f-${k}`}>
                    <span className="small">{t(label)}</span>
                    <span className="fraction-bar">
                      <span style={{ width: `${v * 100}%` }} />
                    </span>
                    <span className="mono small">{fmt(v * 100, 3)} %</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {spec && (
            <>
              <p className="small muted">{t(H.bothSame)}</p>
              {(['A', 'B'] as const).map((k) =>
                spec[k].atLimit ? (
                  <Banner key={k} kind="warn">
                    {t(H.specLimit, { name: t(MATERIAL_NAMES[k === 'A' ? s.materialA : s.materialB]) })}
                  </Banner>
                ) : null,
              )}
              <div className="readouts" data-testid="heat-readouts">
                <Readout label={t(UI.time)} value={fmt(s.t, 4)} unit="s" />
                <Readout label={t(H.energy)} value={fmt(s.power * s.t, 5)} unit="J" accent="purple" />
                <Readout label={`ΔT ${t(MATERIAL_NAMES[s.materialA])}`} value={fmt(spec.A.T - s.T0, 4)} unit="°C" accent="primary" />
                <Readout label={`ΔT ${t(MATERIAL_NAMES[s.materialB])}`} value={fmt(spec.B.T - s.T0, 4)} unit="°C" accent="amber" />
              </div>
            </>
          )}
        </div>

        <div className="heat-side">
          <div className="panel">
            <div className="panel-title">
              <span>{t(H.tt)}</span>
            </div>
            <LineChart
              title={t(H.tt)}
              series={series}
              xLabel="t"
              yLabel="T"
              xUnit="s"
              yUnit="°C"
              xDomain={[0, end || 1]}
              yDomain={yDomain}
              cursorX={s.t}
              height={250}
              bands={s.mode === 'phase' ? [{ y: 0, label: t(H.melting) }, { y: 100, label: t(H.boiling) }] : undefined}
            />
            {tUnitMin && <p className="small muted ltr">{fmt(s.t / 60, 3)} min</p>}
          </div>
          {s.mode === 'phase' && now && (
            <div className="panel">
              <div className="panel-title">
                <span>{t(H.particles)}</span>
              </div>
              <Particles T={now.T} solid={now.solid} liquid={now.liquid} gas={now.gas} label={t(H.particleLabel, { state: t(PHASE_NAMES[now.phase]), T: fmt(now.T, 3) })} />
              <p className="small muted">{t(H.particleNote)}</p>
            </div>
          )}
        </div>
      </div>

      {budget && (
        <div className="panel">
          <div className="panel-title">
            <span>{t(H.budget)}</span>
            <span className="small muted ltr">m = {s.mass} kg</span>
          </div>
          <div className="table-wrap">
            <table className="data" data-testid="energy-budget">
              <thead>
                <tr>
                  <th scope="col">{t(H.stage)}</th>
                  <th scope="col">{t(H.formula)}</th>
                  <th scope="col" className="num">
                    Q (J)
                  </th>
                </tr>
              </thead>
              <tbody>
                {budget.rows.map((r) => (
                  <tr key={r.i} className={r.Q > 0 ? '' : 'row-faint'}>
                    <td>{t(H.stages[r.i])}</td>
                    <td className="mono small" dir="ltr">{r.formula}</td>
                    <td className="num">{fmt(r.Q, 5)}</td>
                  </tr>
                ))}
                <tr className="row-total">
                  <td>{t(H.total)}</td>
                  <td className="mono small" dir="ltr">
                    {s.power} W × {fmt(s.t, 4)} s
                  </td>
                  <td className="num">{fmt(budget.total, 5)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <details className="panel motion-setup" open={s.labMode === 'free'}>
        <summary className="panel-title">
          <span>{t(UI.setup)}</span>
        </summary>
        <Segmented
          label={t(H.modeLabel)}
          value={s.mode}
          onChange={heatActions.setMode}
          options={[
            { value: 'phase', label: t(H.phaseMode) },
            { value: 'specific', label: t(H.specificMode) },
          ]}
        />
        <div className="setup-grid" style={{ marginTop: 12 }}>
          <SliderField label={t(H.mass)} value={s.mass} {...HEAT_LIMITS.mass} unit="kg" onChange={(v) => heatActions.set({ mass: v })} />
          <SliderField
            label={t(H.T0)}
            value={s.T0}
            min={s.mode === 'phase' ? HEAT_LIMITS.tMin : HEAT_LIMITS.specificTMin}
            max={s.mode === 'phase' ? HEAT_LIMITS.tMax : HEAT_LIMITS.specificTMax - 10}
            step={1}
            unit="°C"
            onChange={(v) => heatActions.set({ T0: v })}
          />
          <SliderField label={t(H.power)} value={s.power} {...HEAT_LIMITS.power} unit="W" onChange={(v) => heatActions.set({ power: v })} />
        </div>
        {s.mode === 'phase' ? (
          <>
            <Segmented
              label={t(H.direction)}
              value={s.cooling ? 'cool' : 'heat'}
              onChange={(v) => heatActions.set({ cooling: v === 'cool' })}
              options={[
                { value: 'heat', label: t(H.heating) },
                { value: 'cool', label: t(H.coolingL) },
              ]}
            />
            <p className="small muted" style={{ marginTop: 8 }}>
              {t(H.waterOnly)}
            </p>
          </>
        ) : (
          <div className="setup-grid">
            <label className="field">
              <span className="label">{t(H.sampleA)}</span>
              <select value={s.materialA} onChange={(e) => heatActions.set({ materialA: e.target.value as MaterialId })} data-testid="material-a">
                {materialOptions}
              </select>
              <span className="small muted ltr">{t(H.cFrom, { c: MATERIALS[s.materialA].c })}</span>
            </label>
            <label className="field">
              <span className="label">{t(H.sampleB)}</span>
              <select value={s.materialB} onChange={(e) => heatActions.set({ materialB: e.target.value as MaterialId })} data-testid="material-b">
                {materialOptions}
              </select>
              <span className="small muted ltr">{t(H.cFrom, { c: MATERIALS[s.materialB].c })}</span>
            </label>
          </div>
        )}
      </details>

      {s.labMode === 'guided' && (
        <RecordsPanel
          activity={activity}
          onRecord={() => {
            if ('values' in rec) addRecord('heat', activity.id, rec.values);
          }}
          recordDisabled={'blocked' in rec ? t(rec.blocked) : undefined}
        />
      )}
    </LabShell>
  );
}
