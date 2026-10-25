import { l, type L } from '../../i18n/i18n';
import type { CircuitStatus, ElementKind, WarningCode } from '../../physics/circuit/types';
import type { Tool } from './store';

export const PART_NAMES: Record<ElementKind, L> = {
  battery: l('Battery', 'بطارية'),
  resistor: l('Resistor', 'مقاومة'),
  bulb: l('Bulb', 'مصباح'),
  switch: l('Switch', 'مفتاح'),
  wire: l('Wire', 'سلك'),
  ammeter: l('Ammeter', 'أميتر'),
  voltmeter: l('Voltmeter', 'فولتميتر'),
};

export const TOOL_NAMES: Record<Tool, L> = {
  select: l('Select / move', 'تحديد / تحريك'),
  ...PART_NAMES,
};

export const TOOL_HELP: Record<Tool, L> = {
  select: l('Click a part to select it. Drag a part to move it. Drag from a dot to draw wires.', 'انقر عنصرًا لتحديده، واسحبه لتحريكه. اسحب من نقطة لرسم الأسلاك.'),
  wire: l('Drag from one dot to another to draw wires, or click a gap between two dots.', 'اسحب من نقطة إلى أخرى لرسم الأسلاك، أو انقر الفراغ بين نقطتين.'),
  battery: l('Click a gap between two dots (or an existing wire) to place a battery.', 'انقر الفراغ بين نقطتين (أو سلكًا موجودًا) لوضع بطارية.'),
  resistor: l('Click a gap or a wire to place a resistor.', 'انقر فراغًا أو سلكًا لوضع مقاومة.'),
  bulb: l('Click a gap or a wire to place a bulb.', 'انقر فراغًا أو سلكًا لوضع مصباح.'),
  switch: l('Click a gap or a wire to place a switch.', 'انقر فراغًا أو سلكًا لوضع مفتاح.'),
  ammeter: l('Place the ammeter in series: replace a wire in the path of the current.', 'صِل الأميتر على التوالي: ضعه مكان سلك في مسار التيّار.'),
  voltmeter: l('Place the voltmeter in parallel: on a side branch joining the two ends of a part.', 'صِل الفولتميتر على التوازي: في فرع جانبي يصل بين طرفي العنصر.'),
};

export const STATUS_TEXT: Record<CircuitStatus, { kind: 'info' | 'ok' | 'warn' | 'error'; title: L; body: L }> = {
  empty: {
    kind: 'info',
    title: l('Empty workspace', 'منطقة العمل فارغة'),
    body: l('Choose a part from the parts bar, or load a prepared circuit.', 'اختر عنصرًا من شريط العناصر، أو حمّل دائرة جاهزة.'),
  },
  'no-source': {
    kind: 'info',
    title: l('No battery', 'لا توجد بطارية'),
    body: l('Add a battery to drive a current.', 'أضف بطارية لتوليد تيّار.'),
  },
  open: {
    kind: 'warn',
    title: l('Open circuit — no current', 'دائرة مفتوحة — لا يسري تيّار'),
    body: l('There is no closed loop from + back to −. Check for an open switch, a gap in the wires, or a voltmeter in series.', 'لا يوجد مسار مغلق من القطب الموجب إلى السالب. تحقّق من وجود مفتاح مفتوح أو فجوة في الأسلاك أو فولتميتر على التوالي.'),
  },
  ok: {
    kind: 'ok',
    title: l('Closed circuit — current flows', 'دائرة مغلقة — يسري التيّار'),
    body: l('Readings update as you change the circuit.', 'تتحدّث القراءات كلّما غيّرت الدائرة.'),
  },
  short: {
    kind: 'error',
    title: l('Short circuit', 'قصر في الدائرة'),
    body: l('The battery terminals are joined by a path with no resistance (wires, a closed switch or an ammeter). The current would be unlimited, so the simulation stops. Add a resistor or bulb to that path.', 'طرفا البطارية متّصلان بمسار بلا مقاومة (أسلاك أو مفتاح مغلق أو أميتر)، فيصبح التيّار غير محدود وتتوقّف المحاكاة. أضف مقاومة أو مصباحًا إلى ذلك المسار.'),
  },
  conflict: {
    kind: 'error',
    title: l('Invalid circuit', 'دائرة غير صالحة'),
    body: l('Ideal batteries connected directly in parallel (or in a loop of batteries and wires) have no single solution. Connect them in series or add resistance between them.', 'البطاريات المثاليّة الموصولة مباشرة على التوازي (أو في حلقة من البطاريات والأسلاك) ليس لها حلّ واحد. صِلها على التوالي أو أضف مقاومة بينها.'),
  },
};

export const WARNING_TEXT: Record<WarningCode, L> = {
  dangling: l('{name} has an end that is not connected to anything.', 'أحد طرفي {name} غير موصول بأيّ شيء.'),
  bypassed: l('{name} is bypassed by a wire: both of its ends are joined, so no current goes through it.', '{name} مُتجاوَز بسلك: طرفاه متّصلان، فلا يمرّ فيه تيّار.'),
  'voltmeter-series': l('{name} is in series. A voltmeter has a very large resistance, so it blocks the current — connect it in parallel.', '{name} موصول على التوالي. مقاومة الفولتميتر كبيرة جدًّا فيمنع مرور التيّار — صِله على التوازي.'),
  'ammeter-parallel': l('{name} is connected in parallel with a part. An ammeter has almost no resistance, so it takes the current away from that part — connect it in series.', '{name} موصول على التوازي مع عنصر. مقاومة الأميتر صغيرة جدًّا فيسحب التيّار من ذلك العنصر — صِله على التوالي.'),
  'high-current': l('{name} delivers a very large current (over 10 A). A real battery and wires would overheat.', '{name} تزوّد تيّارًا كبيرًا جدًّا (أكثر من 10 A). البطارية والأسلاك الحقيقيّة سترتفع حرارتها كثيرًا.'),
  'meter-floating': l('{name} is not connected across anything in the circuit, so it reads 0.', '{name} غير موصول بين نقطتين في الدائرة، لذا قراءته صفر.'),
};

export const E = {
  canvasLabel: l(
    'Circuit workspace. Arrow keys move the cursor between grid gaps; Enter places the chosen part or selects the part under the cursor; Delete removes the selected part; Space toggles a switch; Escape returns to the select tool.',
    'منطقة بناء الدائرة. تحرّك مفاتيح الأسهم المؤشّر بين الفراغات؛ يضع مفتاح الإدخال العنصر المختار أو يحدّد العنصر تحت المؤشّر؛ يحذف مفتاح الحذف العنصر المحدّد؛ تبدّل المسافة حالة المفتاح؛ يعيد Escape أداة التحديد.',
  ),
  parts: l('Parts', 'العناصر'),
  presets: l('Prepared circuits', 'دوائر جاهزة'),
  presetNames: {
    ohm: l('Ohm’s law (Fig. 16-4a)', 'قانون أوم (الشكل 16-4a)'),
    resistance: l('Changing resistance, 6 V', 'تغيير المقاومة، 6 V'),
    series: l('Series bulbs (Fig. 23-4)', 'مصابيح على التوالي (الشكل 23-4)'),
    parallel: l('Parallel bulbs (Fig. 24-4)', 'مصابيح على التوازي (الشكل 24-4)'),
    combined: l('Combined circuit (Lesson 2-4, Q4)', 'دائرة مركّبة (الدرس 2-4، س4)'),
    blank: l('Empty workspace', 'منطقة فارغة'),
  } as Record<string, L>,
  load: l('Load', 'تحميل'),
  undo: l('Undo', 'تراجع'),
  clearAll: l('Clear all', 'مسح الكلّ'),
  flow: l('Show current flow', 'إظهار سريان التيّار'),
  flowNote: l('Dots move in the direction of conventional current (+ to −).', 'تتحرّك النقاط في اتّجاه التيّار الاصطلاحي (من + إلى −).'),
  inspector: l('Selected part', 'العنصر المحدّد'),
  noSelection: l('Select a part on the workspace or in the list below to change its value.', 'حدّد عنصرًا في منطقة العمل أو في القائمة أدناه لتغيير قيمته.'),
  voltage: l('Voltage', 'فرق الجهد'),
  resistance: l('Resistance', 'المقاومة'),
  coldResistance: l('Cold resistance R₀', 'المقاومة وهو بارد R₀'),
  bulbModel: l('Bulb model', 'نموذج المصباح'),
  ohmic: l('Ohmic (constant R)', 'أومي (R ثابتة)'),
  filament: l('Filament (enrichment)', 'فتيلة (إثرائي)'),
  ratedPower: l('Rated power (brightness scale)', 'القدرة المقنّنة (مقياس السطوع)'),
  switchState: l('Switch', 'المفتاح'),
  closed: l('Closed', 'مغلق'),
  open: l('Open', 'مفتوح'),
  flip: l('Reverse terminals', 'عكس الطرفين'),
  rotate: l('Rotate', 'تدوير'),
  remove: l('Remove', 'حذف'),
  components: l('Components in the circuit', 'العناصر في الدائرة'),
  wires: l('{n} wire segments', '{n} من قطع الأسلاك'),
  readings: l('Readings', 'القراءات'),
  batteryV: l('Battery voltage', 'جهد البطارية'),
  totalI: l('Current from battery', 'التيّار الخارج من البطارية'),
  req: l('Equivalent resistance', 'المقاومة المكافئة'),
  totalP: l('Total power', 'القدرة الكلّيّة'),
  meters: l('Meter readings', 'قراءات أجهزة القياس'),
  partValues: l('Values for {name}', 'قيم {name}'),
  across: l('V across', 'فرق الجهد'),
  through: l('I through', 'التيّار المارّ'),
  power: l('Power', 'القدرة'),
  rNow: l('R now', 'R الحاليّة'),
  ivTitle: l('I–V characteristic of {name}', 'منحنى (شدّة التيّار – فرق الجهد) لـ {name}'),
  ivNote: l('Calculated by re-solving this circuit for battery voltages 0–12 V. It is not your recorded data.', 'حُسب بإعادة حلّ هذه الدائرة لجهود بطارية من 0 إلى 12 V، وليس من بياناتك المسجّلة.'),
  ivNeed: l('Select a resistor or bulb in a circuit with one battery to see its I–V graph.', 'حدّد مقاومة أو مصباحًا في دائرة ذات بطارية واحدة لرؤية منحناه.'),
  needMeters: l('This activity reads the ammeter A1 and voltmeter V1. Load the prepared circuit with “Set up experiment”.', 'يقرأ هذا النشاط الأميتر A1 والفولتميتر V1. حمّل الدائرة الجاهزة باستخدام «تجهيز التجربة».'),
  needClosed: l('Close the circuit first — there is no current to measure.', 'أغلق الدائرة أوّلًا — لا يوجد تيّار لقياسه.'),
  needFault: l('Fix the circuit fault before recording.', 'أصلح خطأ الدائرة قبل التسجيل.'),
  needBulb: l('This activity reads bulb L1. Load the series or parallel circuit.', 'يقرأ هذا النشاط المصباح L1. حمّل دائرة التوالي أو التوازي.'),
  needCombined: l('This activity reads R1, R2 and R3. Load the combined circuit with “Set up experiment”.', 'يقرأ هذا النشاط R1 و R2 و R3. حمّل الدائرة المركّبة باستخدام «تجهيز التجربة».'),
  switchTo: l('Switch circuit', 'تبديل الدائرة'),
  tagSeries: l('Series', 'توالٍ'),
  tagParallel: l('Parallel', 'توازٍ'),
  tagCustom: l('Own circuit', 'دائرة خاصّة'),
  quickControls: l('Quick controls', 'تحكّم سريع'),
};
