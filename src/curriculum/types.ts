import type { L } from '../i18n/i18n';
import type { LabId, RecordRow } from '../lib/progress';

/**
 * `textbook`  — the activity, figure or worked example appears in the Grade 10 book.
 * `adapted`   — the concept and equations are in the book; the step-by-step procedure was designed for this lab.
 * `enrichment`— goes beyond the book (clearly labelled in the UI).
 */
export type SourceKind = 'textbook' | 'adapted' | 'enrichment';

export interface ColumnDef {
  id: string;
  label: L;
  unit: string;
  digits?: number;
}

export interface CheckContext<S = unknown> {
  records: RecordRow[];
  state: S;
}

export interface CheckQuestion<S = unknown> {
  id: string;
  prompt: L;
  kind: 'numeric' | 'choice' | 'open';
  unit?: string;
  choices?: L[];
  correctChoice?: number;
  /** Expected numeric answer, computed from the simulation or the learner's records. null = cannot be checked yet. */
  expected?: (ctx: CheckContext<S>) => number | null;
  /** What the learner must do before the check is possible (shown when expected returns null). */
  needs?: L;
  /** Relative tolerance for numeric answers (default 3 %). */
  tolerance?: number;
  hints: L[];
  /** Shown after a correct answer or when the answer is revealed. */
  explanation: L;
  /** Shown after an incorrect attempt: names the likely misconception without giving the answer. */
  wrongFeedback?: L;
}

export interface ChartSpec {
  x: string;
  y: string;
  /** Show a least-squares line (through the origin when `origin`). */
  fit?: 'line' | 'origin';
  /** Unit of the fitted slope, e.g. Ω for V against I. */
  slopeUnit?: string;
  /** Group points into separate series by the record's `tag` value. */
  byTag?: boolean;
}

export interface ActivityDef<S = unknown> {
  id: string;
  lab: LabId;
  title: L;
  source: SourceKind;
  /** Lesson / activity / page reference in the textbook. */
  ref: L;
  /** Learning outcome codes from the textbook (e.g. P1011.3). */
  outcomes: string[];
  objective: L;
  question: L;
  hypothesisPrompt: L;
  setup: L[];
  steps: L[];
  columns: ColumnDef[];
  chart?: ChartSpec;
  questions: CheckQuestion<S>[];
  conclusion: L;
  principle: L;
  /** Lab-specific preset loaded by "Set up experiment". */
  preset: string;
  equations: string[];
  minutes: number;
}

export interface LabInfo {
  id: LabId;
  title: L;
  short: L;
  unit: L;
  lessons: L[];
  objectives: L[];
  outcomes: string[];
  pages: string;
  accent: 'primary' | 'navy' | 'orange' | 'purple';
  /** Which textbook the lab is built on, e.g. “Grade 10 · Science · Semester 1”. */
  book: L;
  assumptions: L[];
  safety: L[];
  /** Plain-text curriculum context given to the AI assistant. */
  assistantContext: string;
}
