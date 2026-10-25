/**
 * Reactions from the Grade 10 textbook (Semester 1, Units 1 and 2), stored as UNBALANCED
 * skeleton equations. `answer` is the balanced form printed in the book; tests check that the
 * solver reproduces it.
 */
import type { L } from '../i18n/i18n';
import { l } from '../i18n/i18n';

export interface BookReaction {
  id: string;
  skeleton: string;
  answer: number[];
  name: L;
  ref: L;
}

export const BOOK_REACTIONS: BookReaction[] = [
  {
    id: 'na-water',
    skeleton: 'Na(s) + H2O(l) -> NaOH(aq) + H2(g)',
    answer: [2, 2, 2, 1],
    name: l('Sodium with water', 'الصوديوم مع الماء'),
    ref: l('Lessons 3-1 and 2-2', 'الدرسان 3-1 و 2-2'),
  },
  {
    id: 'ca-water',
    skeleton: 'Ca(s) + H2O(l) -> Ca(OH)2(aq) + H2(g)',
    answer: [1, 2, 1, 1],
    name: l('Calcium with water', 'الكالسيوم مع الماء'),
    ref: l('Lesson 3-1', 'الدرس 3-1'),
  },
  {
    id: 'li-oxygen',
    skeleton: 'Li(s) + O2(g) -> Li2O(s)',
    answer: [4, 1, 2],
    name: l('Lithium burning in oxygen', 'احتراق الليثيوم في الأكسجين'),
    ref: l('Lesson 3-1', 'الدرس 3-1'),
  },
  {
    id: 'mg-oxygen',
    skeleton: 'Mg(s) + O2(g) -> MgO(s)',
    answer: [2, 1, 2],
    name: l('Magnesium burning in oxygen', 'احتراق المغنيسيوم في الأكسجين'),
    ref: l('Lesson 3-1', 'الدرس 3-1'),
  },
  {
    id: 'halogen',
    skeleton: 'KBr(aq) + Cl2(aq) -> KCl(aq) + Br2(aq)',
    answer: [2, 1, 2, 1],
    name: l('Chlorine displaces bromine', 'الكلور يحلّ محلّ البروم'),
    ref: l('Lesson 3-1 · Activity 3-1b', 'الدرس 3-1 · النشاط 3-1b'),
  },
  {
    id: 'caco3-hcl',
    skeleton: 'CaCO3(s) + HCl(aq) -> CaCl2(aq) + H2O(l) + CO2(g)',
    answer: [1, 2, 1, 1, 1],
    name: l('Calcium carbonate with hydrochloric acid', 'كربونات الكالسيوم مع حمض الهيدروكلوريك'),
    ref: l('Lesson 2-2', 'الدرس 2-2'),
  },
  {
    id: 'as-cl2',
    skeleton: 'As(s) + Cl2(g) -> AsCl3(s)',
    answer: [2, 3, 2],
    name: l('Arsenic with chlorine', 'الزرنيخ مع الكلور'),
    ref: l('Lesson 2-2', 'الدرس 2-2'),
  },
  {
    id: 'ethane',
    skeleton: 'C2H6(g) + O2(g) -> CO2(g) + H2O(l)',
    answer: [2, 7, 4, 6],
    name: l('Combustion of ethane', 'احتراق الإيثان'),
    ref: l('Lesson 2-2', 'الدرس 2-2'),
  },
  {
    id: 'hgo',
    skeleton: 'HgO(s) -> Hg(l) + O2(g)',
    answer: [2, 2, 1],
    name: l('Decomposition of mercury(II) oxide', 'تحلّل أكسيد الزئبق (II)'),
    ref: l('Lesson 2-2 · conservation of mass', 'الدرس 2-2 · حفظ الكتلة'),
  },
  {
    id: 'pb-ki',
    skeleton: 'Pb(NO3)2(aq) + KI(aq) -> PbI2(s) + KNO3(aq)',
    answer: [1, 2, 1, 2],
    name: l('Lead(II) nitrate with potassium iodide', 'نترات الرصاص (II) مع يوديد البوتاسيوم'),
    ref: l('Lesson 2-2 · conservation of mass', 'الدرس 2-2 · حفظ الكتلة'),
  },
  {
    id: 'agno3-cacl2',
    skeleton: 'AgNO3(aq) + CaCl2(aq) -> AgCl(s) + Ca(NO3)2(aq)',
    answer: [2, 1, 2, 1],
    name: l('Silver nitrate with calcium chloride', 'نترات الفضّة مع كلوريد الكالسيوم'),
    ref: l('Lesson 2-2 · ionic equations', 'الدرس 2-2 · المعادلات الأيونيّة'),
  },
  {
    id: 'net-ionic',
    skeleton: 'Ag^+(aq) + Cl^-(aq) -> AgCl(s)',
    answer: [1, 1, 1],
    name: l('Net ionic equation: silver chloride', 'معادلة أيونيّة نهائيّة: كلوريد الفضّة'),
    ref: l('Lesson 2-2 · net ionic equations', 'الدرس 2-2 · المعادلات الأيونيّة النهائيّة'),
  },
  {
    id: 'thermite',
    skeleton: 'Fe2O3(s) + Al(s) -> Al2O3(s) + Fe(s)',
    answer: [1, 2, 1, 2],
    name: l('Thermite reaction', 'تفاعل الثيرمايت'),
    ref: l('Lesson 3-2 · Example 30', 'الدرس 3-2 · المثال 30'),
  },
  {
    id: 'fecl3-koh',
    skeleton: 'FeCl3(aq) + KOH(aq) -> Fe(OH)3(s) + KCl(aq)',
    answer: [1, 3, 1, 3],
    name: l('Iron(III) chloride with potassium hydroxide', 'كلوريد الحديد (III) مع هيدروكسيد البوتاسيوم'),
    ref: l('Lesson 3-2 · Example 31', 'الدرس 3-2 · المثال 31'),
  },
  {
    id: 'so2',
    skeleton: 'SO2(g) + O2(g) -> SO3(g)',
    answer: [2, 1, 2],
    name: l('Sulfur dioxide to sulfur trioxide', 'تحوّل ثاني أكسيد الكبريت إلى ثالث أكسيد الكبريت'),
    ref: l('Lesson 3-2 · Example 32', 'الدرس 3-2 · المثال 32'),
  },
  {
    id: 'fe-steam',
    skeleton: 'Fe(s) + H2O(l) -> Fe2O3(s) + H2(g)',
    answer: [2, 3, 1, 3],
    name: l('Iron with water', 'الحديد مع الماء'),
    ref: l('Lesson 3-2 · Example 33', 'الدرس 3-2 · المثال 33'),
  },
  {
    id: 'nahco3',
    skeleton: 'NaHCO3(s) + HCl(aq) -> NaCl(aq) + H2O(l) + CO2(g)',
    answer: [1, 1, 1, 1, 1],
    name: l('Baking soda with hydrochloric acid', 'صودا الخبز مع حمض الهيدروكلوريك'),
    ref: l('Lesson 3-2 · Activity 3-2a', 'الدرس 3-2 · النشاط 3-2a'),
  },
  {
    id: 'ethanol',
    skeleton: 'C2H5OH(l) + O2(g) -> CO2(g) + H2O(l)',
    answer: [1, 3, 2, 3],
    name: l('Combustion of ethanol', 'احتراق الإيثانول'),
    ref: l('Lesson 2-2 · exercise', 'الدرس 2-2 · تمرين'),
  },
];
