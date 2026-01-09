/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current month as YYYY-MM string.
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parse a YYYY-MM string into year and month numbers.
 */
export function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [yearStr, monthStr] = yearMonth.split('-');
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
  };
}

/**
 * Get the number of days in a month.
 */
export function getDaysInMonth(yearMonth: string): number {
  const { year, month } = parseYearMonth(yearMonth);
  return new Date(year, month, 0).getDate();
}

/**
 * Get all dates in a month as YYYY-MM-DD strings.
 */
export function getMonthDates(yearMonth: string): string[] {
  const { year, month } = parseYearMonth(yearMonth);
  const daysInMonth = getDaysInMonth(yearMonth);
  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    dates.push(`${year}-${String(month).padStart(2, '0')}-${dayStr}`);
  }

  return dates;
}

/**
 * Get the day of week for a date (0 = Monday, 6 = Sunday).
 * Note: JavaScript's getDay() returns 0 = Sunday, so we convert.
 */
export function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00');
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Check if a date is a weekend (Saturday or Sunday).
 */
export function isWeekend(dateString: string): boolean {
  const dayOfWeek = getDayOfWeek(dateString);
  return dayOfWeek >= 5; // 5 = Saturday, 6 = Sunday
}

/**
 * Get the day name abbreviation for a date.
 */
export function getDayName(dateString: string): string {
  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  return dayNames[getDayOfWeek(dateString)];
}

/**
 * Get the day number from a date string.
 */
export function getDayNumber(dateString: string): number {
  return parseInt(dateString.split('-')[2], 10);
}

/**
 * Format a date string as "DD" (day number with leading zero).
 */
export function formatDayNumber(dateString: string): string {
  return String(getDayNumber(dateString)).padStart(2, '0');
}

/**
 * Get the ISO week number for a date (weeks start on Monday).
 */
export function getWeekNumber(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00');

  // ISO week: week 1 is the week containing January 4th
  // Weeks start on Monday
  const target = new Date(date.valueOf());

  // Set to nearest Thursday (current date + 4 - current day number)
  // Make Sunday's day number 7
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);

  // Get first Thursday of year
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);

  // Calculate week number
  const weekNumber = 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);

  return weekNumber;
}

/**
 * Get the previous month as YYYY-MM string.
 */
export function getPreviousMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

/**
 * Get the next month as YYYY-MM string.
 */
export function getNextMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Format a month as human-readable string (e.g., "January 2026").
 */
export function formatMonth(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[month - 1]} ${year}`;
}

/**
 * Check if a YYYY-MM string is valid.
 */
export function isValidYearMonth(yearMonth: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return false;
  const { year, month } = parseYearMonth(yearMonth);
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
}

/**
 * Group dates by week (Monday to Sunday).
 * Returns an array of arrays, where each inner array contains dates for one week.
 */
export function groupDatesByWeek(dates: string[]): string[][] {
  if (dates.length === 0) return [];

  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  for (const date of dates) {
    const dayOfWeek = getDayOfWeek(date);

    // If this is Monday and we have dates in currentWeek, start a new week
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(date);
  }

  // Don't forget the last week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
