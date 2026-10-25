import { l, type L } from '../i18n/i18n';
import type { LabId } from '../lib/progress';

export interface WorkshopStep {
  id: string;
  lab: LabId;
  title: L;
  minutes: number;
  /** Query string applied to the lab page (activity, preset, mode). */
  query: Record<string, string>;
  objective: L;
  /** What the presenter does on screen. */
  actions: L[];
  /** What to say: the physics explanation. */
  explain: L;
}

/** A 5-minute electricity sequence for a live demonstration. */
export const ELECTRICITY_SEQUENCE: WorkshopStep[] = [
  {
    id: 'e1',
    lab: 'electricity',
    title: l('Closed and open circuits', 'الدائرة المغلقة والمفتوحة'),
    minutes: 1,
    query: { activity: 'ohm-voltage', preset: 'ohm', mode: 'free' },
    objective: l('Show that current flows only around a complete loop.', 'إظهار أنّ التيّار يسري فقط في مسار مغلق كامل.'),
    actions: [
      l('Point at the moving dots: conventional current from + to −.', 'أشِر إلى النقاط المتحرّكة: التيّار الاصطلاحي من + إلى −.'),
      l('Click the switch S, then click it again: the circuit opens and every reading drops to 0.', 'انقر المفتاح S ثمّ انقره مجدّدًا: تُفتح الدائرة وتهبط كلّ القراءات إلى الصفر.'),
    ],
    explain: l('Without a closed path there is no current (Lesson 1-4). The ammeter is in series and reads the current; the voltmeter is in parallel and reads the voltage.', 'لا يسري تيّار بلا مسار مغلق (الدرس 1-4). الأميتر موصول على التوالي ويقيس التيّار، والفولتميتر موصول على التوازي ويقيس فرق الجهد.'),
  },
  {
    id: 'e2',
    lab: 'electricity',
    title: l('Ohm’s law in four readings', 'قانون أوم في أربع قراءات'),
    minutes: 1.5,
    query: { activity: 'ohm-voltage', preset: 'ohm', mode: 'guided' },
    objective: l('Collect V and I at 1, 2, 3, 4 V and read R from the slope.', 'جمع قيم V و I عند 1 و 2 و 3 و 4 V وقراءة R من الميل.'),
    actions: [
      l('Select the battery; set 1 V and press “Record reading”. Repeat for 2, 3 and 4 V.', 'اختر البطارية؛ اضبطها على 1 V واضغط «تسجيل القراءة». كرّر عند 2 و 3 و 4 V.'),
      l('Show the straight line through the origin and its slope (10 Ω).', 'اعرض الخطّ المستقيم المارّ بنقطة الأصل وميله (10 Ω).'),
    ],
    explain: l('For a fixed resistor V/I is constant: V = IR (Activity b1-4). Doubling the voltage doubles the current.', 'للمقاومة الثابتة تكون النسبة V/I ثابتة: V = IR (النشاط b1-4). مضاعفة فرق الجهد تضاعف شدّة التيّار.'),
  },
  {
    id: 'e3',
    lab: 'electricity',
    title: l('What a short circuit looks like', 'كيف يبدو القصر في الدائرة'),
    minutes: 1,
    query: { activity: 'ohm-voltage', preset: 'ohm', mode: 'free' },
    objective: l('Show why a wire across the battery is dangerous.', 'إظهار سبب خطورة توصيل سلك بين طرفي البطارية.'),
    actions: [
      l('Choose the Wire tool. Drag from the dot at the top of the resistor to the dot one step right and one step down, then drag from there back to the resistor’s bottom dot. This wire bypasses the resistor.', 'اختر أداة السلك. اسحب من النقطة أعلى المقاومة إلى النقطة التي تليها يمينًا وأسفل، ثمّ اسحب منها إلى النقطة أسفل المقاومة. يتجاوز هذا السلك المقاومة.'),
      l('The lab flags a short circuit and stops. Press Undo to recover.', 'يُنبّه المختبر إلى القصر ويتوقّف. اضغط «تراجع» للعودة.'),
    ],
    explain: l('With no resistance in the loop, I = V/R has no limit. Real batteries and wires overheat — that is why circuits use fuses.', 'بلا مقاومة في الدائرة لا يكون للتيّار I = V/R حدّ. ترتفع حرارة البطاريات والأسلاك الحقيقيّة كثيرًا، ولهذا تُستخدم المصهرات.'),
  },
  {
    id: 'e4',
    lab: 'electricity',
    title: l('Series versus parallel', 'التوالي مقابل التوازي'),
    minutes: 1.5,
    query: { activity: 'series-parallel', preset: 'series', mode: 'guided' },
    objective: l('Compare the textbook’s three-bulb circuits (Figures 23-4 and 24-4).', 'مقارنة دائرتي المصابيح الثلاثة في الكتاب (الشكلان 23-4 و 24-4).'),
    actions: [
      l('Series: 0.5 A everywhere, 0.5 V per bulb, dim bulbs. Record a reading.', 'التوالي: 0.5 A في كلّ مكان، و 0.5 V لكلّ مصباح، ومصابيح خافتة. سجّل قراءة.'),
      l('Press “Parallel bulbs”: 1.5 V on each bulb, 4.5 A from the cell, bright bulbs. Record again.', 'اضغط «مصابيح على التوازي»: 1.5 V على كلّ مصباح، و 4.5 A من البطارية، ومصابيح ساطعة. سجّل مجدّدًا.'),
    ],
    explain: l('Series: Req = R1 + R2 + R3 = 3 Ω. Parallel: 1/Req = 1/R1 + 1/R2 + 1/R3, so Req = 1/3 Ω and the cell supplies nine times the current.', 'التوالي: Req = R1 + R2 + R3 = 3 Ω. التوازي: 1/Req = 1/R1 + 1/R2 + 1/R3، فتكون Req = 1/3 Ω وتزوّد البطارية تيّارًا أكبر بتسع مرّات.'),
  },
];

/** One prepared scenario per lab (the electricity one is the sequence above). */
export const SCENARIOS: WorkshopStep[] = [
  {
    id: 'm1',
    lab: 'motion',
    title: l('The robot of Example 24: area under v–t', 'روبوت المثال 24: المساحة تحت منحنى السرعة المتّجهة'),
    minutes: 4,
    query: { activity: 'robot-area', mode: 'guided' },
    objective: l('Find the distance travelled from the area under the v–t graph.', 'إيجاد المسافة المقطوعة من المساحة تحت منحنى (السرعة المتّجهة – الزمن).'),
    actions: [
      l('Press Play. Pause at 5 s, 10 s and 15 s and record.', 'اضغط «تشغيل». أوقف مؤقّتًا عند 5 s و 10 s و 15 s وسجّل.'),
      l('Point out the trapezium under the v–t graph: 25 + 50 + 25 = 100 m.', 'أشِر إلى شبه المنحرف تحت المنحنى: 25 + 50 + 25 = 100 m.'),
    ],
    explain: l('Displacement equals the area under the v–t graph; the slope of each segment is the acceleration (2, 0, −2 m/s²).', 'الإزاحة تساوي المساحة تحت منحنى (السرعة المتّجهة – الزمن)، وميل كلّ جزء هو التسارع (2 و 0 و ‎−2 m/s²).'),
  },
  {
    id: 'm2',
    lab: 'motion',
    title: l('Speed or velocity? A cart that turns back', 'السرعة أم السرعة المتّجهة؟ عربة تعود أدراجها'),
    minutes: 3,
    query: { activity: 'turnaround', mode: 'guided' },
    objective: l('See velocity change sign while speed stays positive; compare distance and displacement.', 'ملاحظة تغيّر إشارة السرعة المتّجهة مع بقاء السرعة موجبة، ومقارنة المسافة بالإزاحة.'),
    actions: [l('Play to 5 s (the cart stops), then to 8 s. Compare the distance and displacement readouts.', 'شغّل حتّى 5 s (تتوقّف العربة) ثمّ حتّى 8 s. قارن قراءتي المسافة والإزاحة.')],
    explain: l('Velocity is a vector and can be negative; speed is its size. After turning back, distance (34 m) exceeds displacement (16 m).', 'السرعة المتّجهة كمّيّة متّجهة ويمكن أن تكون سالبة، والسرعة مقدارها. بعد العودة تصبح المسافة (34 m) أكبر من الإزاحة (16 m).'),
  },
  {
    id: 'h1',
    lab: 'heat',
    title: l('Why does the temperature stop rising?', 'لماذا تتوقّف درجة الحرارة عن الارتفاع؟'),
    minutes: 4,
    query: { activity: 'heating-curve', mode: 'guided' },
    objective: l('Explain the plateaus of the heating curve with latent heat.', 'تفسير المراحل الأفقيّة لمنحنى التسخين بالحرارة الكامنة.'),
    actions: [
      l('Press Play and watch the particle model as the ice melts at 0 °C.', 'اضغط «تشغيل» وراقب نموذج الجسيمات أثناء انصهار الجليد عند 0 °C.'),
      l('Show the energy accounting table: the melting row grows while the temperature is constant.', 'اعرض جدول حساب الطاقة: يزداد صفّ الانصهار بينما تبقى درجة الحرارة ثابتة.'),
    ],
    explain: l('During a change of state the energy breaks the bonds between particles (Q = mL) instead of raising their kinetic energy, so the temperature stays constant (Figure 16-3).', 'أثناء تغيّر الحالة تُستخدم الطاقة في فكّ الروابط بين الجسيمات (Q = mL) بدلًا من زيادة طاقتها الحركيّة، فتبقى درجة الحرارة ثابتة (الشكل 16-3).'),
  },
  {
    id: 'h2',
    lab: 'heat',
    title: l('Water versus aluminium', 'الماء مقابل الألومنيوم'),
    minutes: 3,
    query: { activity: 'specific-heat', mode: 'guided' },
    objective: l('Same energy, different temperature rise: specific heat capacity.', 'الطاقة نفسها وارتفاع مختلف في درجة الحرارة: السعة الحراريّة النوعيّة.'),
    actions: [l('Press Play to 600 s (10 min). Compare the temperature rises: about 14 °C for water and 67 °C for aluminium.', 'اضغط «تشغيل» حتّى 600 s (10 دقائق). قارن ارتفاع درجة الحرارة: نحو 14 °C للماء و 67 °C للألومنيوم.')],
    explain: l('Q = mcΔT: with equal Q and m, ΔT is inversely proportional to c. Water’s large c (4184 J/kg·°C) moderates climate (Lesson 2-3).', 'Q = mcΔT: عند تساوي Q و m يتناسب ΔT عكسيًّا مع c. السعة الحراريّة الكبيرة للماء (4184 J/kg·°C) تلطّف المناخ (الدرس 2-3).'),
  },
];

export const ALL_STEPS = [...ELECTRICITY_SEQUENCE, ...SCENARIOS];

export const LAB_PATH: Record<LabId, string> = { electricity: '/lab/electricity', motion: '/lab/motion', heat: '/lab/heat', chemistry: '/lab/chemistry' };

export const stepLink = (s: WorkshopStep) => `${LAB_PATH[s.lab]}?${new URLSearchParams({ ...s.query, ws: s.id }).toString()}`;
