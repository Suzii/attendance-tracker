/**
 * Czech Republic Public Holidays
 *
 * Fixed holidays:
 * - January 1: New Year's Day (Den obnovy samostatného českého státu)
 * - May 1: Labour Day (Svátek práce)
 * - May 8: Victory in Europe Day (Den vítězství)
 * - July 5: Saints Cyril and Methodius Day (Den slovanských věrozvěstů Cyrila a Metoděje)
 * - July 6: Jan Hus Day (Den upálení mistra Jana Husa)
 * - September 28: Czech Statehood Day (Den české státnosti)
 * - October 28: Czechoslovak Independence Day (Den vzniku samostatného československého státu)
 * - November 17: Struggle for Freedom and Democracy Day (Den boje za svobodu a demokracii)
 * - December 24: Christmas Eve (Štědrý den)
 * - December 25: Christmas Day (1. svátek vánoční)
 * - December 26: St. Stephen's Day (2. svátek vánoční)
 *
 * Movable holiday:
 * - Easter Monday (Velikonoční pondělí)
 */

interface CzechHoliday {
  name: string;
  nameCs: string;
}

// Fixed holidays (month is 1-indexed)
const FIXED_HOLIDAYS: Record<string, CzechHoliday> = {
  '01-01': { name: 'New Year\'s Day', nameCs: 'Den obnovy samostatného českého státu' },
  '05-01': { name: 'Labour Day', nameCs: 'Svátek práce' },
  '05-08': { name: 'Victory in Europe Day', nameCs: 'Den vítězství' },
  '07-05': { name: 'Saints Cyril and Methodius Day', nameCs: 'Den slovanských věrozvěstů Cyrila a Metoděje' },
  '07-06': { name: 'Jan Hus Day', nameCs: 'Den upálení mistra Jana Husa' },
  '09-28': { name: 'Czech Statehood Day', nameCs: 'Den české státnosti' },
  '10-28': { name: 'Independence Day', nameCs: 'Den vzniku samostatného československého státu' },
  '11-17': { name: 'Freedom and Democracy Day', nameCs: 'Den boje za svobodu a demokracii' },
  '12-24': { name: 'Christmas Eve', nameCs: 'Štědrý den' },
  '12-25': { name: 'Christmas Day', nameCs: '1. svátek vánoční' },
  '12-26': { name: 'St. Stephen\'s Day', nameCs: '2. svátek vánoční' },
};

/**
 * Calculate Easter Sunday using the Anonymous Gregorian algorithm.
 * Returns the date of Easter Sunday for the given year.
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Get Easter Monday date for a given year.
 * Easter Monday is the day after Easter Sunday.
 */
function getEasterMonday(year: number): Date {
  const easterSunday = getEasterSunday(year);
  const easterMonday = new Date(easterSunday);
  easterMonday.setDate(easterMonday.getDate() + 1);
  return easterMonday;
}

/**
 * Format a date as MM-DD string.
 */
function formatMonthDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

/**
 * Check if a date string (YYYY-MM-DD) is a Czech public holiday.
 * Returns the holiday info if it is, or null if not.
 */
export function getCzechHoliday(dateString: string): CzechHoliday | null {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr, 10);
  const monthDay = `${monthStr}-${dayStr}`;

  // Check fixed holidays
  if (FIXED_HOLIDAYS[monthDay]) {
    return FIXED_HOLIDAYS[monthDay];
  }

  // Check Easter Monday
  const easterMonday = getEasterMonday(year);
  const easterMondayStr = formatMonthDay(easterMonday);

  if (monthDay === easterMondayStr) {
    return { name: 'Easter Monday', nameCs: 'Velikonoční pondělí' };
  }

  return null;
}

/**
 * Check if a date string (YYYY-MM-DD) is a Czech public holiday.
 */
export function isCzechHoliday(dateString: string): boolean {
  return getCzechHoliday(dateString) !== null;
}

/**
 * Get all Czech public holidays for a given year.
 * Returns an array of date strings (YYYY-MM-DD) and their holiday info.
 */
export function getCzechHolidaysForYear(year: number): Array<{ date: string; holiday: CzechHoliday }> {
  const holidays: Array<{ date: string; holiday: CzechHoliday }> = [];

  // Add fixed holidays
  for (const [monthDay, holiday] of Object.entries(FIXED_HOLIDAYS)) {
    holidays.push({
      date: `${year}-${monthDay}`,
      holiday,
    });
  }

  // Add Easter Monday
  const easterMonday = getEasterMonday(year);
  const easterMondayDate = `${year}-${formatMonthDay(easterMonday)}`;
  holidays.push({
    date: easterMondayDate,
    holiday: { name: 'Easter Monday', nameCs: 'Velikonoční pondělí' },
  });

  // Sort by date
  holidays.sort((a, b) => a.date.localeCompare(b.date));

  return holidays;
}

/**
 * Get Czech public holidays for a given month.
 * Returns an array of date strings (YYYY-MM-DD) that are holidays in that month.
 */
export function getCzechHolidaysForMonth(yearMonth: string): Array<{ date: string; holiday: CzechHoliday }> {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);

  return getCzechHolidaysForYear(year).filter(h => h.date.startsWith(yearMonth));
}
