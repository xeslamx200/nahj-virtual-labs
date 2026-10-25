import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AssistantSnapshot } from '../../assistant/types';
import { bohrNotation, shells, valenceElectrons } from '../../chemistry/config';
import { ELEMENTS, elementBySymbol } from '../../chemistry/elements';
import { allSpecies, checkBalance, equationText, solveCoefficients } from '../../chemistry/equation';
import { BOOK_REACTIONS } from '../../chemistry/reactions';
import { trendMembers } from '../../chemistry/trends';
import { ActivityGuide } from '../../components/ActivityGuide';
import { Icon, type IconName } from '../../components/Icon';
import { LabShell } from '../../components/LabShell';
import { RecordsPanel } from '../../components/RecordsPanel';
import { CHEMISTRY_ACTIVITIES, CHEMISTRY_LAB, type ChemModule } from '../../curriculum/chemistry';
import { l, useI18n, type L } from '../../i18n/i18n';
import { fmt } from '../../lib/format';
import { addRecord, getActivity, progressStore, type RecordRow } from '../../lib/progress';
import { PeriodicExplorer, TREND_NAMES } from './PeriodicExplorer';
import { balanceRecord, currentEquation, ReactionLab, stoichResult } from './ReactionLab';
import { solutionNumbers, SolutionLab } from './SolutionLab';
import { chemActions, chemStore, useChem, type ChemUiState } from './store';
import '../../styles/chemistry.css';

const MODULES: { id: ChemModule; label: L; icon: IconName; hint: L }[] = [
  { id: 'periodic', label: l('Periodic Table Explorer', 'مستكشف الجدول الدوري'), icon: 'atom', hint: l('Unit 1', 'الوحدة 1') },
  { id: 'reactions', label: l('Reactions & Stoichiometry', 'التفاعلات والحسابات الكيميائيّة'), icon: 'flask', hint: l('Lessons 1-2 to 3-2', 'الدروس 1-2 إلى 3-2') },
  { id: 'solutions', label: l('Solutions & Concentration', 'المحاليل والتركيز'), icon: 'layers', hint: l('Lesson 3-2', 'الدرس 3-2') },
];

const C = {
  modules: l('Lab module', 'وحدة المختبر'),
  needPeriodic: l('Open the Periodic Table Explorer (press “Set up experiment”).', 'افتح مستكشف الجدول الدوري (اضغط «تجهيز التجربة»).'),
  needReactions: l('Open Reactions & Stoichiometry (press “Set up experiment”).', 'افتح التفاعلات والحسابات الكيميائيّة (اضغط «تجهيز التجربة»).'),
  needSolutions: l('Open Solutions & Concentration (press “Set up experiment”).', 'افتح المحاليل والتركيز (اضغط «تجهيز التجربة»).'),
  needMainGroup: l('Choose an element from groups 1, 2 or 13–18 (the Bohr rules apply to representative elements).', 'اختر عنصرًا من المجموعات 1 أو 2 أو 13–18 (تنطبق قواعد بور على العناصر الممثّلة).'),
  needTrend: l('Choose an element of {set} (highlighted in the table), or change the trend set.', 'اختر عنصرًا من {set} (المظلّلة في الجدول)، أو غيّر مجموعة التدرّج.'),
  needEquation: l('Load an equation first.', 'حمّل معادلة أوّلًا.'),
  needStoich: l('Balance the equation, then give a mass for the given substance and ask for the mass of the product.', 'وازن المعادلة، ثمّ أدخل كتلة المادّة المعطاة واطلب كتلة الناتج.'),
  needFilled: l('Complete all three preparation steps (weigh, dissolve, fill to the mark).', 'أكمل خطوات التحضير الثلاث (الوزن، والإذابة، والإكمال حتّى العلامة).'),
  custom: l('Your equation', 'معادلتك'),
};

type Rec = { values: Record<string, number>; tag?: string } | { blocked: L | string };

export function chemRecordFor(activityId: string, s: ChemUiState): Rec {
  const e = elementBySymbol(s.element);
  switch (activityId) {
    case 'bohr-table': {
      if (s.module !== 'periodic') return { blocked: C.needPeriodic };
      if (!e || e.group === null || valenceElectrons(e) === null) return { blocked: C.needMainGroup };
      return { values: { Z: e.Z, period: e.period, group: e.group, levels: shells(e.Z).length, valence: valenceElectrons(e)! }, tag: e.symbol };
    }
    case 'radius-trend': {
      if (s.module !== 'periodic') return { blocked: C.needPeriodic };
      if (!e || !trendMembers(s.trendSet).some((m) => m.symbol === e.symbol)) return { blocked: { en: C.needTrend.en.replace('{set}', TREND_NAMES[s.trendSet].en), ar: C.needTrend.ar.replace('{set}', TREND_NAMES[s.trendSet].ar) } };
      return { values: { Z: e.Z, radius: e.radius!, levels: shells(e.Z).length, valence: valenceElectrons(e) ?? NaN }, tag: s.trendSet };
    }
    case 'balancing': {
      if (s.module !== 'reactions') return { blocked: C.needReactions };
      const eq = currentEquation(s);
      if (!eq || s.coefficients.length !== allSpecies(eq).length) return { blocked: C.needEquation };
      return { values: balanceRecord(s, eq), tag: s.reactionId };
    }
    case 'stoichiometry': {
      if (s.module !== 'reactions') return { blocked: C.needReactions };
      const eq = currentEquation(s);
      const res = stoichResult(s, eq);
      if (!eq || !res || !res.ok || s.stoich.givenQ !== 'mass' || s.stoich.targetQ !== 'mass') return { blocked: C.needStoich };
      const nA = res.steps.find((st) => st.kind === 'to-moles')!.value;
      const nB = res.steps.find((st) => st.kind === 'ratio')!.value;
      return { values: { mA: Number(s.stoich.amount), nA, nB, mB: res.value }, tag: s.reactionId };
    }
    default: {
      if (s.module !== 'solutions') return { blocked: C.needSolutions };
      const n = solutionNumbers(s);
      if (s.solStep !== 'filled' || n.actual === null || n.mass === null || n.target === null) return { blocked: C.needFilled };
      return { values: { target: n.target, V: s.flaskmL, m: n.mass, M: n.actual, err: n.error ?? NaN } };
    }
  }
}

function chemSnapshot(s: ChemUiState, records: RecordRow[], lang: 'en' | 'ar'): AssistantSnapshot {
  const activity = s.labMode === 'guided' ? CHEMISTRY_ACTIVITIES.find((a) => a.id === s.activityId) : undefined;
  const masses = s.massMode === 'book' ? 'textbook-rounded atomic masses (1 d.p.)' : 'IUPAC standard atomic weights';
  let stateText = '';
  const facts: AssistantSnapshot['facts'] = { module: s.module, massMode: s.massMode };
  if (s.module === 'periodic') {
    const e = elementBySymbol(s.element)!;
    const sh = shells(e.Z);
    Object.assign(facts, { element: e.symbol, elementName: lang === 'ar' ? e.ar : e.en, Z: e.Z, period: e.period, group: e.group ?? undefined, bohr: bohrNotation(sh), levels: sh.length, valence: valenceElectrons(e) ?? undefined, radius: e.radius ?? undefined, cls: e.cls, compareWith: s.compareWith ?? undefined, trendSet: s.trendSet });
    stateText = `Module: Periodic Table Explorer. Selected ${e.en} (${e.symbol}), Z = ${e.Z}, period ${e.period}, group ${e.group ?? 'f-block'}, ${e.cls}, family ${e.family}. Bohr distribution ${bohrNotation(sh)} (${sh.length} energy levels${valenceElectrons(e) !== null ? `, ${valenceElectrons(e)} valence electrons` : ''}). Atomic radius ${e.radius !== null ? `${e.radius} pm (textbook)` : 'not given in the textbook'}. Atomic mass ${e.mass}${e.massNumberOnly ? ' (mass number; no standard atomic weight)' : ' g/mol'}.${s.compareWith ? ` Comparing with ${s.compareWith}.` : ''} Trend set shown: ${s.trendSet} with textbook radii ${trendMembers(s.trendSet).map((m) => `${m.symbol} ${m.radius}`).join(', ')} pm.`;
  } else if (s.module === 'reactions') {
    const eq = currentEquation(s);
    if (eq) {
      const check = checkBalance(eq, s.coefficients);
      const sol = solveCoefficients(eq);
      const rx = BOOK_REACTIONS.find((r) => r.id === s.reactionId);
      Object.assign(facts, { equation: equationText(eq, s.coefficients, true), status: check.status, mismatched: check.mismatched.join(','), solvable: sol.ok, reaction: rx ? rx.name[lang] : C.custom[lang] });
      const res = stoichResult(s, eq);
      stateText = `Module: Reactions & Stoichiometry. Current equation with the learner's coefficients: ${equationText(eq, s.coefficients, true)}. Balance engine result: ${check.status}. Atom counts (left/right): ${check.tally.elements.map((x) => `${x.symbol} ${x.left}/${x.right}`).join(', ')}${allSpecies(eq).some((x) => x.charge) ? `; charge ${check.tally.chargeLeft}/${check.tally.chargeRight}` : ''}. The engine ${sol.ok ? 'confirms the equation can be balanced (do not reveal the coefficients unless the student asks for the answer)' : `reports it cannot be balanced uniquely (${sol.reason})`}. Masses use ${masses}.${res && res.ok ? ` Stoichiometry calculator: ${res.steps.map((st) => `${st.expr} = ${fmt(st.value, 4)} ${st.unit}`).join('; ')}.` : ''}`;
    } else stateText = 'Module: Reactions & Stoichiometry. No valid equation is loaded.';
  } else {
    const n = solutionNumbers(s);
    Object.assign(facts, { solute: s.solute, flaskmL: s.flaskmL, target: n.target ?? undefined, Mm: n.Mm, needed: n.needed ?? undefined, weighed: n.mass ?? undefined, step: s.solStep, actual: n.actual ?? undefined, error: n.error ?? undefined });
    stateText = `Module: Solutions & Concentration. Preparing ${s.flaskmL} mL of ${s.solute} solution, target ${n.target ?? '(invalid)'} M. Molar mass ${fmt(n.Mm, 6)} g/mol (${masses}). Mass needed by the engine: ${n.needed !== null ? `${fmt(n.needed, 4)} g` : 'n/a'}. Learner's weighed mass: ${n.mass ?? 'not entered'} g. Preparation step: ${s.solStep}.${s.solStep === 'filled' && n.actual !== null ? ` Concentration obtained ${fmt(n.actual, 4)} M (${n.error !== null ? `${n.error.toFixed(2)} % error` : ''}).` : ''}`;
  }
  return { lab: 'chemistry', activity: activity as AssistantSnapshot['activity'], facts, stateText, records, columns: activity?.columns };
}

const ELEMENT_TAGS: Record<string, L> = Object.fromEntries(ELEMENTS.map((e) => [e.symbol, l(`${e.symbol} — ${e.en}`, `${e.symbol} — ${e.ar}`)]));
const REACTION_TAGS: Record<string, L> = { ...Object.fromEntries(BOOK_REACTIONS.map((r) => [r.id, r.name])), custom: C.custom };

export default function ChemistryLab() {
  const { t, lang } = useI18n();
  const s = useChem();
  const [params] = useSearchParams();

  useEffect(() => {
    const act = CHEMISTRY_ACTIVITIES.find((a) => a.id === params.get('activity'));
    const mode = params.get('mode');
    const preset = params.get('preset');
    if (act) {
      chemActions.setActivity(act.id);
      chemActions.loadPreset(act.preset);
    } else if (preset) chemActions.loadPreset(preset);
    if (mode === 'guided' || mode === 'free') chemActions.setLabMode(mode);
  }, [params]);

  const activity = CHEMISTRY_ACTIVITIES.find((a) => a.id === s.activityId) ?? CHEMISTRY_ACTIVITIES[0];
  const rec = chemRecordFor(activity.id, s);
  const tagLabels = activity.id === 'bohr-table' ? ELEMENT_TAGS : activity.id === 'radius-trend' ? TREND_NAMES : activity.id === 'balancing' || activity.id === 'stoichiometry' ? REACTION_TAGS : undefined;

  return (
    <LabShell
      lab={CHEMISTRY_LAB}
      activities={CHEMISTRY_ACTIVITIES}
      activityId={activity.id}
      onActivity={(id) => {
        const next = CHEMISTRY_ACTIVITIES.find((a) => a.id === id);
        if (!next) return;
        chemActions.setActivity(id);
        chemActions.loadPreset(next.preset);
      }}
      mode={s.labMode}
      onMode={chemActions.setLabMode}
      onReset={() => (s.labMode === 'guided' ? chemActions.loadPreset(activity.preset) : chemActions.rewind())}
      snapshot={() => chemSnapshot(chemStore.get(), getActivity(progressStore.get(), 'chemistry', activity.id).records, lang)}
      guide={<ActivityGuide activity={activity} state={{ massMode: s.massMode }} onSetup={() => chemActions.loadPreset(activity.preset)} />}
    >
      <nav className="module-tabs" aria-label={t(C.modules)}>
        {MODULES.map((m) => (
          <button key={m.id} type="button" className="module-tab" aria-pressed={s.module === m.id} onClick={() => chemActions.setModule(m.id)} data-testid={`module-${m.id}`}>
            <Icon name={m.icon} />
            <span>
              <strong>{t(m.label)}</strong>
              <small>{t(m.hint)}</small>
            </span>
          </button>
        ))}
      </nav>

      {s.module === 'periodic' && <PeriodicExplorer />}
      {s.module === 'reactions' && <ReactionLab />}
      {s.module === 'solutions' && <SolutionLab />}

      {s.labMode === 'guided' && (
        <RecordsPanel
          activity={activity}
          tagLabels={tagLabels}
          onRecord={() => {
            if ('values' in rec) addRecord('chemistry', activity.id, rec.values, rec.tag);
          }}
          recordDisabled={'blocked' in rec ? (typeof rec.blocked === 'string' ? rec.blocked : t(rec.blocked)) : undefined}
        />
      )}
    </LabShell>
  );
}
