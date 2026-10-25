import type { LabId } from '../lib/progress';
import { CHEMISTRY_ACTIVITIES, CHEMISTRY_LAB } from './chemistry';
import { ELECTRICITY_ACTIVITIES, ELECTRICITY_LAB } from './electricity';
import { HEAT_ACTIVITIES, HEAT_LAB } from './heat';
import { MOTION_ACTIVITIES, MOTION_LAB } from './motion';
import type { ActivityDef, LabInfo } from './types';

export const LABS: Record<LabId, { info: LabInfo; activities: ActivityDef<unknown>[]; path: string; icon: 'bolt' | 'motion' | 'flame' | 'flask' }> = {
  electricity: { info: ELECTRICITY_LAB, activities: ELECTRICITY_ACTIVITIES as ActivityDef<unknown>[], path: '/lab/electricity', icon: 'bolt' },
  motion: { info: MOTION_LAB, activities: MOTION_ACTIVITIES as ActivityDef<unknown>[], path: '/lab/motion', icon: 'motion' },
  heat: { info: HEAT_LAB, activities: HEAT_ACTIVITIES as ActivityDef<unknown>[], path: '/lab/heat', icon: 'flame' },
  chemistry: { info: CHEMISTRY_LAB, activities: CHEMISTRY_ACTIVITIES as ActivityDef<unknown>[], path: '/lab/chemistry', icon: 'flask' },
};

/** Display order: the flagship electricity lab first, then the Semester 2 unit order, then the Semester 1 chemistry lab. */
export const LAB_ORDER: LabId[] = ['electricity', 'motion', 'heat', 'chemistry'];
