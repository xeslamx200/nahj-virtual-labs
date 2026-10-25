import { useState } from 'react';
import { allSpecies, checkBalance, parseEquation, solveCoefficients, type Equation } from '../../chemistry/equation';
import { balanceHints, type Hint } from '../../chemistry/hints';
import { molarMass, type MassMode } from '../../chemistry/molarMass';
import { BOOK_REACTIONS } from '../../chemistry/reactions';
import { convert, sideMasses, stoichiometry, UNIT, type CalcResult, type Quantity, type Step } from '../../chemistry/stoichiometry';
import { Icon } from '../../components/Icon';
import { Banner, Segmented } from '../../components/ui';
import { interpolate, l, useI18n, type L } from '../../i18n/i18n';
import { fmt, parseNumber } from '../../lib/format';
import { Formula } from './Formula';
import { calcError, equationError, formulaError, solveError } from './messages';
import { chemActions, useChem, type ChemUiState } from './store';

const R = {
  equation: l('Equation', 'المعادلة'),
  reaction: l('Textbook reaction', 'تفاعل من الكتاب'),
  custom: l('Your own equation', 'معادلتك'),
  customPh: l('e.g. Al + O2 -> Al2O3', 'مثال: Al + O2 -> Al2O3'),
  load: l('Load', 'حمّل'),
  customHelp: l('Type the formulas with an arrow (->). Use (s), (l), (g), (aq) for states, SO4^2- for charges. Once loaded, the formulas are locked.', 'اكتب الصيغ مع سهم (\u2066->\u2069). استخدم (s) و (l) و (g) و (aq) للحالات، و \u2066SO4^2-\u2069 للشحنات. بعد التحميل تُقفل الصيغ.'),
  locked: l('Formulas are fixed: change the coefficients only. Changing a subscript would make a different substance.', 'الصيغ ثابتة: غيّر المعاملات فقط. تغيير الرقم السفلي يعني مادّة مختلفة.'),
  coef: l('Coefficient of {f}', 'معامل {f}'),
  more: l('Increase', 'زيادة'),
  less: l('Decrease', 'إنقاص'),
  resetCoef: l('Reset coefficients', 'أعد المعاملات'),
  balanced: l('Balanced: every element has the same number of atoms on both sides.', 'موزونة: لكلّ عنصر العدد نفسه من الذرّات في الطرفين.'),
  balancedCharge: l('The total charge is the same on both sides too ({q}).', 'والشحنة الكلّيّة متساوية في الطرفين أيضًا ({q}).'),
  notLowest: l('Balanced, but not in the smallest whole-number ratio: divide every coefficient by {g}.', 'موزونة، لكن ليس بأصغر نسبة أعداد صحيحة: اقسم جميع المعاملات على {g}.'),
  unbalanced: l('Not balanced yet: {list}.', 'غير موزونة بعد: {list}.'),
  item: l('{el} has {a} on the left and {b} on the right', '{el}: {a} في اليسار و {b} في اليمين'),
  chargeOff: l('charge {a} on the left and {b} on the right', 'الشحنة {a} في اليسار و {b} في اليمين'),
  inventory: l('Atom inventory', 'جرد الذرّات'),
  inventoryNote: l('Exact counts from formulas × coefficients — one dot per atom (up to 24).', 'أعداد دقيقة من الصيغ × المعاملات، نقطة لكلّ ذرّة (حتّى 24).'),
  element: l('Element', 'العنصر'),
  reactants: l('Reactants', 'المتفاعلات'),
  products: l('Products', 'النواتج'),
  charge: l('Charge', 'الشحنة'),
  mass: l('Conservation of mass', 'حفظ الكتلة'),
  massNote: l('Mass of the amounts in the equation (coefficient × molar mass). A balanced equation always gives equal masses; equal masses alone do not prove balance (they can match by coincidence), so check every element.', 'كتلة الكمّيّات في المعادلة (المعامل × الكتلة المولية). المعادلة الموزونة تعطي دائمًا كتلتين متساويتين، لكنّ تساوي الكتلتين وحده لا يثبت الموازنة (قد يحدث مصادفةً)، لذا تحقّق من كلّ عنصر.'),
  hint: l('Hint', 'تلميح'),
  nextHint: l('Another hint', 'تلميح آخر'),
  answer: l('Show balanced equation', 'اعرض المعادلة الموزونة'),
  revealed: l('Answer shown. Check each element in the inventory to see why it balances.', 'عُرضت الإجابة. تحقّق من كلّ عنصر في الجرد لترى سبب توازنه.'),
  calcs: l('Calculations', 'الحسابات'),
  mmTab: l('Molar mass', 'الكتلة المولية'),
  convTab: l('Mole conversions', 'تحويلات المول'),
  stoichTab: l('Stoichiometry', 'الحسابات الكيميائيّة'),
  massMode: l('Atomic masses', 'الكتل الذرّيّة'),
  book: l('Textbook rounding', 'تقريب الكتاب'),
  precise: l('IUPAC values', 'قيم IUPAC'),
  formula: l('Formula', 'الصيغة'),
  count: l('Atoms', 'عدد الذرّات'),
  atomic: l('Atomic mass', 'الكتلة الذرّيّة'),
  subtotal: l('Subtotal', 'المجموع الجزئي'),
  percent: l('% by mass', 'النسبة المئويّة بالكتلة'),
  total: l('Molar mass', 'الكتلة المولية'),
  massNumberWarn: l('{s} has no standard atomic weight; the mass number of a long-lived isotope is used.', 'ليس لـ {s} وزن ذرّي قياسي، ويُستخدم العدد الكتلي لنظير طويل العمر.'),
  amount: l('Amount', 'الكمّيّة'),
  from: l('Given as', 'المعطى بوحدة'),
  to: l('Find', 'المطلوب'),
  q: { mass: l('mass (g)', 'الكتلة (g)'), moles: l('moles (mol)', 'عدد المولات (mol)'), particles: l('particles', 'عدد الجسيمات'), volume: l('gas volume at STP (L)', 'حجم الغاز عند STP (L)') } as Record<Quantity, L>,
  working: l('Working', 'خطوات الحلّ'),
  result: l('Result', 'النتيجة'),
  given: l('Given substance', 'المادّة المعطاة'),
  target: l('Substance to find', 'المادّة المطلوبة'),
  stoichNeedsBalance: l('The calculator uses the equation above. Balance it first.', 'تستخدم الحاسبة المعادلة أعلاه. وازنها أوّلًا.'),
  kinds: {
    'molar-mass': l('Molar mass', 'الكتلة المولية'),
    'to-moles': l('Convert to moles', 'التحويل إلى مولات'),
    ratio: l('Mole ratio from the balanced equation', 'النسبة المولية من المعادلة الموزونة'),
    'from-moles': l('Convert from moles', 'التحويل من المولات'),
  } as Record<Step['kind'], L>,
  stp: l('Volumes use Vm = 22.4 L/mol (gases at STP only).', 'تستخدم الحجوم Vm = 22.4 L/mol (للغازات عند STP فقط).'),
};

const HINTS: Record<Hint['code'], L> = {
  'start-with': l('Start with {el}: it appears in only one reactant and one product.', 'ابدأ بـ {el}: فهو يظهر في متفاعل واحد وناتج واحد فقط.'),
  polyatomic: l('{ion} appears unchanged on both sides: balance it as one unit.', 'يظهر {ion} دون تغيير في الطرفين: وازنه كوحدة واحدة.'),
  'o-last': l('This is a combustion: balance C and H first, and oxygen last.', 'هذا تفاعل احتراق: وازن C و H أوّلًا، والأكسجين أخيرًا.'),
  'elements-last': l('Substances made of one element ({f}) are easiest to adjust last.', 'الموادّ المكوّنة من عنصر واحد ({f}) هي الأسهل تعديلًا في النهاية.'),
  mismatch: l('Right now {el} has {a} atoms on the left and {b} on the right.', 'حاليًّا لـ {el} عدد {a} من الذرّات في اليسار و {b} في اليمين.'),
  charge: l('Atoms are balanced but the charge is not: {a} on the left, {b} on the right.', 'الذرّات متوازنة لكنّ الشحنة ليست كذلك: {a} في اليسار و {b} في اليمين.'),
  halves: l('If you need half a molecule (for example 3½ O₂), double every coefficient.', 'إذا احتجت إلى نصف جزيء (مثل 3½ O₂)، فضاعف جميع المعاملات.'),
  lowest: l('All coefficients share a common factor: divide them to get the smallest whole numbers.', 'لجميع المعاملات عامل مشترك: اقسمها للحصول على أصغر أعداد صحيحة.'),
};

function hintText(h: Hint, lang: 'en' | 'ar') {
  const v: Record<string, string | number> = {};
  if ('element' in h) v.el = h.element;
  if ('ion' in h) v.ion = h.ion;
  if ('left' in h) {
    v.a = h.left;
    v.b = h.right;
  }
  if ('formulas' in h) v.f = h.formulas.join(', ');
  return interpolate(HINTS[h.code][lang], v);
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export function currentEquation(s: Pick<ChemUiState, 'equationText'>): Equation | null {
  const r = parseEquation(s.equationText);
  return r.ok ? r.value : null;
}

/* ----------------------------------------------------------- balancer --- */

function Dots({ n, cls }: { n: number; cls: string }) {
  const shown = Math.min(n, 24);
  return (
    <span className="atom-dots" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => (
        <span key={i} className={`atom-dot ${cls}`} />
      ))}
      {n > 24 && <span className="small muted">+{n - 24}</span>}
    </span>
  );
}

function Balancer({ eq }: { eq: Equation }) {
  const { t, lang } = useI18n();
  const s = useChem();
  const species = allSpecies(eq);
  const check = checkBalance(eq, s.coefficients);
  const solve = solveCoefficients(eq);
  const hints = balanceHints(eq, s.coefficients);
  const masses = sideMasses(eq, s.coefficients, s.massMode);
  const hasCharge = species.some((sp) => sp.charge !== 0);
  const g = s.coefficients.reduce(gcd);

  const term = (i: number) => {
    const sp = species[i];
    const c = s.coefficients[i];
    const label = interpolate(R.coef[lang], { f: sp.formula });
    return (
      <div className="eq-term" key={i}>
        <div className="coef" role="group" aria-label={label}>
          <button type="button" className="coef-btn" aria-label={`${t(R.less)} — ${label}`} disabled={c <= 1} onClick={() => chemActions.setCoefficient(i, c - 1)}>
            −
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={c}
            aria-label={label}
            data-testid={`coef-${i}`}
            onChange={(ev) => chemActions.setCoefficient(i, ev.target.valueAsNumber)}
          />
          <button type="button" className="coef-btn" aria-label={`${t(R.more)} — ${label}`} disabled={c >= 99} onClick={() => chemActions.setCoefficient(i, c + 1)}>
            +
          </button>
        </div>
        <span className="eq-formula" title={t(R.locked)}>
          <Formula f={sp.formula + (sp.charge ? `^${Math.abs(sp.charge) === 1 ? '' : Math.abs(sp.charge)}${sp.charge > 0 ? '+' : '-'}` : '')} state={sp.state} />
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="eq-row" dir="ltr" data-testid="equation-row">
        {eq.reactants.map((_, i) => (
          <span key={`r${i}`} className="eq-chunk">
            {i > 0 && <span className="eq-op">+</span>}
            {term(i)}
          </span>
        ))}
        <span className="eq-op eq-arrow">→</span>
        {eq.products.map((_, j) => (
          <span key={`p${j}`} className="eq-chunk">
            {j > 0 && <span className="eq-op">+</span>}
            {term(eq.reactants.length + j)}
          </span>
        ))}
      </div>
      <p className="small muted">
        <Icon name="info" /> {t(R.locked)}
      </p>

      <div data-testid="balance-status">
        {check.status === 'balanced' && (
          <Banner kind="ok">
            {t(R.balanced)} {hasCharge ? t(R.balancedCharge, { q: check.tally.chargeLeft }) : ''}
          </Banner>
        )}
        {check.status === 'balanced-not-lowest' && <Banner kind="warn">{t(R.notLowest, { g })}</Banner>}
        {check.status === 'unbalanced' && (
          <Banner kind="warn">
            {t(R.unbalanced, {
              list: [
                ...check.tally.elements.filter((e) => e.left !== e.right).map((e) => t(R.item, { el: e.symbol, a: e.left, b: e.right })),
                ...(check.chargeBalanced ? [] : [t(R.chargeOff, { a: check.tally.chargeLeft, b: check.tally.chargeRight })]),
              ].join(lang === 'ar' ? '، ' : '; '),
            })}
          </Banner>
        )}
        {!solve.ok && <Banner kind="error">{solveError(solve, lang)}</Banner>}
      </div>

      <div className="inventory">
        <div className="panel-title">
          <span>{t(R.inventory)}</span>
        </div>
        <div className="table-wrap">
          <table className="data inventory-table">
            <thead>
              <tr>
                <th scope="col">{t(R.element)}</th>
                <th scope="col">{t(R.reactants)}</th>
                <th scope="col">{t(R.products)}</th>
                <th scope="col">
                  <span className="sr-only">✓</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {check.tally.elements.map((e) => (
                <tr key={e.symbol} className={e.left === e.right ? 'ok' : 'bad'}>
                  <th scope="row">{e.symbol}</th>
                  <td>
                    <span className="num">{e.left}</span> <Dots n={e.left} cls="left" />
                  </td>
                  <td>
                    <span className="num">{e.right}</span> <Dots n={e.right} cls="right" />
                  </td>
                  <td aria-label={e.left === e.right ? '✓' : '✗'}>{e.left === e.right ? <Icon name="check" /> : <Icon name="x" />}</td>
                </tr>
              ))}
              {hasCharge && (
                <tr className={check.chargeBalanced ? 'ok' : 'bad'}>
                  <th scope="row">{t(R.charge)}</th>
                  <td className="num">{check.tally.chargeLeft}</td>
                  <td className="num">{check.tally.chargeRight}</td>
                  <td>{check.chargeBalanced ? <Icon name="check" /> : <Icon name="x" />}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="small muted">{t(R.inventoryNote)}</p>
      </div>

      <div className="mass-compare" data-testid="mass-compare">
        <p className="label">{t(R.mass)}</p>
        <div className="mass-bars">
          {[
            { k: 'L', label: t(R.reactants), v: masses.left },
            { k: 'R', label: t(R.products), v: masses.right },
          ].map((b) => (
            <div key={b.k} className="mass-bar-row">
              <span className="small">{b.label}</span>
              <span className="mass-bar">
                <span className={`mass-fill ${b.k === 'L' ? 'left' : 'right'}`} style={{ width: `${(100 * b.v) / Math.max(masses.left, masses.right)}%` }} />
              </span>
              <span className="num ltr">{fmt(b.v, 5)} g</span>
            </div>
          ))}
        </div>
        <p className="small muted">{t(R.massNote)}</p>
      </div>

      <div className="hint-row">
        {s.hintsShown > 0 && (
          <ol className="hint-list small">
            {hints.slice(0, s.hintsShown).map((h, i) => (
              <li key={i}>{hintText(h, lang)}</li>
            ))}
          </ol>
        )}
        <div className="btn-row">
          {check.status !== 'balanced' && s.hintsShown < hints.length && (
            <button type="button" className="btn btn-sm" onClick={() => chemActions.set({ hintsShown: s.hintsShown + 1 })} data-testid="balance-hint">
              <Icon name="lightbulb" /> {t(s.hintsShown ? R.nextHint : R.hint)}
            </button>
          )}
          {check.status !== 'balanced' && solve.ok && (s.hintsShown > 0 || s.revealed) && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => chemActions.set({ coefficients: solve.coefficients, revealed: true })}
              data-testid="balance-reveal"
            >
              {t(R.answer)}
            </button>
          )}
          <button type="button" className="btn btn-sm btn-ghost" onClick={chemActions.resetCoefficients}>
            <Icon name="reset" /> {t(R.resetCoef)}
          </button>
        </div>
        {s.revealed && check.status === 'balanced' && <p className="small muted">{t(R.revealed)}</p>}
      </div>
    </>
  );
}

function EquationPicker() {
  const { t, lang } = useI18n();
  const s = useChem();
  const [draft, setDraft] = useState(s.customDraft);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="eq-picker">
      <label className="field">
        <span className="label">{t(R.reaction)}</span>
        <select
          value={s.reactionId}
          onChange={(ev) => {
            if (ev.target.value !== 'custom') chemActions.loadReaction(ev.target.value);
          }}
          data-testid="reaction-select"
        >
          {BOOK_REACTIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {t(r.name)} — {t(r.ref)}
            </option>
          ))}
          {s.reactionId === 'custom' && <option value="custom">{t(R.custom)}</option>}
        </select>
      </label>
      <form
        className="field"
        onSubmit={(ev) => {
          ev.preventDefault();
          const r = parseEquation(draft);
          if (!r.ok) {
            setErr(equationError(r.error, lang));
            return;
          }
          setErr(null);
          chemActions.set({ customDraft: draft });
          chemActions.loadCustom(draft);
        }}
      >
        <span className="label">{t(R.custom)}</span>
        <span className="input-row">
          <input type="text" dir="ltr" value={draft} placeholder={t(R.customPh)} onChange={(ev) => setDraft(ev.target.value)} aria-describedby="custom-eq-help" data-testid="custom-equation" maxLength={200} />
          <button type="submit" className="btn btn-sm">
            {t(R.load)}
          </button>
        </span>
        <span id="custom-eq-help" className="small muted">
          {t(R.customHelp)}
        </span>
        {err && (
          <span className="small field-error" role="alert" data-testid="custom-error">
            {err}
          </span>
        )}
      </form>
    </div>
  );
}

/* -------------------------------------------------------- calculators --- */

function StepsList({ res }: { res: CalcResult }) {
  const { t, lang } = useI18n();
  if (!res.ok) return <Banner kind="warn">{calcError(res.error, lang)}</Banner>;
  return (
    <div className="steps" data-testid="calc-steps">
      <p className="label">{t(R.working)}</p>
      <ol className="steps-list">
        {res.steps.map((st, i) => (
          <li key={i}>
            <span className="small muted">{t(R.kinds[st.kind])}</span>
            <span className="ltr step-expr">
              {st.expr} = <strong>{fmtValue(st.value, st.unit)}</strong>
            </span>
          </li>
        ))}
      </ol>
      <p className="calc-result" data-testid="calc-result">
        {t(R.result)}: <strong className="ltr">{fmtValue(res.value, res.unit)}</strong>
      </p>
    </div>
  );
}

function fmtValue(v: number, unit: string) {
  return unit === 'particles' ? `${v.toExponential(3)}` : `${fmt(v, 4)} ${unit}`;
}

function MolarMassCalc({ mode }: { mode: MassMode }) {
  const { t, lang } = useI18n();
  const s = useChem();
  const r = molarMass(s.mmFormula, mode);
  return (
    <div className="calc">
      <label className="field">
        <span className="label">{t(R.formula)}</span>
        <input type="text" dir="ltr" value={s.mmFormula} onChange={(ev) => chemActions.set({ mmFormula: ev.target.value })} data-testid="mm-formula" maxLength={80} />
      </label>
      {!r.ok ? (
        <p className="small field-error" role="alert">
          {formulaError(r.error, lang)}
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">{t(R.element)}</th>
                  <th scope="col" className="num">{t(R.count)}</th>
                  <th scope="col" className="num">
                    {t(R.atomic)} <span className="ltr muted">(g/mol)</span>
                  </th>
                  <th scope="col" className="num">
                    {t(R.subtotal)} <span className="ltr muted">(g/mol)</span>
                  </th>
                  <th scope="col" className="num">{t(R.percent)}</th>
                </tr>
              </thead>
              <tbody>
                {r.value.parts.map((p) => (
                  <tr key={p.symbol}>
                    <th scope="row">{p.symbol}</th>
                    <td className="num">{p.count}</td>
                    <td className="num">{p.atomicMass}</td>
                    <td className="num">{fmt(p.subtotal, 6)}</td>
                    <td className="num">{p.percent.toFixed(2)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="calc-result" data-testid="mm-result">
            {t(R.total)} <Formula f={r.value.formula} /> = <strong className="ltr">{fmt(r.value.total, 6)} g/mol</strong>
          </p>
          {r.value.parts
            .filter((p) => p.massNumberOnly)
            .map((p) => (
              <p key={p.symbol} className="small muted">
                {t(R.massNumberWarn, { s: p.symbol })}
              </p>
            ))}
        </>
      )}
    </div>
  );
}

const QUANTITIES: Quantity[] = ['mass', 'moles', 'particles', 'volume'];

function ConversionCalc({ mode }: { mode: MassMode }) {
  const { t, lang } = useI18n();
  const s = useChem();
  const c = s.conv;
  const mm = molarMass(c.formula, mode);
  const amount = parseNumber(c.amount);
  const set = (p: Partial<ChemUiState['conv']>) => chemActions.set({ conv: { ...c, ...p } });
  return (
    <div className="calc">
      <div className="calc-grid">
        <label className="field">
          <span className="label">{t(R.formula)}</span>
          <input type="text" dir="ltr" value={c.formula} onChange={(ev) => set({ formula: ev.target.value })} maxLength={80} data-testid="conv-formula" />
        </label>
        <label className="field">
          <span className="label">{t(R.amount)}</span>
          <input type="text" dir="ltr" inputMode="decimal" value={c.amount} onChange={(ev) => set({ amount: ev.target.value })} data-testid="conv-amount" />
        </label>
        <label className="field">
          <span className="label">{t(R.from)}</span>
          <select value={c.from} onChange={(ev) => set({ from: ev.target.value as Quantity })}>
            {QUANTITIES.map((q) => (
              <option key={q} value={q}>
                {t(R.q[q])}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">{t(R.to)}</span>
          <select value={c.to} onChange={(ev) => set({ to: ev.target.value as Quantity })}>
            {QUANTITIES.map((q) => (
              <option key={q} value={q}>
                {t(R.q[q])}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!mm.ok ? (
        <p className="small field-error" role="alert">
          {formulaError(mm.error, lang)}
        </p>
      ) : (
        <>
          <p className="small muted">
            Mm(<Formula f={mm.value.formula} />) = <span className="ltr">{fmt(mm.value.total, 6)} g/mol</span>
          </p>
          <StepsList res={convert(amount ?? NaN, c.from, c.to, mm.value.total)} />
          {(c.from === 'volume' || c.to === 'volume') && <p className="small muted">{t(R.stp)}</p>}
        </>
      )}
    </div>
  );
}

export function stoichResult(s: ChemUiState, eq: Equation | null): CalcResult | null {
  if (!eq) return null;
  return stoichiometry(eq, s.coefficients, {
    given: { index: s.stoich.given, amount: parseNumber(s.stoich.amount) ?? NaN, quantity: s.stoich.givenQ },
    target: { index: s.stoich.target, quantity: s.stoich.targetQ },
    mode: s.massMode,
  });
}

function StoichCalc({ eq }: { eq: Equation }) {
  const { t } = useI18n();
  const s = useChem();
  const species = allSpecies(eq);
  const st = s.stoich;
  const set = (p: Partial<ChemUiState['stoich']>) => chemActions.set({ stoich: { ...st, ...p } });
  const balanced = checkBalance(eq, s.coefficients).status !== 'unbalanced';
  const res = stoichResult(s, eq)!;
  const qs: Quantity[] = ['mass', 'moles', 'volume'];
  const opts = species.map((sp, i) => (
    <option key={i} value={i}>
      {sp.formula}
      {sp.state ? `(${sp.state})` : ''}
    </option>
  ));
  return (
    <div className="calc">
      {!balanced && <Banner kind="warn">{t(R.stoichNeedsBalance)}</Banner>}
      <div className="calc-grid">
        <label className="field">
          <span className="label">{t(R.given)}</span>
          <select value={st.given} onChange={(ev) => set({ given: Number(ev.target.value) })} dir="ltr" data-testid="stoich-given">
            {opts}
          </select>
        </label>
        <label className="field">
          <span className="label">{t(R.amount)}</span>
          <span className="input-row">
            <input type="text" dir="ltr" inputMode="decimal" value={st.amount} onChange={(ev) => set({ amount: ev.target.value })} data-testid="stoich-amount" />
            <select value={st.givenQ} onChange={(ev) => set({ givenQ: ev.target.value as Quantity })} aria-label={t(R.from)}>
              {qs.map((q) => (
                <option key={q} value={q}>
                  {UNIT[q]}
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className="field">
          <span className="label">{t(R.target)}</span>
          <select value={st.target} onChange={(ev) => set({ target: Number(ev.target.value) })} dir="ltr" data-testid="stoich-target">
            {opts}
          </select>
        </label>
        <label className="field">
          <span className="label">{t(R.to)}</span>
          <select value={st.targetQ} onChange={(ev) => set({ targetQ: ev.target.value as Quantity })}>
            {qs.map((q) => (
              <option key={q} value={q}>
                {t(R.q[q])}
              </option>
            ))}
          </select>
        </label>
      </div>
      {balanced && <StepsList res={res} />}
      <p className="small muted">{t(R.stp)}</p>
    </div>
  );
}

function Calculators({ eq }: { eq: Equation | null }) {
  const { t } = useI18n();
  const s = useChem();
  const [tab, setTab] = useState<'mm' | 'conv' | 'stoich'>(s.activityId === 'stoichiometry' ? 'stoich' : 'mm');
  return (
    <section className="panel calcs">
      <div className="panel-title">
        <span>{t(R.calcs)}</span>
        <Segmented
          label={t(R.massMode)}
          value={s.massMode}
          onChange={(massMode) => chemActions.set({ massMode })}
          options={[
            { value: 'book', label: t(R.book) },
            { value: 'precise', label: t(R.precise) },
          ]}
        />
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ['mm', R.mmTab],
            ['conv', R.convTab],
            ['stoich', R.stoichTab],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)} data-testid={`calc-tab-${id}`}>
            {t(label)}
          </button>
        ))}
      </div>
      {tab === 'mm' && <MolarMassCalc mode={s.massMode} />}
      {tab === 'conv' && <ConversionCalc mode={s.massMode} />}
      {tab === 'stoich' && eq && <StoichCalc eq={eq} />}
    </section>
  );
}

export function ReactionLab() {
  const { t } = useI18n();
  const s = useChem();
  const eq = currentEquation(s);
  return (
    <div className="chem-reactions">
      <section className="panel">
        <div className="panel-title">
          <span>{t(R.equation)}</span>
        </div>
        <EquationPicker />
        {eq && s.coefficients.length === allSpecies(eq).length && <Balancer eq={eq} />}
      </section>
      <Calculators eq={eq} />
    </div>
  );
}

/** Totals used by the balancing activity's records. */
export function balanceRecord(s: ChemUiState, eq: Equation) {
  const check = checkBalance(eq, s.coefficients);
  const m = sideMasses(eq, s.coefficients, s.massMode);
  return {
    atomsL: check.tally.elements.reduce((a, e) => a + e.left, 0),
    atomsR: check.tally.elements.reduce((a, e) => a + e.right, 0),
    massL: m.left,
    massR: m.right,
    balanced: check.status === 'unbalanced' ? 0 : 1,
  };
}

