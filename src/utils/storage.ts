import type { AttendanceData, StoredData, Settings, MonthSettings, StoredSettings } from '../types';
import { STORAGE_KEY, STORAGE_VERSION, SETTINGS_STORAGE_KEY, SETTINGS_VERSION, DEFAULT_DAILY_WORK_HOURS } from '../constants';

/**
 * Load attendance data from localStorage.
 * Returns empty object if no data exists.
 */
export function loadData(): AttendanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const stored: StoredData = JSON.parse(raw);

    // Handle version migrations if needed in the future
    if (stored.version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch: expected ${STORAGE_VERSION}, got ${stored.version}`);
      // For now, just return the data as-is
      // In the future, we could add migration logic here
    }

    return stored.data;
  } catch (error) {
    console.error('Failed to load attendance data from localStorage:', error);
    return {};
  }
}

/**
 * Save attendance data to localStorage.
 */
export function saveData(data: AttendanceData): void {
  try {
    const stored: StoredData = {
      version: STORAGE_VERSION,
      data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to save attendance data to localStorage:', error);
  }
}

/**
 * Clear all attendance data from localStorage.
 */
export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear attendance data from localStorage:', error);
  }
}

/**
 * Export attendance data as JSON string (for backup/download).
 */
export function exportData(data: AttendanceData): string {
  const stored: StoredData = {
    version: STORAGE_VERSION,
    data,
    lastUpdated: new Date().toISOString(),
  };
  return JSON.stringify(stored, null, 2);
}

/**
 * Import attendance data from JSON string (for restore/upload).
 * Returns the imported data or null if invalid.
 */
export function importData(jsonString: string): AttendanceData | null {
  try {
    const stored: StoredData = JSON.parse(jsonString);

    if (typeof stored.data !== 'object') {
      console.error('Invalid data structure in import');
      return null;
    }

    return stored.data;
  } catch (error) {
    console.error('Failed to parse imported data:', error);
    return null;
  }
}

// ============ Settings Storage ============

const DEFAULT_SETTINGS: Settings = {
  dailyWorkHours: DEFAULT_DAILY_WORK_HOURS,
};

/**
 * Load settings from localStorage.
 * On first load, migrates existing attendance data by baking in 6h default for all existing months.
 */
export function loadSettings(): { settings: Settings; monthlySettings: { [month: string]: MonthSettings } } {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);

    // If settings already exist, just return them
    if (raw) {
      const stored: StoredSettings = JSON.parse(raw);
      return {
        settings: stored.settings ?? DEFAULT_SETTINGS,
        monthlySettings: stored.monthlySettings ?? {},
      };
    }

    // First time loading settings - migrate existing attendance data
    // Bake in 6h default for all months that have data
    const monthlySettings: { [month: string]: MonthSettings } = {};

    const attendanceRaw = localStorage.getItem(STORAGE_KEY);
    if (attendanceRaw) {
      const attendanceData: StoredData = JSON.parse(attendanceRaw);
      if (attendanceData.data) {
        // Find all unique months in the data
        const months = new Set<string>();
        for (const date of Object.keys(attendanceData.data)) {
          const month = date.substring(0, 7); // YYYY-MM
          months.add(month);
        }

        // Bake in the default (6h) for each existing month
        for (const month of months) {
          monthlySettings[month] = { dailyWorkHours: DEFAULT_DAILY_WORK_HOURS };
        }

        console.log(`Migrated settings for ${months.size} existing months with ${DEFAULT_DAILY_WORK_HOURS}h default`);
      }
    }

    // Save the migrated settings immediately
    const newSettings = { settings: DEFAULT_SETTINGS, monthlySettings };
    saveSettings(newSettings.settings, newSettings.monthlySettings);

    return newSettings;
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return { settings: DEFAULT_SETTINGS, monthlySettings: {} };
  }
}

/**
 * Save settings to localStorage.
 */
export function saveSettings(settings: Settings, monthlySettings: { [month: string]: MonthSettings }): void {
  try {
    const stored: StoredSettings = {
      version: SETTINGS_VERSION,
      settings,
      monthlySettings,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

/**
 * Get the daily work hours for a specific month.
 * Returns the month-specific setting if it exists, otherwise the default setting.
 */
export function getMonthlyWorkHours(
  month: string,
  settings: Settings,
  monthlySettings: { [month: string]: MonthSettings }
): number {
  return monthlySettings[month]?.dailyWorkHours ?? settings.dailyWorkHours;
}

/**
 * Set the daily work hours for a specific month (bakes it into the month's data).
 */
export function setMonthlyWorkHours(
  month: string,
  hours: number,
  monthlySettings: { [month: string]: MonthSettings }
): { [month: string]: MonthSettings } {
  return {
    ...monthlySettings,
    [month]: { dailyWorkHours: hours },
  };
}
