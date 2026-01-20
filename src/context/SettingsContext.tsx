import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Settings, MonthSettings } from '../types';
import { loadSettings, saveSettings, getMonthlyWorkHours, setMonthlyWorkHours } from '../utils/storage';

export interface SettingsContextValue {
  /** Global default settings */
  settings: Settings;
  /** Per-month settings */
  monthlySettings: { [month: string]: MonthSettings };
  /** Get the work hours for a specific month (uses month-specific or falls back to default) */
  getWorkHoursForMonth: (month: string) => number;
  /** Update the default daily work hours */
  setDefaultWorkHours: (hours: number) => void;
  /** Set work hours for a specific month (bakes it in) */
  setWorkHoursForMonth: (month: string, hours: number) => void;
  /** Ensure a month has its settings baked in (called when first tracking in a month) */
  ensureMonthSettings: (month: string) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings().settings);
  const [monthlySettings, setMonthlySettings] = useState<{ [month: string]: MonthSettings }>(
    () => loadSettings().monthlySettings
  );

  // Persist to localStorage on changes
  useEffect(() => {
    saveSettings(settings, monthlySettings);
  }, [settings, monthlySettings]);

  const getWorkHoursForMonth = useCallback(
    (month: string): number => {
      return getMonthlyWorkHours(month, settings, monthlySettings);
    },
    [settings, monthlySettings]
  );

  const setDefaultWorkHours = useCallback((hours: number) => {
    setSettings(prev => ({ ...prev, dailyWorkHours: hours }));
  }, []);

  const setWorkHoursForMonthCb = useCallback((month: string, hours: number) => {
    setMonthlySettings(prev => setMonthlyWorkHours(month, hours, prev));
  }, []);

  const ensureMonthSettings = useCallback(
    (month: string) => {
      // If the month doesn't have settings yet, bake in the current default
      if (!monthlySettings[month]) {
        setMonthlySettings(prev => ({
          ...prev,
          [month]: { dailyWorkHours: settings.dailyWorkHours },
        }));
      }
    },
    [monthlySettings, settings.dailyWorkHours]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      monthlySettings,
      getWorkHoursForMonth,
      setDefaultWorkHours,
      setWorkHoursForMonth: setWorkHoursForMonthCb,
      ensureMonthSettings,
    }),
    [settings, monthlySettings, getWorkHoursForMonth, setDefaultWorkHours, setWorkHoursForMonthCb, ensureMonthSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
