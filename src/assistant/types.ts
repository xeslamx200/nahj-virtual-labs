import type { ActivityDef, ColumnDef } from '../curriculum/types';
import type { LabId, RecordRow } from '../lib/progress';

export type Intent = 'explain' | 'why' | 'next' | 'practice' | 'interpret' | 'ask';

export type Facts = Record<string, number | string | boolean | undefined>;

/** Everything the assistant may know about the lab right now — all values come from the simulation. */
export interface AssistantSnapshot {
  lab: LabId;
  activity?: ActivityDef<unknown>;
  facts: Facts;
  /** Plain-text description of the state for the language model. */
  stateText: string;
  records: RecordRow[];
  columns?: ColumnDef[];
}

/** A textbook passage the server retrieved and the model reported using (built server-side from index metadata). */
export interface TextbookCitation {
  id: string;
  book: { en: string; ar: string };
  unit: number;
  unitTitle: { en: string; ar: string };
  /** null for unit introductions and reviews. */
  lesson: string | null;
  lessonTitle: { en: string; ar: string };
  page: number;
}

/** What an AI answer was based on. `verified: false` means the model's reply could not be checked. */
export interface AnswerSources {
  textbook: TextbookCitation[];
  /** 'full': the cited passages contain the answer's terms and numbers; 'partial': only some of them (or general knowledge was added). */
  support?: 'full' | 'partial' | 'none';
  /** How the lab values were checked server-side: they are always reported by the lab page, never re-simulated. */
  experimentCheck?: 'none' | 'consistent' | 'format-only' | 'rejected';
  experiment: boolean;
  general: boolean;
  verified: boolean;
}

export interface AssistantReply {
  id: string;
  intent: Intent;
  text: string;
  /** Hidden answer for practice questions (offline tutor). */
  answer?: string;
  source: 'ai' | 'offline';
  /** Only for live AI answers. */
  sources?: AnswerSources;
  question?: string;
}
