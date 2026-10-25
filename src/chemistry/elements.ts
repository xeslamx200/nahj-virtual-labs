/**
 * Periodic table dataset (118 elements).
 *
 * Sources
 *  - Atomic weights: IUPAC/CIAAW standard atomic weights, abridged to five significant
 *    figures (conventional values where IUPAC gives an interval, e.g. H 1.008, Li 6.94,
 *    C 12.011, Cl 35.45). Elements with no stable isotope have no standard atomic weight;
 *    for them `mass` is the mass number of a long-lived isotope and `massNumberOnly` is set.
 *  - Atomic radii: the Grade 10 Science textbook, Semester 1, Lesson 2-1 (atomic-radius
 *    figure, pm, Z = 1–54) and Table 5-1 (Cs 298 pm). No other radii are invented: elements
 *    the book does not list have `radius: null`.
 *  - Melting points: textbook Table 6-1 only. Flame colours: textbook Table 8-1 only.
 *  - Metal / non-metal / metalloid: textbook Lesson 1-1 (metalloids B, Si, Ge, As, Sb, Te).
 */

export type Family =
  | 'alkali'
  | 'alkaline-earth'
  | 'transition'
  | 'lanthanide'
  | 'actinide'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble';

export type ElementClass = 'metal' | 'nonmetal' | 'metalloid';

export interface Element {
  Z: number;
  symbol: string;
  en: string;
  ar: string;
  /** g/mol (standard atomic weight) — or a mass number when `massNumberOnly`. */
  mass: number;
  massNumberOnly: boolean;
  period: number;
  /** 1–18; null for the f-block rows (La–Lu, Ac–Lr). */
  group: number | null;
  family: Family;
  cls: ElementClass;
  /** Atomic radius in pm from the textbook; null when the book gives none. */
  radius: number | null;
  /** Melting point in °C from textbook Table 6-1; null otherwise. */
  meltingPoint: number | null;
  /** Physical state at room temperature (25 °C, 1 atm). */
  state: 'solid' | 'liquid' | 'gas' | 'unknown';
  /** Z ≥ 104: synthetic, properties predicted rather than measured. */
  predicted: boolean;
}

// Z|symbol|English|Arabic|mass ('*' = mass number of a long-lived isotope)
const RAW = `1|H|Hydrogen|الهيدروجين|1.008
2|He|Helium|الهيليوم|4.0026
3|Li|Lithium|الليثيوم|6.94
4|Be|Beryllium|البيريليوم|9.0122
5|B|Boron|البورون|10.81
6|C|Carbon|الكربون|12.011
7|N|Nitrogen|النيتروجين|14.007
8|O|Oxygen|الأكسجين|15.999
9|F|Fluorine|الفلور|18.998
10|Ne|Neon|النيون|20.180
11|Na|Sodium|الصوديوم|22.990
12|Mg|Magnesium|المغنيسيوم|24.305
13|Al|Aluminium|الألومنيوم|26.982
14|Si|Silicon|السيليكون|28.085
15|P|Phosphorus|الفوسفور|30.974
16|S|Sulfur|الكبريت|32.06
17|Cl|Chlorine|الكلور|35.45
18|Ar|Argon|الأرجون|39.95
19|K|Potassium|البوتاسيوم|39.098
20|Ca|Calcium|الكالسيوم|40.078
21|Sc|Scandium|السكانديوم|44.956
22|Ti|Titanium|التيتانيوم|47.867
23|V|Vanadium|الفاناديوم|50.942
24|Cr|Chromium|الكروم|51.996
25|Mn|Manganese|المنجنيز|54.938
26|Fe|Iron|الحديد|55.845
27|Co|Cobalt|الكوبلت|58.933
28|Ni|Nickel|النيكل|58.693
29|Cu|Copper|النحاس|63.546
30|Zn|Zinc|الخارصين|65.38
31|Ga|Gallium|الجاليوم|69.723
32|Ge|Germanium|الجرمانيوم|72.630
33|As|Arsenic|الزرنيخ|74.922
34|Se|Selenium|السيلينيوم|78.971
35|Br|Bromine|البروم|79.904
36|Kr|Krypton|الكريبتون|83.798
37|Rb|Rubidium|الروبيديوم|85.468
38|Sr|Strontium|السترونشيوم|87.62
39|Y|Yttrium|الإتريوم|88.906
40|Zr|Zirconium|الزركونيوم|91.224
41|Nb|Niobium|النيوبيوم|92.906
42|Mo|Molybdenum|الموليبدينوم|95.95
43|Tc|Technetium|التكنيشيوم|98*
44|Ru|Ruthenium|الروثينيوم|101.07
45|Rh|Rhodium|الروديوم|102.91
46|Pd|Palladium|البلاديوم|106.42
47|Ag|Silver|الفضّة|107.87
48|Cd|Cadmium|الكادميوم|112.41
49|In|Indium|الإنديوم|114.82
50|Sn|Tin|القصدير|118.71
51|Sb|Antimony|الأنتيمون|121.76
52|Te|Tellurium|التيلوريوم|127.60
53|I|Iodine|اليود|126.904
54|Xe|Xenon|الزينون|131.29
55|Cs|Caesium|السيزيوم|132.91
56|Ba|Barium|الباريوم|137.33
57|La|Lanthanum|اللانثانوم|138.91
58|Ce|Cerium|السيريوم|140.12
59|Pr|Praseodymium|البراسيوديميوم|140.91
60|Nd|Neodymium|النيوديميوم|144.24
61|Pm|Promethium|البروميثيوم|145*
62|Sm|Samarium|الساماريوم|150.36
63|Eu|Europium|اليوروبيوم|151.96
64|Gd|Gadolinium|الجادولينيوم|157.25
65|Tb|Terbium|التيربيوم|158.93
66|Dy|Dysprosium|الديسبروسيوم|162.50
67|Ho|Holmium|الهولميوم|164.93
68|Er|Erbium|الإربيوم|167.26
69|Tm|Thulium|الثوليوم|168.93
70|Yb|Ytterbium|الإتيربيوم|173.05
71|Lu|Lutetium|اللوتيشيوم|174.97
72|Hf|Hafnium|الهافنيوم|178.49
73|Ta|Tantalum|التنتالوم|180.95
74|W|Tungsten|التنجستن|183.84
75|Re|Rhenium|الرينيوم|186.21
76|Os|Osmium|الأوزميوم|190.23
77|Ir|Iridium|الإريديوم|192.22
78|Pt|Platinum|البلاتين|195.08
79|Au|Gold|الذهب|196.97
80|Hg|Mercury|الزئبق|200.59
81|Tl|Thallium|الثاليوم|204.38
82|Pb|Lead|الرصاص|207.2
83|Bi|Bismuth|البزموت|208.98
84|Po|Polonium|البولونيوم|209*
85|At|Astatine|الأستاتين|210*
86|Rn|Radon|الرادون|222*
87|Fr|Francium|الفرانسيوم|223*
88|Ra|Radium|الراديوم|226*
89|Ac|Actinium|الأكتينيوم|227*
90|Th|Thorium|الثوريوم|232.04
91|Pa|Protactinium|البروتكتينيوم|231.04
92|U|Uranium|اليورانيوم|238.03
93|Np|Neptunium|النبتونيوم|237*
94|Pu|Plutonium|البلوتونيوم|244*
95|Am|Americium|الأمريسيوم|243*
96|Cm|Curium|الكوريوم|247*
97|Bk|Berkelium|البركيليوم|247*
98|Cf|Californium|الكاليفورنيوم|251*
99|Es|Einsteinium|الأينشتاينيوم|252*
100|Fm|Fermium|الفيرميوم|257*
101|Md|Mendelevium|المندليفيوم|258*
102|No|Nobelium|النوبليوم|259*
103|Lr|Lawrencium|اللورنسيوم|266*
104|Rf|Rutherfordium|الرذرفورديوم|267*
105|Db|Dubnium|الدوبنيوم|268*
106|Sg|Seaborgium|السيبورجيوم|269*
107|Bh|Bohrium|البوريوم|270*
108|Hs|Hassium|الهاسيوم|269*
109|Mt|Meitnerium|المايتنريوم|278*
110|Ds|Darmstadtium|الدارمشتاتيوم|281*
111|Rg|Roentgenium|الرونتجينيوم|282*
112|Cn|Copernicium|الكوبرنيسيوم|285*
113|Nh|Nihonium|النيهونيوم|286*
114|Fl|Flerovium|الفليروفيوم|289*
115|Mc|Moscovium|الموسكوفيوم|290*
116|Lv|Livermorium|الليفرموريوم|293*
117|Ts|Tennessine|التينيسين|294*
118|Og|Oganesson|الأوغانيسون|294*`;

/** Atomic radii (pm) as printed in the textbook (Lesson 2-1 figure; Cs from Table 5-1). */
export const BOOK_RADII: Record<string, number> = {
  H: 53, He: 32,
  Li: 167, Be: 112, B: 87, C: 67, N: 56, O: 48, F: 42, Ne: 38,
  Na: 190, Mg: 145, Al: 118, Si: 111, P: 98, S: 88, Cl: 79, Ar: 71,
  K: 243, Ca: 194, Sc: 184, Ti: 176, V: 171, Cr: 166, Mn: 161, Fe: 156, Co: 152, Ni: 149, Cu: 145, Zn: 142,
  Ga: 136, Ge: 125, As: 114, Se: 103, Br: 94, Kr: 88,
  Rb: 265, Sr: 219, Y: 212, Zr: 206, Nb: 198, Mo: 190, Tc: 183, Ru: 178, Rh: 173, Pd: 169, Ag: 165, Cd: 161,
  In: 156, Sn: 145, Sb: 133, Te: 123, I: 115, Xe: 108,
  Cs: 298,
};

/** Melting points (°C) from textbook Table 6-1. */
export const BOOK_MELTING: Record<string, number> = { Li: 180, Na: 93, Be: 1287, Mg: 650, F: -220, Cl: -101, Br: -7, He: -272, Ne: -248 };

const METALLOIDS = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te']);
const HALOGENS = new Set(['F', 'Cl', 'Br', 'I', 'At', 'Ts']);
const NOBLE = new Set(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og']);
const NONMETALS = new Set(['H', 'C', 'N', 'O', 'P', 'S', 'Se']);
const LIQUIDS = new Set(['Hg', 'Br']);
const GASES = new Set(['H', 'He', 'N', 'O', 'F', 'Ne', 'Cl', 'Ar', 'Kr', 'Xe', 'Rn']);

const PERIOD_END = [2, 10, 18, 36, 54, 86, 118];

export function periodOf(Z: number): number {
  return PERIOD_END.findIndex((end) => Z <= end) + 1;
}

/** Group number 1–18, or null for the f-block (La–Lu, Ac–Lr). */
export function groupOf(Z: number): number | null {
  if (Z === 1) return 1;
  if (Z === 2) return 18;
  if ((Z >= 57 && Z <= 71) || (Z >= 89 && Z <= 103)) return null;
  const p = periodOf(Z);
  const start = PERIOD_END[p - 2] + 1;
  const pos = Z - start; // 0-based position in the period
  if (p <= 3) return pos < 2 ? pos + 1 : pos + 11; // s block then p block (groups 13–18)
  if (p <= 5) return pos + 1;
  // Periods 6 and 7: two s elements, then the 15-element f-block row (La–Lu / Ac–Lr), then groups 4…18.
  if (pos < 2) return pos + 1;
  return pos - 13;
}

function familyOf(symbol: string, Z: number, group: number | null): Family {
  if (METALLOIDS.has(symbol)) return 'metalloid';
  if (HALOGENS.has(symbol)) return 'halogen';
  if (NOBLE.has(symbol)) return 'noble';
  if (NONMETALS.has(symbol)) return 'nonmetal';
  if (group === null) return Z < 89 ? 'lanthanide' : 'actinide';
  if (group === 1) return 'alkali';
  if (group === 2) return 'alkaline-earth';
  if (group >= 3 && group <= 12) return 'transition';
  return 'post-transition';
}

export const ELEMENTS: Element[] = RAW.split('\n').map((line) => {
  const [z, symbol, en, ar, m] = line.split('|');
  const Z = Number(z);
  const group = groupOf(Z);
  const family = familyOf(symbol, Z, group);
  const cls: ElementClass = family === 'metalloid' ? 'metalloid' : ['nonmetal', 'halogen', 'noble'].includes(family) ? 'nonmetal' : 'metal';
  return {
    Z,
    symbol,
    en,
    ar,
    mass: Number(m.replace('*', '')),
    massNumberOnly: m.endsWith('*'),
    period: periodOf(Z),
    group,
    family,
    cls,
    radius: BOOK_RADII[symbol] ?? null,
    meltingPoint: BOOK_MELTING[symbol] ?? null,
    state: Z >= 104 ? 'unknown' : LIQUIDS.has(symbol) ? 'liquid' : GASES.has(symbol) ? 'gas' : 'solid',
    predicted: Z >= 104,
  };
});

const BY_SYMBOL = new Map(ELEMENTS.map((e) => [e.symbol, e]));

export function elementBySymbol(symbol: string): Element | undefined {
  return BY_SYMBOL.get(symbol);
}

export function elementByZ(Z: number): Element | undefined {
  return Number.isInteger(Z) && Z >= 1 && Z <= ELEMENTS.length ? ELEMENTS[Z - 1] : undefined;
}

/**
 * Atomic masses rounded the way most worked examples in the textbook do
 * (one decimal place: H 1.0, C 12.0, O 16.0, Na 23.0, Cl 35.5, Fe 55.8 …).
 */
export function roundedMass(e: Element): number {
  return Math.round(e.mass * 10 + 1e-9) / 10;
}

/** Grid position for the 18-column table: row 1–7 for periods, 9–10 for the f-block rows. */
export function gridPosition(e: Element): { row: number; col: number } {
  if (e.group !== null) return { row: e.period, col: e.group };
  const first = e.Z < 89 ? 57 : 89;
  return { row: e.Z < 89 ? 9 : 10, col: 3 + (e.Z - first) };
}

/** Flame-test colours from textbook Table 8-1. */
export const FLAME_COLOURS: Record<string, { en: string; ar: string; css: string }> = {
  Li: { en: 'red', ar: 'أحمر', css: '#d1253a' },
  Na: { en: 'yellow', ar: 'أصفر', css: '#f0b400' },
  K: { en: 'light violet', ar: 'بنفسجي فاتح', css: '#b48fd8' },
  Rb: { en: 'dark red', ar: 'أحمر داكن', css: '#8e1b2b' },
  Cs: { en: 'light blue', ar: 'أزرق فاتح', css: '#6fb3e0' },
  Be: { en: 'white', ar: 'أبيض', css: '#f4f4f4' },
  Mg: { en: 'bluish white', ar: 'أبيض مائل إلى الزرقة', css: '#dbe8f7' },
  Ca: { en: 'brick red', ar: 'أحمر طوبي', css: '#c0482a' },
  Sr: { en: 'crimson', ar: 'قرمزي', css: '#c2133e' },
  Ba: { en: 'green', ar: 'أخضر', css: '#4caa3c' },
};

/** Most common ion charge by group (textbook Figure 27-1); null where the book gives none. */
export function typicalCharge(e: Element): number | null {
  switch (e.group) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 13:
      return 3;
    case 15:
      return -3;
    case 16:
      return -2;
    case 17:
      return -1;
    case 18:
      return 0;
    default:
      return null;
  }
}

/** Groups the textbook calls "main group" (representative) elements. */
export const isMainGroup = (e: Element) => e.group !== null && (e.group <= 2 || e.group >= 13);
