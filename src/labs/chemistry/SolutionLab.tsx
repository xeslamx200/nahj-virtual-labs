import { massForSolution, massPercent, molarity, molarityFromMass, percentError } from '../../chemistry/concentration';
import { M } from '../../chemistry/molarMass';
import { Icon } from '../../components/Icon';
import { Banner, Readout } from '../../components/ui';
import { l, useI18n, type L } from '../../i18n/i18n';
import { fmt, parseNumber } from '../../lib/format';
import { Formula } from './Formula';
import { calcError } from './messages';
import { chemActions, useChem, type ChemUiState } from './store';

/** Solutes used in the textbook's worked examples and activities. */
export const SOLUTES: { formula: string; name: L; ref: L; colour?: [number, number, number] }[] = [
  { formula: 'CuSO4·5H2O', name: l('Copper(II) sulfate pentahydrate', 'كبريتات النحاس (II) خماسيّة الماء'), ref: l('Activity 3-2b', 'النشاط 3-2b'), colour: [32, 110, 200] },
  { formula: 'NaCl', name: l('Sodium chloride', 'كلوريد الصوديوم'), ref: l('Example 34', 'المثال 34') },
  { formula: 'KCl', name: l('Potassium chloride', 'كلوريد البوتاسيوم'), ref: l('Example 35', 'المثال 35') },
  { formula: 'Na2SO4', name: l('Sodium sulfate', 'كبريتات الصوديوم'), ref: l('Example 36', 'المثال 36') },
  { formula: 'Li2CO3', name: l('Lithium carbonate', 'كربونات الليثيوم'), ref: l('Example 37', 'المثال 37') },
  { formula: 'KOH', name: l('Potassium hydroxide', 'هيدروكسيد البوتاسيوم'), ref: l('Example 38', 'المثال 38') },
  { formula: 'KI', name: l('Potassium iodide', 'يوديد البوتاسيوم'), ref: l('Example 39', 'المثال 39') },
  { formula: 'Zn(NO3)2', name: l('Zinc nitrate', 'نترات الخارصين'), ref: l('Lesson 3-2 review', 'تقويم الدرس 3-2') },
];
export const FLASKS = [100, 250, 500, 1000];

const S = {
  prep: l('Prepare a standard solution', 'تحضير محلول قياسي'),
  solute: l('Solute', 'المذاب'),
  flask: l('Volumetric flask', 'الدورق الحجمي'),
  target: l('Target molarity', 'التركيز المطلوب'),
  working: l('Show the calculation', 'اعرض الحسابات'),
  calcA: l('a) Molar mass', 'a) الكتلة المولية'),
  calcB: l('b) Moles needed: n = M × V', 'b) المولات اللازمة: n = M × V'),
  calcC: l('c) Mass needed: m = n × Mm', 'c) الكتلة اللازمة: m = n × Mm'),
  tryFirst: l('Work it out first, then open the calculation to check.', 'احسبها بنفسك أوّلًا، ثمّ افتح الحسابات للتحقّق.'),
  weigh: l('Mass to weigh', 'الكتلة المراد وزنها'),
  weighBtn: l('1 · Weigh', '1 · زِن'),
  transfer: l('2 · Transfer and dissolve', '2 · انقل وأذِب'),
  fill: l('3 · Fill to the mark and invert', '3 · أكمل حتّى العلامة واقلب'),
  again: l('Empty the flask', 'أفرغ الدورق'),
  balance: l('Balance', 'الميزان'),
  stepEmpty: l('Enter the mass you calculated and weigh it on weighing paper.', 'أدخل الكتلة التي حسبتها وزِنها على ورق الوزن.'),
  stepWeighed: l('Transfer all the solid into the flask with a little distilled water and swirl until it dissolves.', 'انقل المادّة الصلبة كلّها إلى الدورق مع قليل من الماء المقطّر، وحرّكه دائريًّا حتّى تذوب.'),
  stepDissolved: l('Add distilled water until the bottom of the meniscus touches the mark, then stopper and invert several times.', 'أضف الماء المقطّر حتّى يلامس أسفل سطح المحلول المقعّر خطّ العلامة، ثمّ أغلق الدورق واقلبه عدّة مرّات.'),
  stepFilled: l('Solution ready. Its concentration follows from the mass you weighed.', 'المحلول جاهز، ويُحسب تركيزه من الكتلة التي وزنتها.'),
  obtained: l('Molarity obtained', 'التركيز الناتج'),
  error: l('Error vs target', 'الخطأ مقارنة بالمطلوب'),
  good: l('Within 1 % of the target — a good standard solution.', 'ضمن 1 % من المطلوب — محلول قياسي جيّد.'),
  off: l('More than 1 % from the target. Check your calculation and the mass you weighed.', 'يبعد أكثر من 1 % عن المطلوب. راجع حساباتك والكتلة التي وزنتها.'),
  badMass: l('Enter a mass between 0.001 g and 1000 g.', 'أدخل كتلة بين 0.001 g و 1000 g.'),
  badTarget: l('Enter a target molarity between 0.001 M and 5 M.', 'أدخل تركيزًا مطلوبًا بين 0.001 M و 5 M.'),
  flaskLabel: l('{v} mL volumetric flask, {state}', 'دورق حجمي {v} mL، {state}'),
  states: { empty: l('empty', 'فارغ'), weighed: l('empty, solid weighed', 'فارغ، والمادّة موزونة'), dissolved: l('solid dissolved, below the mark', 'المادّة مذابة، والمحلول دون العلامة'), filled: l('filled to the mark', 'ممتلئ حتّى العلامة') },
  molarityCalc: l('Molarity calculator (equation 7-2)', 'حاسبة الموالريّة (المعادلة 7-2)'),
  n: l('Moles of solute n', 'عدد مولات المذاب n'),
  V: l('Volume of solution V', 'حجم المحلول V'),
  pctTitle: l('Percentage by mass', 'النسبة المئويّة بالكتلة'),
  pctNote: l('Named in the unit overview; the lesson has no worked example, so this calculator uses the general definition.', 'ورد ذكرها في مقدّمة الوحدة، ولا يتضمّن الدرس مثالًا محلولًا، لذا تستخدم هذه الحاسبة التعريف العامّ.'),
  pctSolute: l('Mass of solute', 'كتلة المذاب'),
  pctSolvent: l('Mass of solvent (water)', 'كتلة المذيب (الماء)'),
  noDilution: l('Dilution is not part of this textbook and is not included.', 'التخفيف ليس من محتوى هذا الكتاب، ولم يُضمَّن.'),
};

export function solutionNumbers(s: ChemUiState) {
  const Mm = M(s.solute, s.massMode);
  const V = s.flaskmL / 1000;
  const target = parseNumber(s.targetM);
  const targetOk = target !== null && target >= 0.001 && target <= 5;
  const needed = targetOk ? massForSolution(target!, V, Mm) : null;
  const m = parseNumber(s.weighed);
  const massOk = m !== null && m >= 0.001 && m <= 1000;
  const actual = massOk ? molarityFromMass(m!, Mm, V) : null;
  return {
    Mm,
    V,
    target: targetOk ? target! : null,
    needed: needed && needed.ok ? needed.value : null,
    mass: massOk ? m! : null,
    actual: actual && actual.ok ? actual.value : null,
    error: actual && actual.ok && targetOk ? percentError(actual.value, target!) : null,
  };
}

function Glassware({ s, numbers }: { s: ChemUiState; numbers: ReturnType<typeof solutionNumbers> }) {
  const { t } = useI18n();
  const sol = SOLUTES.find((x) => x.formula === s.solute);
  const level = s.solStep === 'filled' ? 1 : s.solStep === 'dissolved' ? 0.55 : 0;
  const conc = s.solStep === 'filled' ? numbers.actual ?? 0 : s.solStep === 'dissolved' && numbers.actual ? numbers.actual / 0.55 : 0;
  const alpha = sol?.colour ? Math.min(0.85, 0.12 + conc * 3.2) : 0.12;
  const fillColour = sol?.colour ? `rgba(${sol.colour.join(',')},${alpha})` : 'rgba(150,190,230,0.28)';
  // Flask geometry: bulb centre (100,170) r 52; neck from y 40 to 122; mark at y 70.
  const neckTop = 40;
  const mark = 70;
  const bulbBottom = 222;
  const liquidTop = level === 1 ? mark : level > 0 ? 160 : bulbBottom;
  const pile = s.solStep === 'weighed';
  return (
    <div className="glassware">
      <svg viewBox="0 0 200 240" className="flask" role="img" aria-label={t(S.flaskLabel, { v: s.flaskmL, state: t(S.states[s.solStep]) })}>
        <defs>
          <clipPath id="flask-inside">
            <path d="M88 40 V122 A52 52 0 1 0 112 122 V40 Z" />
          </clipPath>
        </defs>
        <rect x={0} y={liquidTop} width={200} height={240 - liquidTop} fill={fillColour} clipPath="url(#flask-inside)" className="flask-liquid" />
        {level === 1 && <path d="M88 70 q12 5 24 0" className="meniscus" />}
        <path d="M86 32 h28 M88 34 V122 A52 52 0 1 0 112 122 V34" className="flask-glass" />
        <line x1={84} x2={116} y1={mark} y2={mark} className="flask-mark" />
        <text x={124} y={mark + 4} className="flask-text">
          {s.flaskmL} mL
        </text>
        <text x={100} y={neckTop - 14} className="flask-text" textAnchor="middle">
          ±0.1 mL
        </text>
      </svg>
      <svg viewBox="0 0 200 140" className="balance-svg" aria-hidden="true">
        <rect x={20} y={88} width={160} height={40} rx={8} className="bal-body" />
        <rect x={50} y={98} width={100} height={22} rx={4} className="bal-screen" />
        <text x={100} y={114} className="bal-text" textAnchor="middle">
          {s.solStep === 'empty' ? '0.000' : numbers.mass !== null ? numbers.mass.toFixed(3) : '—'} g
        </text>
        <rect x={45} y={76} width={110} height={8} rx={3} className="bal-pan" />
        {pile && <path d="M70 76 q30 -26 60 0 z" className="bal-solid" style={{ fill: sol?.colour ? `rgb(${sol.colour.join(',')})` : '#e8e4dc' }} />}
      </svg>
    </div>
  );
}

export function SolutionLab() {
  const { t, lang } = useI18n();
  const s = useChem();
  const n = solutionNumbers(s);
  const sol = SOLUTES.find((x) => x.formula === s.solute) ?? SOLUTES[0];
  const nCalc = parseNumber(s.calcN);
  const vCalc = parseNumber(s.calcV);
  const mRes = molarity(nCalc ?? NaN, vCalc ?? NaN);
  const pSolute = parseNumber(s.pct.solute) ?? NaN;
  const pSolvent = parseNumber(s.pct.solvent) ?? NaN;
  const pRes = Number.isFinite(pSolute) && Number.isFinite(pSolvent) && pSolvent >= 0 ? massPercent(pSolute, pSolute + pSolvent) : massPercent(NaN, 1);
  const lock = s.solStep !== 'empty';
  return (
    <div className="chem-solutions">
      <section className="panel">
        <div className="panel-title">
          <span>{t(S.prep)}</span>
          <span className="chip">{t(sol.ref)}</span>
        </div>
        <div className="calc-grid">
          <label className="field">
            <span className="label">{t(S.solute)}</span>
            <select value={s.solute} disabled={lock} onChange={(ev) => chemActions.set({ solute: ev.target.value })} data-testid="solute-select">
              {SOLUTES.map((x) => (
                <option key={x.formula} value={x.formula}>
                  {x.formula} — {t(x.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">{t(S.flask)}</span>
            <select value={s.flaskmL} disabled={lock} onChange={(ev) => chemActions.set({ flaskmL: Number(ev.target.value) })} data-testid="flask-select">
              {FLASKS.map((v) => (
                <option key={v} value={v}>
                  {v} mL
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">
              {t(S.target)} <span className="ltr muted">(M = mol/L)</span>
            </span>
            <input type="text" dir="ltr" inputMode="decimal" value={s.targetM} disabled={lock} onChange={(ev) => chemActions.set({ targetM: ev.target.value })} data-testid="target-molarity" />
          </label>
        </div>
        {n.target === null && <p className="small field-error">{t(S.badTarget)}</p>}

        <details className="working" data-testid="solution-working">
          <summary>{t(S.working)}</summary>
          <p className="small muted">{t(S.tryFirst)}</p>
          <ol className="steps-list">
            <li>
              <span className="small muted">{t(S.calcA)}</span>
              <span className="ltr step-expr">
                Mm(<Formula f={s.solute} />) = <strong>{fmt(n.Mm, 6)} g/mol</strong>
              </span>
            </li>
            {n.target !== null && (
              <>
                <li>
                  <span className="small muted">{t(S.calcB)}</span>
                  <span className="ltr step-expr">
                    n = {n.target} mol/L × {n.V} L = <strong>{fmt(n.target * n.V, 4)} mol</strong>
                  </span>
                </li>
                <li>
                  <span className="small muted">{t(S.calcC)}</span>
                  <span className="ltr step-expr">
                    m = {fmt(n.target * n.V, 4)} mol × {fmt(n.Mm, 6)} g/mol = <strong data-testid="mass-needed">{fmt(n.needed, 4)} g</strong>
                  </span>
                </li>
              </>
            )}
          </ol>
        </details>

        <div className="prep">
          <Glassware s={s} numbers={n} />
          <div className="prep-controls">
            <label className="field">
              <span className="label">{t(S.weigh)}</span>
              <span className="input-row">
                <input type="text" dir="ltr" inputMode="decimal" value={s.weighed} disabled={lock} onChange={(ev) => chemActions.set({ weighed: ev.target.value })} data-testid="weigh-input" />
                <span className="unit ltr">g</span>
              </span>
            </label>
            {s.weighed.trim() !== '' && n.mass === null && <p className="small field-error">{t(S.badMass)}</p>}
            <p className="small">{t(S[`step${s.solStep[0].toUpperCase()}${s.solStep.slice(1)}` as 'stepEmpty'])}</p>
            <div className="btn-row">
              <button type="button" className="btn btn-sm btn-primary" disabled={s.solStep !== 'empty' || n.mass === null || n.target === null} onClick={() => chemActions.set({ solStep: 'weighed' })} data-testid="step-weigh">
                <Icon name="scale" /> {t(S.weighBtn)}
              </button>
              <button type="button" className="btn btn-sm btn-primary" disabled={s.solStep !== 'weighed'} onClick={() => chemActions.set({ solStep: 'dissolved' })} data-testid="step-dissolve">
                {t(S.transfer)}
              </button>
              <button type="button" className="btn btn-sm btn-primary" disabled={s.solStep !== 'dissolved'} onClick={() => chemActions.set({ solStep: 'filled' })} data-testid="step-fill">
                {t(S.fill)}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" disabled={s.solStep === 'empty'} onClick={() => chemActions.set({ solStep: 'empty' })}>
                <Icon name="reset" /> {t(S.again)}
              </button>
            </div>
            {s.solStep === 'filled' && n.actual !== null && (
              <>
                <div className="readouts">
                  <Readout label={t(S.obtained)} value={fmt(n.actual, 4)} unit="M" accent="purple" />
                  <Readout label={t(S.error)} value={n.error !== null ? `${n.error >= 0 ? '+' : ''}${n.error.toFixed(2)}` : '—'} unit="%" />
                </div>
                <div data-testid="solution-feedback">{n.error !== null && <Banner kind={Math.abs(n.error) <= 1 ? 'ok' : 'warn'}>{t(Math.abs(n.error) <= 1 ? S.good : S.off)}</Banner>}</div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>{t(S.molarityCalc)}</span>
        </div>
        <div className="calc-grid">
          <label className="field">
            <span className="label">
              {t(S.n)} <span className="ltr muted">(mol)</span>
            </span>
            <input type="text" dir="ltr" inputMode="decimal" value={s.calcN} onChange={(ev) => chemActions.set({ calcN: ev.target.value })} />
          </label>
          <label className="field">
            <span className="label">
              {t(S.V)} <span className="ltr muted">(L)</span>
            </span>
            <input type="text" dir="ltr" inputMode="decimal" value={s.calcV} onChange={(ev) => chemActions.set({ calcV: ev.target.value })} />
          </label>
        </div>
        {mRes.ok ? (
          <p className="calc-result">
            <span className="ltr">
              M = n / V = {s.calcN} / {s.calcV} = <strong>{fmt(mRes.value, 4)} M</strong>
            </span>
          </p>
        ) : (
          <p className="small field-error">{calcError(mRes.error, lang)}</p>
        )}

        <h3 className="sub-title">{t(S.pctTitle)}</h3>
        <p className="small muted">{t(S.pctNote)}</p>
        <div className="calc-grid">
          <label className="field">
            <span className="label">
              {t(S.pctSolute)} <span className="ltr muted">(g)</span>
            </span>
            <input type="text" dir="ltr" inputMode="decimal" value={s.pct.solute} onChange={(ev) => chemActions.set({ pct: { ...s.pct, solute: ev.target.value } })} />
          </label>
          <label className="field">
            <span className="label">
              {t(S.pctSolvent)} <span className="ltr muted">(g)</span>
            </span>
            <input type="text" dir="ltr" inputMode="decimal" value={s.pct.solvent} onChange={(ev) => chemActions.set({ pct: { ...s.pct, solvent: ev.target.value } })} />
          </label>
        </div>
        {pRes.ok ? (
          <p className="calc-result">
            <span className="ltr">
              % = {s.pct.solute} / ({s.pct.solute} + {s.pct.solvent}) × 100 = <strong>{fmt(pRes.value, 4)} %</strong>
            </span>
          </p>
        ) : (
          <p className="small field-error">{calcError(pRes.error, lang)}</p>
        )}
        <p className="small muted">{t(S.noDilution)}</p>
      </section>
    </div>
  );
}
