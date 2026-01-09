import { AttendanceData, ValidationError, DayRecord } from '../types';
import { getTodayDateString } from './dateUtils';

/**
 * Validate a single day's entries for integrity issues.
 */
export function validateDayRecord(
  dateString: string,
  record: DayRecord,
  isToday: boolean
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for unclosed entries on past days
  const hasUnclosedEntry = record.entries.some(e => e.end === null);
  if (hasUnclosedEntry && !isToday) {
    errors.push({
      date: dateString,
      message: `Unclosed time entry`,
      type: 'unclosed_entry',
    });
  }

  // Check for entries with end before start
  for (const entry of record.entries) {
    if (entry.end) {
      const start = new Date(entry.start);
      const end = new Date(entry.end);
      if (end < start) {
        errors.push({
          date: dateString,
          message: `Entry ends before it starts`,
          type: 'invalid_order',
        });
        break;
      }
    }
  }

  // Check for overlapping entries (only check closed entries)
  const closedEntries = record.entries
    .filter(e => e.end !== null)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  for (let i = 0; i < closedEntries.length - 1; i++) {
    const current = closedEntries[i];
    const next = closedEntries[i + 1];
    const currentEnd = new Date(current.end!).getTime();
    const nextStart = new Date(next.start).getTime();

    if (currentEnd > nextStart) {
      errors.push({
        date: dateString,
        message: `Overlapping time entries`,
        type: 'overlapping_entries',
      });
      break;
    }
  }

  return errors;
}

/**
 * Validate all attendance data.
 * Returns an array of validation errors.
 */
export function validateData(data: AttendanceData): ValidationError[] {
  const errors: ValidationError[] = [];
  const today = getTodayDateString();

  for (const [dateString, record] of Object.entries(data)) {
    const isToday = dateString === today;
    const dayErrors = validateDayRecord(dateString, record, isToday);
    errors.push(...dayErrors);
  }

  // Sort errors by date (most recent first)
  errors.sort((a, b) => b.date.localeCompare(a.date));

  return errors;
}

/**
 * Check if there are any blocking errors (unclosed entries on past days).
 * Blocking errors prevent starting new time tracking.
 */
export function hasBlockingErrors(errors: ValidationError[]): boolean {
  return errors.some(e => e.type === 'unclosed_entry');
}

/**
 * Get dates with unclosed entries.
 */
export function getUnclosedEntryDates(data: AttendanceData): string[] {
  const today = getTodayDateString();

  return Object.entries(data)
    .filter(([dateString, record]) => {
      if (dateString === today) return false;
      return record.entries.some(e => e.end === null);
    })
    .map(([dateString]) => dateString)
    .sort((a, b) => b.localeCompare(a)); // Most recent first
}

/**
 * Format validation error for display.
 */
export function formatValidationError(error: ValidationError): string {
  const dateObj = new Date(error.date + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);

  return `${formattedDate}: ${error.message}`;
}
