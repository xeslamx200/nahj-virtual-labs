import { l } from '../i18n/i18n';
import { WATER } from '../physics/heat/materials';
import type { ActivityDef, LabInfo } from './types';

export interface HeatCheckState {
  mass: number;
  power: number;
}

export const HEAT_LAB: LabInfo = {
  id: 'heat',
  title: l('Heat & Matter Lab', 'مختبر الحرارة والمادّة'),
  short: l('Heat samples, watch the particles, and explain temperature plateaus with Q = mcΔT and Q = mL.', 'سخّن العيّنات، وراقب الجسيمات، وفسّر ثبات درجة الحرارة باستخدام Q = mcΔT و Q = mL.'),
  unit: l('Unit 3 · Heat and Changes in States of Matter', 'الوحدة 3 · الحرارة وتغيّر حالات المادّة'),
  book: l('Grade 10 · Science · Semester 2', 'الصفّ العاشر · العلوم · الفصل الدراسي الثاني'),
  lessons: [
    l('Lesson 1-3 · Temperature and Heat (p. 90)', 'الدرس 1-3 · درجة الحرارة والحرارة (ص 90)'),
    l('Lesson 2-3 · Specific Heat Capacity and Specific Latent Heat (p. 100)', 'الدرس 2-3 · السعة الحراريّة النوعيّة والحرارة الكامنة النوعيّة (ص 100)'),
  ],
  objectives: [
    l('Relate temperature to the average kinetic energy of particles.', 'ربط درجة الحرارة بمتوسّط الطاقة الحركيّة للجسيمات.'),
    l('Investigate specific heat capacity and use Q = mcΔT.', 'استقصاء السعة الحراريّة النوعيّة واستخدام Q = mcΔT.'),
    l('Investigate specific latent heat and use Q = mL.', 'استقصاء الحرارة الكامنة النوعيّة واستخدام Q = mL.'),
    l('Explain why temperature stays constant during a change of state.', 'تفسير ثبات درجة الحرارة أثناء تغيّر الحالة.'),
  ],
  outcomes: ['P1006.1', 'P1006.2', 'P1007.1', 'P1007.2', 'P1007.3', 'P1007.4'],
  pages: '90–117',
  accent: 'orange',
  assumptions: [
    l('Pure substance at standard atmospheric pressure: water melts at 0 °C and boils at 100 °C.', 'مادّة نقيّة عند الضغط الجوّي المعياري: يتحوّل الماء من صلب إلى سائل عند 0 °C ويغلي عند 100 °C.'),
    l('All the heater energy goes into the sample (ideal insulation, no losses), and the sample has one uniform temperature.', 'تذهب طاقة السخّان كلّها إلى العيّنة (عزل مثاليّ دون فقد)، ودرجة حرارة العيّنة منتظمة.'),
    l('c is constant within each state. Values from textbook Table 2-3; Lf and Lv from Tables 3-3 and 4-3.', 'السعة الحراريّة النوعيّة ثابتة في كلّ حالة، وقيمها من الجدول 2-3 في الكتاب، و Lf و Lv من الجدولين 3-3 و 4-3.'),
    l('The textbook gives Lv(water) = 2430 kJ/kg, which the lab uses; many references quote about 2260 kJ/kg at 100 °C.', 'يذكر الكتاب Lv للماء = 2430 kJ/kg ويستخدمها المختبر، بينما تذكر مراجع كثيرة نحو 2260 kJ/kg عند 100 °C.'),
    l('The phase-change model is limited to water between −40 °C and 140 °C; the specific-heat comparison stops at 90 °C so no change of state occurs.', 'نموذج تغيّر الحالة مقصور على الماء بين ‎−40 °C و 140 °C، ومقارنة السعة الحراريّة تتوقّف عند 90 °C فلا يحدث تغيّر في الحالة.'),
    l('The particle picture is qualitative: speed grows with temperature, and the arrangement follows the state.', 'نموذج الجسيمات وصفيّ: تزداد سرعة الجسيمات بزيادة درجة الحرارة، ويتبع ترتيبها حالة المادّة.'),
    l('Time can be sped up; all values are computed from the simulated time, not the clock.', 'يمكن تسريع الزمن، وتُحسب جميع القيم من زمن المحاكاة وليس من ساعة الجهاز.'),
  ],
  safety: [
    l('General lab safety (not from the textbook): steam causes worse burns than boiling water because it also releases its latent heat (textbook Figure 19-3).', 'إرشاد عامّ للسلامة: يسبّب البخار حروقًا أشدّ من الماء المغلي لأنّه يُطلق أيضًا حرارته الكامنة (الشكل 19-3 في الكتاب).'),
    l('Use tongs and heat-resistant gloves with real heaters and hot samples.', 'استخدم الملقط والقفّازات المقاومة للحرارة مع السخّانات والعيّنات الساخنة الحقيقيّة.'),
  ],
  assistantContext: `Textbook: Qatar MoEHE Grade 10 Science, Semester 2, Unit 3 "Heat and Changes in States of Matter".
Lesson 1-3 Temperature and Heat (pp.90-99): temperature measures the average kinetic energy of the particles (P1006.1); thermometers and conversion between scales TF = 9/5 TC + 32, TC = 5/9 (TF − 32), TK = TC + 273.15 (P1006.2); thermal energy is the total kinetic energy of the particles (P1006.3); heat flows from higher to lower temperature until thermal equilibrium (P1006.4).
Lesson 2-3 Specific Heat Capacity and Specific Latent Heat (pp.100-117): specific heat capacity c is the energy to raise 1 kg by 1 °C, Q = mcΔT (P1007.2); specific latent heat of fusion Lf and vaporization Lv, Q = mL, temperature constant during a change of state (P1007.3); the high c and L of water regulate climate and body temperature (P1007.4).
Table 2-3 c in J/kg°C: water 4184, ice 2000, steam 1970, oil 1800, aluminium 900, glass 840, granite 790, iron/steel 470, copper 387, lead 130, gold 130.
Table 3-3 Lf water 334 kJ/kg. Table 4-3 Lv water 2430 kJ/kg (textbook value).
Figure 16-3: heating curve — temperature rises in the solid, stays constant while melting, rises in the liquid, stays constant while boiling, rises in the gas.
Activity a2-3: 1 kg of water and a 1 kg aluminium block heated by the same immersion heater for 10 minutes; compare temperature rises and compute c. Activity b2-3: measure the latent heat of fusion of ice by melting ice with a heater and weighing the melted water.
Examples: 1 kg oil c = 1790 heated 25 to 105 °C needs 143 200 J; freezing 3 kg of water releases 1 002 000 J; 100 000 J vaporizes 0.0411 kg of water.`,
};

export type HeatMode = 'phase' | 'specific';

export interface HeatPreset {
  mode: HeatMode;
  mass: number;
  T0: number;
  power: number;
  materialA?: string;
  materialB?: string;
  speed: number;
}

export const HEAT_PRESETS: Record<string, HeatPreset> = {
  specific: { mode: 'specific', mass: 1, T0: 20, power: 100, materialA: 'water', materialB: 'aluminium', speed: 30 },
  curve: { mode: 'phase', mass: 0.2, T0: -20, power: 1000, speed: 20 },
  fusion: { mode: 'phase', mass: 0.5, T0: 0, power: 200, speed: 10 },
  scales: { mode: 'phase', mass: 0.5, T0: 20, power: 500, speed: 20 },
};

export const HEAT_ACTIVITIES: ActivityDef<HeatCheckState>[] = [
  {
    id: 'specific-heat',
    lab: 'heat',
    title: l('Specific heat capacity: water vs aluminium', 'السعة الحراريّة النوعيّة: الماء والألومنيوم'),
    source: 'textbook',
    ref: l('Lesson 2-3 · Activity a2-3 · eq. 4-3 · p. 105', 'الدرس 2-3 · النشاط a2-3 · المعادلة 4-3 · ص 105'),
    outcomes: ['P1007.1', 'P1007.2'],
    objective: l('Compare the temperature rise of 1 kg of water and 1 kg of aluminium given the same energy, and calculate c = Q / (mΔT).', 'مقارنة ارتفاع درجة حرارة 1 kg من الماء و 1 kg من الألومنيوم عند تزويدهما بالطاقة نفسها، وحساب c = Q / (mΔT).'),
    question: l('How does the specific heat capacity differ between water and aluminium?', 'كيف تختلف السعة الحراريّة النوعيّة بين الماء والألومنيوم؟'),
    hypothesisPrompt: l('Predict which sample will warm up more in 10 minutes.', 'توقّع أيّ العيّنتين سترتفع درجة حرارتها أكثر خلال 10 دقائق.'),
    setup: [
      l('Two samples, each 1 kg at 20 °C, each with an identical 100 W immersion heater (heater power is an assumption — the book does not state it).', 'عيّنتان، كتلة كلّ منهما 1 kg عند 20 °C، ولكلّ منهما سخّان غمر متماثل قدرته 100 W (قدرة السخّان افتراض، إذ لا يحدّدها الكتاب).'),
    ],
    steps: [
      l('Start heating. Pause at 2, 4, 6, 8 and 10 minutes and record.', 'ابدأ التسخين، وأوقفه مؤقّتًا عند 2 و 4 و 6 و 8 و 10 دقائق وسجّل القراءات.'),
      l('Calculate the energy supplied Q = P × t.', 'احسب الطاقة المزوّدة Q = P × t.'),
      l('Use Q = mcΔT to calculate c for each sample.', 'استخدم Q = mcΔT لحساب c لكلّ عيّنة.'),
    ],
    columns: [
      { id: 't', label: l('Time', 'الزمن'), unit: 's', digits: 4 },
      { id: 'Q', label: l('Energy Q', 'الطاقة Q'), unit: 'J', digits: 4 },
      { id: 'TA', label: l('T sample A', 'T العيّنة A'), unit: '°C', digits: 4 },
      { id: 'TB', label: l('T sample B', 'T العيّنة B'), unit: '°C', digits: 4 },
      { id: 'cA', label: l('c of A = Q/(mΔT)', 'c للعيّنة A'), unit: 'J/kg°C', digits: 4 },
      { id: 'cB', label: l('c of B = Q/(mΔT)', 'c للعيّنة B'), unit: 'J/kg°C', digits: 4 },
    ],
    chart: { x: 't', y: 'TA' },
    questions: [
      {
        id: 'q10',
        kind: 'numeric',
        unit: 'J',
        prompt: l('How much energy does a 100 W heater supply in 10 minutes?', 'ما مقدار الطاقة التي يزوّدها سخّان قدرته 100 W خلال 10 دقائق؟'),
        expected: () => 60000,
        hints: [l('Power is energy per second: Q = P × t.', 'القدرة هي الطاقة لكلّ ثانية: Q = P × t.'), l('10 min = 600 s.', '10 دقائق = 600 s.')],
        explanation: l('Q = 100 W × 600 s = 60 000 J.', 'Q = 100 W × 600 s = 60 000 J.'),
      },
      {
        id: 'dt-water',
        kind: 'numeric',
        unit: '°C',
        prompt: l('By how much does the water’s temperature rise with 60 000 J?', 'بكم ترتفع درجة حرارة الماء عند تزويده بـ 60 000 J؟'),
        expected: () => 60000 / 4184,
        hints: [l('ΔT = Q / (mc).', 'ΔT = Q / (mc).'), l('60 000 / (1 × 4184).', '60 000 / (1 × 4184).')],
        explanation: l('ΔT = 60 000 / 4184 ≈ 14.3 °C. Aluminium rises ≈ 66.7 °C with the same energy.', 'ΔT = 60 000 / 4184 ≈ 14.3 °C، بينما ترتفع درجة حرارة الألومنيوم ≈ 66.7 °C بالطاقة نفسها.'),
      },
      {
        id: 'faster',
        kind: 'choice',
        prompt: l('Which sample warms faster, and why?', 'أيّ العيّنتين تسخن أسرع، ولماذا؟'),
        choices: [
          l('Aluminium — it has the smaller specific heat capacity', 'الألومنيوم، لأنّ سعته الحراريّة النوعيّة أصغر'),
          l('Water — it has the larger specific heat capacity', 'الماء، لأنّ سعته الحراريّة النوعيّة أكبر'),
          l('Both the same — they have equal masses', 'كلاهما بالمعدّل نفسه، لأنّ كتلتيهما متساويتان'),
        ],
        correctChoice: 0,
        hints: [l('Smaller c means less energy is needed for each 1 °C.', 'السعة الحراريّة الأصغر تعني طاقة أقلّ لكلّ 1 °C.')],
        explanation: l('Aluminium needs 900 J per kg per °C, water 4184 J. With the same energy, aluminium’s ΔT is 4184/900 ≈ 4.6 times larger.', 'يحتاج الألومنيوم 900 J لكلّ kg لكلّ °C، والماء 4184 J. بالطاقة نفسها يكون ΔT للألومنيوم أكبر بنحو 4184/900 ≈ 4.6 مرّة.'),
      },
      {
        id: 'climate',
        kind: 'open',
        prompt: l('Use your result to explain why coastal cities such as Doha have milder temperatures than inland deserts (textbook p. 110).', 'استخدم نتيجتك لتفسير سبب اعتدال درجات الحرارة في المدن الساحليّة مثل الدوحة مقارنة بالمناطق الصحراويّة الداخليّة (الكتاب ص 110).'),
        hints: [l('Large bodies of water absorb a lot of energy with only a small temperature change.', 'المسطّحات المائيّة الكبيرة تمتصّ طاقة كبيرة مع تغيّر صغير في درجة حرارتها.')],
        explanation: l('Water’s high specific heat capacity means the sea warms and cools slowly, absorbing heat in the day and releasing it at night, which moderates the nearby land.', 'السعة الحراريّة النوعيّة العالية للماء تجعل البحر يسخن ويبرد ببطء، فيمتصّ الحرارة نهارًا ويُطلقها ليلًا، ممّا يلطّف درجة حرارة اليابسة القريبة.'),
      },
    ],
    conclusion: l('Equal masses given equal energy show different temperature rises: the smaller the specific heat capacity, the larger ΔT. Water’s c = 4184 J/kg°C is about 4.6 times that of aluminium.', 'الكتل المتساوية التي تُزوَّد بطاقة متساوية ترتفع درجات حرارتها بمقادير مختلفة: كلّما صغرت السعة الحراريّة النوعيّة زاد ΔT. السعة الحراريّة النوعيّة للماء 4184 J/kg°C، أي نحو 4.6 أضعاف سعة الألومنيوم.'),
    principle: l('Q = mcΔT: the energy needed depends on the mass, the material (c) and the temperature change.', 'Q = mcΔT: تعتمد الطاقة اللازمة على الكتلة ونوع المادّة (c) والتغيّر في درجة الحرارة.'),
    preset: 'specific',
    equations: ['Q = mcΔT', 'Q = P t', 'c = Q / (mΔT)'],
    minutes: 10,
  },
  {
    id: 'heating-curve',
    lab: 'heat',
    title: l('Heating curve of water', 'منحنى تسخين الماء'),
    source: 'textbook',
    ref: l('Lesson 2-3 · Figure 16-3 “Temperature and change of state” · eqs 4-3, 5-3, 6-3 · pp. 106–108', 'الدرس 2-3 · الشكل 16-3 «درجة الحرارة وتغيّر الحالة» · المعادلات 4-3 و 5-3 و 6-3 · ص 106–108'),
    outcomes: ['P1007.1', 'P1007.3'],
    objective: l('Observe the heating curve of 0.2 kg of ice from −20 °C to steam and explain the two plateaus with latent heat.', 'ملاحظة منحنى تسخين 0.2 kg من الجليد من ‎−20 °C حتّى يصبح بخارًا، وتفسير المرحلتين الأفقيّتين بالحرارة الكامنة.'),
    question: l('Why does the temperature stop rising while the heater is still on?', 'لماذا تتوقّف درجة الحرارة عن الارتفاع بينما ما زال السخّان يعمل؟'),
    hypothesisPrompt: l('Sketch your prediction of the temperature–time graph.', 'ارسم توقّعك لمنحنى (درجة الحرارة – الزمن).'),
    setup: [l('0.2 kg of ice at −20 °C in an ideal insulated container, 1000 W heater.', '0.2 kg من الجليد عند ‎−20 °C في وعاء معزول عزلًا مثاليًّا، وسخّان قدرته 1000 W.')],
    steps: [
      l('Start heating and watch the particle model as each change of state begins.', 'ابدأ التسخين وراقب نموذج الجسيمات عند بداية كلّ تغيّر في الحالة.'),
      l('Record at the start and end of melting and of boiling.', 'سجّل القراءات عند بداية الانصهار ونهايته، وعند بداية الغليان ونهايته.'),
      l('Use your recorded energy values to find the energy used in each plateau.', 'استخدم قيم الطاقة المسجّلة لإيجاد الطاقة المستخدمة في كلّ مرحلة أفقيّة.'),
    ],
    columns: [
      { id: 't', label: l('Time', 'الزمن'), unit: 's', digits: 4 },
      { id: 'T', label: l('Temperature', 'درجة الحرارة'), unit: '°C', digits: 4 },
      { id: 'Q', label: l('Energy added', 'الطاقة المضافة'), unit: 'J', digits: 5 },
      { id: 'liquid', label: l('Liquid fraction', 'نسبة السائل'), unit: '%', digits: 3 },
      { id: 'gas', label: l('Gas fraction', 'نسبة الغاز'), unit: '%', digits: 3 },
    ],
    chart: { x: 't', y: 'T' },
    questions: [
      {
        id: 'melt-energy',
        kind: 'numeric',
        unit: 'J',
        prompt: l('How much energy melts 0.2 kg of ice at 0 °C?', 'ما مقدار الطاقة اللازمة لصهر 0.2 kg من الجليد عند 0 °C؟'),
        expected: () => 0.2 * WATER.Lf,
        hints: [l('Q = mLf with Lf = 334 000 J/kg.', 'Q = mLf حيث Lf = 334 000 J/kg.')],
        explanation: l('Q = 0.2 × 334 000 = 66 800 J.', 'Q = 0.2 × 334 000 = 66 800 J.'),
      },
      {
        id: 'melt-time',
        kind: 'numeric',
        unit: 's',
        prompt: l('With a 1000 W heater, how long does the melting plateau last?', 'باستخدام سخّان قدرته 1000 W، كم تستمرّ مرحلة الانصهار؟'),
        expected: () => (0.2 * WATER.Lf) / 1000,
        hints: [l('t = Q / P.', 't = Q / P.')],
        explanation: l('t = 66 800 J / 1000 W = 66.8 s.', 't = 66 800 J / 1000 W = 66.8 s.'),
      },
      {
        id: 'water-heat',
        kind: 'numeric',
        unit: 'J',
        prompt: l('Energy to heat the 0.2 kg of water from 0 °C to 100 °C?', 'الطاقة اللازمة لتسخين 0.2 kg من الماء من 0 °C إلى 100 °C؟'),
        expected: () => 0.2 * 4184 * 100,
        hints: [l('Q = mcΔT with c = 4184 J/kg°C.', 'Q = mcΔT حيث c = 4184 J/kg°C.')],
        explanation: l('Q = 0.2 × 4184 × 100 = 83 680 J — less than the 486 000 J needed to boil it away (0.2 × 2 430 000).', 'Q = 0.2 × 4184 × 100 = 83 680 J، وهي أقلّ من 486 000 J اللازمة لتبخيره كلّه (0.2 × 2 430 000).'),
      },
      {
        id: 'plateau',
        kind: 'choice',
        prompt: l('During boiling, the energy from the heater…', 'أثناء الغليان، فإنّ طاقة السخّان…'),
        choices: [
          l('separates the particles (changes state); the temperature stays at 100 °C', 'تُستخدم لفصل الجسيمات (تغيير الحالة)، وتبقى درجة الحرارة 100 °C'),
          l('is lost, because the temperature does not change', 'تُفقد، لأنّ درجة الحرارة لا تتغيّر'),
          l('raises the temperature slowly above 100 °C', 'ترفع درجة الحرارة ببطء فوق 100 °C'),
        ],
        correctChoice: 0,
        hints: [l('Watch the particles in the model during the plateau.', 'راقب الجسيمات في النموذج أثناء المرحلة الأفقيّة.')],
        explanation: l('Energy is conserved: during a change of state it increases the potential energy of the particles (breaking them apart), not their average kinetic energy, so the temperature is constant.', 'الطاقة محفوظة: أثناء تغيّر الحالة تزيد الطاقة من طاقة الوضع للجسيمات (فتفصلها عن بعضها)، لا من متوسّط طاقتها الحركيّة، لذلك تبقى درجة الحرارة ثابتة.'),
      },
    ],
    conclusion: l('The temperature rises in each single state (Q = mcΔT) and stays constant while melting and boiling (Q = mL). Boiling takes much longer than melting because Lv is far larger than Lf.', 'ترتفع درجة الحرارة في كلّ حالة منفردة (Q = mcΔT) وتبقى ثابتة أثناء الانصهار والغليان (Q = mL). يستغرق الغليان وقتًا أطول بكثير من الانصهار لأنّ Lv أكبر بكثير من Lf.'),
    principle: l('Temperature measures the average kinetic energy of particles. During a change of state the added energy changes the arrangement of particles instead.', 'درجة الحرارة مقياس لمتوسّط الطاقة الحركيّة للجسيمات، وأثناء تغيّر الحالة تُغيّر الطاقة المضافة ترتيب الجسيمات بدلًا من ذلك.'),
    preset: 'curve',
    equations: ['Q = mcΔT', 'Q = mLf', 'Q = mLv'],
    minutes: 10,
  },
  {
    id: 'latent-fusion',
    lab: 'heat',
    title: l('Specific latent heat of fusion of ice', 'الحرارة الكامنة النوعيّة لانصهار الجليد'),
    source: 'textbook',
    ref: l('Lesson 2-3 · Activity b2-3 · eq. 5-3 · p. 111', 'الدرس 2-3 · النشاط b2-3 · المعادلة 5-3 · ص 111'),
    outcomes: ['P1007.3'],
    objective: l('Measure the energy supplied and the mass of ice melted to calculate Lf = Q / m.', 'قياس الطاقة المزوّدة وكتلة الجليد المنصهر لحساب Lf = Q / m.'),
    question: l('How can we calculate the latent heat of fusion of ice?', 'كيف نحسب الحرارة الكامنة لانصهار الجليد؟'),
    hypothesisPrompt: l('Predict how much ice a 200 W heater melts in 3 minutes.', 'توقّع كتلة الجليد التي يصهرها سخّان قدرته 200 W خلال 3 دقائق.'),
    setup: [l('0.5 kg of crushed ice already at 0 °C (the book waits until the ice starts melting), 200 W heater.', '0.5 kg من الجليد المجروش عند 0 °C (ينتظر الكتاب حتّى يبدأ الجليد بالانصهار)، وسخّان قدرته 200 W.')],
    steps: [
      l('Start heating. Record at 60 s, 120 s and 180 s.', 'ابدأ التسخين، وسجّل عند 60 s و 120 s و 180 s.'),
      l('For each row, divide the energy supplied by the mass melted.', 'اقسم الطاقة المزوّدة على الكتلة المنصهرة لكلّ صفّ.'),
    ],
    columns: [
      { id: 't', label: l('Time', 'الزمن'), unit: 's', digits: 4 },
      { id: 'Q', label: l('Energy Q = Pt', 'الطاقة Q = Pt'), unit: 'J', digits: 5 },
      { id: 'melted', label: l('Mass melted', 'الكتلة المنصهرة'), unit: 'kg', digits: 4 },
      { id: 'Lf', label: l('Q / m', 'Q / m'), unit: 'J/kg', digits: 4 },
      { id: 'T', label: l('Temperature', 'درجة الحرارة'), unit: '°C', digits: 3 },
    ],
    chart: { x: 'Q', y: 'melted', fit: 'origin', slopeUnit: 'kg/J' },
    questions: [
      {
        id: 'melted-3min',
        kind: 'numeric',
        unit: 'kg',
        prompt: l('What mass of ice does 200 W melt in 3 minutes?', 'ما كتلة الجليد التي يصهرها سخّان 200 W خلال 3 دقائق؟'),
        expected: () => (200 * 180) / WATER.Lf,
        hints: [l('Q = Pt = 200 × 180 J.', 'Q = Pt = 200 × 180 J.'), l('m = Q / Lf.', 'm = Q / Lf.')],
        explanation: l('Q = 36 000 J, m = 36 000 / 334 000 ≈ 0.108 kg.', 'Q = 36 000 J، و m = 36 000 / 334 000 ≈ 0.108 kg.'),
      },
      {
        id: 'lf-data',
        kind: 'numeric',
        unit: 'J/kg',
        prompt: l('Using your last recorded row, calculate Lf.', 'باستخدام آخر صفّ سجّلته، احسب Lf.'),
        expected: ({ records }) => {
          const r = records.at(-1);
          return r && r.values.melted > 0 ? r.values.Q / r.values.melted : null;
        },
        needs: l('Record a row after heating has started.', 'سجّل صفًّا بعد بدء التسخين.'),
        hints: [l('Lf = Q / m.', 'Lf = Q / m.')],
        explanation: l('Lf = Q / m ≈ 334 000 J/kg, the value in Table 3-3. In a real experiment heat from the room also melts some ice, which is why the book asks about sources of error.', 'Lf = Q / m ≈ 334 000 J/kg، وهي القيمة في الجدول 3-3. في التجربة الحقيقيّة تصهر حرارة الغرفة جزءًا من الجليد أيضًا، ولهذا يسأل الكتاب عن مصادر الخطأ.'),
      },
      {
        id: 'why-wait',
        kind: 'choice',
        prompt: l('Why does the book wait for the ice to start melting before timing?', 'لماذا ينتظر الكتاب بدء انصهار الجليد قبل البدء بالتوقيت؟'),
        choices: [
          l('So that all the energy goes into melting at 0 °C, not into warming cold ice', 'لكي تذهب الطاقة كلّها إلى الانصهار عند 0 °C، لا إلى تسخين الجليد البارد'),
          l('So that the heater reaches full power', 'لكي يصل السخّان إلى قدرته الكاملة'),
          l('It makes no difference', 'لا فرق في ذلك'),
        ],
        correctChoice: 0,
        hints: [l('Ice below 0 °C first needs Q = mcΔT before it can melt.', 'يحتاج الجليد الأبرد من 0 °C أوّلًا إلى Q = mcΔT قبل أن ينصهر.')],
        explanation: l('If the ice were colder than 0 °C, part of the energy would raise its temperature, and Q / m would be too large.', 'لو كان الجليد أبرد من 0 °C لذهب جزء من الطاقة إلى رفع درجة حرارته، ولكانت النسبة Q / m أكبر من الحقيقيّة.'),
      },
    ],
    conclusion: l('The mass melted is directly proportional to the energy supplied; the constant ratio Q / m is the specific latent heat of fusion, 334 000 J/kg for ice.', 'تتناسب الكتلة المنصهرة طرديًّا مع الطاقة المزوّدة، والنسبة الثابتة Q / m هي الحرارة الكامنة النوعيّة للانصهار، وتساوي 334 000 J/kg للجليد.'),
    principle: l('Q = mLf: melting 1 kg of ice at 0 °C needs 334 kJ, while warming 1 kg of water by 1 °C needs only 4.18 kJ.', 'Q = mLf: يحتاج صهر 1 kg من الجليد عند 0 °C إلى 334 kJ، بينما يحتاج رفع درجة حرارة 1 kg من الماء بمقدار 1 °C إلى 4.18 kJ فقط.'),
    preset: 'fusion',
    equations: ['Q = mLf', 'Lf = Q / m', 'Q = P t'],
    minutes: 8,
  },
  {
    id: 'temperature-scales',
    lab: 'heat',
    title: l('Temperature scales', 'مقاييس درجة الحرارة'),
    source: 'textbook',
    ref: l('Lesson 1-3 · eqs 1-3, 2-3, 3-3 · Examples 1–2 · p. 95', 'الدرس 1-3 · المعادلات 1-3 و 2-3 و 3-3 · المثالان 1 و 2 · ص 95'),
    outcomes: ['P1006.2'],
    objective: l('Convert the thermometer reading between the Celsius, Fahrenheit and Kelvin scales.', 'تحويل قراءة مقياس درجة الحرارة بين المقاييس السيليزي والفهرنهايتي والمطلق (كلفن).'),
    question: l('How do readings on the three temperature scales relate?', 'ما العلاقة بين القراءات على مقاييس درجة الحرارة الثلاثة؟'),
    hypothesisPrompt: l('Predict the Fahrenheit and Kelvin readings of boiling water.', 'توقّع قراءتي الماء المغلي بالمقياسين الفهرنهايتي والمطلق.'),
    setup: [l('Water at 20 °C heated by a 500 W heater. The thermometer shows all three scales.', 'ماء عند 20 °C يُسخَّن بسخّان قدرته 500 W، ويعرض مقياس درجة الحرارة المقاييس الثلاثة.')],
    steps: [
      l('Heat the water and record at 40 °C and at 100 °C.', 'سخّن الماء وسجّل عند 40 °C وعند 100 °C.'),
      l('Check each conversion with the equations.', 'تحقّق من كلّ تحويل باستخدام المعادلات.'),
    ],
    columns: [
      { id: 'T', label: l('Celsius', 'سيليزي'), unit: '°C', digits: 4 },
      { id: 'F', label: l('Fahrenheit', 'فهرنهايتي'), unit: '°F', digits: 4 },
      { id: 'K', label: l('Kelvin', 'كلفن'), unit: 'K', digits: 5 },
    ],
    chart: { x: 'T', y: 'F', fit: 'line', slopeUnit: '°F/°C' },
    questions: [
      {
        id: 'f40',
        kind: 'numeric',
        unit: '°F',
        prompt: l('Convert 40 °C to °F.', 'حوّل 40 °C إلى °F.'),
        expected: () => 104,
        hints: [l('TF = 9/5 TC + 32.', 'TF = 9/5 TC + 32.')],
        explanation: l('TF = 9/5 × 40 + 32 = 104 °F (Example 1).', 'TF = 9/5 × 40 + 32 = 104 °F (المثال 1).'),
      },
      {
        id: 'k30',
        kind: 'numeric',
        unit: 'K',
        prompt: l('Convert 30 °C to kelvin.', 'حوّل 30 °C إلى كلفن.'),
        expected: () => 303.15,
        tolerance: 0.001,
        hints: [l('TK = TC + 273.15.', 'TK = TC + 273.15.')],
        explanation: l('TK = 30 + 273.15 = 303.15 K (Example 2a).', 'TK = 30 + 273.15 = 303.15 K (المثال 2a).'),
      },
      {
        id: 'slope',
        kind: 'numeric',
        prompt: l('What is the slope of the °F against °C graph?', 'ما ميل منحنى (°F – °C)؟'),
        expected: () => 1.8,
        hints: [l('Compare the equation with y = mx + b.', 'قارن المعادلة بالصيغة y = mx + b.')],
        explanation: l('TF = 1.8 TC + 32: slope 9/5 = 1.8, intercept 32 °F.', 'TF = 1.8 TC + 32: الميل 9/5 = 1.8، والمقطع 32 °F.'),
      },
    ],
    conclusion: l('A temperature change of 1 °C equals 1 K and 1.8 °F. Kelvin starts at absolute zero (−273.15 °C).', 'التغيّر بمقدار 1 °C يساوي 1 K ويساوي 1.8 °F، ويبدأ مقياس كلفن من الصفر المطلق (‎−273.15 °C).'),
    principle: l('All three scales measure the same physical quantity — the average kinetic energy of the particles — with different zero points and degree sizes.', 'تقيس المقاييس الثلاثة الكمّيّة الفيزيائيّة نفسها، وهي متوسّط الطاقة الحركيّة للجسيمات، لكن بنقاط صفر وأحجام درجات مختلفة.'),
    preset: 'scales',
    equations: ['TF = 9/5 TC + 32', 'TC = 5/9 (TF − 32)', 'TK = TC + 273.15'],
    minutes: 5,
  },
];
