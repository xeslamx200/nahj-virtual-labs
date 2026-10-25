import { l } from '../i18n/i18n';
import { linearFit } from '../lib/format';
import type { MotionConfig } from '../physics/motion/model';
import type { ActivityDef, LabInfo } from './types';

export interface MotionCheckState {
  config: MotionConfig;
  t: number;
}

export const MOTION_LAB: LabInfo = {
  id: 'motion',
  title: l('Motion Lab', 'مختبر الحركة'),
  short: l('Launch a cart on a straight track and read its motion from x–t and v–t graphs.', 'حرّك عربة على مسار مستقيم واقرأ حركتها من منحنيي (الموقع – الزمن) و(السرعة المتّجهة – الزمن).'),
  unit: l('Unit 2 · Kinematics', 'الوحدة 2 · علم الحركة (الكينماتيكا)'),
  book: l('Grade 10 · Science · Semester 2', 'الصفّ العاشر · العلوم · الفصل الدراسي الثاني'),
  lessons: [
    l('Lesson 1-2 · Vectors and Scalars (p. 38)', 'الدرس 1-2 · الكمّيّات المتّجهة والكمّيّات القياسيّة (ص 38)'),
    l('Lesson 2-2 · Motion Description (p. 56)', 'الدرس 2-2 · وصف الحركة (ص 56)'),
  ],
  objectives: [
    l('Distinguish distance from displacement and speed from velocity.', 'التمييز بين المسافة والإزاحة، وبين السرعة والسرعة المتّجهة.'),
    l('Represent motion with x–t and v–t graphs and interpret their slopes.', 'تمثيل الحركة بمنحنيي (الموقع – الزمن) و(السرعة المتّجهة – الزمن) وتفسير ميل كلّ منهما.'),
    l('Find displacement as the area under the v–t graph.', 'إيجاد الإزاحة من المساحة تحت منحنى (السرعة المتّجهة – الزمن).'),
    l('Apply the equations of uniformly accelerated motion.', 'تطبيق معادلات الحركة بتسارع منتظم.'),
  ],
  outcomes: ['P1003.1', 'P1003.2', 'P1003.3', 'P1004.1'],
  pages: '56–87',
  accent: 'navy',
  assumptions: [
    l('The cart is treated as a point moving along a straight line (one dimension).', 'تُعامَل العربة كنقطة تتحرّك على خطّ مستقيم (بعد واحد).'),
    l('Positive direction is to the right of the origin, as in Figure 28-2.', 'الاتّجاه الموجب نحو يمين نقطة الأصل، كما في الشكل 28-2.'),
    l('Acceleration is constant within each stage; friction and air resistance are not modelled separately.', 'التسارع ثابت خلال كلّ مرحلة، ولا تُنمذَج قوى الاحتكاك ومقاومة الهواء بشكل منفصل.'),
    l('A stage may set a new velocity instantly (an idealisation used in textbook example 16).', 'يمكن لمرحلة أن تبدأ بسرعة متّجهة جديدة فورًا (تبسيط مستخدم في المثال 16 من الكتاب).'),
    l('Every animation frame, reading, table row and graph point comes from the same equations, evaluated at the same time t.', 'كلّ إطار في الحركة وكلّ قراءة وصفّ في الجدول ونقطة على المنحنى ناتجة عن المعادلات نفسها عند الزمن t نفسه.'),
  ],
  safety: [],
  assistantContext: `Textbook: Qatar MoEHE Grade 10 Science, Semester 2, Unit 2 "Kinematics".
Lesson 1-2 Vectors and Scalars (p.38): scalar has magnitude only, vector has magnitude and direction; displacement is a vector, distance is a scalar.
Lesson 2-2 Motion Description (pp.56-87). Outcomes: P1003.2 describe distance, displacement, speed, velocity and acceleration; P1003.3 represent them graphically and interpret graphs, including displacement as area under the v-t graph; P1004.1 derive and use the equations of uniformly accelerated motion in a straight line.
Equations: speed v = d/t (5-2); velocity v = Δx/Δt (6-2); acceleration a = Δv/Δt (7-2); vf = vi + a t (8-2); xf = xi + vi t + ½ a t² (9-2); vf² = vi² + 2a(xf − xi) (10-2).
Sign convention: right of origin positive, left negative (Fig 28-2). Speed cannot be negative; velocity can be positive, negative or zero.
Graphs: slope of x-t = velocity; constant velocity gives a straight x-t line; constant acceleration gives a straight v-t line and a curved x-t graph (Fig 38-2); slope of v-t = acceleration; area under v-t = displacement.
Examples: 150 m in 12 s gives 12.5 m/s (ex 14); robot 0.5 m/s right for 15 s then 0.3 m/s left for 18 s ends at +2.1 m (ex 16); robot 2 m/s² for 5 s, constant 5 s, −2 m/s² for 5 s covers 100 m (ex 24); vi = 1 m/s, a = 0.5 m/s², t = 3 s gives 2.5 m/s (ex 25); from rest 1.4 m in 1.6 s gives a = 1.09 m/s² (ex 26); 0 to 25 m/s over 150 m gives 2.1 m/s² (ex 29).`,
};

export const MOTION_PRESETS: Record<string, MotionConfig> = {
  uniform: { x0: 0, v0: 5, stages: [{ duration: 10, a: 0 }] },
  accelerated: { x0: 0, v0: 1, stages: [{ duration: 6, a: 0.5 }] },
  robot: {
    x0: 0,
    v0: 0,
    stages: [
      { duration: 5, a: 2 },
      { duration: 5, a: 0 },
      { duration: 5, a: -2 },
    ],
  },
  turnaround: { x0: 0, v0: 10, stages: [{ duration: 8, a: -2 }] },
  reverse: { x0: 0, v0: 0.5, stages: [{ duration: 15, a: 0 }, { duration: 18, a: 0, v: -0.3 }] },
};

export const MOTION_ACTIVITIES: ActivityDef<MotionCheckState>[] = [
  {
    id: 'uniform',
    lab: 'motion',
    title: l('Uniform motion: speed and velocity', 'الحركة المنتظمة: السرعة والسرعة المتّجهة'),
    source: 'adapted',
    ref: l('Lesson 2-2 · eqs 5-2, 6-2 · Figures 27-2, 28-2 · pp. 62–63', 'الدرس 2-2 · المعادلتان 5-2 و 6-2 · الشكلان 27-2 و 28-2 · ص 62–63'),
    outcomes: ['P1003.2', 'P1003.3'],
    objective: l(
      'Show that an object moving with constant velocity has a straight x–t graph whose slope is the velocity, and that the sign of velocity gives the direction.',
      'إثبات أنّ الجسم المتحرّك بسرعة متّجهة ثابتة يكون منحنى (الموقع – الزمن) له خطًّا مستقيمًا ميله يساوي السرعة المتّجهة، وأنّ إشارة السرعة المتّجهة تدلّ على الاتّجاه.',
    ),
    question: l('What does the slope of a position–time graph tell us?', 'ماذا يخبرنا ميل منحنى (الموقع – الزمن)؟'),
    hypothesisPrompt: l('Predict the shape of the x–t graph for a cart moving at a steady 5 m/s.', 'توقّع شكل منحنى (الموقع – الزمن) لعربة تتحرّك بسرعة ثابتة مقدارها 5 m/s.'),
    setup: [l('Cart at x = 0 m, velocity +5 m/s, acceleration 0, run time 10 s.', 'العربة عند x = 0 m، السرعة المتّجهة ‎+5 m/s، التسارع صفر، زمن التشغيل 10 s.')],
    steps: [
      l('Play the motion. Pause at t = 2, 4, 6 and 8 s (or use Step) and record each time.', 'شغّل الحركة، ثمّ أوقفها مؤقّتًا عند t = 2 و 4 و 6 و 8 s (أو استخدم زرّ الخطوة) وسجّل القراءات في كلّ مرّة.'),
      l('Look at the x–t graph and work out its slope.', 'لاحظ منحنى (الموقع – الزمن) واحسب ميله.'),
      l('Reset, change the velocity to −5 m/s and play again. Compare the speed and velocity readings.', 'أعد الضبط، وغيّر السرعة المتّجهة إلى ‎−5 m/s، ثمّ شغّل مجدّدًا. قارن بين قراءتي السرعة والسرعة المتّجهة.'),
    ],
    columns: [
      { id: 't', label: l('Time t', 'الزمن t'), unit: 's', digits: 3 },
      { id: 'x', label: l('Position x', 'الموقع x'), unit: 'm', digits: 3 },
      { id: 'v', label: l('Velocity v', 'السرعة المتّجهة v'), unit: 'm/s', digits: 3 },
      { id: 'speed', label: l('Speed', 'السرعة'), unit: 'm/s', digits: 3 },
    ],
    chart: { x: 't', y: 'x', fit: 'line', slopeUnit: 'm/s' },
    questions: [
      {
        id: 'disp-8',
        kind: 'numeric',
        unit: 'm',
        prompt: l('At +5 m/s, how far does the cart move in 8 s?', 'بسرعة متّجهة ‎+5 m/s، كم تقطع العربة خلال 8 s؟'),
        expected: () => 40,
        hints: [l('Δx = v Δt.', 'Δx = v Δt.')],
        explanation: l('Δx = (5 m/s)(8 s) = 40 m.', 'Δx = (5 m/s)(8 s) = 40 m.'),
      },
      {
        id: 'slope',
        kind: 'numeric',
        unit: 'm/s',
        prompt: l('From your recorded rows, what is the slope of the x–t graph?', 'من الصفوف التي سجّلتها، ما ميل منحنى (الموقع – الزمن)؟'),
        expected: ({ records }) => {
          const pts = records.map((r) => ({ x: r.values.t, y: r.values.x }));
          const fit = linearFit(pts);
          return pts.length >= 2 && fit ? fit.m : null;
        },
        needs: l('Record at least two rows first.', 'سجّل صفّين على الأقلّ أوّلًا.'),
        hints: [l('slope = Δx / Δt between two of your rows.', 'الميل = Δx / Δt بين صفّين من جدولك.')],
        explanation: l('The slope of the x–t graph equals the velocity of the cart.', 'ميل منحنى (الموقع – الزمن) يساوي السرعة المتّجهة للعربة.'),
      },
      {
        id: 'negative',
        kind: 'choice',
        prompt: l('A velocity of −5 m/s means the cart…', 'السرعة المتّجهة ‎−5 m/s تعني أنّ العربة…'),
        choices: [
          l('moves left (towards −x) at 5 m/s', 'تتحرّك نحو اليسار (نحو ‎−x) بسرعة 5 m/s'),
          l('is slowing down', 'تتباطأ'),
          l('moves right at −5 m/s', 'تتحرّك نحو اليمين بسرعة ‎−5 m/s'),
        ],
        correctChoice: 0,
        hints: [l('The sign of a vector gives its direction (Figure 28-2).', 'إشارة الكمّيّة المتّجهة تدلّ على اتّجاهها (الشكل 28-2).')],
        explanation: l('Velocity is a vector: the minus sign only shows the direction (to the left). The speed is still 5 m/s.', 'السرعة المتّجهة كمّيّة متّجهة: الإشارة السالبة تدلّ على الاتّجاه فقط (نحو اليسار)، وتبقى السرعة 5 m/s.'),
      },
      {
        id: 'speed-negative',
        kind: 'choice',
        prompt: l('Can the speed reading ever be negative?', 'هل يمكن أن تكون قراءة السرعة سالبة؟'),
        choices: [l('No — speed is a scalar (magnitude only)', 'لا، فالسرعة كمّيّة قياسيّة (مقدار فقط)'), l('Yes, when moving left', 'نعم، عند الحركة نحو اليسار')],
        correctChoice: 0,
        hints: [l('Watch the Speed readout while the cart moves left.', 'راقب قراءة السرعة بينما تتحرّك العربة نحو اليسار.')],
        explanation: l('Speed is the magnitude of velocity, so it cannot be negative (textbook p. 63).', 'السرعة هي مقدار السرعة المتّجهة، لذا لا يمكن أن تكون سالبة (الكتاب ص 63).'),
      },
    ],
    conclusion: l(
      'At constant velocity the x–t graph is a straight line; its slope is the velocity. The sign of the velocity shows the direction, while speed is always positive.',
      'عند ثبات السرعة المتّجهة يكون منحنى (الموقع – الزمن) خطًّا مستقيمًا ميله يساوي السرعة المتّجهة. تدلّ إشارة السرعة المتّجهة على الاتّجاه، أمّا السرعة فموجبة دائمًا.',
    ),
    principle: l('v = Δx / Δt: equal displacements in equal time intervals give a constant slope.', 'v = Δx / Δt: الإزاحات المتساوية في فترات زمنية متساوية تعطي ميلًا ثابتًا.'),
    preset: 'uniform',
    equations: ['v = d / t', 'v = Δx / Δt'],
    minutes: 8,
  },
  {
    id: 'accelerated',
    lab: 'motion',
    title: l('Uniformly accelerated motion', 'الحركة المتسارعة بانتظام'),
    source: 'textbook',
    ref: l('Lesson 2-2 · eqs 7-2, 8-2, 9-2 · Figure 38-2, Example 25 · pp. 70–76', 'الدرس 2-2 · المعادلات 7-2 و 8-2 و 9-2 · الشكل 38-2 والمثال 25 · ص 70–76'),
    outcomes: ['P1003.3', 'P1004.1'],
    objective: l(
      'Show that constant acceleration gives a straight v–t graph (slope = a) and a curved x–t graph, and use vf = vi + at and xf = xi + vi t + ½at².',
      'إثبات أنّ التسارع الثابت يعطي منحنى (السرعة المتّجهة – الزمن) مستقيمًا ميله a، ومنحنى (الموقع – الزمن) منحنيًا، واستخدام المعادلتين vf = vi + at و xf = xi + vi t + ½at².',
    ),
    question: l('How do the graphs change when the velocity increases at a constant rate?', 'كيف تتغيّر المنحنيات عندما تزداد السرعة المتّجهة بمعدّل ثابت؟'),
    hypothesisPrompt: l('Predict the velocity of a cart after 3 s if vi = 1 m/s and a = 0.5 m/s².', 'توقّع السرعة المتّجهة لعربة بعد 3 s إذا كانت vi = 1 m/s و a = 0.5 m/s².'),
    setup: [l('Cart at x = 0 m with vi = +1 m/s and a = +0.5 m/s² for 6 s (Example 25a).', 'العربة عند x = 0 m بسرعة ابتدائيّة ‎+1 m/s وتسارع ‎+0.5 m/s² لمدّة 6 s (المثال 25a).')],
    steps: [
      l('Step through the motion one second at a time and record each second.', 'تقدّم في الحركة ثانية بثانية وسجّل القراءات كلّ ثانية.'),
      l('Compare the shapes of the x–t and v–t graphs.', 'قارن شكلي منحنى (الموقع – الزمن) ومنحنى (السرعة المتّجهة – الزمن).'),
      l('Change a to −0.5 m/s² and vi to 2 m/s (Example 25b). What changes?', 'غيّر a إلى ‎−0.5 m/s² و vi إلى 2 m/s (المثال 25b). ما الذي يتغيّر؟'),
    ],
    columns: [
      { id: 't', label: l('Time t', 'الزمن t'), unit: 's', digits: 3 },
      { id: 'x', label: l('Position x', 'الموقع x'), unit: 'm', digits: 3 },
      { id: 'v', label: l('Velocity v', 'السرعة المتّجهة v'), unit: 'm/s', digits: 3 },
      { id: 'a', label: l('Acceleration a', 'التسارع a'), unit: 'm/s²', digits: 3 },
    ],
    chart: { x: 't', y: 'v', fit: 'line', slopeUnit: 'm/s²' },
    questions: [
      {
        id: 'vf-3',
        kind: 'numeric',
        unit: 'm/s',
        prompt: l('vi = 1 m/s, a = 0.5 m/s². What is v after 3 s?', 'vi = 1 m/s و a = 0.5 m/s². ما السرعة المتّجهة بعد 3 s؟'),
        expected: () => 2.5,
        hints: [l('Use equation 8-2: vf = vi + at.', 'استخدم المعادلة 8-2: vf = vi + at.')],
        explanation: l('vf = 1 + (0.5)(3) = 2.5 m/s (Example 25a).', 'vf = 1 + (0.5)(3) = 2.5 m/s (المثال 25a).'),
      },
      {
        id: 'xf-4',
        kind: 'numeric',
        unit: 'm',
        prompt: l('Where is the cart after 4 s?', 'أين تكون العربة بعد 4 s؟'),
        expected: () => 8,
        hints: [l('Equation 9-2: xf = xi + vi t + ½at².', 'المعادلة 9-2: xf = xi + vi t + ½at².'), l('0 + (1)(4) + ½(0.5)(4)².', '0 + (1)(4) + ½(0.5)(4)².')],
        explanation: l('xf = 0 + 4 + 0.25 × 16 = 8 m.', 'xf = 0 + 4 + 0.25 × 16 = 8 m.'),
      },
      {
        id: 'vt-slope',
        kind: 'numeric',
        unit: 'm/s²',
        prompt: l('From your records, what is the slope of the v–t graph?', 'من تسجيلاتك، ما ميل منحنى (السرعة المتّجهة – الزمن)؟'),
        expected: ({ records }) => {
          const fit = linearFit(records.map((r) => ({ x: r.values.t, y: r.values.v })));
          return records.length >= 2 && fit ? fit.m : null;
        },
        needs: l('Record at least two rows first.', 'سجّل صفّين على الأقلّ أوّلًا.'),
        hints: [l('slope = Δv / Δt.', 'الميل = Δv / Δt.')],
        explanation: l('The slope of the v–t graph is the acceleration (eq. 7-2), 0.5 m/s² here.', 'ميل منحنى (السرعة المتّجهة – الزمن) هو التسارع (المعادلة 7-2)، ويساوي هنا 0.5 m/s².'),
      },
      {
        id: 'xt-shape',
        kind: 'choice',
        prompt: l('With constant positive acceleration, the x–t graph is…', 'عند تسارع موجب ثابت، يكون منحنى (الموقع – الزمن)…'),
        choices: [l('a curve that gets steeper', 'منحنيًا يزداد ميله'), l('a straight line', 'خطًّا مستقيمًا'), l('a horizontal line', 'خطًّا أفقيًّا')],
        correctChoice: 0,
        hints: [l('The slope of x–t is the velocity — is the velocity constant?', 'ميل منحنى (الموقع – الزمن) هو السرعة المتّجهة، فهل السرعة المتّجهة ثابتة؟')],
        explanation: l('The velocity keeps increasing, so the slope of the x–t graph keeps increasing: a curve (Figure 38-2b).', 'تزداد السرعة المتّجهة باستمرار، فيزداد ميل منحنى (الموقع – الزمن) ويصبح منحنيًا (الشكل 38-2b).'),
      },
    ],
    conclusion: l(
      'Constant acceleration means the velocity changes by the same amount every second: the v–t graph is a straight line with slope a, and the x–t graph is a curve.',
      'التسارع الثابت يعني أنّ السرعة المتّجهة تتغيّر بالمقدار نفسه كلّ ثانية: منحنى (السرعة المتّجهة – الزمن) خطّ مستقيم ميله a، ومنحنى (الموقع – الزمن) منحنٍ.',
    ),
    principle: l('a = Δv / Δt. Positive acceleration with positive velocity means speeding up; opposite signs mean slowing down.', 'a = Δv / Δt. التسارع الموجب مع سرعة متّجهة موجبة يعني تزايد السرعة، واختلاف الإشارتين يعني تباطؤ الحركة.'),
    preset: 'accelerated',
    equations: ['a = Δv / Δt', 'vf = vi + at', 'xf = xi + vi t + ½at²', 'vf² = vi² + 2a(xf − xi)'],
    minutes: 10,
  },
  {
    id: 'robot-area',
    lab: 'motion',
    title: l('Displacement from the area under v–t', 'الإزاحة من المساحة تحت منحنى (السرعة المتّجهة – الزمن)'),
    source: 'textbook',
    ref: l('Lesson 2-2 · Example 24 (robot) · p. 74', 'الدرس 2-2 · المثال 24 (الروبوت) · ص 74'),
    outcomes: ['P1003.3'],
    objective: l('Find the distance travelled by the robot of Example 24 from the area under its v–t graph and check it against the track.', 'إيجاد المسافة التي يقطعها روبوت المثال 24 من المساحة تحت منحنى (السرعة المتّجهة – الزمن)، والتحقّق منها على المسار.'),
    question: l('How far does a robot travel if it accelerates, cruises, then brakes for 5 s each?', 'ما المسافة التي يقطعها روبوت يتسارع ثمّ يتحرّك بسرعة ثابتة ثمّ يتباطأ، لمدّة 5 s في كلّ مرحلة؟'),
    hypothesisPrompt: l('Estimate the total distance before running the simulation.', 'قدّر المسافة الكلّيّة قبل تشغيل المحاكاة.'),
    setup: [l('Stage 1: a = 2 m/s² for 5 s. Stage 2: a = 0 for 5 s. Stage 3: a = −2 m/s² for 5 s. Starts from rest at x = 0.', 'المرحلة 1: a = 2 m/s² لمدّة 5 s. المرحلة 2: a = 0 لمدّة 5 s. المرحلة 3: a = ‎−2 m/s² لمدّة 5 s. يبدأ من السكون عند x = 0.')],
    steps: [
      l('Run the motion and record at t = 5, 10 and 15 s.', 'شغّل الحركة وسجّل عند t = 5 و 10 و 15 s.'),
      l('Split the area under the v–t graph into a triangle, a rectangle and a triangle.', 'قسّم المساحة تحت منحنى (السرعة المتّجهة – الزمن) إلى مثلث ومستطيل ومثلث.'),
      l('Compare your area with the position reading at 15 s.', 'قارن المساحة التي حسبتها بقراءة الموقع عند 15 s.'),
    ],
    columns: [
      { id: 't', label: l('Time t', 'الزمن t'), unit: 's', digits: 3 },
      { id: 'v', label: l('Velocity v', 'السرعة المتّجهة v'), unit: 'm/s', digits: 3 },
      { id: 'x', label: l('Position x', 'الموقع x'), unit: 'm', digits: 4 },
      { id: 'd', label: l('Distance', 'المسافة'), unit: 'm', digits: 4 },
    ],
    chart: { x: 't', y: 'v' },
    questions: [
      {
        id: 'first',
        kind: 'numeric',
        unit: 'm',
        prompt: l('Distance covered in the first 5 s?', 'المسافة المقطوعة في أوّل 5 s؟'),
        expected: () => 25,
        hints: [l('Triangle: ½ × base × height.', 'مساحة المثلث = ½ × القاعدة × الارتفاع.'), l('½ × 5 s × 10 m/s.', '½ × 5 s × 10 m/s.')],
        explanation: l('d = ½ (5 s)(10 m/s) = 25 m.', 'd = ½ (5 s)(10 m/s) = 25 m.'),
      },
      {
        id: 'total',
        kind: 'numeric',
        unit: 'm',
        prompt: l('Total distance in 15 s?', 'المسافة الكلّيّة خلال 15 s؟'),
        expected: () => 100,
        hints: [l('Add the three areas.', 'اجمع المساحات الثلاث.')],
        explanation: l('25 m + 50 m + 25 m = 100 m — the same as the position reading at 15 s.', '25 m + 50 m + 25 m = 100 m، وهي قراءة الموقع نفسها عند 15 s.'),
      },
      {
        id: 'vmax',
        kind: 'numeric',
        unit: 'm/s',
        prompt: l('What is the maximum velocity?', 'ما أكبر سرعة متّجهة؟'),
        expected: () => 10,
        hints: [l('vf = vi + at for the first stage.', 'vf = vi + at للمرحلة الأولى.')],
        explanation: l('vf = 0 + (2)(5) = 10 m/s.', 'vf = 0 + (2)(5) = 10 m/s.'),
      },
    ],
    conclusion: l('The area under a v–t graph equals the displacement. For this robot it is 25 + 50 + 25 = 100 m.', 'المساحة تحت منحنى (السرعة المتّجهة – الزمن) تساوي الإزاحة، وهي لهذا الروبوت 25 + 50 + 25 = 100 m.'),
    principle: l('Displacement = velocity × time for each very small time interval; adding all the strips gives the area under the graph.', 'الإزاحة = السرعة المتّجهة × الزمن لكلّ فترة زمنية صغيرة جدًّا، وجمع هذه الشرائح يعطي المساحة تحت المنحنى.'),
    preset: 'robot',
    equations: ['d = ½ b h', 'd = b h', 'vf = vi + at'],
    minutes: 8,
  },
  {
    id: 'turnaround',
    lab: 'motion',
    title: l('Distance vs displacement when the cart turns back', 'المسافة والإزاحة عند رجوع العربة'),
    source: 'adapted',
    ref: l('Lesson 2-2 · Distance and displacement (Figures 20-2, 21-2), negative acceleration (Figure 36-2b) · pp. 57, 70', 'الدرس 2-2 · المسافة والإزاحة (الشكلان 20-2 و 21-2)، والتسارع السالب (الشكل 36-2b) · ص 57 و 70'),
    outcomes: ['P1003.1', 'P1003.2'],
    objective: l('See why distance can be larger than the magnitude of displacement when the direction of motion changes.', 'إدراك سبب كون المسافة أكبر من مقدار الإزاحة عند تغيّر اتّجاه الحركة.'),
    question: l('A cart starts at +10 m/s with a = −2 m/s². After 8 s, are distance and displacement equal?', 'تبدأ عربة بسرعة ‎+10 m/s وتسارع ‎−2 m/s². بعد 8 s، هل تتساوى المسافة والإزاحة؟'),
    hypothesisPrompt: l('Predict when the cart stops and which way it moves afterwards.', 'توقّع متى تتوقّف العربة، وفي أيّ اتّجاه تتحرّك بعد ذلك.'),
    setup: [l('x0 = 0 m, vi = +10 m/s, a = −2 m/s², run time 8 s.', 'x0 = 0 m، vi = ‎+10 m/s، a = ‎−2 m/s²، زمن التشغيل 8 s.')],
    steps: [
      l('Play and pause when the velocity reading reaches 0. Record.', 'شغّل الحركة وأوقفها مؤقّتًا عندما تصل قراءة السرعة المتّجهة إلى صفر، ثمّ سجّل.'),
      l('Continue to 8 s and record again. Compare distance and displacement.', 'تابع حتّى 8 s وسجّل مرّة أخرى. قارن بين المسافة والإزاحة.'),
    ],
    columns: [
      { id: 't', label: l('Time t', 'الزمن t'), unit: 's', digits: 3 },
      { id: 'v', label: l('Velocity v', 'السرعة المتّجهة v'), unit: 'm/s', digits: 3 },
      { id: 'speed', label: l('Speed', 'السرعة'), unit: 'm/s', digits: 3 },
      { id: 'dx', label: l('Displacement', 'الإزاحة'), unit: 'm', digits: 4 },
      { id: 'd', label: l('Distance', 'المسافة'), unit: 'm', digits: 4 },
    ],
    chart: { x: 't', y: 'v' },
    questions: [
      {
        id: 'stop',
        kind: 'numeric',
        unit: 's',
        prompt: l('At what time does the cart stop momentarily?', 'في أيّ لحظة تتوقّف العربة لحظيًّا؟'),
        expected: () => 5,
        hints: [l('Set vf = 0 in vf = vi + at.', 'ضع vf = 0 في المعادلة vf = vi + at.')],
        explanation: l('0 = 10 − 2t → t = 5 s.', '0 = 10 − 2t ← t = 5 s.'),
      },
      {
        id: 'disp',
        kind: 'numeric',
        unit: 'm',
        prompt: l('Displacement after 8 s?', 'الإزاحة بعد 8 s؟'),
        expected: () => 16,
        hints: [l('xf = xi + vi t + ½at².', 'xf = xi + vi t + ½at².')],
        explanation: l('xf = 0 + 10(8) + ½(−2)(64) = 80 − 64 = 16 m.', 'xf = 0 + 10(8) + ½(‎−2)(64) = 80 − 64 = 16 m.'),
      },
      {
        id: 'dist',
        kind: 'numeric',
        unit: 'm',
        prompt: l('Total distance travelled after 8 s?', 'المسافة الكلّيّة المقطوعة بعد 8 s؟'),
        expected: () => 34,
        hints: [l('Forward 0–5 s, then backward 5–8 s. Add the two path lengths.', 'إلى الأمام من 0 إلى 5 s، ثمّ إلى الخلف من 5 إلى 8 s. اجمع طولي المسارين.')],
        explanation: l('Forward 25 m (0–5 s), then back 9 m (5–8 s): distance = 34 m, displacement = 25 − 9 = 16 m.', 'إلى الأمام 25 m (من 0 إلى 5 s)، ثمّ إلى الخلف 9 m (من 5 إلى 8 s): المسافة = 34 m، والإزاحة = 25 − 9 = 16 m.'),
        wrongFeedback: l('Distance adds the lengths of both legs; it does not subtract the backward part.', 'المسافة تجمع طولي المسارين، ولا تطرح الجزء المقطوع إلى الخلف.'),
      },
    ],
    conclusion: l(
      'When the direction changes, the distance (scalar path length) is larger than the magnitude of the displacement (vector from start to finish). Velocity changes sign at the turning point; speed does not.',
      'عندما يتغيّر اتّجاه الحركة تكون المسافة (طول المسار، كمّيّة قياسيّة) أكبر من مقدار الإزاحة (المتّجه من البداية إلى النهاية). تتغيّر إشارة السرعة المتّجهة عند نقطة الرجوع، أمّا السرعة فلا.',
    ),
    principle: l('Displacement is a vector (Lesson 1-2); distance is a scalar. They are equal only for straight-line motion without a change of direction.', 'الإزاحة كمّيّة متّجهة (الدرس 1-2)، والمسافة كمّيّة قياسيّة، ولا تتساويان إلّا في الحركة المستقيمة دون تغيّر في الاتّجاه.'),
    preset: 'turnaround',
    equations: ['vf = vi + at', 'xf = xi + vi t + ½at²'],
    minutes: 7,
  },
];
