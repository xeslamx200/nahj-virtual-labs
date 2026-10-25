import type { EquationError, SolveResult } from '../../chemistry/equation';
import type { FormulaError } from '../../chemistry/formula';
import type { CalcError } from '../../chemistry/stoichiometry';
import type { ConcError } from '../../chemistry/concentration';
import { interpolate, l, type L, type Lang } from '../../i18n/i18n';

const FORMULA: Record<FormulaError['code'], L> = {
  empty: l('Type a formula.', 'اكتب صيغة كيميائيّة.'),
  'unknown-element': l('“{t}” is not an element symbol. Symbols start with a capital letter, then an optional small letter (Co is cobalt, CO is carbon monoxide).', '«{t}» ليس رمز عنصر. يبدأ الرمز بحرف كبير يليه أحيانًا حرف صغير (Co هو الكوبلت، و CO هو أوّل أكسيد الكربون).'),
  'lowercase-start': l('“{t}” starts with a small letter. Element symbols start with a capital letter (e.g. H2O, not h2o).', '«{t}» يبدأ بحرف صغير. تبدأ رموز العناصر بحرف كبير (مثل H2O وليس h2o).'),
  'unexpected-char': l('Unexpected character “{t}”.', 'رمز غير متوقّع «{t}».'),
  'unclosed-bracket': l('A bracket is opened but never closed.', 'فُتح قوس ولم يُغلق.'),
  'unopened-bracket': l('A bracket is closed but was never opened.', 'أُغلق قوس لم يُفتح.'),
  'zero-count': l('A subscript of 0 is not allowed.', 'لا يُسمح بالرقم السفلي 0.'),
  'too-large': l('The formula is too long or a count is too large.', 'الصيغة طويلة جدًّا أو أحد الأعداد كبير جدًّا.'),
  'bad-charge': l('Write charges as SO4^2- or Na^+.', 'اكتب الشحنات بالشكل \u2066SO4^2-\u2069 أو \u2066Na^+\u2069.'),
  'leading-coefficient': l('A number in front of a formula is a coefficient, not part of the formula. Enter the formula alone (e.g. H2O).', 'الرقم أمام الصيغة معامل وليس جزءًا منها. اكتب الصيغة وحدها (مثل H2O).'),
};

export function formulaError(e: FormulaError, lang: Lang): string {
  return interpolate(FORMULA[e.code][lang], { t: e.token ?? '' });
}

export function equationError(e: EquationError, lang: Lang): string {
  switch (e.code) {
    case 'no-arrow':
      return l('Separate reactants and products with an arrow: -> or →.', 'افصل المتفاعلات عن النواتج بسهم: ‎-> أو →.')[lang];
    case 'many-arrows':
      return l('Use only one arrow.', 'استخدم سهمًا واحدًا فقط.')[lang];
    case 'empty-side':
      return (e.side === 'reactant' ? l('There are no reactants.', 'لا توجد متفاعلات.') : l('There are no products.', 'لا توجد نواتج.'))[lang];
    case 'too-many-species':
      return l('Use at most 10 substances.', 'استخدم 10 موادّ على الأكثر.')[lang];
    case 'formula':
      return `${e.text || '…'}: ${formulaError(e.error, lang)}`;
  }
}

export function solveError(r: Extract<SolveResult, { ok: false }>, lang: Lang): string {
  switch (r.reason) {
    case 'one-sided':
      return interpolate(
        l('{els} appears on one side only, so no coefficients can balance it. Check the formulas — the lab never changes them for you.', 'يظهر {els} في طرف واحد فقط، فلا يمكن لأيّ معاملات أن توازنه. راجع الصيغ، فالمختبر لا يغيّرها نيابةً عنك.')[lang],
        { els: (r.elements ?? []).join(', ') },
      );
    case 'impossible':
      return l('These formulas cannot be balanced with positive whole-number coefficients. Check the formulas.', 'لا يمكن موازنة هذه الصيغ بمعاملات صحيحة موجبة. راجع الصيغ.')[lang];
    case 'not-unique':
      return l('This equation can be balanced in more than one way (it combines independent reactions), so there is no single answer.', 'يمكن موازنة هذه المعادلة بأكثر من طريقة (فهي تجمع تفاعلات مستقلّة)، فلا توجد إجابة واحدة.')[lang];
    case 'too-large':
      return l('The balanced coefficients would be larger than 999.', 'ستكون المعاملات الموزونة أكبر من 999.')[lang];
  }
}

export function calcError(e: CalcError | ConcError, lang: Lang): string {
  switch (e.code) {
    case 'not-a-number':
      return l('Enter a number.', 'أدخل عددًا.')[lang];
    case 'not-positive':
      return l('Enter a value greater than zero.', 'أدخل قيمة أكبر من الصفر.')[lang];
    case 'too-large':
      return l('That value is too large.', 'هذه القيمة كبيرة جدًّا.')[lang];
    case 'unbalanced':
      return l('Balance the equation first: the mole ratio comes from the coefficients of the balanced equation.', 'وازن المعادلة أوّلًا: تؤخذ النسبة المولية من معاملات المعادلة الموزونة.')[lang];
    case 'not-gas':
      return interpolate(l('{f} is not marked as a gas (g). The molar volume 22.4 L/mol applies to gases at STP only.', 'لم تُوسم {f} بأنّها غاز (g). الحجم المولي 22.4 L/mol خاصّ بالغازات عند STP فقط.')[lang], { f: e.formula });
    case 'same-species':
      return l('Choose two different substances.', 'اختر مادّتين مختلفتين.')[lang];
    case 'bad-index':
      return l('Choose a substance from the equation.', 'اختر مادّة من المعادلة.')[lang];
    case 'solute-exceeds-solution':
      return l('The solute cannot weigh more than the whole solution.', 'لا يمكن أن تزيد كتلة المذاب على كتلة المحلول كلّه.')[lang];
  }
}
