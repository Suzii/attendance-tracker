import type { TimeEntry, DayRecord, DayStats, WeekSummary } from '../types';
import {
  SPECIAL_DAY_MINUTES,
  WEEKLY_TARGET_MINUTES,
  THRESHOLD_OVERTIME_MINUTES,
  THRESHOLD_UNDER_MINUTES,
  TOTAL_DISPLAY_MINUTES,
  LUNCH_DURATION_SHORT,
  LUNCH_DURATION_LONG,
} from '../constants';
import { getDayOfWeek, isWeekend, getWeekNumber } from './dateUtils';
import { getCzechHoliday, isCzechHoliday } from './czechHolidays';

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
 * Special days (sick, vacation, public_holiday) return SPECIAL_DAY_MINUTES.
 */
export function calculateDayTotal(record: DayRecord | undefined): number {
  if (!record) return 0;

  if (record.specialDay) {
    return SPECIAL_DAY_MINUTES;
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
 * Determine the weekly status based on total minutes.
 */
export function getWeekStatus(totalMinutes: number): 'overtime' | 'met' | 'under' | 'way-under' {
  if (totalMinutes >= THRESHOLD_OVERTIME_MINUTES) return 'overtime';
  if (totalMinutes >= WEEKLY_TARGET_MINUTES) return 'met';
  if (totalMinutes >= THRESHOLD_UNDER_MINUTES) return 'under';
  return 'way-under';
}

/**
 * Calculate day statistics for a single date.
 */
export function calculateDayStats(
  dateString: string,
  record: DayRecord | undefined
): DayStats {
  const holiday = getCzechHoliday(dateString);
  const isHoliday = holiday !== null;

  // Determine special day type (public holiday takes precedence)
  let specialDay = record?.specialDay ?? null;
  if (isHoliday) {
    specialDay = 'public_holiday';
  }

  // Calculate total minutes
  let totalMinutes = 0;
  if (specialDay) {
    totalMinutes = SPECIAL_DAY_MINUTES;
  } else if (record?.entries) {
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
 * Calculate week summaries from an array of day stats.
 * Groups days by week and calculates totals.
 */
export function calculateWeekSummaries(dayStats: DayStats[]): WeekSummary[] {
  if (dayStats.length === 0) return [];

  const weeks: WeekSummary[] = [];
  let currentWeek: DayStats[] = [];
  let currentWeekNumber = getWeekNumber(dayStats[0].date);

  for (const day of dayStats) {
    const weekNumber = getWeekNumber(day.date);

    if (weekNumber !== currentWeekNumber && currentWeek.length > 0) {
      // Finish the current week
      const totalMinutes = currentWeek.reduce((sum, d) => sum + d.totalMinutes, 0);
      weeks.push({
        weekNumber: currentWeekNumber,
        days: currentWeek,
        totalMinutes,
        targetMinutes: WEEKLY_TARGET_MINUTES,
        status: getWeekStatus(totalMinutes),
      });
      currentWeek = [];
      currentWeekNumber = weekNumber;
    }

    currentWeek.push(day);
  }

  // Don't forget the last week
  if (currentWeek.length > 0) {
    const totalMinutes = currentWeek.reduce((sum, d) => sum + d.totalMinutes, 0);
    weeks.push({
      weekNumber: currentWeekNumber,
      days: currentWeek,
      totalMinutes,
      targetMinutes: WEEKLY_TARGET_MINUTES,
      status: getWeekStatus(totalMinutes),
    });
  }

  return weeks;
}

/**
 * Count workdays in a list of dates.
 * Workdays = Mon-Fri excluding public holidays.
 */
export function countWorkdays(dates: string[]): number {
  return dates.filter(date => {
    const dayOfWeek = getDayOfWeek(date);
    const isWeekday = dayOfWeek < 5; // 0-4 = Mon-Fri
    const isHoliday = isCzechHoliday(date);
    return isWeekday && !isHoliday;
  }).length;
}

/**
 * Calculate expected hours for a month.
 * Expected = workdays × SPECIAL_DAY_HOURS (6h per day).
 */
export function calculateExpectedMinutes(dates: string[]): number {
  const workdays = countWorkdays(dates);
  return workdays * SPECIAL_DAY_MINUTES;
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
