/**
 * Learner progress, kept only in this browser (localStorage). There are no
 * accounts and nothing is sent to a server.
 */
import { createStore, useStore } from './store';

export type LabId = 'electricity' | 'motion' | 'heat' | 'chemistry';

export interface RecordRow {
  id: string;
  /** Measured values keyed by column id (all produced by the simulation). */
  values: Record<string, number>;
  /** Optional category, e.g. "series" / "parallel" or a material id. */
  tag?: string;
  /** Free-text observation typed by the learner. */
  note?: string;
  createdAt: number;
}

export interface AnswerState {
  value: string;
  correct: boolean | null;
  attempts: number;
  hintsShown: number;
  revealed: boolean;
}

export interface ActivityProgress {
  hypothesis: string;
  records: RecordRow[];
  answers: Record<string, AnswerState>;
  reflections: Record<string, string>;
  completed: boolean;
  updatedAt: number;
}

export type ProgressState = Partial<Record<LabId, Record<string, ActivityProgress>>>;

const KEY = 'nahj-labs-progress-v1';

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export const progressStore = createStore<ProgressState>(load);
progressStore.subscribe(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(progressStore.get()));
  } catch {
    /* storage full or unavailable: progress stays in memory for this session */
  }
});

export const emptyProgress = (): ActivityProgress => ({
  hypothesis: '',
  records: [],
  answers: {},
  reflections: {},
  completed: false,
  updatedAt: 0,
});

export function getActivity(state: ProgressState, lab: LabId, activity: string): ActivityProgress {
  return state[lab]?.[activity] ?? emptyProgress();
}

export function updateActivity(lab: LabId, activity: string, fn: (p: ActivityProgress) => ActivityProgress) {
  progressStore.set((s) => {
    const current = getActivity(s, lab, activity);
    const next = { ...fn(current), updatedAt: Date.now() };
    return { ...s, [lab]: { ...(s[lab] ?? {}), [activity]: next } };
  });
}

let rowCounter = 0;
export function addRecord(lab: LabId, activity: string, values: Record<string, number>, tag?: string) {
  updateActivity(lab, activity, (p) => ({
    ...p,
    records: [...p.records, { id: `r${Date.now().toString(36)}${(rowCounter++).toString(36)}`, values, tag, createdAt: Date.now() }],
  }));
}

export function removeRecord(lab: LabId, activity: string, id: string) {
  updateActivity(lab, activity, (p) => ({ ...p, records: p.records.filter((r) => r.id !== id) }));
}

export function resetActivity(lab: LabId, activity: string) {
  progressStore.set((s) => {
    const labState = { ...(s[lab] ?? {}) };
    delete labState[activity];
    return { ...s, [lab]: labState };
  });
}

export function resetAllProgress() {
  progressStore.set({});
}

export function useActivityProgress(lab: LabId, activity: string): ActivityProgress {
  const s = useStore(progressStore);
  return getActivity(s, lab, activity);
}

export function labSummary(state: ProgressState, lab: LabId, activityIds: string[]) {
  const acts = activityIds.map((id) => getActivity(state, lab, id));
  const started = acts.filter((a) => a.updatedAt > 0).length;
  const completed = acts.filter((a) => a.completed).length;
  return { started, completed, total: activityIds.length };
}
