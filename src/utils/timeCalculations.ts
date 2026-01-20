import type { TimeEntry, DayRecord, DayStats, WeekSummary, SpecialDayType } from '../types';
import {
  SPECIAL_DAY_MINUTES,
  TOTAL_DISPLAY_MINUTES,
  LUNCH_DURATION_LONG,
} from '../constants';
import { getDayOfWeek, isWeekend, getWeekNumber } from './dateUtils';
import { getCzechHoliday } from './czechHolidays';

/**
 * Check if a special day type is a half-day.
 */
export function isHalfDay(specialDay: SpecialDayType): boolean {
  return specialDay?.includes('_half') ?? false;
}

/**
 * Get the minutes credited for a special day type.
 * Full days (sick, vacation) = dailyMinutes, half days = dailyMinutes / 2.
 * @param dailyMinutes - The full day minutes (e.g., 360 for 6h). Defaults to SPECIAL_DAY_MINUTES for backwards compatibility.
 */
export function getSpecialDayMinutes(specialDay: SpecialDayType, dailyMinutes: number = SPECIAL_DAY_MINUTES): number {
  return isHalfDay(specialDay) ? dailyMinutes / 2 : dailyMinutes;
}

/**
 * Calculate the total minutes worked from a list of time entries.
 * For ongoing entries (end is null), calculates up to the current time.
 */
export function calculateEntriesTotal(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => {
    const start = new Date(entry.start);
    const end = entry.end ? new Date(entry.end) : new Date();
    const diffMs = end.getTime() - start.getTime();
    return total + Math.floor(diffMs / 60000);
  }, 0);
}

/**
 * Calculate total minutes for a day record.
 * Full special days (sick, vacation, public_holiday) return dailyMinutes.
 * Half-day special days return dailyMinutes/2 + logged entries.
 * @param dailyMinutes - The full day minutes. Defaults to SPECIAL_DAY_MINUTES for backwards compatibility.
 */
export function calculateDayTotal(record: DayRecord | undefined, dailyMinutes: number = SPECIAL_DAY_MINUTES): number {
  if (!record) return 0;

  if (record.specialDay) {
    const specialMinutes = getSpecialDayMinutes(record.specialDay, dailyMinutes);
    // Half-days allow tracking work for the other half
    if (isHalfDay(record.specialDay)) {
      return specialMinutes + calculateEntriesTotal(record.entries);
    }
    return specialMinutes;
  }

  return calculateEntriesTotal(record.entries);
}

/**
 * Format minutes as "Xh YYm" string.
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

/**
 * Format minutes as "X.X h" string (decimal hours).
 */
export function formatMinutesDecimal(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

/**
 * Get the position (0-100%) of a timestamp within a day.
 * Used for visual time span positioning.
 */
export function getTimePosition(timestamp: string): number {
  const date = new Date(timestamp);
  const minutes = date.getHours() * 60 + date.getMinutes();
  return (minutes / TOTAL_DISPLAY_MINUTES) * 100;
}

/**
 * Get the width (0-100%) of a time span.
 */
export function getSpanWidth(start: string, end: string | null): number {
  const startPos = getTimePosition(start);
  const endPos = end ? getTimePosition(end) : getTimePosition(new Date().toISOString());
  return Math.max(0, endPos - startPos);
}

/**
 * Determine the weekly status based on total minutes and dynamic target.
 * Thresholds are relative to target:
 * - overtime: >= 115% of target
 * - met: >= 100% of target
 * - under: >= 92% of target (27.5/30 ratio)
 * - way-under: < 92% of target
 */
export function getWeekStatus(totalMinutes: number, targetMinutes: number): 'overtime' | 'met' | 'under' | 'way-under' {
  if (targetMinutes === 0) return 'met'; // No workdays in this week portion

  const overtimeThreshold = targetMinutes * 1.15;
  const underThreshold = targetMinutes * 0.917; // ~27.5/30 ratio

  if (totalMinutes >= overtimeThreshold) return 'overtime';
  if (totalMinutes >= targetMinutes) return 'met';
  if (totalMinutes >= underThreshold) return 'under';
  return 'way-under';
}

/**
 * Calculate day statistics for a single date.
 * @param dailyMinutes - The full day minutes. Defaults to SPECIAL_DAY_MINUTES for backwards compatibility.
 */
export function calculateDayStats(
  dateString: string,
  record: DayRecord | undefined,
  dailyMinutes: number = SPECIAL_DAY_MINUTES
): DayStats {
  const holiday = getCzechHoliday(dateString);
  const isHoliday = holiday !== null;

  // Determine special day type
  const specialDay = record?.specialDay ?? null;

  // Calculate total minutes
  let totalMinutes = 0;

  // Public holidays: dailyMinutes base + any logged work
  if (isHoliday) {
    totalMinutes = dailyMinutes;
    if (record?.entries) {
      totalMinutes += calculateEntriesTotal(record.entries);
    }
  }
  // Sick/vacation days (full or half)
  else if (specialDay) {
    const specialMinutes = getSpecialDayMinutes(specialDay, dailyMinutes);
    // Half-days allow tracking work for the other half
    if (isHalfDay(specialDay) && record?.entries) {
      totalMinutes = specialMinutes + calculateEntriesTotal(record.entries);
    } else {
      totalMinutes = specialMinutes;
    }
  }
  // Regular days: just logged entries
  else if (record?.entries) {
    totalMinutes = calculateEntriesTotal(record.entries);
  }

  return {
    date: dateString,
    totalMinutes,
    isWeekend: isWeekend(dateString),
    dayOfWeek: getDayOfWeek(dateString),
    hasOpenEntry: record?.entries.some(e => e.end === null) ?? false,
    specialDay,
    isPublicHoliday: isHoliday,
    holidayName: holiday?.name,
  };
}

/**
 * Count workdays in a week (Mon-Fri).
 * Public holidays on weekdays count as workdays (they contribute 6h like sick/vacation).
 */
function countWeekWorkdays(days: DayStats[]): number {
  return days.filter(day => !day.isWeekend).length;
}

/**
 * Calculate week summaries from an array of day stats.
 * Groups days by week and calculates totals with dynamic targets.
 * @param dailyMinutes - The full day minutes for target calculation. Defaults to SPECIAL_DAY_MINUTES.
 */
export function calculateWeekSummaries(dayStats: DayStats[], dailyMinutes: number = SPECIAL_DAY_MINUTES): WeekSummary[] {
  if (dayStats.length === 0) return [];

  const weeks: WeekSummary[] = [];
  let currentWeek: DayStats[] = [];
  let currentWeekNumber = getWeekNumber(dayStats[0].date);

  for (const day of dayStats) {
    const weekNumber = getWeekNumber(day.date);

    if (weekNumber !== currentWeekNumber && currentWeek.length > 0) {
      // Finish the current week
      const totalMinutes = currentWeek.reduce((sum, d) => sum + d.totalMinutes, 0);
      const workdays = countWeekWorkdays(currentWeek);
      const targetMinutes = workdays * dailyMinutes;
      weeks.push({
        weekNumber: currentWeekNumber,
        days: currentWeek,
        totalMinutes,
        targetMinutes,
        status: getWeekStatus(totalMinutes, targetMinutes),
      });
      currentWeek = [];
      currentWeekNumber = weekNumber;
    }

    currentWeek.push(day);
  }

  // Don't forget the last week
  if (currentWeek.length > 0) {
    const totalMinutes = currentWeek.reduce((sum, d) => sum + d.totalMinutes, 0);
    const workdays = countWeekWorkdays(currentWeek);
    const targetMinutes = workdays * dailyMinutes;
    weeks.push({
      weekNumber: currentWeekNumber,
      days: currentWeek,
      totalMinutes,
      targetMinutes,
      status: getWeekStatus(totalMinutes, targetMinutes),
    });
  }

  return weeks;
}

/**
 * Count workdays in a list of dates.
 * Workdays = Mon-Fri (public holidays count as workdays since they contribute 6h).
 */
export function countWorkdays(dates: string[]): number {
  return dates.filter(date => {
    const dayOfWeek = getDayOfWeek(date);
    const isWeekday = dayOfWeek < 5; // 0-4 = Mon-Fri
    return isWeekday;
  }).length;
}

/**
 * Calculate expected hours for a month.
 * Expected = workdays × dailyMinutes.
 * @param dailyMinutes - The full day minutes. Defaults to SPECIAL_DAY_MINUTES for backwards compatibility.
 */
export function calculateExpectedMinutes(dates: string[], dailyMinutes: number = SPECIAL_DAY_MINUTES): number {
  const workdays = countWorkdays(dates);
  return workdays * dailyMinutes;
}

/**
 * Split an entry by inserting a lunch break in the middle.
 * Returns two new entries with the lunch break gap.
 */
export function splitEntryForLunch(
  entry: TimeEntry,
  lunchDurationMinutes: number = LUNCH_DURATION_LONG
): [TimeEntry, TimeEntry] | null {
  if (!entry.end) {
    // Cannot split an ongoing entry
    return null;
  }

  const start = new Date(entry.start);
  const end = new Date(entry.end);
  const totalMs = end.getTime() - start.getTime();
  const totalMinutes = totalMs / 60000;

  if (totalMinutes < lunchDurationMinutes + 60) {
    // Entry is too short to split (need at least 30min on each side)
    return null;
  }

  // Find the midpoint and create the lunch break centered there
  const midpointMs = start.getTime() + totalMs / 2;
  const lunchStartMs = midpointMs - (lunchDurationMinutes / 2) * 60000;
  const lunchEndMs = midpointMs + (lunchDurationMinutes / 2) * 60000;

  const firstEntry: TimeEntry = {
    id: entry.id,
    start: entry.start,
    end: new Date(lunchStartMs).toISOString(),
  };

  const secondEntry: TimeEntry = {
    id: `${entry.id}-after-lunch`,
    start: new Date(lunchEndMs).toISOString(),
    end: entry.end,
  };

  return [firstEntry, secondEntry];
}

/**
 * Generate a unique entry ID.
 */
export function generateEntryId(): string {
  return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
