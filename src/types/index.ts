/**
 * A single time entry representing a start-stop pair.
 * If `end` is null, the entry is currently running.
 */
export interface TimeEntry {
  id: string;
  start: string; // ISO 8601 timestamp
  end: string | null; // ISO 8601 timestamp, null if ongoing
}

/**
 * Special day types that override normal time tracking.
 * - 'sick': Sick day (6 hours)
 * - 'sick_first_half': Sick day morning (3 hours, can track work for afternoon)
 * - 'sick_second_half': Sick day afternoon (3 hours, can track work for morning)
 * - 'vacation': Vacation day (6 hours)
 * - 'vacation_first_half': Vacation morning (3 hours, can track work for afternoon)
 * - 'vacation_second_half': Vacation afternoon (3 hours, can track work for morning)
 * - 'public_holiday': Czech public holiday (6 hours, auto-detected, locked)
 */
export type SpecialDayType =
  | 'sick' | 'sick_first_half' | 'sick_second_half'
  | 'vacation' | 'vacation_first_half' | 'vacation_second_half'
  | 'public_holiday'
  | null;

/**
 * A single day's attendance record.
 */
export interface DayRecord {
  date: string; // YYYY-MM-DD format
  entries: TimeEntry[]; // 0-10 entries per day
  specialDay: SpecialDayType;
}

/**
 * Complete attendance data structure.
 * Keyed by date string (YYYY-MM-DD) for O(1) lookup.
 */
export interface AttendanceData {
  [date: string]: DayRecord;
}

/**
 * Weekly summary data for display.
 */
export interface WeekSummary {
  weekNumber: number;
  days: DayStats[];
  totalMinutes: number;
  targetMinutes: number;
  status: 'overtime' | 'met' | 'under' | 'way-under';
}

/**
 * Calculated day statistics for display.
 */
export interface DayStats {
  date: string;
  totalMinutes: number;
  isWeekend: boolean;
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  hasOpenEntry: boolean;
  specialDay: SpecialDayType;
  isPublicHoliday: boolean;
  holidayName?: string;
}

/**
 * Validation error for data integrity checks.
 */
export interface ValidationError {
  date: string;
  message: string;
  type: 'unclosed_entry' | 'overlapping_entries' | 'invalid_order';
}

/**
 * Application state shape.
 */
export interface AttendanceState {
  data: AttendanceData;
  selectedMonth: string; // YYYY-MM format
  isTracking: boolean;
  currentEntryId: string | null;
}

/**
 * Stored data structure for localStorage.
 */
export interface StoredData {
  version: number;
  data: AttendanceData;
  lastUpdated: string;
}
