import { bohrNotation, inBookScope, ionShells, shells, valenceElectrons } from '../../chemistry/config';
import { ELEMENTS, FLAME_COLOURS, elementBySymbol, gridPosition, isMainGroup, type Element, type Family } from '../../chemistry/elements';
import { compareElements, trendMembers } from '../../chemistry/trends';
import { Icon } from '../../components/Icon';
import { LineChart, SERIES_COLORS, type ChartSeries } from '../../components/LineChart';
import { Banner, Readout, Segmented } from '../../components/ui';
import { l, useI18n, type L } from '../../i18n/i18n';
import { EqText, Formula } from './Formula';
import { chemActions, useChem, type TrendSet } from './store';

export const FAMILY_NAMES: Record<Family, L> = {
  alkali: l('Alkali metal', 'فلزّ قلوي'),
  'alkaline-earth': l('Alkaline-earth metal', 'فلزّ قلوي ترابي'),
  transition: l('Transition metal', 'فلزّ انتقالي'),
  lanthanide: l('Lanthanide', 'لانثانيد'),
  actinide: l('Actinide', 'أكتينيد'),
  'post-transition': l('Other metal', 'فلزّ آخر'),
  metalloid: l('Metalloid', 'شبه فلزّ'),
  nonmetal: l('Non-metal', 'لافلزّ'),
  halogen: l('Halogen', 'هالوجين'),
  noble: l('Noble gas', 'غاز نبيل'),
};
export const CLASS_NAMES = { metal: l('Metal', 'فلزّ'), nonmetal: l('Non-metal', 'لافلزّ'), metalloid: l('Metalloid', 'شبه فلزّ') };
const STATE_NAMES = { solid: l('Solid', 'صلب'), liquid: l('Liquid', 'سائل'), gas: l('Gas', 'غاز'), unknown: l('Unknown', 'غير معروفة') };

export const TREND_NAMES: Record<TrendSet, L> = {
  period2: l('Period 2', 'الدورة 2'),
  period3: l('Period 3', 'الدورة 3'),
  group1: l('Group 1', 'المجموعة 1'),
  group17: l('Group 17', 'المجموعة 17'),
};

const P = {
  table: l('Periodic table', 'الجدول الدوري'),
  colour: l('Colour by', 'التلوين حسب'),
  byClass: l('Metal / non-metal', 'فلزّ / لافلزّ'),
  byFamily: l('Family', 'العائلة'),
  trend: l('Trend set', 'مجموعة التدرّج'),
  tableHelp: l('Select an element. Use the arrow keys to move between elements.', 'اختر عنصرًا. استخدم مفاتيح الأسهم للتنقّل بين العناصر.'),
  fRow: l('{a}–{b}: see the row below', '{a}–{b}: انظر الصفّ أدناه'),
  Z: l('Atomic number', 'العدد الذرّي'),
  mass: l('Atomic mass', 'الكتلة الذرّيّة'),
  massNumber: l('No stable isotope: mass number of a long-lived isotope, not a standard atomic weight.', 'لا يوجد نظير مستقرّ: العدد الكتلي لنظير طويل العمر، وليس وزنًا ذرّيًّا قياسيًّا.'),
  period: l('Period', 'الدورة'),
  group: l('Group', 'المجموعة'),
  fBlock: l('f-block', 'الفئة f'),
  state: l('State at 25 °C', 'الحالة عند 25 °C'),
  bohr: l('Bohr distribution', 'توزيع بور الإلكتروني'),
  levels: l('Energy levels', 'مستويات الطاقة'),
  valence: l('Valence electrons', 'إلكترونات التكافؤ'),
  ion: l('Common ion', 'الأيون الشائع'),
  radius: l('Atomic radius', 'نصف القطر الذرّي'),
  noRadius: l('not given in the textbook', 'غير مذكور في الكتاب'),
  melting: l('Melting point (Table 6-1)', 'درجة الانصهار (الجدول 6-1)'),
  flame: l('Flame colour (Table 8-1)', 'لون اللهب (الجدول 8-1)'),
  bohrNote: l(
    'Bohr model: a simplified picture of electrons in main energy levels around the nucleus. It is not the full quantum picture of the atom.',
    'نموذج بور: صورة مبسّطة للإلكترونات في مستويات الطاقة الرئيسة حول النواة، وليس الصورة الكمّيّة الكاملة للذرّة.',
  ),
  beyond: l(
    'Beyond the textbook’s Bohr treatment (main-group elements of periods 1–4). The shell counts come from the element’s ground-state electron configuration and are shown for reference.',
    'خارج نطاق معالجة الكتاب لنموذج بور (العناصر الممثّلة في الدورات 1–4). أعداد الإلكترونات في المستويات مأخوذة من التوزيع الإلكتروني للحالة المستقرّة، وتُعرض للاطّلاع.',
  ),
  predicted: l('Synthetic element: the configuration and properties are predictions.', 'عنصر مُصنَّع: التوزيع الإلكتروني والخواصّ تنبّؤات.'),
  nucleus: l('Nucleus +{Z}', 'النواة ‎+{Z}'),
  bohrLabel: l('Bohr model of {name}: {dist}', 'نموذج بور لعنصر {name}: {dist}'),
  reactivity: l('Reactivity (textbook)', 'النشاط الكيميائي (من الكتاب)'),
  trendTitle: l('Atomic radius – atomic number', 'نصف القطر الذرّي – العدد الذرّي'),
  radiusSeries: l('Textbook radius', 'نصف القطر في الكتاب'),
  selected: l('Selected', 'المحدّد'),
  trendAcross: l('Across a period the radius decreases: the nuclear charge increases while the number of energy levels stays the same.', 'عبر الدورة يقلّ نصف القطر: تزداد شحنة النواة بينما يبقى عدد مستويات الطاقة ثابتًا.'),
  trendDown: l('Down a group the radius increases: each element has one more energy level.', 'إلى أسفل المجموعة يزداد نصف القطر: لكلّ عنصر مستوى طاقة إضافي.'),
  compare: l('Compare with', 'قارن مع'),
  none: l('— choose —', '— اختر —'),
  cmpRadius: l('Larger atomic radius: {s}', 'نصف القطر الذرّي الأكبر: {s}'),
  cmpRadiusNA: l('Radius: the textbook does not give both values.', 'نصف القطر: لا يذكر الكتاب القيمتين.'),
  cmpMetal: l('More metallic: {s}', 'الخواصّ الفلزّيّة أقوى: {s}'),
  cmpReactive: l('Predicted to be more reactive: {s}', 'المتوقّع أنّه أنشط: {s}'),
  cmpSameGroup: l('Same group — rule: down a group metals become more reactive and non-metals less reactive.', 'المجموعة نفسها — القاعدة: إلى أسفل المجموعة يزداد نشاط الفلزّات ويقلّ نشاط اللافلزّات.'),
  cmpSamePeriod: l('Same period — rule: across a period metal reactivity decreases and non-metal reactivity increases.', 'الدورة نفسها — القاعدة: عبر الدورة يقلّ نشاط الفلزّات ويزداد نشاط اللافلزّات.'),
  cmpNone: l('The textbook’s trend rules compare representative elements in the same group or the same period only.', 'تقارن قواعد التدرّج في الكتاب بين العناصر الممثّلة في المجموعة نفسها أو الدورة نفسها فقط.'),
  cmpNoble: l('Noble gases are very unreactive (full outer level), so no reactivity order is predicted.', 'الغازات النبيلة قليلة النشاط جدًّا (مستواها الأخير ممتلئ)، لذا لا يُتنبّأ بترتيب للنشاط.'),
  cmpMixed: l('A metal and a non-metal react in different ways (losing vs gaining electrons), so their reactivity is not ranked.', 'يتفاعل الفلزّ واللافلزّ بطريقتين مختلفتين (فقد الإلكترونات أو كسبها)، لذا لا يُرتَّب نشاطهما.'),
  cmpMetalloid: l('Metalloids are not ranked by these reactivity rules.', 'لا تُرتَّب أشباه الفلزّات وفق قواعد النشاط هذه.'),
};

const REACTIVITY: Partial<Record<number, { text: L; eq?: string[] }>> = {
  1: {
    text: l('The most reactive metals; reactivity increases down the group. They react with water to form a hydroxide and hydrogen, and with oxygen to form an oxide.', 'أنشط الفلزّات، ويزداد نشاطها إلى أسفل المجموعة. تتفاعل مع الماء مكوّنة هيدروكسيدًا وغاز الهيدروجين، ومع الأكسجين مكوّنة أكسيدًا.'),
    eq: ['2M + 2H2O → 2MOH + H2', '4M + O2 → 2M2O'],
  },
  2: {
    text: l('Reactive metals, less than group 1; reactivity increases down the group.', 'فلزّات نشطة، أقلّ نشاطًا من المجموعة 1، ويزداد نشاطها إلى أسفل المجموعة.'),
    eq: ['M + 2H2O → M(OH)2 + H2', '2M + O2 → 2MO'],
  },
  17: {
    text: l('Very reactive non-metals; reactivity decreases down the group, so a halogen displaces a less reactive one from its salt.', 'لافلزّات نشطة جدًّا، ويقلّ نشاطها إلى أسفل المجموعة، لذا يحلّ الهالوجين محلّ هالوجين أقلّ نشاطًا في أملاحه.'),
    eq: ['2KZ + X2 → 2KX + Z2'],
  },
  18: { text: l('Very unreactive: the outer energy level is full.', 'قليلة النشاط جدًّا: مستوى الطاقة الأخير ممتلئ.') },
};

/* ---------------------------------------------------------------- Bohr --- */

export function BohrModel({ e }: { e: Element }) {
  const { t, lang } = useI18n();
  const s = shells(e.Z);
  const size = 240;
  const c = size / 2;
  const r0 = 24;
  const step = (c - r0 - 10) / Math.max(1, s.length);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="bohr" role="img" aria-label={t(P.bohrLabel, { name: lang === 'ar' ? e.ar : e.en, dist: bohrNotation(s) })}>
      <circle cx={c} cy={c} r={r0 - 4} className="bohr-nucleus" />
      <text x={c} y={c - 2} className="bohr-sym">
        {e.symbol}
      </text>
      <text x={c} y={c + 11} className="bohr-charge">
        +{e.Z}
      </text>
      {s.map((n, i) => {
        const r = r0 + step * (i + 1);
        const dot = Math.max(1.8, Math.min(4.2, (Math.PI * r) / Math.max(n, 1) / 2.2));
        return (
          <g key={i}>
            <circle cx={c} cy={c} r={r} className="bohr-shell" />
            {Array.from({ length: n }, (_, k) => {
              const a = (2 * Math.PI * k) / n - Math.PI / 2 + i * 0.35;
              return <circle key={k} cx={c + r * Math.cos(a)} cy={c + r * Math.sin(a)} r={dot} className={i === s.length - 1 ? 'bohr-e outer' : 'bohr-e'} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* --------------------------------------------------------------- table --- */

function cellClass(e: Element, colorBy: 'class' | 'family') {
  return colorBy === 'class' ? `pt-${e.cls}` : `pt-f-${e.family}`;
}

function PeriodicGrid() {
  const { t, lang } = useI18n();
  const s = useChem();
  const members = new Set(trendMembers(s.trendSet).map((e) => e.symbol));
  const move = (from: Element, key: string) => {
    const { row, col } = gridPosition(from);
    const d = { ArrowRight: [0, lang === 'ar' ? -1 : 1], ArrowLeft: [0, lang === 'ar' ? 1 : -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[key];
    if (!d) return;
    for (let k = 1; k < 18; k++) {
      const target = ELEMENTS.find((x) => {
        const p = gridPosition(x);
        return p.row === row + d[0] * k && p.col === col + d[1] * k;
      });
      if (target) {
        chemActions.selectElement(target.symbol);
        document.getElementById(`pt-${target.symbol}`)?.focus();
        return;
      }
      if (d[0] !== 0) break;
    }
  };
  return (
    <div className="pt-wrap" role="group" aria-label={t(P.table)}>
      <div className="pt-grid" dir="ltr">
        {ELEMENTS.map((e) => {
          const { row, col } = gridPosition(e);
          const selected = e.symbol === s.element;
          return (
            <button
              key={e.Z}
              id={`pt-${e.symbol}`}
              type="button"
              className={`pt-cell ${cellClass(e, s.colorBy)} ${selected ? 'selected' : ''} ${members.has(e.symbol) ? 'in-trend' : ''} ${e.symbol === s.compareWith ? 'compared' : ''}`}
              style={{ gridRow: row, gridColumn: col }}
              aria-pressed={selected}
              aria-label={`${e.Z} ${lang === 'ar' ? e.ar : e.en} (${e.symbol})`}
              tabIndex={selected ? 0 : -1}
              onClick={() => chemActions.selectElement(e.symbol)}
              onKeyDown={(ev) => {
                if (ev.key.startsWith('Arrow')) {
                  ev.preventDefault();
                  move(e, ev.key);
                }
              }}
              data-testid={`pt-${e.symbol}`}
            >
              <span className="pt-z">{e.Z}</span>
              <span className="pt-sym">{e.symbol}</span>
            </button>
          );
        })}
        <span className="pt-placeholder" style={{ gridRow: 6, gridColumn: 3 }} title={t(P.fRow, { a: 57, b: 71 })}>
          57–71
        </span>
        <span className="pt-placeholder" style={{ gridRow: 7, gridColumn: 3 }} title={t(P.fRow, { a: 89, b: 103 })}>
          89–103
        </span>
        <span className="pt-gap" style={{ gridRow: 8, gridColumn: '1 / -1' }} />
      </div>
    </div>
  );
}

function Legend() {
  const { t } = useI18n();
  const { colorBy } = useChem();
  const items =
    colorBy === 'class'
      ? (['metal', 'metalloid', 'nonmetal'] as const).map((k) => ({ cls: `pt-${k}`, label: t(CLASS_NAMES[k]) }))
      : (['alkali', 'alkaline-earth', 'transition', 'post-transition', 'lanthanide', 'actinide', 'metalloid', 'nonmetal', 'halogen', 'noble'] as Family[]).map((k) => ({ cls: `pt-f-${k}`, label: t(FAMILY_NAMES[k]) }));
  return (
    <ul className="pt-legend small">
      {items.map((it) => (
        <li key={it.cls}>
          <span className={`pt-swatch ${it.cls}`} aria-hidden="true" /> {it.label}
        </li>
      ))}
      <li>
        <span className="pt-swatch in-trend-swatch" aria-hidden="true" /> {t(P.trend)}
      </li>
    </ul>
  );
}

/* -------------------------------------------------------------- detail --- */

function ElementCard({ e }: { e: Element }) {
  const { t, lang } = useI18n();
  const s = shells(e.Z);
  const v = valenceElectrons(e);
  const ion = ionShells(e);
  const flame = FLAME_COLOURS[e.symbol];
  const rx = e.group !== null && isMainGroup(e) ? REACTIVITY[e.group] : undefined;
  return (
    <section className="panel el-card" aria-live="polite" data-testid="element-card">
      <div className="el-head">
        <div className={`el-tile ${cellClass(e, 'class')}`}>
          <span className="pt-z">{e.Z}</span>
          <span className="el-sym">{e.symbol}</span>
        </div>
        <div>
          <h2 className="el-name">{lang === 'ar' ? e.ar : e.en}</h2>
          <p className="small muted">
            {t(CLASS_NAMES[e.cls])}
            {t(FAMILY_NAMES[e.family]) !== t(CLASS_NAMES[e.cls]) && <> · {t(FAMILY_NAMES[e.family])}</>}
          </p>
        </div>
      </div>
      <div className="readouts el-readouts">
        <Readout label={t(P.Z)} value={String(e.Z)} />
        <Readout label={t(P.mass)} value={e.massNumberOnly ? `[${e.mass}]` : String(e.mass)} unit={e.massNumberOnly ? '' : 'g/mol'} title={e.massNumberOnly ? t(P.massNumber) : undefined} />
        <Readout label={t(P.period)} value={String(e.period)} />
        <Readout label={t(P.group)} value={e.group === null ? t(P.fBlock) : String(e.group)} text={e.group === null} />
      </div>
      <div className="el-bohr">
        <BohrModel e={e} />
        <div className="el-bohr-facts">
          <p className="label">{t(P.bohr)}</p>
          <p className="el-dist ltr" data-testid="bohr-notation">
            {bohrNotation(s)}
          </p>
          <dl className="facts small">
            <div>
              <dt>{t(P.levels)}</dt>
              <dd>{s.length}</dd>
            </div>
            {v !== null && (
              <div>
                <dt>{t(P.valence)}</dt>
                <dd>{v}</dd>
              </div>
            )}
            {ion && (
              <div>
                <dt>{t(P.ion)}</dt>
                <dd>
                  <Formula f={`${e.symbol}^${Math.abs(ion.charge) === 1 ? '' : Math.abs(ion.charge)}${ion.charge > 0 ? '+' : '-'}`} /> <span className="ltr">{ion.shells.length ? bohrNotation(ion.shells) : '0'}</span>
                </dd>
              </div>
            )}
            <div>
              <dt>{t(P.radius)}</dt>
              <dd>{e.radius !== null ? <span className="ltr">{e.radius} pm</span> : <span className="muted">{t(P.noRadius)}</span>}</dd>
            </div>
            {e.meltingPoint !== null && (
              <div>
                <dt>{t(P.melting)}</dt>
                <dd className="ltr">{e.meltingPoint} °C</dd>
              </div>
            )}
            {flame && (
              <div>
                <dt>{t(P.flame)}</dt>
                <dd>
                  <span className="flame-dot" style={{ background: flame.css }} aria-hidden="true" /> {flame[lang]}
                </dd>
              </div>
            )}
            <div>
              <dt>{t(P.state)}</dt>
              <dd>{t(STATE_NAMES[e.state])}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="small muted bohr-note">
        <Icon name="info" /> {t(P.bohrNote)}
      </p>
      {e.predicted ? <Banner kind="info">{t(P.predicted)}</Banner> : !inBookScope(e) && <Banner kind="info">{t(P.beyond)}</Banner>}
      {e.massNumberOnly && <p className="small muted">{t(P.massNumber)}</p>}
      {rx && (
        <div className="el-react">
          <p className="label">{t(P.reactivity)}</p>
          <p className="small">{t(rx.text)}</p>
          {rx.eq && (
            <div className="eq-block">
              {rx.eq.map((x) => (
                <span key={x} className="eq-pill">
                  <EqText text={x} />
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ComparePanel({ e }: { e: Element }) {
  const { t, lang } = useI18n();
  const s = useChem();
  const other = s.compareWith ? elementBySymbol(s.compareWith) : undefined;
  const cmp = other ? compareElements(e, other) : null;
  return (
    <section className="panel compare">
      <label className="field">
        <span className="label">
          {t(P.compare)} <Formula f={e.symbol} />
        </span>
        <select value={s.compareWith ?? ''} onChange={(ev) => chemActions.set({ compareWith: ev.target.value || null })} data-testid="compare-select">
          <option value="">{t(P.none)}</option>
          {ELEMENTS.filter((x) => x.symbol !== e.symbol && x.Z <= 56).map((x) => (
            <option key={x.Z} value={x.symbol}>
              {x.symbol} — {lang === 'ar' ? x.ar : x.en}
            </option>
          ))}
        </select>
      </label>
      {cmp && other && (
        <ul className="guide-list small" data-testid="compare-result">
          <li>{cmp.largerRadius ? t(P.cmpRadius, { s: cmp.largerRadius }) : t(P.cmpRadiusNA)}</li>
          {cmp.rule === 'none' ? (
            <li>{t(P.cmpNone)}</li>
          ) : (
            <>
              <li>{t(cmp.rule === 'same-group' ? P.cmpSameGroup : P.cmpSamePeriod)}</li>
              {cmp.moreMetallic && <li>{t(P.cmpMetal, { s: cmp.moreMetallic })}</li>}
              <li>
                {cmp.moreReactive
                  ? t(P.cmpReactive, { s: cmp.moreReactive })
                  : t(cmp.reactivityNote === 'noble-gas' ? P.cmpNoble : cmp.reactivityNote === 'metalloid' ? P.cmpMetalloid : P.cmpMixed)}
              </li>
            </>
          )}
        </ul>
      )}
    </section>
  );
}

function TrendChart({ e }: { e: Element }) {
  const { t } = useI18n();
  const s = useChem();
  const members = trendMembers(s.trendSet);
  const isPeriod = s.trendSet.startsWith('period');
  const series: ChartSeries[] = [
    { id: 'radius', label: `${t(P.radiusSeries)} · ${t(TREND_NAMES[s.trendSet])}`, kind: 'line+points', color: SERIES_COLORS[0], points: members.map((m) => ({ x: m.Z, y: m.radius! })) },
  ];
  if (e.radius !== null && members.some((m) => m.symbol === e.symbol))
    series.push({ id: 'sel', label: `${t(P.selected)}: ${e.symbol}`, kind: 'points', color: SERIES_COLORS[1], points: [{ x: e.Z, y: e.radius }] });
  return (
    <section className="panel">
      <div className="panel-title">
        <span>{t(P.trendTitle)}</span>
        <label className="inline-select">
          <span className="sr-only">{t(P.trend)}</span>
          <select value={s.trendSet} onChange={(ev) => chemActions.set({ trendSet: ev.target.value as TrendSet })} data-testid="trend-select">
            {(Object.keys(TREND_NAMES) as TrendSet[]).map((k) => (
              <option key={k} value={k}>
                {t(TREND_NAMES[k])}
              </option>
            ))}
          </select>
        </label>
      </div>
      <LineChart title={t(P.trendTitle)} series={series} xLabel={t(P.Z)} yLabel={t(P.radius)} yUnit="pm" height={220} />
      <p className="small muted">{t(isPeriod ? P.trendAcross : P.trendDown)}</p>
    </section>
  );
}

export function PeriodicExplorer() {
  const { t } = useI18n();
  const s = useChem();
  const e = elementBySymbol(s.element) ?? ELEMENTS[0];
  return (
    <div className="chem-periodic">
      <section className="panel pt-panel">
        <div className="panel-title">
          <span>{t(P.table)}</span>
          <Segmented
            label={t(P.colour)}
            value={s.colorBy}
            onChange={(colorBy) => chemActions.set({ colorBy })}
            options={[
              { value: 'class', label: t(P.byClass) },
              { value: 'family', label: t(P.byFamily) },
            ]}
          />
        </div>
        <p className="small muted sr-only">{t(P.tableHelp)}</p>
        <PeriodicGrid />
        <Legend />
      </section>
      <div className="chem-periodic-lower">
        <ElementCard e={e} />
        <div className="chem-periodic-side">
          <ComparePanel e={e} />
          <TrendChart e={e} />
        </div>
      </div>
    </div>
  );
}
