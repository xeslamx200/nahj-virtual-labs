import { l } from '../i18n/i18n';
import { originSlope } from '../lib/format';
import type { Circuit, SolveResult } from '../physics/circuit/types';
import type { ActivityDef, LabInfo } from './types';

export interface ElecCheckState {
  circuit: Circuit;
  result: SolveResult;
}

const resistorValue = (s: ElecCheckState) => s.circuit.elements.find((e) => e.id === 'R1')?.resistance ?? null;

export const ELECTRICITY_LAB: LabInfo = {
  id: 'electricity',
  title: l('Electricity Lab', 'مختبر الكهرباء'),
  short: l('Build circuits, measure current and voltage, and test Ohm’s law.', 'ابنِ دوائر كهربائية، وقِس شدّة التيّار وفرق الجهد، واختبر قانون أوم.'),
  unit: l('Unit 4 · Fundamentals of Electricity', 'الوحدة 4 · أساسيّات الكهرباء التيّاريّة'),
  book: l('Grade 10 · Science · Semester 2', 'الصفّ العاشر · العلوم · الفصل الدراسي الثاني'),
  lessons: [
    l('Lesson 1-4 · Current, Voltage and Resistance (p. 120)', 'الدرس 1-4 · التيّار الكهربائي، والجهد الكهربائي، والمقاومة الكهربائية (ص 120)'),
    l('Lesson 2-4 · Complex Circuits (p. 136)', 'الدرس 2-4 · الدوائر الكهربائية المركّبة (ص 136)'),
  ],
  objectives: [
    l('Relate potential difference and current for ohmic conductors (V = IR).', 'استقصاء العلاقة بين فرق الجهد الكهربائي وشدّة التيّار للموصلات الأوميّة (V = IR).'),
    l('Calculate equivalent resistance of series, parallel and combined circuits.', 'حساب المقاومة المكافئة لدوائر التوالي والتوازي والدوائر المركّبة.'),
    l('Use an ammeter in series and a voltmeter in parallel.', 'توصيل الأميتر على التوالي والفولتميتر على التوازي.'),
    l('Solve problems with P = VI, P = I²R and P = V²/R.', 'حلّ مسائل باستخدام P = VI و P = I²R و P = V²/R.'),
  ],
  outcomes: ['P1011.1', 'P1011.2', 'P1011.3', 'P1011.4', 'P1012.2', 'P1012.4'],
  pages: '120–147',
  accent: 'primary',
  assumptions: [
    l('Batteries are ideal sources (no internal resistance).', 'البطاريات مصادر مثاليّة (بلا مقاومة داخليّة).'),
    l('Wires, closed switches and ammeters have zero resistance; voltmeters draw no current.', 'مقاومة الأسلاك والمفاتيح المغلقة والأميتر صفر، والفولتميتر لا يسحب تيّارًا.'),
    l('Resistors and “ohmic” bulbs keep a constant resistance (Ohm’s law).', 'المقاومات والمصابيح «الأوميّة» مقاومتها ثابتة (قانون أوم).'),
    l('The “filament” bulb option is an enrichment model, R = R₀(1 + 0.5·|V|): it shows the non-ohmic trend of Figure 14-4, not a specific real bulb.', 'خيار «مصباح الفتيلة» نموذج إثرائي R = R₀(1 + 0.5·|V|): يوضّح السلوك غير الأومي في الشكل 14-4، وليس مصباحًا حقيقيًّا بعينه.'),
    l('Any arrangement of the parts is solved exactly by nodal analysis; a shorted battery or batteries directly in parallel are reported instead of solved.', 'تُحلّ أيّ دائرة مكوّنة من هذه العناصر بدقّة بطريقة تحليل العُقد؛ أمّا البطارية المقصورة أو البطاريات الموصولة مباشرة على التوازي فيُبلَّغ عنها ولا تُحلّ.'),
    l('Bulb brightness on screen is proportional to √(P / rated power) and is only a visual cue.', 'سطوع المصباح على الشاشة يتناسب مع √(القدرة / القدرة المقنّنة) وهو مؤشّر بصريّ فقط.'),
  ],
  safety: [
    l('General lab safety (not from the textbook): never connect an ammeter directly across a battery — it acts as a short circuit.', 'إرشاد عامّ للسلامة (ليس من الكتاب): لا تصل الأميتر مباشرة بين طرفي البطارية، فهو يعمل كقصر في الدائرة.'),
    l('Real circuits get hot at high current. This lab is limited to 24 V; mains electricity (240 V) is dangerous.', 'تسخن الدوائر الحقيقيّة عند التيّارات الكبيرة. هذا المختبر محدود بـ 24 V، أمّا كهرباء المنازل (240 V) فخطرة.'),
  ],
  assistantContext: `Textbook: Qatar MoEHE Grade 10 Science, Semester 2, Unit 4 "Fundamentals of Electricity".
Lesson 1-4 Current, Voltage and Resistance (pages 120-135). Outcomes: P1011.1 define current I = Q/t (ampere A); P1011.2 define potential difference V = W/Q (volt V); P1011.3 investigate the relation between voltage and current for ohmic and non-ohmic components and analyse graphs; P1011.4 calculate V, I, R with V = IR; P1012.1 resistance of a wire R = ρL/A.
Key ideas: a closed circuit lets current flow, an open circuit stops it; voltmeter connects in parallel, ammeter in series; Ohm's law V = IR, 1 ohm lets 1 A flow at 1 V; ohmic conductors give a straight V-I line, a lamp filament is non-ohmic (resistance rises as it heats).
Activity a1-4 explores circuits with lamps and meters; Activity b1-4 measures V and I for a 10 ohm resistor at 1-4 V and then for a lamp; Activity c1-4 measures wire resistance.
Lesson 2-4 Complex Circuits (pages 136-147). Outcomes P1012.2 equivalent resistance of combined circuits; P1012.4 power P = E/t, P = VI, P = I^2 R, P = V^2/R.
Series: same current everywhere, voltages add, Req = R1 + R2 + R3. Parallel: same voltage across each branch, currents add (charge conservation), 1/Req = 1/R1 + 1/R2 + 1/R3; adding branches lowers Req and raises total current.
Worked examples: three 1 ohm lamps on 1.5 V in series give 0.5 A and 0.5 V each (Fig 23-4); the same lamps in parallel draw 1.5 A each, 4.5 A total (Fig 24-4); 10 ohm + 20 ohm on 10 V gives 0.33 A; 2 ohm || 3 ohm = 1.2 ohm, plus 1.5 ohm in series = 2.7 ohm.`,
};

const V = 'V';
const A = 'A';

export const ELECTRICITY_ACTIVITIES: ActivityDef<ElecCheckState>[] = [
  {
    id: 'ohm-voltage',
    lab: 'electricity',
    title: l('How does voltage affect current?', 'كيف يؤثّر فرق الجهد في شدّة التيّار؟'),
    source: 'textbook',
    ref: l('Lesson 1-4 · Activity b1-4 “Ohm’s law”, part 1 · p. 132', 'الدرس 1-4 · النشاط b1-4 «قانون أوم» الجزء الأول · ص 132'),
    outcomes: ['P1011.3', 'P1011.4'],
    objective: l(
      'Investigate the relationship between potential difference V and current I for a fixed 10 Ω resistor, and find R from the slope of the V–I graph.',
      'استقصاء العلاقة بين فرق الجهد V وشدّة التيّار I لمقاومة ثابتة مقدارها 10 Ω، وإيجاد R من ميل منحنى (فرق الجهد – شدّة التيّار).',
    ),
    question: l('How does the current through a resistor change when the voltage across it increases?', 'كيف تتغيّر شدّة التيّار المارّ في المقاومة عند زيادة فرق الجهد بين طرفيها؟'),
    hypothesisPrompt: l('Predict: if the voltage doubles, what happens to the current?', 'توقّع: إذا تضاعف فرق الجهد، ماذا يحدث لشدّة التيّار؟'),
    setup: [
      l('Circuit of Figure 16-4a: variable supply, switch, ammeter in series, 10 Ω resistor, voltmeter across the resistor.', 'دائرة الشكل 16-4a: مصدر طاقة متغيّر، مفتاح، أميتر على التوالي، مقاومة 10 Ω، وفولتميتر بين طرفي المقاومة.'),
      l('Press “Set up experiment” to load it. The resistance stays fixed throughout (controlled variable).', 'اضغط «تجهيز التجربة» لتحميلها. تبقى المقاومة ثابتة طوال التجربة (متغيّر مضبوط).'),
    ],
    steps: [
      l('Select the battery and set it to 1 V. Close the switch.', 'اختر البطارية واضبطها على 1 V، ثم أغلق المفتاح.'),
      l('Press “Record reading” to save the voltmeter and ammeter values.', 'اضغط «تسجيل القراءة» لحفظ قراءتي الفولتميتر والأميتر.'),
      l('Repeat for 2 V, 3 V and 4 V.', 'كرّر ذلك عند 2 V و 3 V و 4 V.'),
      l('Look at the V–I graph built from your readings and find its slope.', 'لاحظ منحنى (فرق الجهد – شدّة التيّار) الناتج عن قراءاتك وأوجد ميله.'),
    ],
    columns: [
      { id: 'V', label: l('Voltage V', 'فرق الجهد V'), unit: V, digits: 3 },
      { id: 'I', label: l('Current I', 'شدّة التيّار I'), unit: A, digits: 3 },
      { id: 'R', label: l('V / I', 'V / I'), unit: 'Ω', digits: 3 },
    ],
    chart: { x: 'I', y: 'V', fit: 'origin', slopeUnit: 'Ω' },
    questions: [
      {
        id: 'i-at-3v',
        kind: 'numeric',
        unit: A,
        prompt: l('With the 10 Ω resistor, what current flows when V = 3 V?', 'باستخدام المقاومة 10 Ω، ما شدّة التيّار عندما يكون V = 3 V؟'),
        expected: ({ state }) => {
          const R = resistorValue(state);
          return R ? 3 / R : null;
        },
        hints: [l('Ohm’s law: V = IR. Rearrange it for I.', 'قانون أوم: V = IR. أعد ترتيبه لإيجاد I.'), l('I = V / R = 3 V ÷ 10 Ω.', 'I = V / R = 3 V ÷ 10 Ω.')],
        explanation: l('I = V / R = 3 V / 10 Ω = 0.3 A. The ammeter shows the same value at 3 V.', 'I = V / R = 3 V / 10 Ω = 0.3 A، وهي القيمة نفسها التي يقرؤها الأميتر عند 3 V.'),
        wrongFeedback: l('Check that you divided the voltage by the resistance (not multiplied).', 'تأكّد أنّك قسمت فرق الجهد على المقاومة ولم تضربهما.'),
      },
      {
        id: 'slope',
        kind: 'numeric',
        unit: 'Ω',
        prompt: l('From your recorded data, what is the slope of the V–I graph?', 'من بياناتك المسجّلة، ما ميل منحنى (فرق الجهد – شدّة التيّار)؟'),
        expected: ({ records }) => {
          const pts = records.map((r) => ({ x: r.values.I, y: r.values.V })).filter((p) => p.x > 0);
          return pts.length >= 2 ? originSlope(pts) : null;
        },
        needs: l('Record at least two readings first.', 'سجّل قراءتين على الأقلّ أوّلًا.'),
        hints: [l('Slope = rise / run = ΔV / ΔI.', 'الميل = ΔV / ΔI.'), l('Pick two points on the line, e.g. (0.1 A, 1 V) and (0.4 A, 4 V).', 'اختر نقطتين على الخطّ، مثل (0.1 A, 1 V) و (0.4 A, 4 V).')],
        explanation: l('The slope ΔV/ΔI equals the resistance: 10 Ω. A straight line through the origin means the resistor is ohmic.', 'الميل ΔV/ΔI يساوي المقاومة: 10 Ω. الخطّ المستقيم المارّ بنقطة الأصل يعني أنّ المقاومة موصل أومي.'),
      },
      {
        id: 'double',
        kind: 'choice',
        prompt: l('When the voltage across the resistor doubles, the current…', 'عندما يتضاعف فرق الجهد بين طرفي المقاومة، فإنّ شدّة التيّار…'),
        choices: [l('doubles', 'تتضاعف'), l('halves', 'تقلّ إلى النصف'), l('stays the same', 'تبقى ثابتة'), l('becomes four times larger', 'تزداد أربع مرّات')],
        correctChoice: 0,
        hints: [l('Compare your 2 V and 4 V readings.', 'قارن قراءتيك عند 2 V و 4 V.')],
        explanation: l('For constant R, I = V/R, so I is directly proportional to V: doubling V doubles I.', 'عند ثبات R يكون I = V/R، أي أنّ I يتناسب طرديًّا مع V: مضاعفة V تضاعف I.'),
      },
      {
        id: 'ohmic',
        kind: 'open',
        prompt: l('Is the resistor an ohmic conductor? Use the shape of your graph to explain.', 'هل المقاومة موصل أومي؟ فسّر إجابتك بالاعتماد على شكل المنحنى.'),
        hints: [l('What does a straight line through the origin tell you about V/I?', 'ماذا يخبرك الخطّ المستقيم المارّ بنقطة الأصل عن النسبة V/I؟')],
        explanation: l('Yes. The V–I graph is a straight line through the origin, so V/I is constant at every voltage — this is Ohm’s law.', 'نعم. منحنى (فرق الجهد – شدّة التيّار) خطّ مستقيم يمرّ بنقطة الأصل، أي أنّ النسبة V/I ثابتة عند جميع قيم الجهد، وهذا هو قانون أوم.'),
      },
    ],
    conclusion: l(
      'For a fixed resistor the current is directly proportional to the voltage. The ratio V/I is constant and equals the resistance R (V = IR).',
      'في المقاومة الثابتة تتناسب شدّة التيّار طرديًّا مع فرق الجهد، وتبقى النسبة V/I ثابتة وتساوي المقاومة R (V = IR).',
    ),
    principle: l(
      'The voltage is the energy given to each coulomb of charge; a larger push drives charge round the circuit at a higher rate. The resistance sets how much current flows for each volt: 1 Ω allows 1 A per 1 V.',
      'فرق الجهد هو الطاقة التي يكتسبها كلّ كولوم من الشحنة؛ فكلّما زاد الدفع زاد معدّل سريان الشحنة في الدائرة. وتحدّد المقاومة مقدار التيّار لكلّ فولت: 1 Ω يسمح بمرور 1 A عند 1 V.',
    ),
    preset: 'ohm',
    equations: ['V = IR', 'I = V / R', 'R = V / I'],
    minutes: 10,
  },
  {
    id: 'ohm-resistance',
    lab: 'electricity',
    title: l('How does resistance affect current?', 'كيف تؤثّر المقاومة في شدّة التيّار؟'),
    source: 'adapted',
    ref: l('Lesson 1-4 · Ohm’s law (eq. 3-4), examples 3–5 · pp. 129–131', 'الدرس 1-4 · قانون أوم (المعادلة 3-4)، الأمثلة 3–5 · ص 129–131'),
    outcomes: ['P1011.3', 'P1011.4'],
    objective: l(
      'Investigate how the current changes when the resistance changes while the voltage stays constant.',
      'استقصاء تغيّر شدّة التيّار عند تغيير المقاومة مع بقاء فرق الجهد ثابتًا.',
    ),
    question: l('At a constant 6 V, what happens to the current as the resistance increases?', 'عند فرق جهد ثابت 6 V، ماذا يحدث لشدّة التيّار عند زيادة المقاومة؟'),
    hypothesisPrompt: l('Predict how the current will change when R goes from 10 Ω to 20 Ω.', 'توقّع كيف ستتغيّر شدّة التيّار عندما تتغيّر R من 10 Ω إلى 20 Ω.'),
    setup: [
      l('Same circuit as Figure 16-4a, with the battery fixed at 6 V (controlled variable).', 'الدائرة نفسها في الشكل 16-4a مع تثبيت البطارية على 6 V (متغيّر مضبوط).'),
      l('The resistor is the independent variable; the ammeter reading is the dependent variable.', 'المقاومة هي المتغيّر المستقلّ، وقراءة الأميتر هي المتغيّر التابع.'),
    ],
    steps: [
      l('Load the set-up. Select the resistor R and set it to 5 Ω. Record.', 'حمّل التجربة، ثم اختر المقاومة R واضبطها على 5 Ω وسجّل القراءة.'),
      l('Repeat for 10, 15, 20 and 30 Ω without changing the battery.', 'كرّر عند 10 و 15 و 20 و 30 Ω دون تغيير البطارية.'),
      l('Compare the I–R graph with the I–V graph from the previous activity.', 'قارن منحنى (شدّة التيّار – المقاومة) بمنحنى النشاط السابق.'),
    ],
    columns: [
      { id: 'R', label: l('Resistance R', 'المقاومة R'), unit: 'Ω', digits: 3 },
      { id: 'I', label: l('Current I', 'شدّة التيّار I'), unit: A, digits: 3 },
      { id: 'V', label: l('Voltage V', 'فرق الجهد V'), unit: V, digits: 3 },
      { id: 'IR', label: l('I × R', 'I × R'), unit: V, digits: 3 },
    ],
    chart: { x: 'R', y: 'I' },
    questions: [
      {
        id: 'i-20',
        kind: 'numeric',
        unit: A,
        prompt: l('At 6 V, what current flows through a 20 Ω resistor?', 'عند 6 V، ما شدّة التيّار المارّ في مقاومة 20 Ω؟'),
        expected: () => 0.3,
        hints: [l('Use I = V / R.', 'استخدم I = V / R.')],
        explanation: l('I = 6 V / 20 Ω = 0.3 A.', 'I = 6 V / 20 Ω = 0.3 A.'),
      },
      {
        id: 'double-r',
        kind: 'choice',
        prompt: l('If the resistance doubles at constant voltage, the current…', 'إذا تضاعفت المقاومة مع ثبات فرق الجهد، فإنّ شدّة التيّار…'),
        choices: [l('doubles', 'تتضاعف'), l('halves', 'تقلّ إلى النصف'), l('stays the same', 'تبقى ثابتة')],
        correctChoice: 1,
        hints: [l('Compare your 10 Ω and 20 Ω rows.', 'قارن صفّي 10 Ω و 20 Ω في جدولك.')],
        explanation: l('I = V/R: with V fixed, current is inversely proportional to resistance, so doubling R halves I.', 'I = V/R: مع ثبات V تتناسب شدّة التيّار عكسيًّا مع المقاومة، لذا فإنّ مضاعفة R تُنقص I إلى النصف.'),
      },
      {
        id: 'product',
        kind: 'numeric',
        unit: V,
        prompt: l('Multiply I × R for any of your rows. What value do you get?', 'اضرب I × R لأيّ صفّ من جدولك. ما القيمة التي تحصل عليها؟'),
        expected: ({ records }) => (records.length ? records[records.length - 1].values.IR : null),
        needs: l('Record at least one reading first.', 'سجّل قراءة واحدة على الأقلّ أوّلًا.'),
        hints: [l('The product should match one of the readings that you kept constant.', 'يجب أن يساوي الناتج إحدى القراءات التي أبقيتها ثابتة.')],
        explanation: l('I × R equals the battery voltage (6 V) in every row — Ohm’s law again, V = IR.', 'الناتج I × R يساوي جهد البطارية (6 V) في جميع الصفوف، وهذا هو قانون أوم V = IR.'),
      },
    ],
    conclusion: l(
      'At constant voltage, the current is inversely proportional to the resistance: a larger resistance lets less current flow, and I × R stays equal to V.',
      'عند ثبات فرق الجهد تتناسب شدّة التيّار عكسيًّا مع المقاومة: المقاومة الأكبر تسمح بتيّار أقلّ، ويبقى حاصل الضرب I × R مساويًا لـ V.',
    ),
    principle: l(
      'Resistance measures how hard it is for current to flow (the textbook compares it with a narrow bottle neck, Figure 12-4). The same voltage pushes less charge per second through a larger resistance.',
      'المقاومة مقياس لمدى صعوبة سريان التيّار (يشبّهها الكتاب بفوهة قارورة ضيّقة، الشكل 12-4). فرق الجهد نفسه يدفع شحنة أقلّ في الثانية عبر مقاومة أكبر.',
    ),
    preset: 'resistance',
    equations: ['I = V / R', 'V = IR'],
    minutes: 8,
  },
  {
    id: 'series-parallel',
    lab: 'electricity',
    title: l('Compare series and parallel circuits', 'المقارنة بين دوائر التوالي والتوازي'),
    source: 'textbook',
    ref: l('Lesson 2-4 · Figures 19-4, 23-4, 24-4 and Activity a1-4 · pp. 127, 137–142', 'الدرس 2-4 · الأشكال 19-4 و 23-4 و 24-4 والنشاط a1-4 · ص 127 و 137–142'),
    outcomes: ['P1012.2'],
    objective: l(
      'Compare current, voltage and equivalent resistance when three identical 1 Ω bulbs are connected to a 1.5 V cell in series and in parallel.',
      'مقارنة شدّة التيّار وفرق الجهد والمقاومة المكافئة عند توصيل ثلاثة مصابيح متماثلة (1 Ω) ببطارية 1.5 V على التوالي ثمّ على التوازي.',
    ),
    question: l('Why do bulbs in parallel shine brighter than the same bulbs in series?', 'لماذا تضيء المصابيح الموصولة على التوازي أكثر من المصابيح نفسها الموصولة على التوالي؟'),
    hypothesisPrompt: l('Predict the current from the cell in each circuit.', 'توقّع شدّة التيّار الخارج من البطارية في كلّ دائرة.'),
    setup: [
      l('Series circuit (Figure 23-4): 1.5 V cell, three 1 Ω bulbs, ammeter, voltmeter across bulb L1.', 'دائرة التوالي (الشكل 23-4): بطارية 1.5 V، ثلاثة مصابيح 1 Ω، أميتر، وفولتميتر بين طرفي المصباح L1.'),
      l('Parallel circuit (Figure 24-4): the same parts, each bulb on its own branch, ammeter A1 on the main line and A2 in branch L1.', 'دائرة التوازي (الشكل 24-4): العناصر نفسها، كلّ مصباح في فرع مستقلّ، الأميتر A1 في الخطّ الرئيس و A2 في فرع L1.'),
    ],
    steps: [
      l('Load the series circuit. Record the readings.', 'حمّل دائرة التوالي وسجّل القراءات.'),
      l('Delete bulb L2 (select it, then Delete). What happens to the other bulbs? Undo with “Set up experiment”.', 'احذف المصباح L2 (اختره ثمّ احذفه). ماذا يحدث لبقيّة المصابيح؟ أعِد التجهيز بزر «تجهيز التجربة».'),
      l('Load the parallel circuit. Record the readings.', 'حمّل دائرة التوازي وسجّل القراءات.'),
      l('Delete one bulb in the parallel circuit and compare.', 'احذف مصباحًا واحدًا في دائرة التوازي وقارن.'),
    ],
    columns: [
      { id: 'Itotal', label: l('Cell current', 'تيّار البطارية'), unit: A, digits: 3 },
      { id: 'Vbulb', label: l('V across L1', 'الجهد على L1'), unit: V, digits: 3 },
      { id: 'Ibulb', label: l('I in L1', 'التيّار في L1'), unit: A, digits: 3 },
      { id: 'Req', label: l('Req', 'المقاومة المكافئة'), unit: 'Ω', digits: 3 },
      { id: 'P', label: l('Power of L1', 'قدرة L1'), unit: 'W', digits: 3 },
    ],
    questions: [
      {
        id: 'series-i',
        kind: 'numeric',
        unit: A,
        prompt: l('Series circuit: what is the current through each bulb?', 'دائرة التوالي: ما شدّة التيّار المارّ في كلّ مصباح؟'),
        expected: () => 0.5,
        hints: [l('First find Req = R1 + R2 + R3.', 'أوجد أوّلًا Req = R1 + R2 + R3.'), l('Then I = V / Req = 1.5 V / 3 Ω.', 'ثمّ I = V / Req = 1.5 V / 3 Ω.')],
        explanation: l('Req = 3 Ω, so I = 1.5 / 3 = 0.5 A, the same in every bulb; each bulb gets 0.5 V.', 'Req = 3 Ω، إذن I = 1.5 / 3 = 0.5 A وهو التيّار نفسه في كلّ مصباح، ويكون فرق الجهد على كلّ مصباح 0.5 V.'),
        wrongFeedback: l('In series the resistances add, and the same current flows through every component.', 'في دائرة التوالي تُجمع المقاومات، ويسري التيّار نفسه في جميع المكوّنات.'),
      },
      {
        id: 'parallel-total',
        kind: 'numeric',
        unit: A,
        prompt: l('Parallel circuit: what total current leaves the cell?', 'دائرة التوازي: ما شدّة التيّار الكلّي الخارج من البطارية؟'),
        expected: () => 4.5,
        hints: [l('Each bulb has the full 1.5 V across it.', 'فرق الجهد على كلّ مصباح يساوي 1.5 V كاملة.'), l('I_total = I1 + I2 + I3.', 'I_total = I1 + I2 + I3.')],
        explanation: l('Each branch carries 1.5 V / 1 Ω = 1.5 A, so I_total = 1.5 + 1.5 + 1.5 = 4.5 A (Figure 24-4).', 'يمرّ في كلّ فرع 1.5 V / 1 Ω = 1.5 A، إذن I_total = 1.5 + 1.5 + 1.5 = 4.5 A (الشكل 24-4).'),
      },
      {
        id: 'parallel-req',
        kind: 'numeric',
        unit: 'Ω',
        prompt: l('What is the equivalent resistance of the three 1 Ω bulbs in parallel?', 'ما المقاومة المكافئة للمصابيح الثلاثة (1 Ω) الموصولة على التوازي؟'),
        expected: () => 1 / 3,
        hints: [l('1/Req = 1/R1 + 1/R2 + 1/R3.', '1/Req = 1/R1 + 1/R2 + 1/R3.')],
        explanation: l('1/Req = 1 + 1 + 1 = 3, so Req = 0.33 Ω — smaller than any single branch.', '1/Req = 1 + 1 + 1 = 3، إذن Req = 0.33 Ω وهي أصغر من مقاومة أيّ فرع منفرد.'),
      },
      {
        id: 'remove-series',
        kind: 'choice',
        prompt: l('In the series circuit, removing one bulb…', 'في دائرة التوالي، عند إزالة مصباح واحد…'),
        choices: [l('turns off all bulbs', 'تنطفئ جميع المصابيح'), l('makes the others brighter', 'تزداد إضاءة المصابيح الأخرى'), l('has no effect', 'لا يحدث أيّ تغيير')],
        correctChoice: 0,
        hints: [l('How many paths does the current have in a series circuit?', 'كم مسارًا للتيّار في دائرة التوالي؟')],
        explanation: l('A series circuit has a single path; removing a bulb opens the circuit and the current stops everywhere (Figure 19-4b).', 'لدائرة التوالي مسار واحد؛ إزالة مصباح تجعل الدائرة مفتوحة فيتوقّف التيّار في كلّ مكان (الشكل 19-4b).'),
      },
      {
        id: 'brighter',
        kind: 'open',
        prompt: l('Explain, using your recorded power values, why the parallel bulbs are brighter.', 'فسّر باستخدام قيم القدرة التي سجّلتها سبب زيادة إضاءة المصابيح الموصولة على التوازي.'),
        hints: [l('Compare the voltage across one bulb, and P = V²/R, in the two circuits.', 'قارن فرق الجهد على مصباح واحد، والقدرة P = V²/R في الدائرتين.')],
        explanation: l('In parallel each bulb gets the full 1.5 V, so P = V²/R = 2.25 W per bulb, versus 0.25 W in series (0.5 V each). More power means a brighter bulb.', 'في التوازي يحصل كلّ مصباح على 1.5 V كاملة، فتكون P = V²/R = 2.25 W لكلّ مصباح، مقابل 0.25 W في التوالي (0.5 V لكلّ مصباح). القدرة الأكبر تعني إضاءة أشدّ.'),
      },
    ],
    conclusion: l(
      'Series: one path, same current, voltages add up to the cell voltage, Req = R1 + R2 + R3. Parallel: same voltage on every branch, branch currents add up to the total, 1/Req = 1/R1 + 1/R2 + 1/R3, so the total current is larger.',
      'التوالي: مسار واحد، التيّار نفسه في كلّ المكوّنات، مجموع فروق الجهد يساوي جهد البطارية، Req = R1 + R2 + R3. التوازي: فرق الجهد نفسه على كلّ فرع، ومجموع تيّارات الفروع يساوي التيّار الكلّي، 1/Req = 1/R1 + 1/R2 + 1/R3، لذا يكون التيّار الكلّي أكبر.',
    ),
    principle: l(
      'Charge is conserved: the current entering a junction equals the current leaving it. Energy is conserved: around any loop the voltage gains (cell) equal the voltage drops (bulbs).',
      'الشحنة محفوظة: التيّار الداخل إلى نقطة تفرّع يساوي التيّار الخارج منها. والطاقة محفوظة: في أيّ مسار مغلق يساوي الجهد الذي تكتسبه الشحنة (من البطارية) مجموع فروق الجهد على المصابيح.',
    ),
    preset: 'series',
    equations: ['Req = R1 + R2 + R3', '1/Req = 1/R1 + 1/R2 + 1/R3', 'P = V²/R'],
    minutes: 12,
  },
  {
    id: 'combined-power',
    lab: 'electricity',
    title: l('Combined circuit and electric power', 'الدائرة المركّبة والقدرة الكهربائية'),
    source: 'textbook',
    ref: l('Lesson 2-4 · Example 11 and Review question 4 · pp. 143, 147', 'الدرس 2-4 · المثال 11 وسؤال التقويم 4 · ص 143 و 147'),
    outcomes: ['P1012.2', 'P1012.4'],
    objective: l(
      'Calculate the equivalent resistance, currents and power in a circuit that combines series and parallel parts, and verify with the meters.',
      'حساب المقاومة المكافئة وشدّة التيّار والقدرة في دائرة تجمع التوالي والتوازي، والتحقّق من ذلك بأجهزة القياس.',
    ),
    question: l('How is the current shared in a 13 V circuit with 20 Ω in series with 10 Ω ∥ 15 Ω?', 'كيف يتوزّع التيّار في دائرة جهدها 13 V فيها مقاومة 20 Ω على التوالي مع (10 Ω ∥ 15 Ω)؟'),
    hypothesisPrompt: l('Predict which resistor dissipates the most power.', 'توقّع أيّ مقاومة تستهلك أكبر قدرة.'),
    setup: [
      l('Circuit from Review question 4 (p. 147): 13 V battery, R1 = 20 Ω in series with R2 = 10 Ω ∥ R3 = 15 Ω.', 'دائرة سؤال التقويم 4 (ص 147): بطارية 13 V، المقاومة R1 = 20 Ω على التوالي مع R2 = 10 Ω ∥ R3 = 15 Ω.'),
    ],
    steps: [
      l('Calculate Req on paper first, then compare with the reading panel.', 'احسب Req على الورق أوّلًا، ثمّ قارنها بلوحة القراءات.'),
      l('Select R2 and R3 to read their currents. Record.', 'اختر R2 و R3 لقراءة تيّار كلّ منهما، ثمّ سجّل.'),
      l('Change R3 to 30 Ω. Predict, then record again.', 'غيّر R3 إلى 30 Ω. توقّع، ثمّ سجّل مرّة أخرى.'),
    ],
    columns: [
      { id: 'Req', label: l('Req', 'المقاومة المكافئة'), unit: 'Ω', digits: 3 },
      { id: 'Itotal', label: l('Cell current', 'تيّار البطارية'), unit: A, digits: 3 },
      { id: 'Vpar', label: l('V across R2 ∥ R3', 'الجهد على R2 ∥ R3'), unit: V, digits: 3 },
      { id: 'P1', label: l('Power in R1', 'القدرة في R1'), unit: 'W', digits: 3 },
      { id: 'Ptotal', label: l('Total power', 'القدرة الكلّيّة'), unit: 'W', digits: 3 },
    ],
    questions: [
      {
        id: 'req',
        kind: 'numeric',
        unit: 'Ω',
        prompt: l('What is the equivalent resistance of the original circuit?', 'ما المقاومة المكافئة للدائرة الأصليّة؟'),
        expected: () => 26,
        hints: [l('First combine 10 Ω ∥ 15 Ω.', 'اجمع أوّلًا 10 Ω ∥ 15 Ω.'), l('1/Rp = 1/10 + 1/15 → Rp = 6 Ω; then add 20 Ω.', '1/Rp = 1/10 + 1/15 ← Rp = 6 Ω، ثمّ أضف 20 Ω.')],
        explanation: l('Rp = 6 Ω, so Req = 20 + 6 = 26 Ω, and I = 13 / 26 = 0.5 A.', 'Rp = 6 Ω، إذن Req = 20 + 6 = 26 Ω، و I = 13 / 26 = 0.5 A.'),
      },
      {
        id: 'p1',
        kind: 'numeric',
        unit: 'W',
        prompt: l('What power is dissipated in R1 = 20 Ω?', 'ما القدرة المستهلكة في R1 = 20 Ω؟'),
        expected: () => 5,
        hints: [l('The whole cell current (0.5 A) flows through R1.', 'يمرّ تيّار البطارية كاملًا (0.5 A) في R1.'), l('P = I²R.', 'P = I²R.')],
        explanation: l('P = I²R = (0.5 A)² × 20 Ω = 5 W.', 'P = I²R = (0.5 A)² × 20 Ω = 5 W.'),
      },
      {
        id: 'i10',
        kind: 'numeric',
        unit: A,
        prompt: l('What current flows through the 10 Ω resistor?', 'ما شدّة التيّار المارّ في المقاومة 10 Ω؟'),
        expected: () => 0.3,
        hints: [l('Find the voltage across the parallel part: V = I × Rp.', 'أوجد فرق الجهد على الجزء الموصول على التوازي: V = I × Rp.'), l('3 V across 10 Ω.', '3 V على 10 Ω.')],
        explanation: l('V∥ = 0.5 A × 6 Ω = 3 V, so I10 = 3/10 = 0.3 A and I15 = 3/15 = 0.2 A; 0.3 + 0.2 = 0.5 A.', 'V∥ = 0.5 A × 6 Ω = 3 V، إذن I10 = 3/10 = 0.3 A و I15 = 3/15 = 0.2 A، والمجموع 0.5 A.'),
      },
    ],
    conclusion: l(
      'Reduce a combined circuit step by step: replace each parallel group by its equivalent, then add series parts. The total power from the cell (P = VI) equals the sum of the powers in the resistors.',
      'تُبسَّط الدائرة المركّبة خطوة بخطوة: تُستبدل كلّ مجموعة متوازية بمقاومتها المكافئة، ثمّ تُجمع المقاومات المتوالية. والقدرة الكلّيّة من البطارية (P = VI) تساوي مجموع القدرات المستهلكة في المقاومات.',
    ),
    principle: l(
      'Electric power is the rate of energy transfer, P = E/t. With Ohm’s law it can be written P = VI = I²R = V²/R.',
      'القدرة الكهربائية هي المعدّل الزمني لانتقال الطاقة P = E/t، وباستخدام قانون أوم تُكتب P = VI = I²R = V²/R.',
    ),
    preset: 'combined',
    equations: ['Req = R1 + (1/R2 + 1/R3)⁻¹', 'P = VI', 'P = I²R', 'P = V²/R'],
    minutes: 10,
  },
];
