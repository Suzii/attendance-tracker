import { useState, useEffect } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { TimeRangeInput } from './TimestampInput';
import { LunchButtons } from '../tracking/LunchButtons';
import type { DayRecord, TimeEntry, SpecialDayType } from '../../types';
import { formatMonth, getDayName, formatDayNumber } from '../../utils/dateUtils';
import { generateEntryId, formatMinutes, calculateEntriesTotal } from '../../utils/timeCalculations';
import { isCzechHoliday, getCzechHoliday } from '../../utils/czechHolidays';
import { MAX_ENTRIES_PER_DAY, SPECIAL_DAY_MINUTES } from '../../constants';

interface EditDayModalProps {
  date: string;
  onClose: () => void;
}

export function EditDayModal({ date, onClose }: EditDayModalProps) {
  const { state, updateDay, setSpecialDay } = useAttendance();

  // Get existing record or create empty one
  const existingRecord = state.data[date];
  const isPublicHoliday = isCzechHoliday(date);
  const holidayInfo = getCzechHoliday(date);

  // Local state for editing
  const [entries, setEntries] = useState<TimeEntry[]>(
    existingRecord?.entries ?? []
  );
  const [specialDayType, setSpecialDayType] = useState<SpecialDayType>(
    existingRecord?.specialDay ?? null
  );

  // Sync local state when date changes
  useEffect(() => {
    const record = state.data[date];
    setEntries(record?.entries ?? []);
    setSpecialDayType(record?.specialDay ?? null);
  }, [date, state.data]);

  // Calculate total for display
  // Public holidays: 6h base + logged entries
  // Sick/vacation: flat 6h
  // Regular: just logged entries
  const entriesMinutes = calculateEntriesTotal(entries);
  let totalMinutes = 0;
  if (isPublicHoliday) {
    totalMinutes = SPECIAL_DAY_MINUTES + entriesMinutes;
  } else if (specialDayType) {
    totalMinutes = SPECIAL_DAY_MINUTES;
  } else {
    totalMinutes = entriesMinutes;
  }

  // Handle entry changes
  const handleEntryStartChange = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], start: value };
    setEntries(newEntries);
  };

  const handleEntryEndChange = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], end: value || null };
    setEntries(newEntries);
  };

  const handleDeleteEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const handleAddEntry = () => {
    if (entries.length >= MAX_ENTRIES_PER_DAY) return;

    // Create a new entry with default times: 8:30 AM - 3:00 PM (15:00)
    const newEntry: TimeEntry = {
      id: generateEntryId(),
      start: new Date(date + 'T08:30:00').toISOString(),
      end: new Date(date + 'T15:00:00').toISOString(),
    };

    setEntries([...entries, newEntry]);
  };

  const handleSpecialDayChange = (type: SpecialDayType) => {
    setSpecialDayType(type);
    if (type) {
      setEntries([]);
    }
  };

  const handleSave = () => {
    if (specialDayType) {
      setSpecialDay(date, specialDayType);
    } else {
      const record: DayRecord = {
        date,
        entries,
        specialDay: null,
      };
      updateDay(record);
    }
    onClose();
  };

  const handleClear = () => {
    setEntries([]);
    setSpecialDayType(null);
  };

  // Parse date for display
  const dateObj = new Date(date + 'T00:00:00');
  const monthStr = formatMonth(`${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Edit Day
              </h2>
              <p className="text-sm text-gray-500">
                {getDayName(date)}, {formatDayNumber(date)} {monthStr}
              </p>
              {isPublicHoliday && holidayInfo && (
                <p className="text-sm text-blue-600 font-medium mt-1">
                  {holidayInfo.name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Public holiday info banner */}
          {isPublicHoliday && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Public holiday: 6h base + any extra work you log below.
              </p>
            </div>
          )}

          {/* Special day selector (not shown for public holidays) */}
          {!isPublicHoliday && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-600 block mb-2">
                Day Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSpecialDayChange(null)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${!specialDayType
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Regular
                </button>
                <button
                  onClick={() => handleSpecialDayChange('sick')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${specialDayType === 'sick'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Sick Day
                </button>
                <button
                  onClick={() => handleSpecialDayChange('vacation')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${specialDayType === 'vacation'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Vacation
                </button>
              </div>
            </div>
          )}

          {/* Time entries (shown for public holidays and regular days) */}
          {(isPublicHoliday || !specialDayType) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600">
                  {isPublicHoliday ? 'Extra Work' : 'Time Entries'}
                </label>
                <span className="text-sm text-gray-400">
                  {entries.length}/{MAX_ENTRIES_PER_DAY}
                </span>
              </div>

              {entries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {isPublicHoliday ? 'No extra work logged.' : 'No time entries for this day.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <TimeRangeInput
                      key={entry.id}
                      entry={entry}
                      onStartChange={(v) => handleEntryStartChange(index, v)}
                      onEndChange={(v) => handleEntryEndChange(index, v)}
                      onDelete={() => handleDeleteEntry(index)}
                    />
                  ))}
                </div>
              )}

              {/* Add entry button */}
              {entries.length < MAX_ENTRIES_PER_DAY && (
                <button
                  onClick={handleAddEntry}
                  className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
                >
                  + Add Entry
                </button>
              )}

              {/* Lunch break buttons */}
              {entries.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Insert Lunch Break
                  </label>
                  <LunchButtons targetDate={date} />
                </div>
              )}
            </div>
          )}

          {/* Special day info (sick/vacation) */}
          {!isPublicHoliday && specialDayType && (
            <div className="text-center py-4">
              <p className="text-gray-600">
                {specialDayType === 'sick' ? 'Sick day' : 'Vacation'} - 6 hours will be logged automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500">Total: </span>
              <span className="font-semibold text-gray-800">
                {formatMinutes(totalMinutes)}
              </span>
              {isPublicHoliday && entriesMinutes > 0 && (
                <span className="text-gray-400 ml-1">
                  (6h + {formatMinutes(entriesMinutes)})
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
