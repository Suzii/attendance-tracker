import { AttendanceData, StoredData } from '../types';
import { STORAGE_KEY, STORAGE_VERSION } from '../constants';

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
