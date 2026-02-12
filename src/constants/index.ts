// Weekly target hours
export const WEEKLY_TARGET_HOURS = 30;
export const WEEKLY_TARGET_MINUTES = WEEKLY_TARGET_HOURS * 60; // 1800

// Special day hours (sick, vacation, public holiday)
export const SPECIAL_DAY_HOURS = 6;
export const SPECIAL_DAY_MINUTES = SPECIAL_DAY_HOURS * 60; // 360
export const HALF_DAY_MINUTES = SPECIAL_DAY_MINUTES / 2; // 180 (3h)

// Thresholds for weekly status colors
export const THRESHOLD_OVERTIME_HOURS = 34.5;
export const THRESHOLD_OVERTIME_MINUTES = THRESHOLD_OVERTIME_HOURS * 60; // 2070
export const THRESHOLD_UNDER_HOURS = 27.5;
export const THRESHOLD_UNDER_MINUTES = THRESHOLD_UNDER_HOURS * 60; // 1650

// Max entries per day
export const MAX_ENTRIES_PER_DAY = 10;

// LocalStorage keys
export const STORAGE_KEY = 'attendance-tracker-data';
export const SETTINGS_STORAGE_KEY = 'attendance-tracker-settings';
export const STORAGE_VERSION = 1;
export const SETTINGS_VERSION = 1;

// Default settings
export const DEFAULT_DAILY_WORK_HOURS = 8;

// Day display range (full 24 hours for visualization)
export const DAY_START_HOUR = 0;
export const DAY_END_HOUR = 24;
export const TOTAL_DISPLAY_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60; // 1440

// Lunch break durations in minutes
export const LUNCH_DURATION_SHORT = 30; // 0.5h
export const LUNCH_DURATION_LONG = 60; // 1h

// Status colors (Tailwind classes)
export const STATUS_COLORS = {
  overtime: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  met: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  under: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  'way-under': {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
} as const;

// Day colors
export const DAY_COLORS = {
  weekday: 'text-gray-800',
  weekend: 'text-gray-400 bg-gray-50',
  publicHoliday: 'text-blue-700 bg-blue-50',
  sick: 'text-orange-700 bg-orange-50',
  vacation: 'text-teal-700 bg-teal-50',
  pnOcr: 'text-pink-700 bg-pink-50',
} as const;
