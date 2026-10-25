import { shells, valenceElectrons } from '../chemistry/config';
import { elementBySymbol } from '../chemistry/elements';
import { M } from '../chemistry/molarMass';
import { MOLAR_VOLUME_STP } from '../chemistry/stoichiometry';
import { l } from '../i18n/i18n';
import type { ActivityDef, LabInfo } from './types';

/** What the guided questions may read from the lab (all values come from the calculation engine). */
export interface ChemCheckState {
  massMode: 'precise' | 'book';
}

const el = (s: string) => elementBySymbol(s)!;
const Mm = (f: string, s: ChemCheckState) => M(f, s.massMode);

export const CHEMISTRY_LAB: LabInfo = {
  id: 'chemistry',
  title: l('Chemistry Lab', 'مختبر الكيمياء'),
  short: l(
    'Explore the periodic table and its trends, balance equations by changing coefficients, and calculate moles, masses and concentrations step by step.',
    'استكشف الجدول الدوري وتدرّج خواصّه، ووازن المعادلات بتغيير المعاملات، واحسب المولات والكتل والتراكيز خطوة بخطوة.',
  ),
  unit: l('Units 1–2 · Periodicity · The Mole Concept and Stoichiometry', 'الوحدتان 1 و 2 · الدوريّة في خصائص العناصر · مفهوم المول والحسابات الكيميائيّة'),
  book: l('Grade 10 · Science · Semester 1', 'الصفّ العاشر · العلوم · الفصل الدراسي الأوّل'),
  lessons: [
    l('Lesson 1-1 · The Periodic Table of the Elements (p. 4)', 'الدرس 1-1 · الجدول الدوري للعناصر (ص 4)'),
    l('Lesson 2-1 · Gradation of Periodic Properties (p. 22)', 'الدرس 2-1 · تدرّج الخواصّ الدوريّة للعناصر (ص 22)'),
    l('Lesson 3-1 · Chemical Reactivity of Elements (p. 32)', 'الدرس 3-1 · النشاط الكيميائي للعناصر (ص 32)'),
    l('Lesson 1-2 · Mass of Atoms and Compounds (p. 52)', 'الدرس 1-2 · كتلة الذرّات والمركّبات الكيميائيّة (ص 52)'),
    l('Lesson 2-2 · Chemical Equations (p. 66)', 'الدرس 2-2 · المعادلات الكيميائيّة (ص 66)'),
    l('Lesson 3-2 · Stoichiometry (p. 80)', 'الدرس 3-2 · الحسابات الكيميائيّة (ص 80)'),
  ],
  objectives: [
    l('Relate an element’s Bohr distribution to its period and group.', 'ربط توزيع بور الإلكتروني للعنصر بدورته ومجموعته.'),
    l('Describe the trends in atomic radius and metallic character, and predict reactivity.', 'وصف تدرّج نصف القطر الذرّي والخواصّ الفلزّيّة، والتنبّؤ بالنشاط الكيميائي.'),
    l('Balance equations by changing coefficients only, and explain conservation of mass.', 'موازنة المعادلات بتغيير المعاملات فقط، وتفسير قانون حفظ الكتلة.'),
    l('Convert between mass, moles, particles and gas volume, and solve stoichiometry problems.', 'التحويل بين الكتلة وعدد المولات وعدد الجسيمات وحجم الغاز، وحلّ مسائل الحسابات الكيميائيّة.'),
    l('Calculate molarity and prepare a standard solution.', 'حساب الموالريّة وتحضير محلول قياسي.'),
  ],
  outcomes: ['C1002.3', 'C1002.4', 'C1002.5', 'C1002.6', 'C1001.1', 'C1001.3', 'C1001.4', 'C1001.5', 'C1001.6', 'C1001.7'],
  pages: '4–101',
  accent: 'purple',
  assumptions: [
    l('Atomic masses are IUPAC standard atomic weights. “Textbook rounding” uses one decimal place (H 1.0, C 12.0, O 16.0, Cl 35.5), as in most worked examples, so answers can differ slightly from the book in the last digit.', 'الكتل الذرّيّة هي الأوزان الذرّيّة القياسيّة المعتمدة من IUPAC. ويستخدم خيار «تقريب الكتاب» منزلة عشريّة واحدة (H 1.0، C 12.0، O 16.0، Cl 35.5) كما في معظم الأمثلة المحلولة، لذا قد تختلف بعض الإجابات عن الكتاب في الرقم الأخير.'),
    l('The Bohr model is a simplified picture: electrons are shown in main energy levels around the nucleus. It is not the full quantum-mechanical description of the atom, and the textbook applies it to the first four periods.', 'نموذج بور صورة مبسّطة: تُعرض الإلكترونات في مستويات الطاقة الرئيسة حول النواة. وهو ليس الوصف الكمّي الكامل للذرّة، ويطبّقه الكتاب على الدورات الأربع الأولى.'),
    l('Atomic radii are the values printed in the textbook (pm). Elements without a textbook value show none; nothing is estimated.', 'أنصاف الأقطار الذرّيّة هي القيم المطبوعة في الكتاب (pm). العناصر التي لا يذكر الكتاب قيمتها لا تظهر لها قيمة، ولا يُقدَّر شيء.'),
    l('Reactions are not animated with random particles: the atom inventory shows the exact counts from the formulas and coefficients.', 'لا تُعرض التفاعلات بجسيمات عشوائيّة: يعرض جرد الذرّات الأعداد الدقيقة الناتجة عن الصيغ والمعاملات.'),
    l('Gas volumes use the molar volume 22.4 L/mol, valid for gases at STP (0 °C, 1 atm) only.', 'تستخدم حجوم الغازات الحجم المولي 22.4 L/mol، وهو صالح للغازات عند الظروف القياسيّة STP (0 °C و 1 atm) فقط.'),
    l('Avogadro’s number is 6.022 × 10²³ mol⁻¹ (the textbook’s examples round it to 6.02 × 10²³).', 'عدد أفوجادرو 6.022 × 10²³ mol⁻¹ (تقرّبه أمثلة الكتاب إلى 6.02 × 10²³).'),
    l('Solution preparation is ideal: the weighed mass all dissolves and the flask is filled exactly to the mark.', 'تحضير المحلول مثاليّ: تذوب الكتلة الموزونة كلّها ويُملأ الدورق حتّى خطّ العلامة تمامًا.'),
  ],
  safety: [
    l('General lab safety (not from the textbook): wear safety goggles when working with acids such as HCl.', 'إرشاد عامّ للسلامة: ارتدِ النظّارات الواقية عند التعامل مع الأحماض مثل HCl.'),
    l('Alkali metals react vigorously with water; the textbook’s demonstrations use very small pieces behind a safety screen.', 'تتفاعل الفلزّات القلويّة بشدّة مع الماء، ولا تُجرى عروضها إلا بقطع صغيرة جدًّا خلف حاجز واقٍ.'),
    l('Copper(II) sulfate is harmful if swallowed: weigh it on paper and wash your hands afterwards.', 'كبريتات النحاس (II) ضارّة عند البلع: زِنها على ورق الوزن واغسل يديك بعد ذلك.'),
  ],
  assistantContext: `Textbook: Qatar MoEHE Grade 10 Science, Semester 1 (chemistry units).
Unit 1 "Periodicity in the Properties of Elements".
Lesson 1-1 The Periodic Table (p.4): Mendeleev; metals, non-metals and metalloids (most common metalloids B, Si, As, Te, Ge, Sb); groups (columns) and periods (rows). Bohr distribution written as electrons per main energy level, e.g. N 2,5; Si 2,8,4; Br 2,8,18,7; K 2,8,8,1. Level capacities used: 2, 8, 8 (or 18), 18 (or 32). The number of occupied levels equals the period; valence electrons (outer level) match the group for representative elements. The book applies the Bohr model to the first four periods. Outcomes C1002.1–C1002.4.
Lesson 2-1 Gradation of Periodic Properties (p.22): atomic radius (pm) decreases from left to right across a period (greater nuclear charge, same number of levels) and increases down a group (more levels). Examples: Na 190, Mg 145, Al 118, Si 111, P 98, S 88, Cl 79, Ar 71; Li 167, Na 190, K 243, Rb 265 (Table 5-1 prints 267), Cs 298. Cations are smaller than their atoms, anions larger (Li 2,1 → Li+ 2; F 2,7 → F- 2,8). Table 6-1 melting points °C: Li 180, Na 93, Be 1287, Mg 650, F -220, Cl -101, Br -7, He -272, Ne -248. Electrical conductivity across period 3: Na < Mg < Al, Si is a semiconductor, non-metals are poor conductors. Outcome C1002.5.
Lesson 3-1 Chemical Reactivity (p.32): metallic character decreases across a period and increases down a group; non-metallic character the opposite. Alkali metals are the most reactive metals and reactivity increases down group 1 and group 2; F2 is the most reactive halogen and halogen reactivity decreases down group 17. Reactions: 2Na + 2H2O → 2NaOH + H2; Ca + 2H2O → Ca(OH)2 + H2; 4Li + O2 → 2Li2O; 2Mg + O2 → 2MgO; halogen displacement 2KBr + Cl2 → 2KCl + Br2. Flame colours (Table 8-1): Li red, Na yellow, K light violet, Ca brick red, Sr crimson, Ba green. Activities 3-1a (metals in 0.1 M HCl) and 3-1b (halogen displacement). Outcome C1002.6.
Unit 2 "The Mole Concept and Stoichiometry".
Lesson 1-2 Mass of Atoms and Compounds (p.52): relative atomic mass from isotopic masses and abundances; relative molecular/formula mass; percentage by mass of an element in a compound = (total mass of element / formula mass) × 100. Example: Cr2(SO4)3 is 26.51 % Cr, 24.53 % S, 48.95 % O. Outcomes C1001.2–C1001.3.
Lesson 2-2 Chemical Equations (p.66): balance by changing coefficients only, never subscripts; use the smallest whole-number ratio; treat polyatomic ions as units; in combustion balance O last; state symbols (s), (l), (g), (aq); net ionic equations remove spectator ions and must conserve charge (Ag+ + Cl- → AgCl). Conservation of mass: 2HgO → 2Hg + O2 (100 g → 93 g + 7 g). Examples: CaCO3 + 2HCl → CaCl2 + H2O + CO2; 2C2H6 + 7O2 → 4CO2 + 6H2O; Pb(NO3)2 + 2KI → PbI2 + 2KNO3. Outcome C1001.1.
Lesson 3-2 Stoichiometry (p.80): N = n × NA (NA = 6.02 × 10^23); n = m / Mm (relation 5-2); n = V / Vm with Vm = 22.4 L/mol for a gas at STP 0 °C and 1 atm (relation 6-2); mole ratio from the balanced equation; molarity M = n / V(solution in L) (equation 7-2). Worked examples: 3.75 mol H2 = 84.0 L; 10.0 L He = 0.446 mol; 90 g Ne = 99.9 L at STP; 20.0 g Fe(OH)3 → 41.9 g KCl; 100.0 L SO2 reacts with 50 L O2; 45.0 g Fe → 27.08 L H2 (2Fe + 3H2O → Fe2O3 + 3H2); 1.5 mol NaCl in 0.5 L = 3.0 M; 1.10 g Li2CO3 in 100.0 mL = 0.149 M; 500.0 mL of 0.100 M KOH needs 2.805 g. Activity 3-2a: 2.50 g NaHCO3 + HCl → NaCl + H2O + CO2, compare measured and theoretical NaCl mass. Activity 3-2b: prepare 250.0 mL of 0.0865 M CuSO4·5H2O in a volumetric flask (weigh, dissolve, fill to the mark, invert). The unit overview also names percentage by mass of a solution; dilution is not in this textbook. Outcomes C1001.4–C1001.7.`,
};

export type ChemModule = 'periodic' | 'reactions' | 'solutions';

export interface ChemPreset {
  module: ChemModule;
  element?: string;
  trendSet?: 'period3' | 'group1' | 'period2' | 'group17';
  reaction?: string;
  given?: { index: number; amount: number; quantity: 'mass' | 'moles' | 'volume' };
  target?: { index: number; quantity: 'mass' | 'moles' | 'volume' };
  solute?: string;
  flaskmL?: number;
  targetM?: number;
}

export const CHEM_PRESETS: Record<string, ChemPreset> = {
  bohr: { module: 'periodic', element: 'N', trendSet: 'period3' },
  trends: { module: 'periodic', element: 'Na', trendSet: 'period3' },
  balance: { module: 'reactions', reaction: 'ethane' },
  stoich: { module: 'reactions', reaction: 'nahco3', given: { index: 0, amount: 2.5, quantity: 'mass' }, target: { index: 2, quantity: 'mass' } },
  solution: { module: 'solutions', solute: 'CuSO4·5H2O', flaskmL: 250, targetM: 0.0865 },
};

export const CHEMISTRY_ACTIVITIES: ActivityDef<ChemCheckState>[] = [
  {
    id: 'bohr-table',
    lab: 'chemistry',
    title: l('Bohr distribution and the periodic table', 'توزيع بور الإلكتروني والجدول الدوري'),
    source: 'textbook',
    ref: l('Lesson 1-1 (from p. 4) · Activity 1-1a · Example 1', 'الدرس 1-1 (من ص 4) · النشاط 1-1a · المثال 1'),
    outcomes: ['C1002.3', 'C1002.4'],
    objective: l('Write the Bohr distribution of the first 20 elements and relate the number of energy levels and valence electrons to the period and group.', 'كتابة توزيع بور الإلكتروني للعناصر العشرين الأولى، وربط عدد مستويات الطاقة وإلكترونات التكافؤ بالدورة والمجموعة.'),
    question: l('What is the relationship between an element’s electron distribution and its position in the periodic table?', 'ما العلاقة بين التوزيع الإلكتروني للعنصر وموقعه في الجدول الدوري؟'),
    hypothesisPrompt: l('Predict how the number of occupied energy levels relates to the period number.', 'توقّع العلاقة بين عدد مستويات الطاقة المشغولة ورقم الدورة.'),
    setup: [l('Periodic Table Explorer, starting with nitrogen (Z = 7).', 'مستكشف الجدول الدوري، بدءًا بعنصر النيتروجين (Z = 7).')],
    steps: [
      l('Select an element from periods 1–3. Write its Bohr distribution before you look at the model, then compare.', 'اختر عنصرًا من الدورات 1–3، واكتب توزيعه قبل أن تنظر إلى النموذج، ثمّ قارن.'),
      l('Record at least one element from each of groups 1, 2, 13–18.', 'سجّل عنصرًا واحدًا على الأقلّ من كلّ من المجموعات 1 و 2 و 13–18.'),
      l('Compare the number of energy levels with the period, and the valence electrons with the group.', 'قارن عدد مستويات الطاقة برقم الدورة، وعدد إلكترونات التكافؤ برقم المجموعة.'),
    ],
    columns: [
      { id: 'Z', label: l('Atomic number Z', 'العدد الذرّي Z'), unit: '—', digits: 3 },
      { id: 'period', label: l('Period', 'الدورة'), unit: '—', digits: 1 },
      { id: 'group', label: l('Group', 'المجموعة'), unit: '—', digits: 2 },
      { id: 'levels', label: l('Energy levels', 'مستويات الطاقة'), unit: '—', digits: 1 },
      { id: 'valence', label: l('Valence electrons', 'إلكترونات التكافؤ'), unit: '—', digits: 1 },
    ],
    questions: [
      {
        id: 'g1g2',
        kind: 'choice',
        prompt: l('Compare the valence electrons of group 1 and group 2 elements.', 'قارن بين إلكترونات التكافؤ لعناصر المجموعة الأولى وعناصر المجموعة الثانية.'),
        choices: [l('Group 1 has 1, group 2 has 2', 'للمجموعة الأولى إلكترون واحد، وللثانية إلكترونان'), l('Both have 2', 'لكلّ منهما إلكترونان'), l('Group 1 has 2, group 2 has 1', 'للأولى إلكترونان، وللثانية إلكترون واحد')],
        correctChoice: 0,
        hints: [l('Look at the last number of the distribution for Na (2,8,1) and Mg (2,8,2).', 'انظر إلى الرقم الأخير في توزيع Na (2,8,1) و Mg (2,8,2).')],
        explanation: l('The outer level holds 1 electron in group 1 and 2 in group 2: for representative elements the valence electrons match the group.', 'يحتوي المستوى الأخير على إلكترون واحد في المجموعة الأولى وإلكترونين في الثانية: تطابق إلكترونات التكافؤ رقم المجموعة في العناصر الممثّلة.'),
      },
      {
        id: 'levels-period',
        kind: 'choice',
        prompt: l('What is the relationship between the number of main energy levels and the period?', 'ما العلاقة بين عدد مستويات الطاقة الرئيسة ورقم الدورة التي ينتمي إليها العنصر؟'),
        choices: [l('They are equal', 'متساويان'), l('Levels = period + 1', 'عدد المستويات = رقم الدورة + 1'), l('There is no relationship', 'لا توجد علاقة')],
        correctChoice: 0,
        hints: [l('Na is in period 3: count the numbers in 2,8,1.', 'يقع Na في الدورة 3: عُدّ الأرقام في 2,8,1.')],
        explanation: l('The number of occupied energy levels equals the period number: K (2,8,8,1) has four levels and is in period 4.', 'عدد مستويات الطاقة المشغولة يساوي رقم الدورة: للبوتاسيوم K (2,8,8,1) أربعة مستويات، وهو في الدورة 4.'),
      },
      {
        id: 'br-valence',
        kind: 'numeric',
        unit: '',
        prompt: l('How many valence electrons does bromine (Br, Z = 35) have?', 'ما عدد إلكترونات التكافؤ في ذرّة البروم (Br، Z = 35)؟'),
        expected: () => valenceElectrons(el('Br')),
        tolerance: 0,
        hints: [l('Write the distribution: 2, 8, 18, …', 'اكتب التوزيع: 2، 8، 18، …'), l('Bromine is in group 17.', 'يقع البروم في المجموعة 17.')],
        explanation: l('Br = 2,8,18,7, so it has 7 valence electrons, like every halogen.', 'توزيع Br هو 2,8,18,7، فله 7 إلكترونات تكافؤ مثل جميع الهالوجينات.'),
      },
      {
        id: 'which-282',
        kind: 'choice',
        prompt: l('Which element has the Bohr distribution 2,8,2?', 'ما العنصر الذي توزيع بور الإلكتروني له 2,8,2؟'),
        choices: [l('Beryllium (Be)', 'البيريليوم (Be)'), l('Magnesium (Mg)', 'المغنيسيوم (Mg)'), l('Calcium (Ca)', 'الكالسيوم (Ca)'), l('Silicon (Si)', 'السيليكون (Si)')],
        correctChoice: 1,
        hints: [l('Add the electrons to find Z.', 'اجمع الإلكترونات لتجد العدد الذرّي Z.')],
        explanation: l(`2 + 8 + 2 = 12 electrons, so Z = 12: magnesium, period 3, group 2 (${shells(12).join(',')}).`, `2 + 8 + 2 = 12 إلكترونًا، إذن Z = 12: المغنيسيوم، الدورة 3، المجموعة 2 (${shells(12).join(',')}).`),
      },
      {
        id: 'p2g16',
        kind: 'choice',
        prompt: l('Which element is in period 2 and group 16?', 'ما العنصر الذي ينتمي إلى الدورة الثانية والمجموعة السادسة عشرة؟'),
        choices: [l('Sulfur (S)', 'الكبريت (S)'), l('Nitrogen (N)', 'النيتروجين (N)'), l('Oxygen (O)', 'الأكسجين (O)'), l('Fluorine (F)', 'الفلور (F)')],
        correctChoice: 2,
        hints: [l('Period 2 → two levels; group 16 → six valence electrons: 2,6.', 'الدورة 2 ← مستويان، والمجموعة 16 ← ستّة إلكترونات تكافؤ: 2,6.')],
        explanation: l('2,6 has 8 electrons: oxygen (Z = 8).', 'التوزيع 2,6 يضمّ 8 إلكترونات: الأكسجين (Z = 8).'),
      },
      {
        id: 'noble',
        kind: 'open',
        prompt: l('What do you notice about the distributions of the group 18 elements? How is helium different?', 'ماذا تلاحظ على التوزيعات الإلكترونيّة لعناصر المجموعة 18؟ وبمَ يختلف الهيليوم؟'),
        hints: [l('Compare Ne 2,8 and Ar 2,8,8 with He 2.', 'قارن Ne (2,8) و Ar (2,8,8) بـ He (2).')],
        explanation: l('Their outer level is full (8 electrons; helium’s single level is full with 2), which is why the noble gases are very unreactive.', 'مستواها الأخير ممتلئ (8 إلكترونات، ومستوى الهيليوم الوحيد ممتلئ بإلكترونين)، ولهذا تكون الغازات النبيلة قليلة النشاط جدًّا.'),
      },
    ],
    conclusion: l('The number of occupied energy levels gives the period, and for representative elements the number of valence electrons gives the group (helium excepted). This is why elements in a group have similar chemical properties.', 'يحدّد عدد مستويات الطاقة المشغولة رقم الدورة، ويحدّد عدد إلكترونات التكافؤ رقم المجموعة في العناصر الممثّلة (باستثناء الهيليوم). ولهذا تتشابه خواصّ عناصر المجموعة الواحدة.'),
    principle: l('Electrons fill the levels nearest the nucleus first (2, then 8, then 8 or 18 …). The arrangement of the outer level repeats along each period, which produces the periodic table’s pattern.', 'تملأ الإلكترونات المستويات الأقرب إلى النواة أوّلًا (2، ثمّ 8، ثمّ 8 أو 18 …)، ويتكرّر ترتيب المستوى الأخير في كلّ دورة، وهذا ما ينتج نمط الجدول الدوري.'),
    preset: 'bohr',
    equations: ['K: 2,8,8,1', 'levels = period', 'valence e⁻ = group (1, 2, 13→3 … 18→8)'],
    minutes: 15,
  },
  {
    id: 'radius-trend',
    lab: 'chemistry',
    title: l('Trends in atomic radius and reactivity', 'تدرّج نصف القطر الذرّي والنشاط الكيميائي'),
    source: 'adapted',
    ref: l('Lesson 2-1 (p. 22) · atomic-radius figure, Table 5-1 · Lesson 3-1 (p. 32)', 'الدرس 2-1 (ص 22) · شكل أنصاف الأقطار الذرّيّة، الجدول 5-1 · الدرس 3-1 (ص 32)'),
    outcomes: ['C1002.5', 'C1002.6'],
    objective: l('Plot the textbook atomic radii across period 3 and down group 1, describe both trends, and use them to predict reactivity.', 'تمثيل أنصاف الأقطار الذرّيّة من الكتاب عبر الدورة 3 وفي المجموعة 1 بيانيًّا، ووصف التدرّجين، واستخدامهما للتنبّؤ بالنشاط الكيميائي.'),
    question: l('How does atomic radius change across a period and down a group, and why?', 'كيف يتغيّر نصف القطر الذرّي عبر الدورة وفي المجموعة، ولماذا؟'),
    hypothesisPrompt: l('Predict which is larger: a sodium atom or a chlorine atom.', 'توقّع أيّهما أكبر: ذرّة الصوديوم أم ذرّة الكلور؟'),
    setup: [l('Periodic Table Explorer with the trend set to “Period 3”.', 'مستكشف الجدول الدوري مع اختيار «الدورة 3» للتدرّج.')],
    steps: [
      l('Select each element of period 3 (Na → Ar) and record it.', 'اختر كلّ عنصر من عناصر الدورة 3 (من Na إلى Ar) وسجّله.'),
      l('Change the trend set to “Group 1” and record Li, Na, K, Rb and Cs.', 'غيّر مجموعة التدرّج إلى «المجموعة 1»، وسجّل Li و Na و K و Rb و Cs.'),
      l('Use the graph to describe each trend, then use “Compare” to predict which element of a pair is more reactive.', 'استخدم المنحنى لوصف كلّ تدرّج، ثمّ استخدم «قارن» للتنبّؤ بالعنصر الأنشط في كلّ زوج.'),
    ],
    columns: [
      { id: 'Z', label: l('Atomic number Z', 'العدد الذرّي Z'), unit: '—', digits: 3 },
      { id: 'radius', label: l('Atomic radius', 'نصف القطر الذرّي'), unit: 'pm', digits: 3 },
      { id: 'levels', label: l('Energy levels', 'مستويات الطاقة'), unit: '—', digits: 1 },
      { id: 'valence', label: l('Valence electrons', 'إلكترونات التكافؤ'), unit: '—', digits: 1 },
    ],
    chart: { x: 'Z', y: 'radius', byTag: true },
    questions: [
      {
        id: 'na-cl',
        kind: 'numeric',
        unit: 'pm',
        prompt: l('By how many picometres is a sodium atom larger than a chlorine atom?', 'بكم بيكومترًا تزيد ذرّة الصوديوم على ذرّة الكلور؟'),
        expected: () => el('Na').radius! - el('Cl').radius!,
        tolerance: 0.01,
        hints: [l('Read both radii from your table or the element card.', 'اقرأ نصفي القطرين من جدولك أو من بطاقة العنصر.')],
        explanation: l('190 pm − 79 pm = 111 pm. Both atoms have three energy levels, but chlorine’s nuclear charge (+17) pulls the electrons in more strongly than sodium’s (+11).', '190 pm − 79 pm = 111 pm. لكلتا الذرّتين ثلاثة مستويات طاقة، لكنّ شحنة نواة الكلور (+17) تجذب الإلكترونات بقوّة أكبر من شحنة نواة الصوديوم (+11).'),
      },
      {
        id: 'across',
        kind: 'choice',
        prompt: l('Across period 3 from left to right, the atomic radius…', 'عبر الدورة 3 من اليسار إلى اليمين، فإنّ نصف القطر الذرّي…'),
        choices: [l('decreases', 'يقلّ'), l('increases', 'يزداد'), l('stays the same', 'يبقى ثابتًا')],
        correctChoice: 0,
        wrongFeedback: l('Look again at your graph: the period-3 points go down from Na (Z = 11) to Ar (Z = 18).', 'انظر مجدّدًا إلى المنحنى: تنخفض نقاط الدورة 3 من Na (Z = 11) إلى Ar (Z = 18).'),
        hints: [l('Same number of levels, but the nuclear charge grows by +1 each step.', 'عدد المستويات نفسه، لكنّ شحنة النواة تزداد بمقدار +1 في كلّ خطوة.')],
        explanation: l('It decreases: the number of levels stays at three while the nuclear charge increases, pulling the electrons closer.', 'يقلّ: يبقى عدد المستويات ثلاثة بينما تزداد شحنة النواة فتجذب الإلكترونات أكثر.'),
      },
      {
        id: 'down',
        kind: 'choice',
        prompt: l('Down group 1 from Li to Cs, the atomic radius…', 'في المجموعة 1 من Li إلى Cs، فإنّ نصف القطر الذرّي…'),
        choices: [l('decreases', 'يقلّ'), l('increases', 'يزداد'), l('stays the same', 'يبقى ثابتًا')],
        correctChoice: 1,
        hints: [l('Each step down adds one energy level.', 'كلّ خطوة إلى أسفل تضيف مستوى طاقة جديدًا.')],
        explanation: l('It increases (Li 167 pm → Cs 298 pm) because each element has one more energy level.', 'يزداد (من 167 pm لـ Li إلى 298 pm لـ Cs) لأنّ لكلّ عنصر مستوى طاقة إضافيًّا.'),
      },
      {
        id: 'reactive-metal',
        kind: 'choice',
        prompt: l('Which reacts more vigorously with water: sodium or potassium?', 'أيّهما يتفاعل مع الماء بشدّة أكبر: الصوديوم أم البوتاسيوم؟'),
        choices: [l('Sodium', 'الصوديوم'), l('Potassium', 'البوتاسيوم'), l('They react equally', 'يتفاعلان بالشدّة نفسها')],
        correctChoice: 1,
        hints: [l('Metal reactivity increases down a group: the outer electron is further from the nucleus and is lost more easily.', 'يزداد نشاط الفلزّات إلى أسفل المجموعة: يبتعد إلكترون التكافؤ عن النواة فيُفقد بسهولة أكبر.')],
        explanation: l('Potassium: its single valence electron is in the fourth level, further from the nucleus than sodium’s, so it is lost more easily.', 'البوتاسيوم: إلكترون تكافئه الوحيد في المستوى الرابع، أبعد عن النواة من إلكترون الصوديوم، فيُفقد بسهولة أكبر.'),
      },
      {
        id: 'reactive-halogen',
        kind: 'choice',
        prompt: l('Which halogen is the most reactive?', 'ما أنشط الهالوجينات؟'),
        choices: [l('Fluorine (F₂)', 'الفلور (F₂)'), l('Chlorine (Cl₂)', 'الكلور (Cl₂)'), l('Iodine (I₂)', 'اليود (I₂)')],
        correctChoice: 0,
        hints: [l('Non-metals react by gaining electrons; a small atom attracts an extra electron most strongly.', 'تتفاعل اللافلزّات بكسب الإلكترونات، والذرّة الصغيرة تجذب الإلكترون الإضافي بقوّة أكبر.')],
        explanation: l('Fluorine: it is the smallest halogen (42 pm), so its nucleus attracts an extra electron most strongly. Non-metal reactivity decreases down group 17.', 'الفلور: هو أصغر الهالوجينات (42 pm)، فتجذب نواته الإلكترون الإضافي بأكبر قوّة. يقلّ نشاط اللافلزّات إلى أسفل المجموعة 17.'),
      },
      {
        id: 'explain',
        kind: 'open',
        prompt: l('Explain both radius trends using nuclear charge and the number of energy levels.', 'فسّر تدرّجَي نصف القطر باستخدام شحنة النواة وعدد مستويات الطاقة.'),
        hints: [l('Which factor changes across a period, and which changes down a group?', 'أيّ العاملين يتغيّر عبر الدورة، وأيّهما يتغيّر في المجموعة؟')],
        explanation: l('Across a period the number of levels is constant while the nuclear charge increases, so the radius decreases. Down a group an extra level is added each time, so the radius increases.', 'عبر الدورة يبقى عدد المستويات ثابتًا وتزداد شحنة النواة فيقلّ نصف القطر، وفي المجموعة يُضاف مستوى جديد في كلّ مرّة فيزداد نصف القطر.'),
      },
    ],
    conclusion: l('Atomic radius decreases across a period and increases down a group. The larger the metal atom, the more easily it loses its valence electrons and the more reactive it is; the smaller the non-metal atom, the more strongly it gains electrons.', 'يقلّ نصف القطر الذرّي عبر الدورة ويزداد في المجموعة. كلّما كبرت ذرّة الفلزّ سهل فقدها إلكترونات التكافؤ وزاد نشاطها، وكلّما صغرت ذرّة اللافلزّ زادت قدرتها على كسب الإلكترونات.'),
    principle: l('The outer electrons are attracted by the nucleus and shielded by the inner levels. More nuclear charge with the same levels pulls them in; more levels puts them further out.', 'تجذب النواة الإلكترونات الخارجيّة، وتحجبها المستويات الداخليّة. زيادة شحنة النواة مع ثبات عدد المستويات تقرّبها، وزيادة عدد المستويات تبعدها.'),
    preset: 'trends',
    equations: ['1 pm = 10⁻¹² m', 'Na 190 > Cl 79 pm', 'Li 167 < Cs 298 pm'],
    minutes: 20,
  },
  {
    id: 'balancing',
    lab: 'chemistry',
    title: l('Balancing equations and conservation of mass', 'موازنة المعادلات وقانون حفظ الكتلة'),
    source: 'textbook',
    ref: l('Lesson 2-2 (from p. 66) · balancing rules, conservation of mass, Activity 2-2', 'الدرس 2-2 (من ص 66) · قواعد الموازنة، قانون حفظ الكتلة، النشاط 2-2'),
    outcomes: ['C1001.1'],
    objective: l('Balance textbook equations by changing coefficients only, and show that a balanced equation conserves atoms and mass.', 'موازنة معادلات الكتاب بتغيير المعاملات فقط، وإثبات أنّ المعادلة الموزونة تحفظ عدد الذرّات والكتلة.'),
    question: l('Why must a chemical equation be balanced, and what may you change to balance it?', 'لماذا يجب أن تكون المعادلة الكيميائيّة موزونة، وما الذي يُسمح بتغييره لموازنتها؟'),
    hypothesisPrompt: l('Predict the coefficient of O₂ when ethane (C₂H₆) burns.', 'توقّع معامل O₂ عند احتراق الإيثان (C₂H₆).'),
    setup: [l('Reactions & Stoichiometry, combustion of ethane, all coefficients 1.', 'التفاعلات والحسابات الكيميائيّة، احتراق الإيثان، وجميع المعاملات 1.')],
    steps: [
      l('Record the unbalanced equation and compare the atom counts of both sides. (For ethane the two masses happen to be equal even before balancing — atom counts decide.)', 'سجّل المعادلة غير الموزونة، وقارن عدد ذرّات الطرفين. (في حالة الإيثان تتساوى الكتلتان مصادفةً قبل الموازنة، والحكم لعدد الذرّات.)'),
      l('Balance C, then H, then O last. If O needs a half, double every coefficient.', 'وازن C ثمّ H ثمّ O أخيرًا. وإذا احتاج O إلى نصف، فضاعف جميع المعاملات.'),
      l('Record the balanced equation. Then try the HgO and Pb(NO₃)₂ reactions.', 'سجّل المعادلة الموزونة، ثمّ جرّب تفاعلَي HgO و Pb(NO₃)₂.'),
    ],
    columns: [
      { id: 'atomsL', label: l('Atoms in reactants', 'ذرّات المتفاعلات'), unit: '—', digits: 4 },
      { id: 'atomsR', label: l('Atoms in products', 'ذرّات النواتج'), unit: '—', digits: 4 },
      { id: 'massL', label: l('Mass of reactants', 'كتلة المتفاعلات'), unit: 'g', digits: 5 },
      { id: 'massR', label: l('Mass of products', 'كتلة النواتج'), unit: 'g', digits: 5 },
      { id: 'balanced', label: l('Balanced (1 = yes)', 'موزونة (1 = نعم)'), unit: '—', digits: 1 },
    ],
    questions: [
      {
        id: 'o2-coef',
        kind: 'numeric',
        unit: '',
        prompt: l('In the balanced equation for the combustion of ethane (smallest whole numbers), what is the coefficient of O₂?', 'في معادلة احتراق الإيثان الموزونة (بأصغر أعداد صحيحة)، ما معامل O₂؟'),
        expected: () => 7,
        tolerance: 0,
        hints: [
          l('C₂H₆ gives 2 CO₂ and 3 H₂O: that is 7 O atoms on the right.', 'C₂H₆ يعطي 2 CO₂ و 3 H₂O: أي 7 ذرّات O في الطرف الأيمن.'),
          l('7 O atoms need 3½ O₂. Double everything to remove the half.', '7 ذرّات O تحتاج إلى 3½ O₂. ضاعف كلّ المعاملات للتخلّص من النصف.'),
        ],
        explanation: l('2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O: 4 C, 12 H and 14 O on each side.', '2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O: في كلّ طرف 4 ذرّات C و 12 ذرّة H و 14 ذرّة O.'),
      },
      {
        id: 'change',
        kind: 'choice',
        prompt: l('To balance an equation you may change…', 'لموازنة معادلة يُسمح لك بتغيير…'),
        choices: [l('the coefficients only', 'المعاملات فقط'), l('the subscripts in the formulas', 'الأرقام السفليّة في الصيغ'), l('both coefficients and subscripts', 'المعاملات والأرقام السفليّة معًا')],
        correctChoice: 0,
        wrongFeedback: l('Changing a subscript changes the substance itself: H₂O₂ is hydrogen peroxide, not water.', 'تغيير الرقم السفلي يغيّر المادّة نفسها: H₂O₂ هو فوق أكسيد الهيدروجين وليس الماء.'),
        hints: [l('A formula describes a particular substance.', 'الصيغة تصف مادّة محدّدة.')],
        explanation: l('Only coefficients: they change how many units of each substance react, not what the substance is.', 'المعاملات فقط: فهي تغيّر عدد وحدات كلّ مادّة، لا نوع المادّة.'),
      },
      {
        id: 'hgo-o2',
        kind: 'numeric',
        unit: 'g',
        prompt: l('100 g of HgO decomposes completely (2HgO → 2Hg + O₂) and 92.6 g of mercury forms. What mass of oxygen forms?', 'يتحلّل 100 g من HgO كلّيًّا (2HgO → 2Hg + O₂) فيتكوّن 92.6 g من الزئبق. ما كتلة الأكسجين الناتجة؟'),
        expected: () => 100 - 92.6,
        tolerance: 0.06,
        hints: [l('Mass is conserved: mass of reactants = mass of products.', 'الكتلة محفوظة: كتلة المتفاعلات = كتلة النواتج.')],
        explanation: l('100 g − 92.6 g = 7.4 g of O₂ (the textbook rounds to 93 g and 7 g).', '100 g − 92.6 g = 7.4 g من O₂ (يقرّبها الكتاب إلى 93 g و 7 g).'),
      },
      {
        id: 'lowest',
        kind: 'choice',
        prompt: l('A student writes 4H₂ + 2O₂ → 4H₂O. Which statement is correct?', 'كتب طالب 4H₂ + 2O₂ → 4H₂O. أيّ العبارات الآتية صحيحة؟'),
        choices: [
          l('It is balanced but not in the smallest whole-number ratio', 'موزونة لكنّها ليست بأصغر نسبة أعداد صحيحة'),
          l('It is not balanced', 'غير موزونة'),
          l('It is correct as written', 'صحيحة كما كُتبت'),
        ],
        correctChoice: 0,
        hints: [l('Count the atoms, then look for a common factor of 4, 2 and 4.', 'عُدّ الذرّات، ثمّ ابحث عن عامل مشترك للأعداد 4 و 2 و 4.')],
        explanation: l('Atoms balance (8 H, 4 O each side), but every coefficient divides by 2: write 2H₂ + O₂ → 2H₂O.', 'الذرّات متوازنة (8 H و 4 O في كلّ طرف)، لكنّ جميع المعاملات تقبل القسمة على 2: اكتبها 2H₂ + O₂ → 2H₂O.'),
      },
      {
        id: 'why-mass',
        kind: 'open',
        prompt: l('Use your recorded rows to explain why the mass of the reactants equals the mass of the products only when the equation is balanced.', 'استخدم صفوفك المسجّلة لتفسير لماذا تتساوى كتلة المتفاعلات وكتلة النواتج فقط عندما تكون المعادلة موزونة.'),
        hints: [l('In a reaction atoms are rearranged, not created or destroyed.', 'في التفاعل يُعاد ترتيب الذرّات، ولا تُستحدث ولا تفنى.')],
        explanation: l('Each atom keeps its mass. When every element has the same count on both sides, the total mass on both sides is the same; an unbalanced equation “creates” or “loses” atoms, which is impossible.', 'تحتفظ كلّ ذرّة بكتلتها. فإذا تساوى عدد ذرّات كلّ عنصر في الطرفين تساوت الكتلة الكلّيّة، أمّا المعادلة غير الموزونة فتعني استحداث ذرّات أو فقدانها، وهذا مستحيل.'),
      },
    ],
    conclusion: l('A balanced equation has the same number of atoms of each element (and the same total charge) on both sides, so it obeys the law of conservation of mass. It is balanced by changing coefficients only, using the smallest whole numbers.', 'المعادلة الموزونة فيها العدد نفسه من ذرّات كلّ عنصر (والشحنة الكلّيّة نفسها) في الطرفين، فتحقّق قانون حفظ الكتلة. وتُوازن بتغيير المعاملات فقط وبأصغر أعداد صحيحة.'),
    principle: l('Coefficients multiply whole formula units. Atoms are only rearranged in a reaction, so their number and mass are conserved.', 'تضرب المعاملات وحدات الصيغة كاملة. وفي التفاعل يُعاد ترتيب الذرّات فقط، فيبقى عددها وكتلتها محفوظين.'),
    preset: 'balance',
    equations: ['2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O', 'Σ m(reactants) = Σ m(products)'],
    minutes: 15,
  },
  {
    id: 'stoichiometry',
    lab: 'chemistry',
    title: l('Stoichiometry: predicting the mass of a product', 'الحسابات الكيميائيّة: توقّع كتلة ناتج'),
    source: 'textbook',
    ref: l('Lesson 3-2 · Examples 30–33 · Activity 3-2a · pp. 90–94', 'الدرس 3-2 · الأمثلة 30–33 · النشاط 3-2a · ص 90–94'),
    outcomes: ['C1001.4', 'C1001.5', 'C1001.6'],
    objective: l('Use the mole map (mass → moles → mole ratio → moles → mass) to predict the mass of NaCl formed from NaHCO₃ and HCl.', 'استخدام الخريطة المولية (الكتلة ← المولات ← النسبة المولية ← المولات ← الكتلة) لتوقّع كتلة NaCl الناتجة من تفاعل NaHCO₃ مع HCl.'),
    question: l('Can you predict the mass of a product of a chemical reaction by stoichiometry?', 'هل يمكن توقّع كتلة مادّة ناتجة عن تفاعل كيميائي بإجراء الحسابات الكيميائيّة؟'),
    hypothesisPrompt: l('Predict whether 2.50 g of NaHCO₃ gives more or less than 2.50 g of NaCl.', 'توقّع هل يعطي 2.50 g من NaHCO₃ كتلة من NaCl أكبر أم أقلّ من 2.50 g.'),
    setup: [l('Reactions & Stoichiometry: NaHCO₃ + HCl → NaCl + H₂O + CO₂, given 2.50 g of NaHCO₃.', 'التفاعلات والحسابات الكيميائيّة: NaHCO₃ + HCl → NaCl + H₂O + CO₂، والمعطى 2.50 g من NaHCO₃.')],
    steps: [
      l('Check that the equation is balanced (the calculator works only with a balanced equation).', 'تحقّق من أنّ المعادلة موزونة (لا تعمل الحاسبة إلا مع معادلة موزونة).'),
      l('Calculate the mass of NaCl from 2.50 g of NaHCO₃ yourself, then compare with the step-by-step working.', 'احسب كتلة NaCl الناتجة من 2.50 g من NaHCO₃ بنفسك، ثمّ قارن بالحلّ خطوة بخطوة.'),
      l('Record, then repeat with at least three other masses of NaHCO₃.', 'سجّل، ثمّ كرّر بثلاث كتل أخرى على الأقلّ من NaHCO₃.'),
    ],
    columns: [
      { id: 'mA', label: l('Given mass', 'الكتلة المعطاة'), unit: 'g', digits: 4 },
      { id: 'nA', label: l('Moles given', 'مولات المعطى'), unit: 'mol', digits: 4 },
      { id: 'nB', label: l('Moles of product', 'مولات الناتج'), unit: 'mol', digits: 4 },
      { id: 'mB', label: l('Mass of product', 'كتلة الناتج'), unit: 'g', digits: 4 },
    ],
    chart: { x: 'mA', y: 'mB', fit: 'origin', slopeUnit: 'g/g' },
    questions: [
      {
        id: 'mm-nahco3',
        kind: 'numeric',
        unit: 'g/mol',
        prompt: l('What is the molar mass of NaHCO₃?', 'ما الكتلة المولية لمركّب NaHCO₃؟'),
        expected: ({ state }) => Mm('NaHCO3', state),
        hints: [l('Na + H + C + 3 × O.', 'Na + H + C + 3 × O.'), l('With textbook rounding: 23.0 + 1.0 + 12.0 + 48.0.', 'بتقريب الكتاب: 23.0 + 1.0 + 12.0 + 48.0.')],
        explanation: l('23.0 + 1.0 + 12.0 + 3 × 16.0 = 84.0 g/mol (84.007 g/mol with IUPAC values).', '23.0 + 1.0 + 12.0 + 3 × 16.0 = 84.0 g/mol (و 84.007 g/mol بقيم IUPAC).'),
      },
      {
        id: 'nacl-mass',
        kind: 'numeric',
        unit: 'g',
        prompt: l('What mass of NaCl can be produced in theory from 2.50 g of NaHCO₃?', 'ما كتلة NaCl التي يمكن أن تنتج نظريًّا من 2.50 g من NaHCO₃؟'),
        expected: ({ state }) => (2.5 / Mm('NaHCO3', state)) * Mm('NaCl', state),
        hints: [
          l('n(NaHCO₃) = 2.50 g ÷ 84.0 g/mol.', 'n(NaHCO₃) = 2.50 g ÷ 84.0 g/mol.'),
          l('The mole ratio NaCl : NaHCO₃ is 1 : 1; then m = n × 58.5 g/mol.', 'النسبة المولية NaCl : NaHCO₃ هي 1 : 1، ثمّ m = n × 58.5 g/mol.'),
        ],
        explanation: l('n = 2.50 / 84.0 = 0.0298 mol NaHCO₃ → 0.0298 mol NaCl → 0.0298 × 58.5 = 1.74 g NaCl.', 'n = 2.50 / 84.0 = 0.0298 mol من NaHCO₃ ← 0.0298 mol من NaCl ← 0.0298 × 58.5 = 1.74 g من NaCl.'),
      },
      {
        id: 'fe-h2',
        kind: 'numeric',
        unit: 'L',
        prompt: l('Example 33: what volume of H₂ at STP forms when 45.0 g of iron reacts (2Fe + 3H₂O → Fe₂O₃ + 3H₂)?', 'المثال 33: ما حجم غاز H₂ عند الظروف القياسيّة STP الناتج عند تفاعل 45.0 g من الحديد (2Fe + 3H₂O → Fe₂O₃ + 3H₂)؟'),
        expected: ({ state }) => (45 / Mm('Fe', state)) * 1.5 * MOLAR_VOLUME_STP,
        hints: [l('n(Fe) = 45.0 ÷ 55.8; n(H₂) = n(Fe) × 3/2.', 'n(Fe) = 45.0 ÷ 55.8، و n(H₂) = n(Fe) × 3/2.'), l('V = n × 22.4 L/mol.', 'V = n × 22.4 L/mol.')],
        explanation: l('0.806 mol Fe × 3/2 = 1.209 mol H₂; 1.209 × 22.4 = 27.1 L (the book shows 27.08 L).', '0.806 mol من Fe × 3/2 = 1.209 mol من H₂، و 1.209 × 22.4 = 27.1 L (يذكر الكتاب 27.08 L).'),
      },
      {
        id: 'ratio-source',
        kind: 'choice',
        prompt: l('The mole ratio used in a stoichiometry problem comes from…', 'النسبة المولية المستخدمة في مسائل الحسابات الكيميائيّة تؤخذ من…'),
        choices: [l('the coefficients of the balanced equation', 'معاملات المعادلة الموزونة'), l('the subscripts of the formulas', 'الأرقام السفليّة في الصيغ'), l('the molar masses of the substances', 'الكتل المولية للموادّ')],
        correctChoice: 0,
        hints: [l('Coefficients count formula units — and therefore moles.', 'تعبّر المعاملات عن عدد وحدات الصيغة، أي عن عدد المولات.')],
        explanation: l('The coefficients of the balanced equation give the ratio of moles; that is why the equation must be balanced first.', 'معاملات المعادلة الموزونة تعطي النسبة بين المولات، ولهذا يجب موازنة المعادلة أوّلًا.'),
      },
      {
        id: 'yield',
        kind: 'open',
        prompt: l('In the real activity the measured mass of NaCl is often different from the theoretical value. Give two possible reasons.', 'في النشاط العملي تختلف كتلة NaCl المقيسة غالبًا عن القيمة النظريّة. اذكر سببين محتملين.'),
        hints: [l('Think about spattering, incomplete evaporation and unreacted NaHCO₃.', 'فكّر في تطاير المحلول، وعدم تبخّر الماء كلّه، وبقاء NaHCO₃ دون تفاعل.')],
        explanation: l('Examples: some solution spatters out while heating (less NaCl); water is not fully evaporated (more mass); some NaHCO₃ does not react; balance reading errors.', 'أمثلة: تطاير جزء من المحلول أثناء التسخين (كتلة أقلّ)، أو بقاء ماء لم يتبخّر (كتلة أكبر)، أو عدم تفاعل جزء من NaHCO₃، أو أخطاء في قراءة الميزان.'),
      },
    ],
    conclusion: l('The balanced equation gives the mole ratio, so the mass of a product can be calculated from the mass of a reactant: mass → moles → ratio → moles → mass. The product mass is directly proportional to the reactant mass.', 'تعطي المعادلة الموزونة النسبة المولية، لذا يمكن حساب كتلة الناتج من كتلة المتفاعل: الكتلة ← المولات ← النسبة ← المولات ← الكتلة. وتتناسب كتلة الناتج طرديًّا مع كتلة المتفاعل.'),
    principle: l('The mole links the mass we can weigh to the number of particles that react; coefficients tell how many particles (moles) react together.', 'يربط المول بين الكتلة التي نزنها وعدد الجسيمات المتفاعلة، وتبيّن المعاملات عدد الجسيمات (المولات) التي تتفاعل معًا.'),
    preset: 'stoich',
    equations: ['n = m / Mm', 'n(B) = n(A) × coef B / coef A', 'V = n × 22.4 L/mol (STP)'],
    minutes: 20,
  },
  {
    id: 'standard-solution',
    lab: 'chemistry',
    title: l('Preparing a standard solution', 'تحضير محلول قياسي'),
    source: 'textbook',
    ref: l('Lesson 3-2 · Activity 3-2b · equation 7-2 · Examples 34–40 · pp. 95–99', 'الدرس 3-2 · النشاط 3-2b · المعادلة 7-2 · الأمثلة 34–40 · ص 95–99'),
    outcomes: ['C1001.7'],
    objective: l('Calculate the mass of copper(II) sulfate pentahydrate needed for 250.0 mL of a 0.0865 M solution, prepare it, and check the concentration obtained.', 'حساب كتلة كبريتات النحاس (II) خماسيّة الماء اللازمة لتحضير 250.0 mL من محلول تركيزه 0.0865 M، وتحضيره، والتحقّق من التركيز الناتج.'),
    question: l('How is a standard solution (one with an accurately known concentration) prepared?', 'كيف يُحضَّر محلول قياسي (له تركيز معلوم بدقّة)؟'),
    hypothesisPrompt: l('Predict what happens to the concentration if you weigh too much solid.', 'توقّع ماذا يحدث للتركيز إذا وزنت كتلة أكبر من اللازم.'),
    setup: [l('Solutions & Concentration: CuSO₄·5H₂O, 250 mL volumetric flask, target 0.0865 M.', 'المحاليل والتركيز: CuSO₄·5H₂O، دورق حجمي سعته 250 mL، والتركيز المطلوب 0.0865 M.')],
    steps: [
      l('Calculation a: the molar mass of CuSO₄·5H₂O (include the five water molecules).', 'الحسابات a: الكتلة المولية لـ CuSO₄·5H₂O (مع جزيئات الماء الخمسة).'),
      l('Calculation b: the mass needed, m = M × V × Mm.', 'الحسابات b: الكتلة اللازمة m = M × V × Mm.'),
      l('Weigh your mass, transfer it to the flask, add distilled water to the mark and invert. Record the concentration obtained.', 'زِن الكتلة، وانقلها إلى الدورق، وأضف الماء المقطّر حتّى خطّ العلامة، ثمّ اقلب الدورق. سجّل التركيز الناتج.'),
      l('Repeat with a deliberately wrong mass and compare the percentage error.', 'كرّر بكتلة خاطئة عمدًا، وقارن نسبة الخطأ.'),
    ],
    columns: [
      { id: 'target', label: l('Target molarity', 'التركيز المطلوب'), unit: 'M', digits: 4 },
      { id: 'V', label: l('Flask volume', 'حجم الدورق'), unit: 'mL', digits: 4 },
      { id: 'm', label: l('Mass weighed', 'الكتلة الموزونة'), unit: 'g', digits: 4 },
      { id: 'M', label: l('Molarity obtained', 'التركيز الناتج'), unit: 'M', digits: 4 },
      { id: 'err', label: l('Error', 'نسبة الخطأ'), unit: '%', digits: 3 },
    ],
    chart: { x: 'm', y: 'M', fit: 'origin', slopeUnit: 'M/g' },
    questions: [
      {
        id: 'mm-cuso4',
        kind: 'numeric',
        unit: 'g/mol',
        prompt: l('Calculation a: what is the molar mass of CuSO₄·5H₂O?', 'الحسابات a: ما الكتلة المولية لـ CuSO₄·5H₂O؟'),
        expected: ({ state }) => Mm('CuSO4·5H2O', state),
        hints: [l('Mm(CuSO₄) + 5 × Mm(H₂O).', 'Mm(CuSO₄) + 5 × Mm(H₂O).'), l('159.6 + 5 × 18.0 with textbook rounding.', '159.6 + 5 × 18.0 بتقريب الكتاب.')],
        explanation: l('63.5 + 32.1 + 4 × 16.0 + 5 × 18.0 = 249.6 g/mol (249.68 g/mol with IUPAC values).', '63.5 + 32.1 + 4 × 16.0 + 5 × 18.0 = 249.6 g/mol (و 249.68 g/mol بقيم IUPAC).'),
      },
      {
        id: 'mass-needed',
        kind: 'numeric',
        unit: 'g',
        prompt: l('Calculation b: what mass is needed for 250.0 mL of a 0.0865 M solution?', 'الحسابات b: ما الكتلة اللازمة لتحضير 250.0 mL من محلول تركيزه 0.0865 M؟'),
        expected: ({ state }) => 0.0865 * 0.25 * Mm('CuSO4·5H2O', state),
        hints: [l('n = M × V with V in litres (250.0 mL = 0.2500 L).', 'n = M × V مع V باللتر (250.0 mL = 0.2500 L).'), l('m = n × Mm.', 'm = n × Mm.')],
        explanation: l('n = 0.0865 × 0.2500 = 0.0216 mol; m = 0.0216 × 249.7 = 5.40 g.', 'n = 0.0865 × 0.2500 = 0.0216 mol، و m = 0.0216 × 249.7 = 5.40 g.'),
      },
      {
        id: 'li2co3',
        kind: 'numeric',
        unit: 'M',
        prompt: l('Example 37: 1.10 g of Li₂CO₃ is dissolved to make 100.0 mL of solution. What is its molarity?', 'المثال 37: أُذيب 1.10 g من Li₂CO₃ لتحضير 100.0 mL من المحلول. ما موالريّته؟'),
        expected: ({ state }) => 1.1 / Mm('Li2CO3', state) / 0.1,
        hints: [l('Mm(Li₂CO₃) = 2 × 6.9 + 12.0 + 3 × 16.0.', 'Mm(Li₂CO₃) = 2 × 6.9 + 12.0 + 3 × 16.0.'), l('Convert 100.0 mL to litres before dividing.', 'حوّل 100.0 mL إلى لتر قبل القسمة.')],
        explanation: l('n = 1.10 / 73.8 = 0.0149 mol; M = 0.0149 / 0.100 = 0.149 M.', 'n = 1.10 / 73.8 = 0.0149 mol، و M = 0.0149 / 0.100 = 0.149 M.'),
      },
      {
        id: 'to-mark',
        kind: 'choice',
        prompt: l('Why is the water added up to the mark of the volumetric flask instead of adding exactly 250.0 mL of water?', 'لماذا يُضاف الماء حتّى خطّ العلامة في الدورق الحجمي بدلًا من إضافة 250.0 mL من الماء بالضبط؟'),
        choices: [
          l('Molarity uses the volume of the solution, not of the solvent', 'لأنّ الموالريّة تستخدم حجم المحلول لا حجم المذيب'),
          l('To make the solid dissolve faster', 'لكي تذوب المادّة الصلبة أسرع'),
          l('Because 250.0 mL of water would weigh too much', 'لأنّ 250.0 mL من الماء ستكون ثقيلة جدًّا'),
        ],
        correctChoice: 0,
        hints: [l('Look at equation 7-2: which volume is in the denominator?', 'انظر إلى المعادلة 7-2: أيّ حجم يظهر في المقام؟')],
        explanation: l('M = n / V(solution). The dissolved solid also takes up volume, so the solution is made up to 250.0 mL in total.', 'M = n / V(المحلول). المادّة المذابة تشغل حجمًا أيضًا، لذا يُكمَل المحلول كلّه حتّى 250.0 mL.'),
      },
      {
        id: 'crystal-water',
        kind: 'open',
        prompt: l('Predict what happens to the water in the CuSO₄·5H₂O crystals when they dissolve.', 'توقّع ما سيحدث للماء الموجود في بلّورات CuSO₄·5H₂O عندما تذوب.'),
        hints: [l('Does the crystal water stay attached once the crystal breaks up in water?', 'هل يبقى ماء التبلّر مرتبطًا بعد أن تتفكّك البلّورة في الماء؟')],
        explanation: l('It becomes part of the solvent. That is why the hydrate’s molar mass (including 5H₂O) is used to calculate the mass to weigh.', 'يصبح جزءًا من المذيب، ولهذا تُستخدم الكتلة المولية للمركّب المائي (بما فيها 5H₂O) لحساب الكتلة التي توزن.'),
      },
    ],
    conclusion: l('A standard solution is prepared by weighing the calculated mass m = M × V × Mm, dissolving it, and making the solution up to the mark of a volumetric flask. The concentration obtained is directly proportional to the mass weighed.', 'يُحضَّر المحلول القياسي بوزن الكتلة المحسوبة m = M × V × Mm، وإذابتها، وإكمال المحلول حتّى خطّ العلامة في الدورق الحجمي. ويتناسب التركيز الناتج طرديًّا مع الكتلة الموزونة.'),
    principle: l('Molarity is moles of solute per litre of solution. Accurate mass and accurate final volume give an accurate concentration.', 'الموالريّة هي عدد مولات المذاب في لتر من المحلول. الكتلة الدقيقة والحجم النهائي الدقيق يعطيان تركيزًا دقيقًا.'),
    preset: 'solution',
    equations: ['M = n / V', 'n = m / Mm', 'm = M × V × Mm'],
    minutes: 20,
  },
];
