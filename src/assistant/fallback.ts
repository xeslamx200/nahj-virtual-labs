/**
 * Offline guided tutor: deterministic, curriculum-based responses built only
 * from the simulation's own values. It is always labelled as scripted in the UI.
 */
import { interpolate, l, type L, type Lang } from '../i18n/i18n';
import { fmt, linearFit } from '../lib/format';
import { M } from '../chemistry/molarMass';
import type { AssistantSnapshot, Facts, Intent } from './types';

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const f = (v: unknown, d = 3) => fmt(n(v), d);

interface Out {
  text: string;
  answer?: string;
}

let practiceSeed = 0;
/** Small deterministic pseudo-random sequence so practice questions vary but are reproducible. */
function pick<T>(arr: T[], k: number): T {
  return arr[k % arr.length];
}

/* ---------------------------------------------------------------- why ---- */

function whyElectricity(fx: Facts, lang: Lang): string {
  const t = (s: L, v?: Record<string, string | number>) => interpolate(s[lang], v);
  switch (fx.status) {
    case 'empty':
      return t(l('The workspace is empty. Choose a battery and a bulb from the parts bar and connect them with wires to make a closed circuit.', 'منطقة العمل فارغة. اختر بطارية ومصباحًا من شريط العناصر، ثمّ صِلهما بالأسلاك لتكوين دائرة مغلقة.'));
    case 'no-source':
      return t(l('There is no battery, so nothing pushes charge around the circuit: every current is 0 A.', 'لا توجد بطارية، فلا شيء يدفع الشحنات في الدائرة، لذا تكون شدّة التيّار صفرًا في كلّ مكان.'));
    case 'short':
      return t(l('The battery terminals are joined by a path with no resistance (wires, a closed switch or an ammeter). By V = IR the current would be unlimited, so the lab stops and flags a short circuit. Add a resistor or bulb into that path.', 'طرفا البطارية متّصلان بمسار بلا مقاومة (أسلاك أو مفتاح مغلق أو أميتر). وفق V = IR سيكون التيّار غير محدود، لذلك يتوقّف المختبر ويُنبّه إلى قصر في الدائرة. أضف مقاومة أو مصباحًا في هذا المسار.'));
    case 'conflict':
      return t(l('Two ideal batteries are connected directly in parallel. With no resistance between them their voltages cannot both hold, so the circuit has no single solution. Put them in series or add resistance.', 'بطاريتان مثاليّتان موصولتان مباشرة على التوازي. وبلا مقاومة بينهما لا يمكن تحقيق جهديهما معًا، فلا يوجد حلّ واحد للدائرة. صِلهما على التوالي أو أضف مقاومة.'));
    case 'open':
      return t(l('There is no complete loop from the + terminal back to the − terminal (an open switch, a missing wire, or a voltmeter placed in series). In an open circuit the current is 0 A, so bulbs stay dark and the ammeter reads zero.', 'لا يوجد مسار مغلق كامل من القطب الموجب إلى القطب السالب (مفتاح مفتوح، أو سلك ناقص، أو فولتميتر موصول على التوالي). في الدائرة المفتوحة تكون شدّة التيّار صفرًا، فتبقى المصابيح مطفأة ويقرأ الأميتر صفرًا.'));
  }
  const V = n(fx.batteryV);
  const I = n(fx.totalI);
  const R = n(fx.Req);
  let text =
    V !== undefined && I !== undefined && R !== undefined
      ? t(
          l(
            'The battery provides {V} V. The whole circuit behaves like one equivalent resistance of {R} Ω, so Ohm’s law gives I = V / Req = {V} / {R} = {I} A leaving the battery.',
            'تزوّد البطارية فرق جهد {V} V. تتصرّف الدائرة كلّها كمقاومة مكافئة واحدة مقدارها {R} Ω، فيعطي قانون أوم I = V / Req = {V} / {R} = {I} A خارجة من البطارية.',
          ),
          { V: f(V), R: f(R), I: f(I) },
        )
      : t(l('Current flows because the loop is closed. Each reading follows from V = IR applied to the parts.', 'يسري التيّار لأنّ الدائرة مغلقة، وتنتج كلّ قراءة من تطبيق V = IR على العناصر.'));
  if (n(fx.selectedI) !== undefined && fx.selectedLabel) {
    text +=
      ' ' +
      t(l('For {name}: V = {v} V across it and I = {i} A through it, so V / I = {r} Ω.', 'بالنسبة إلى {name}: فرق الجهد بين طرفيه {v} V، وشدّة التيّار المارّ فيه {i} A، إذن V / I = {r} Ω.'), {
        name: String(fx.selectedLabel),
        v: f(fx.selectedV),
        i: f(fx.selectedI),
        r: f(n(fx.selectedV)! / n(fx.selectedI)!),
      });
  }
  text += ' ' + t(l('What do you expect to happen to the current if you increase the battery voltage?', 'ماذا تتوقّع أن يحدث لشدّة التيّار إذا زدت جهد البطارية؟'));
  return text;
}

function whyMotion(fx: Facts, lang: Lang): string {
  const t = (s: L, v?: Record<string, string | number>) => interpolate(s[lang], v);
  const v = n(fx.v) ?? 0;
  const a = n(fx.a) ?? 0;
  const parts = [
    t(l('At t = {t} s the cart is at x = {x} m with velocity {v} m/s and acceleration {a} m/s².', 'عند t = {t} s تكون العربة عند x = {x} m بسرعة متّجهة {v} m/s وتسارع {a} m/s².'), {
      t: f(fx.t),
      x: f(fx.x),
      v: f(v),
      a: f(a),
    }),
  ];
  if (a === 0) parts.push(t(l('The acceleration is zero, so the velocity does not change: the x–t graph is a straight line and the v–t graph is flat.', 'التسارع صفر، فلا تتغيّر السرعة المتّجهة: منحنى (الموقع – الزمن) خطّ مستقيم ومنحنى (السرعة المتّجهة – الزمن) أفقيّ.')));
  else if (v * a > 0) parts.push(t(l('Velocity and acceleration have the same sign, so the cart is speeding up; each second the velocity changes by {a} m/s (vf = vi + at).', 'للسرعة المتّجهة والتسارع الإشارة نفسها، لذا تتزايد سرعة العربة، وتتغيّر سرعتها المتّجهة كلّ ثانية بمقدار {a} m/s (vf = vi + at).'), { a: f(a) }));
  else if (v * a < 0) parts.push(t(l('Velocity and acceleration have opposite signs, so the cart is slowing down. If this continues it will stop and then move the other way.', 'للسرعة المتّجهة والتسارع إشارتان مختلفتان، لذا تتباطأ العربة. وإذا استمرّ ذلك فستتوقّف ثمّ تتحرّك في الاتّجاه المعاكس.')));
  else parts.push(t(l('The cart is momentarily at rest but still accelerating, so it will start moving in the direction of a.', 'العربة ساكنة لحظيًّا لكنّها ما زالت تتسارع، لذا ستبدأ بالحركة في اتّجاه التسارع.')));
  if (Math.abs((n(fx.distance) ?? 0) - Math.abs(n(fx.displacement) ?? 0)) > 1e-6)
    parts.push(t(l('Distance ({d} m) is larger than the size of the displacement ({dx} m) because the cart changed direction.', 'المسافة ({d} m) أكبر من مقدار الإزاحة ({dx} m) لأنّ العربة غيّرت اتّجاه حركتها.'), { d: f(fx.distance), dx: f(fx.displacement) }));
  return parts.join(' ');
}

function whyHeat(fx: Facts, lang: Lang): string {
  const t = (s: L, v?: Record<string, string | number>) => interpolate(s[lang], v);
  if (fx.mode === 'specific') {
    return t(
      l(
        'Both samples received the same energy, Q = P × t = {Q} J. Sample A ({a}) rose by {dA} °C and sample B ({b}) by {dB} °C. Using Q = mcΔT, the sample with the smaller c needs less energy per degree, so its temperature rises more. Which sample has the smaller c?',
        'تلقّت العيّنتان الطاقة نفسها، Q = P × t = {Q} J. ارتفعت درجة حرارة العيّنة A ({a}) بمقدار {dA} °C والعيّنة B ({b}) بمقدار {dB} °C. باستخدام Q = mcΔT، تحتاج العيّنة ذات السعة الحراريّة النوعيّة الأصغر إلى طاقة أقلّ لكلّ درجة، فترتفع درجة حرارتها أكثر. أيّ العيّنتين سعتها الحراريّة النوعيّة أصغر؟',
      ),
      { Q: f(fx.Q, 4), a: String(fx.materialA), b: String(fx.materialB), dA: f(fx.dTA), dB: f(fx.dTB) },
    );
  }
  const phase = String(fx.phase);
  if (phase === 'solid-liquid' || phase === 'liquid-gas') {
    return t(
      l(
        'The temperature is fixed at {T} °C because the sample is changing state ({pct}% converted). The heater’s energy is separating the particles (Q = mL) instead of making them move faster, so the average kinetic energy — the temperature — does not change.',
        'درجة الحرارة ثابتة عند {T} °C لأنّ العيّنة تتغيّر حالتها (تحوّل {pct}% منها). تُستخدم طاقة السخّان في فصل الجسيمات (Q = mL) بدلًا من زيادة سرعتها، فلا يتغيّر متوسّط الطاقة الحركيّة، أي درجة الحرارة.',
      ),
      { T: f(fx.T), pct: f((n(phase === 'solid-liquid' ? fx.liquid : fx.gas) ?? 0) * 100, 3) },
    );
  }
  return t(
    l(
      'The sample is in a single state ({phase}), so the added energy speeds up the particles and the temperature changes: ΔT = Q / (mc). So far {Q} J have been added and the temperature is {T} °C.',
      'العيّنة في حالة واحدة ({phase})، فتزيد الطاقة المضافة من سرعة الجسيمات وتتغيّر درجة الحرارة: ΔT = Q / (mc). أُضيف حتّى الآن {Q} J ودرجة الحرارة {T} °C.',
    ),
    { phase: String(fx.phaseLabel ?? phase), Q: f(fx.Q, 4), T: f(fx.T) },
  );
}

function whyChemistry(fx: Facts, lang: Lang): string {
  const t = (s: L, v?: Record<string, string | number>) => interpolate(s[lang], v);
  if (fx.module === 'periodic') {
    const valence = n(fx.valence);
    return t(
      l(
        '{name} ({el}) has atomic number {Z}, so its {Z} electrons fill the energy levels as {bohr}. {levels} occupied energy levels place it in period {period}{group}.{val} Elements in the same group have the same number of outer electrons, which is why they react in similar ways.',
        'العدد الذرّي لـ{name} ({el}) هو {Z}، فتتوزّع إلكتروناته الـ{Z} في مستويات الطاقة هكذا: {bohr}. وجود {levels} مستويات طاقة مشغولة يضعه في الدورة {period}{group}.{val} للعناصر في المجموعة نفسها العدد نفسه من إلكترونات التكافؤ، ولذلك تتشابه في تفاعلاتها.',
      ),
      {
        name: String(fx.elementName),
        el: String(fx.element),
        Z: f(fx.Z),
        bohr: String(fx.bohr),
        levels: f(fx.levels),
        period: f(fx.period),
        group: n(fx.group) !== undefined ? t(l(', group {g}', '، المجموعة {g}'), { g: f(fx.group) }) : '',
        val: valence !== undefined ? t(l(' It has {v} electrons in its outer level.', ' في مستواه الخارجيّ {v} إلكترونات.'), { v: valence }) : '',
      },
    );
  }
  if (fx.module === 'reactions') {
    if (!fx.equation) return t(l('No valid equation is loaded yet. Choose a textbook reaction or type one, then load it.', 'لم تُحمَّل معادلة صحيحة بعد. اختر تفاعلًا من الكتاب أو اكتب معادلة ثمّ حمّلها.'));
    if (fx.status === 'balanced')
      return t(l('The engine counts the same number of atoms of every element on both sides of {eq}, so mass is conserved: atoms are only rearranged, never created or destroyed.', 'يعدّ المحرّك العدد نفسه من ذرّات كلّ عنصر في طرفي المعادلة {eq}، فالكتلة محفوظة: الذرّات يُعاد ترتيبها فقط، ولا تُستحدث ولا تفنى.'), { eq: String(fx.equation) });
    if (fx.status === 'balanced-not-lowest')
      return t(l('Every element is balanced, but all your coefficients share a common factor. The textbook writes balanced equations with the smallest whole-number coefficients — divide them all by that factor.', 'جميع العناصر موزونة، لكنّ معاملاتك كلّها تشترك في عامل مشترك. يكتب الكتاب المعادلات الموزونة بأصغر معاملات صحيحة، فاقسمها جميعًا على هذا العامل.'));
    return t(
      l(
        'The equation is not balanced yet: the atom counts differ for {m}. Change only the coefficients (the big numbers in front), never the subscripts, because changing a subscript changes the substance. Which species contains {first}?',
        'المعادلة غير موزونة بعد: يختلف عدد ذرّات {m} بين الطرفين. غيّر المعاملات فقط (الأعداد الكبيرة أمام الصيغ)، ولا تغيّر الأرقام السفليّة أبدًا، لأنّ تغييرها يغيّر المادّة نفسها. ما الصيغ التي تحتوي على {first}؟',
      ),
      { m: String(fx.mismatched || (lang === 'ar' ? 'الشحنة' : 'the charge')), first: String(fx.mismatched || '').split(',')[0] || (lang === 'ar' ? 'أيونات مشحونة' : 'charged ions') },
    );
  }
  const step = String(fx.step);
  if (step === 'filled' && n(fx.actual) !== undefined)
    return t(
      l(
        'You dissolved {w} g of {sol} (M = {Mm} g/mol) and made the volume up to {V} mL. n = m / M = {nmol} mol, so the concentration is n / V = {c} M. The error compared with the target {target} M is {err} %.',
        'أذبت {w} g من {sol} (الكتلة المولية {Mm} g/mol) وأكملت الحجم إلى {V} mL. n = m / M = {nmol} mol، فالتركيز n / V = {c} M. الخطأ مقارنة بالتركيز المطلوب {target} M هو {err} %.',
      ),
      { w: f(fx.weighed, 4), sol: String(fx.solute), Mm: f(fx.Mm, 5), V: f(fx.flaskmL), nmol: f((n(fx.weighed) ?? 0) / (n(fx.Mm) ?? 1), 4), c: f(fx.actual, 4), target: f(fx.target), err: f(fx.error, 2) },
    );
  return t(
    l(
      'To make {V} mL of {target} M {sol}, first find the moles needed (n = M × V in litres), then the mass (m = n × molar mass). The engine needs {need} g. Weigh it, dissolve it in less water than the final volume, then fill to the mark.',
      'لتحضير {V} mL من محلول {sol} تركيزه {target} M، احسب أوّلًا عدد المولات اللازم (n = M × V باللتر)، ثمّ الكتلة (m = n × الكتلة المولية). يحسب المحرّك أنّ الكتلة اللازمة {need} g. زِنها، وأذبها في كمّيّة ماء أقلّ من الحجم النهائيّ، ثمّ أكمل إلى العلامة.',
    ),
    { V: f(fx.flaskmL), target: f(fx.target), sol: String(fx.solute), need: f(fx.needed, 4) },
  );
}

/* ---------------------------------------------------------- practice ---- */

function practice(snapshot: AssistantSnapshot, lang: Lang): Out {
  const k = practiceSeed++;
  const t = (s: L, v?: Record<string, string | number>) => interpolate(s[lang], v);
  if (snapshot.lab === 'electricity') {
    const kind = k % 3;
    if (kind === 0) {
      const V = pick([3, 4.5, 6, 9, 12], k);
      const R = pick([5, 15, 20, 30, 60], k + 2);
      return {
        text: t(l('Practice: a {R} Ω resistor is connected to a {V} V battery. What current flows? (Hint: Ohm’s law.)', 'تمرين: مقاومة {R} Ω موصولة ببطارية {V} V. ما شدّة التيّار المارّ فيها؟ (تلميح: قانون أوم.)'), { R, V }),
        answer: `I = V / R = ${V} / ${R} = ${fmt(V / R, 3)} A`,
      };
    }
    if (kind === 1) {
      const a = pick([2, 4, 6, 12], k);
      const b = pick([3, 6, 12, 4], k + 1);
      return {
        text: t(l('Practice: what is the equivalent resistance of {a} Ω and {b} Ω (i) in series, (ii) in parallel?', 'تمرين: ما المقاومة المكافئة للمقاومتين {a} Ω و {b} Ω (أ) على التوالي، (ب) على التوازي؟'), { a, b }),
        answer: `${a} + ${b} = ${a + b} Ω;  1/Req = 1/${a} + 1/${b} → Req = ${fmt((a * b) / (a + b), 3)} Ω`,
      };
    }
    const P = pick([60, 100, 700, 1000], k);
    const V = 240;
    return {
      text: t(l('Practice: a {P} W appliance runs on {V} V. What current does it draw, and what is its resistance?', 'تمرين: جهاز قدرته {P} W يعمل على {V} V. ما شدّة التيّار الذي يسحبه، وما مقاومته؟'), { P, V }),
      answer: `I = P / V = ${fmt(P / V, 3)} A;  R = V² / P = ${fmt((V * V) / P, 4)} Ω`,
    };
  }
  if (snapshot.lab === 'chemistry') {
    const mode = snapshot.facts.massMode === 'precise' ? 'precise' : 'book';
    const kind = k % 3;
    if (kind === 0) {
      const formula = pick(['H2SO4', 'CaCO3', 'Na2CO3', 'Al2(SO4)3', 'C6H12O6'], k);
      return {
        text: t(l('Practice: calculate the molar mass of {f}. (Hint: add the atomic mass of every atom in the formula.)', 'تمرين: احسب الكتلة المولية لـ {f}. (تلميح: اجمع الكتل الذرّيّة لكلّ الذرّات في الصيغة.)'), { f: formula }),
        answer: `M(${formula}) = ${fmt(M(formula, mode), 5)} g/mol`,
      };
    }
    if (kind === 1) {
      const formula = pick(['NaCl', 'H2O', 'CO2', 'NaOH'], k);
      const m = pick([11.7, 36, 22, 8], k);
      const Mm = M(formula, mode);
      return {
        text: t(l('Practice: how many moles are in {m} g of {f}?', 'تمرين: كم مولًا يوجد في {m} g من {f}؟'), { m, f: formula }),
        answer: `n = m / M = ${m} / ${fmt(Mm, 5)} = ${fmt(m / Mm, 4)} mol`,
      };
    }
    const formula = pick(['NaCl', 'KCl', 'NaOH', 'KI'], k);
    const m = pick([5.85, 7.45, 4, 16.6], k);
    const V = pick([250, 500, 100, 1000], k + 1);
    const Mm = M(formula, mode);
    return {
      text: t(l('Practice: {m} g of {f} is dissolved to make {V} mL of solution. What is the molarity?', 'تمرين: أُذيب {m} g من {f} لتحضير {V} mL من المحلول. ما الموالريّة؟'), { m, f: formula, V }),
      answer: `n = ${m} / ${fmt(Mm, 5)} = ${fmt(m / Mm, 4)} mol;  M = n / V = ${fmt(m / Mm, 4)} / ${V / 1000} L = ${fmt(m / Mm / (V / 1000), 4)} M`,
    };
  }
  if (snapshot.lab === 'motion') {
    const kind = k % 3;
    const vi = pick([0, 2, 4, 5], k);
    const a = pick([1.5, 2, 0.5, 3], k + 1);
    const tt = pick([4, 5, 6, 3], k + 2);
    if (kind === 0)
      return {
        text: t(l('Practice: a car starts at {vi} m/s and accelerates at {a} m/s² for {t} s. What is its final velocity?', 'تمرين: تبدأ سيّارة بسرعة {vi} m/s وتتسارع بمقدار {a} m/s² لمدّة {t} s. ما سرعتها المتّجهة النهائيّة؟'), { vi, a, t: tt }),
        answer: `vf = vi + at = ${vi} + ${a}×${tt} = ${fmt(vi + a * tt, 3)} m/s`,
      };
    if (kind === 1)
      return {
        text: t(l('Practice: how far does the same car travel in those {t} s (vi = {vi} m/s, a = {a} m/s²)?', 'تمرين: ما المسافة التي تقطعها السيّارة نفسها خلال {t} s (vi = {vi} m/s، a = {a} m/s²)؟'), { vi, a, t: tt }),
        answer: `Δx = vi t + ½ a t² = ${fmt(vi * tt + 0.5 * a * tt * tt, 4)} m`,
      };
    const vf = pick([20, 25, 30, 15], k);
    const d = pick([100, 150, 200, 50], k + 1);
    return {
      text: t(l('Practice: a car accelerates from rest to {vf} m/s over {d} m. What is its acceleration? (Equation 10-2.)', 'تمرين: تتسارع سيّارة من السكون حتّى {vf} m/s خلال {d} m. ما تسارعها؟ (المعادلة 10-2.)'), { vf, d }),
      answer: `a = vf² / (2Δx) = ${fmt((vf * vf) / (2 * d), 3)} m/s²`,
    };
  }
  const kind = k % 3;
  if (kind === 0) {
    const m = pick([0.5, 2, 1.5, 0.25], k);
    const c = pick([900, 387, 4184, 470], k + 1);
    const dT = pick([20, 35, 50, 15], k + 2);
    return {
      text: t(l('Practice: how much energy raises {m} kg of a material with c = {c} J/kg°C by {dT} °C?', 'تمرين: ما الطاقة اللازمة لرفع درجة حرارة {m} kg من مادّة سعتها الحراريّة النوعيّة {c} J/kg°C بمقدار {dT} °C؟'), { m, c, dT }),
      answer: `Q = mcΔT = ${m} × ${c} × ${dT} = ${fmt(m * c * dT, 5)} J`,
    };
  }
  if (kind === 1) {
    const m = pick([0.4, 1.2, 2, 0.75], k);
    return {
      text: t(l('Practice: how much energy is needed to melt {m} kg of ice at 0 °C? (Lf = 334 000 J/kg)', 'تمرين: ما الطاقة اللازمة لصهر {m} kg من الجليد عند 0 °C؟ (Lf = 334 000 J/kg)'), { m }),
      answer: `Q = mLf = ${fmt(m * 334000, 5)} J`,
    };
  }
  const C = pick([25, 37, 60, -10], k);
  return {
    text: t(l('Practice: convert {C} °C to °F and to K.', 'تمرين: حوّل {C} °C إلى °F وإلى K.'), { C }),
    answer: `TF = 9/5 × ${C} + 32 = ${fmt((9 / 5) * C + 32, 4)} °F;  TK = ${fmt(C + 273.15, 5)} K`,
  };
}

/* --------------------------------------------------------- interpret ---- */

function interpret(snapshot: AssistantSnapshot, lang: Lang): string {
  const t = (s: L, v?: Record<string, string | number>) => interpolate(s[lang], v);
  const rows = snapshot.records;
  const chart = snapshot.activity?.chart;
  if (!rows.length) return t(l('You have not recorded any data yet. Set up the experiment, then use “Record reading” at least three times with different settings.', 'لم تسجّل أيّ بيانات بعد. جهّز التجربة، ثمّ استخدم «تسجيل القراءة» ثلاث مرّات على الأقلّ بإعدادات مختلفة.'));
  if (!chart) return t(l('You recorded {n} rows. Compare the rows: which value changed, and which stayed the same? What does that tell you about the circuit?', 'سجّلت {n} صفوف. قارن بين الصفوف: أيّ القيم تغيّرت، وأيّها بقي ثابتًا؟ وماذا يخبرك ذلك؟'), { n: rows.length });
  const xs = rows.map((r) => r.values[chart.x]);
  const ys = rows.map((r) => r.values[chart.y]);
  const xc = snapshot.activity!.columns.find((c) => c.id === chart.x)!;
  const yc = snapshot.activity!.columns.find((c) => c.id === chart.y)!;
  const xl = `${xc.label[lang]} (${xc.unit})`;
  const yl = `${yc.label[lang]} (${yc.unit})`;
  if (rows.length < 3)
    return t(l('You have {n} rows. Record at least three points with different {x} values so that a pattern can be seen on the graph of {y}.', 'لديك {n} صفوف. سجّل ثلاث نقاط على الأقلّ بقيم مختلفة لـ {x} حتّى يظهر نمط واضح في منحنى {y}.'), { n: rows.length, x: xl, y: yl });
  const fit = linearFit(xs.map((x, i) => ({ x, y: ys[i] })));
  const ratios = xs.map((x, i) => (x !== 0 ? ys[i] / x : NaN)).filter(Number.isFinite);
  const spread = ratios.length ? (Math.max(...ratios) - Math.min(...ratios)) / Math.abs(ratios[0] || 1) : 1;
  const products = xs.map((x, i) => x * ys[i]);
  const pSpread = (Math.max(...products) - Math.min(...products)) / Math.abs(products[0] || 1);
  let pattern: string;
  if (spread < 0.02 && fit && Math.abs(fit.b) < 0.02 * Math.max(...ys.map(Math.abs)))
    pattern = t(l('{y} ÷ {x} is the same for every row ({r}). That means a straight line through the origin: {y} is directly proportional to {x}.', 'النسبة {y} ÷ {x} متساوية في جميع الصفوف ({r})، أي خطّ مستقيم يمرّ بنقطة الأصل: {y} يتناسب طرديًّا مع {x}.'), { x: xl, y: yl, r: fmt(ratios[0], 4) });
  else if (pSpread < 0.02)
    pattern = t(l('{x} × {y} is the same for every row ({p}). When one doubles the other halves: an inverse proportion.', 'حاصل ضرب {x} × {y} متساوٍ في جميع الصفوف ({p}). عندما تتضاعف إحداهما تقلّ الأخرى إلى النصف: تناسب عكسيّ.'), { x: xl, y: yl, p: fmt(products[0], 4) });
  else if (fit)
    pattern = t(l('A best-fit straight line through your points has slope {m} and intercept {b}. Is the line through the origin? What does the slope represent in this experiment?', 'خطّ أفضل مطابقة لنقاطك ميله {m} ومقطعه {b}. هل يمرّ الخطّ بنقطة الأصل؟ وماذا يمثّل الميل في هذه التجربة؟'), { m: fmt(fit.m, 4), b: fmt(fit.b, 3) });
  else pattern = t(l('Your points do not form a simple pattern yet; try spreading your settings over a wider range.', 'لا تشكّل نقاطك نمطًا بسيطًا بعد، جرّب توزيع الإعدادات على مدى أوسع.'));
  return t(l('First, a question: as {x} increases, what happens to {y}? ', 'أوّلًا سؤال: عندما يزداد {x}، ماذا يحدث لـ {y}؟ '), { x: xl, y: yl }) + pattern;
}

/* ---------------------------------------------------------------- next ---- */

const NEXT: Record<string, L> = {
  electricity: l(
    'Try this: add a second bulb in series and predict the ammeter reading before you look. Then move it into a parallel branch and compare. Which arrangement makes each bulb brighter, and why?',
    'جرّب: أضف مصباحًا ثانيًا على التوالي وتوقّع قراءة الأميتر قبل أن تنظر إليها. ثمّ انقله إلى فرع موازٍ وقارن. أيّ الترتيبين يجعل كلّ مصباح أكثر إضاءة، ولماذا؟',
  ),
  motion: l(
    'Try this: keep vi the same and make a negative. Predict the moment the cart stops using vf = vi + at, then check it on the v–t graph where the line crosses zero.',
    'جرّب: أبقِ vi كما هي واجعل a سالبًا. توقّع لحظة توقّف العربة باستخدام vf = vi + at، ثمّ تحقّق منها على منحنى (السرعة المتّجهة – الزمن) حيث يقطع الخطّ محور الصفر.',
  ),
  chemistry: l(
    'Try this: pick an element, predict whether its neighbour one step down the group has a larger or smaller radius, then check with Compare. Next, balance a textbook reaction using only coefficients and use the stoichiometry tab to predict a product mass.',
    'جرّب: اختر عنصرًا وتوقّع هل نصف قطر العنصر الذي يليه في المجموعة نفسها أكبر أم أصغر، ثمّ تحقّق باستخدام «قارن». بعد ذلك زِن تفاعلًا من الكتاب بتغيير المعاملات فقط، واستخدم تبويب الحسابات الكيميائيّة لتوقّع كتلة ناتج.',
  ),
  heat: l(
    'Try this: double the mass and keep the heater power the same. Predict how long the melting plateau will last now (t = mLf / P), then run it and check.',
    'جرّب: ضاعف الكتلة مع إبقاء قدرة السخّان ثابتة. توقّع مدّة مرحلة الانصهار الآن (t = mLf / P)، ثمّ شغّل المحاكاة وتحقّق.',
  ),
};

/* ---------------------------------------------------------------- main ---- */

export function offlineReply(intent: Intent, snapshot: AssistantSnapshot, lang: Lang, question?: string): Out {
  const t = (s: L, v?: Record<string, string | number>) => interpolate(s[lang], v);
  const act = snapshot.activity;
  switch (intent) {
    case 'explain':
      if (!act)
        return {
          text: t(l('In free exploration you can build anything. Pick a guided activity to get its objective and step-by-step explanation.', 'في الاستكشاف الحرّ يمكنك بناء ما تريد. اختر نشاطًا موجّهًا لعرض هدفه وشرحه خطوة بخطوة.')),
        };
      return {
        text: `${act.principle[lang]} ${t(l('Key equations: {eq}.', 'المعادلات الأساسيّة: {eq}.'), { eq: act.equations.join(' · ') })} ${act.question[lang]}`,
      };
    case 'why':
      return {
        text: snapshot.lab === 'electricity' ? whyElectricity(snapshot.facts, lang) : snapshot.lab === 'motion' ? whyMotion(snapshot.facts, lang) : snapshot.lab === 'chemistry' ? whyChemistry(snapshot.facts, lang) : whyHeat(snapshot.facts, lang),
      };
    case 'next': {
      if (act) {
        const firstQuestion = act.questions[0];
        return {
          text: `${NEXT[snapshot.lab][lang]} ${firstQuestion ? t(l('Then try question 1 of the activity: “{q}”', 'ثمّ حاول الإجابة عن السؤال الأوّل في النشاط: «{q}»'), { q: firstQuestion.prompt[lang] }) : ''}`,
        };
      }
      return { text: NEXT[snapshot.lab][lang] };
    }
    case 'practice':
      return practice(snapshot, lang);
    case 'interpret':
      return { text: interpret(snapshot, lang) };
    case 'ask':
      return {
        text: t(
          l(
            'The offline tutor cannot read free-text questions{q}. Choose one of the buttons above — explain, why, next, practice or interpret — and it will answer using your current readings.',
            'لا يستطيع المعلّم غير المتّصل قراءة الأسئلة الحرّة{q}. اختر أحد الأزرار أعلاه — اشرح، لماذا، الخطوة التالية، تمرين، فسّر بياناتي — وسيجيبك باستخدام قراءاتك الحاليّة.',
          ),
          { q: question ? ` (“${question.slice(0, 60)}”)` : '' },
        ),
      };
  }
}
