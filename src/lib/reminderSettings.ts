import { XanoGroup } from '../api/types';

/**
 * Resolved reminder schedule for the current user.
 * `source` tells the UI which layer of the priority chain is in effect so it
 * can render copy like "Using your team's reminder" vs "Custom reminder".
 */
export interface EffectiveReminderSettings {
  enabled: boolean;
  frequency: 'WEEKDAYS' | 'WEEKLY' | 'DAILY' | 'NONE';
  hour: number;
  min: number;
  source: 'user' | 'group' | 'default';
  /** When source === 'group', the group whose schedule we're using.
   *  Surfaced so the UI can display the group's name. */
  groupName?: string;
}

/** Defaults applied when neither the user nor their groups have a schedule.
 *  Spec: ON, Weekdays at 11:00 AM. */
export const DEFAULT_REMINDER: EffectiveReminderSettings = {
  enabled: true,
  frequency: 'WEEKDAYS',
  hour: 11,
  min: 0,
  source: 'default',
};

/** Shape of a single entry in `user.groups` after AuthContext normalisation.
 *  Heterogeneous — the joined group lives at `.group`, but some entries
 *  expose its fields at the top level too. We read defensively. */
interface UserGroupEntry {
  group?: Partial<XanoGroup> | null;
  groups?: Partial<XanoGroup> | null;
  forest?: { reqStatus?: string };
  reqStatus?: string;
  // Some flatter shapes put the group fields right here:
  groupName?: string;
  reminder_frequency?: XanoGroup['reminder_frequency'];
  reminder_hour?: number;
  reminder_min?: number;
}

interface UserReminderInput {
  reminderFrequency?: string;
  reminderHour?: number;
  reminderMin?: number;
}

function isValidFrequency(f: unknown): f is EffectiveReminderSettings['frequency'] {
  return f === 'WEEKDAYS' || f === 'WEEKLY' || f === 'DAILY' || f === 'NONE';
}

/** Pull the group payload out of an entry regardless of which shape the
 *  backend used (active_groups vs invites vs flat). */
function extractGroup(entry: UserGroupEntry): Partial<XanoGroup> | null {
  return entry.group ?? entry.groups ?? null;
}

function hasGroupSchedule(g: Partial<XanoGroup> | null | undefined): boolean {
  if (!g) return false;
  return (
    isValidFrequency(g.reminder_frequency) &&
    g.reminder_frequency !== 'NONE' &&
    typeof g.reminder_hour === 'number'
  );
}

/**
 * Resolve the schedule the app should show / use, following the priority:
 *
 *   1. User's own override (if reminder_frequency is set and != 'NONE')
 *   2. First joined group with a schedule
 *   3. DEFAULT_REMINDER (Weekdays 11:00, ON)
 *
 * If the user has explicitly set `reminderFrequency = 'NONE'`, that counts
 * as them opting out and we return a disabled `EffectiveReminderSettings`
 * with `source: 'user'` — the UI can then offer to re-enable without
 * silently re-applying the group schedule.
 */
export function getEffectiveReminderSettings(
  user: UserReminderInput | null | undefined,
  groups: UserGroupEntry[] | undefined,
): EffectiveReminderSettings {
  // 1. User-level override
  if (user && isValidFrequency(user.reminderFrequency)) {
    if (user.reminderFrequency === 'NONE') {
      return {
        enabled: false,
        frequency: 'NONE',
        hour: user.reminderHour ?? DEFAULT_REMINDER.hour,
        min: user.reminderMin ?? DEFAULT_REMINDER.min,
        source: 'user',
      };
    }
    return {
      enabled: true,
      frequency: user.reminderFrequency,
      hour: user.reminderHour ?? DEFAULT_REMINDER.hour,
      min: user.reminderMin ?? DEFAULT_REMINDER.min,
      source: 'user',
    };
  }

  // 2. First group with a schedule
  if (Array.isArray(groups)) {
    for (const entry of groups) {
      const g = extractGroup(entry) ?? entry;
      if (hasGroupSchedule(g)) {
        return {
          enabled: true,
          frequency: g.reminder_frequency as EffectiveReminderSettings['frequency'],
          hour: g.reminder_hour as number,
          min: g.reminder_min ?? 0,
          source: 'group',
          groupName: g.groupName ?? undefined,
        };
      }
    }
  }

  // 3. Default
  return { ...DEFAULT_REMINDER };
}

/** Format a 24-hour hour as a 12-hour string with am/pm. */
export function formatReminderTime(hour: number, min: number = 0): string {
  const h12 = ((hour + 11) % 12) + 1;
  const period = hour >= 12 ? 'pm' : 'am';
  const mm = String(min).padStart(2, '0');
  return `${h12}:${mm} ${period}`;
}

/** Human-friendly frequency label for UI ("Weekdays", "Once a week", etc.). */
export function formatReminderFrequency(
  f: EffectiveReminderSettings['frequency'],
): string {
  switch (f) {
    case 'DAILY':
      return 'Every day';
    case 'WEEKDAYS':
      return 'Weekdays';
    case 'WEEKLY':
      return 'Once a week';
    case 'NONE':
    default:
      return 'Off';
  }
}
