import {
  createContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  AttendanceState,
  AttendanceData,
  DayRecord,
  TimeEntry,
  DayStats,
  WeekSummary,
  ValidationError,
  SpecialDayType,
} from '../types';
import { MAX_ENTRIES_PER_DAY, SPECIAL_DAY_MINUTES } from '../constants';
import { loadData, saveData } from '../utils/storage';
import { getTodayDateString, getCurrentMonthString, getMonthDates } from '../utils/dateUtils';
import {
  calculateDayStats,
  calculateWeekSummaries,
  calculateExpectedMinutes,
  generateEntryId,
  splitEntryForLunch,
  isHalfDay,
} from '../utils/timeCalculations';
import { validateData } from '../utils/validation';
import { isCzechHoliday } from '../utils/czechHolidays';

// Action types
type AttendanceAction =
  | { type: 'START_TRACKING' }
  | { type: 'STOP_TRACKING' }
  | { type: 'SET_MONTH'; payload: string }
  | { type: 'UPDATE_DAY'; payload: DayRecord }
  | { type: 'SET_SPECIAL_DAY'; payload: { date: string; specialDay: SpecialDayType } }
  | { type: 'LOAD_DATA'; payload: AttendanceData }
  | { type: 'ADD_LUNCH_BREAK'; payload: { date: string; entryId: string; durationMinutes: number } };

// Find any ongoing entry across all days
function findOngoingEntry(data: AttendanceData): { date: string; entry: TimeEntry } | null {
  for (const [date, record] of Object.entries(data)) {
    const openEntry = record.entries.find(e => e.end === null);
    if (openEntry) {
      return { date, entry: openEntry };
    }
  }
  return null;
}

// Initial state
function getInitialState(): AttendanceState {
  const data = loadData();

  // Check if there's an ongoing entry in any day
  const ongoing = findOngoingEntry(data);

  return {
    data,
    selectedMonth: getCurrentMonthString(),
    isTracking: !!ongoing,
    currentEntryId: ongoing?.entry.id ?? null,
  };
}

// Reducer
function attendanceReducer(
  state: AttendanceState,
  action: AttendanceAction
): AttendanceState {
  switch (action.type) {
    case 'START_TRACKING': {
      const today = getTodayDateString();

      const dayRecord = state.data[today] || {
        date: today,
        entries: [],
        specialDay: null,
      };

      // Enforce max entries
      if (dayRecord.entries.length >= MAX_ENTRIES_PER_DAY) {
        return state;
      }

      // Don't allow tracking if day is marked as full-day special (half-days allow tracking)
      if (dayRecord.specialDay && !isHalfDay(dayRecord.specialDay)) {
        return state;
      }

      const newEntry: TimeEntry = {
        id: generateEntryId(),
        start: new Date().toISOString(),
        end: null,
      };

      return {
        ...state,
        isTracking: true,
        currentEntryId: newEntry.id,
        data: {
          ...state.data,
          [today]: {
            ...dayRecord,
            entries: [...dayRecord.entries, newEntry],
          },
        },
      };
    }

    case 'STOP_TRACKING': {
      if (!state.currentEntryId) {
        return state;
      }

      // Find which day has the ongoing entry
      const ongoing = findOngoingEntry(state.data);
      if (!ongoing) {
        return {
          ...state,
          isTracking: false,
          currentEntryId: null,
        };
      }

      const { date: entryDate, entry: _ } = ongoing;
      const dayRecord = state.data[entryDate];

      const updatedEntries = dayRecord.entries.map(entry =>
        entry.id === state.currentEntryId
          ? { ...entry, end: new Date().toISOString() }
          : entry
      );

      return {
        ...state,
        isTracking: false,
        currentEntryId: null,
        data: {
          ...state.data,
          [entryDate]: {
            ...dayRecord,
            entries: updatedEntries,
          },
        },
      };
    }

    case 'SET_MONTH': {
      return {
        ...state,
        selectedMonth: action.payload,
      };
    }

    case 'UPDATE_DAY': {
      const { date } = action.payload;

      return {
        ...state,
        data: {
          ...state.data,
          [date]: action.payload,
        },
      };
    }

    case 'SET_SPECIAL_DAY': {
      const { date, specialDay } = action.payload;

      // Don't allow changing public holidays
      if (isCzechHoliday(date)) {
        return state;
      }

      const existingRecord = state.data[date] || {
        date,
        entries: [],
        specialDay: null,
      };

      // Half-days preserve entries, full-days clear them
      const entries = specialDay && !isHalfDay(specialDay) ? [] : existingRecord.entries;

      return {
        ...state,
        data: {
          ...state.data,
          [date]: {
            ...existingRecord,
            entries,
            specialDay,
          },
        },
      };
    }

    case 'LOAD_DATA': {
      return {
        ...state,
        data: action.payload,
      };
    }

    case 'ADD_LUNCH_BREAK': {
      const { date, entryId, durationMinutes } = action.payload;
      const dayRecord = state.data[date];

      if (!dayRecord) return state;

      const entryIndex = dayRecord.entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) return state;

      const entry = dayRecord.entries[entryIndex];
      const splitResult = splitEntryForLunch(entry, durationMinutes);

      if (!splitResult) return state;

      const [firstEntry, secondEntry] = splitResult;

      // Replace the original entry with the two split entries
      const newEntries = [
        ...dayRecord.entries.slice(0, entryIndex),
        firstEntry,
        secondEntry,
        ...dayRecord.entries.slice(entryIndex + 1),
      ];

      return {
        ...state,
        data: {
          ...state.data,
          [date]: {
            ...dayRecord,
            entries: newEntries,
          },
        },
      };
    }

    default:
      return state;
  }
}

// Context value type
export interface AttendanceContextValue {
  state: AttendanceState;
  dispatch: React.Dispatch<AttendanceAction>;
  // Computed values
  currentMonthDates: string[];
  currentMonthDayStats: DayStats[];
  weekSummaries: WeekSummary[];
  validationErrors: ValidationError[];
  monthlyTotalMinutes: number;
  monthlyExpectedMinutes: number;
  workdaysInMonth: number;
  // Action helpers
  startTracking: () => void;
  stopTracking: () => void;
  setMonth: (month: string) => void;
  updateDay: (record: DayRecord) => void;
  setSpecialDay: (date: string, specialDay: SpecialDayType) => void;
  addLunchBreak: (date: string, entryId: string, durationMinutes: number) => void;
}

// Create context
export const AttendanceContext = createContext<AttendanceContextValue | null>(null);

// Provider component
export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(attendanceReducer, null, getInitialState);

  // Persist to localStorage on data changes
  useEffect(() => {
    saveData(state.data);
  }, [state.data]);

  // Computed values (memoized)
  const currentMonthDates = useMemo(
    () => getMonthDates(state.selectedMonth),
    [state.selectedMonth]
  );

  const currentMonthDayStats = useMemo(
    () => currentMonthDates.map(date => calculateDayStats(date, state.data[date])),
    [currentMonthDates, state.data]
  );

  const weekSummaries = useMemo(
    () => calculateWeekSummaries(currentMonthDayStats),
    [currentMonthDayStats]
  );

  const validationErrors = useMemo(
    () => validateData(state.data),
    [state.data]
  );

  const monthlyTotalMinutes = useMemo(
    () => currentMonthDayStats.reduce((sum, day) => sum + day.totalMinutes, 0),
    [currentMonthDayStats]
  );

  const monthlyExpectedMinutes = useMemo(
    () => calculateExpectedMinutes(currentMonthDates),
    [currentMonthDates]
  );

  const workdaysInMonth = useMemo(
    () => monthlyExpectedMinutes / SPECIAL_DAY_MINUTES,
    [monthlyExpectedMinutes]
  );

  // Action helpers
  const startTracking = () => dispatch({ type: 'START_TRACKING' });
  const stopTracking = () => dispatch({ type: 'STOP_TRACKING' });
  const setMonth = (month: string) => dispatch({ type: 'SET_MONTH', payload: month });
  const updateDay = (record: DayRecord) => dispatch({ type: 'UPDATE_DAY', payload: record });
  const setSpecialDay = (date: string, specialDay: SpecialDayType) =>
    dispatch({ type: 'SET_SPECIAL_DAY', payload: { date, specialDay } });
  const addLunchBreak = (date: string, entryId: string, durationMinutes: number) =>
    dispatch({ type: 'ADD_LUNCH_BREAK', payload: { date, entryId, durationMinutes } });

  const value: AttendanceContextValue = {
    state,
    dispatch,
    currentMonthDates,
    currentMonthDayStats,
    weekSummaries,
    validationErrors,
    monthlyTotalMinutes,
    monthlyExpectedMinutes,
    workdaysInMonth,
    startTracking,
    stopTracking,
    setMonth,
    updateDay,
    setSpecialDay,
    addLunchBreak,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
