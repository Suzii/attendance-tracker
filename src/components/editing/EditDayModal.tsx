import { useState, useEffect } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { TimeRangeInput } from './TimestampInput';
import type { DayRecord, TimeEntry, SpecialDayType } from '../../types';
import { formatMonth, getDayName, formatDayNumber } from '../../utils/dateUtils';
import { generateEntryId, formatMinutes, calculateEntriesTotal, splitEntryForLunch, isHalfDay, getSpecialDayMinutes } from '../../utils/timeCalculations';
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

  // Helper to parse existing special day into base type and portion
  const parseSpecialDay = (specialDay: SpecialDayType): { baseType: 'sick' | 'vacation' | null; portion: 'full' | 'first_half' | 'second_half' } => {
    if (!specialDay || specialDay === 'public_holiday') return { baseType: null, portion: 'full' };
    if (specialDay === 'sick') return { baseType: 'sick', portion: 'full' };
    if (specialDay === 'vacation') return { baseType: 'vacation', portion: 'full' };
    if (specialDay === 'sick_first_half') return { baseType: 'sick', portion: 'first_half' };
    if (specialDay === 'sick_second_half') return { baseType: 'sick', portion: 'second_half' };
    if (specialDay === 'vacation_first_half') return { baseType: 'vacation', portion: 'first_half' };
    if (specialDay === 'vacation_second_half') return { baseType: 'vacation', portion: 'second_half' };
    return { baseType: null, portion: 'full' };
  };

  // Helper to combine base type and portion into SpecialDayType
  const combineSpecialDay = (baseType: 'sick' | 'vacation' | null, portion: 'full' | 'first_half' | 'second_half'): SpecialDayType => {
    if (!baseType) return null;
    if (portion === 'full') return baseType;
    return `${baseType}_${portion}` as SpecialDayType;
  };

  const initialParsed = parseSpecialDay(existingRecord?.specialDay ?? null);

  // Local state for editing
  const [entries, setEntries] = useState<TimeEntry[]>(
    existingRecord?.entries ?? []
  );
  const [baseType, setBaseType] = useState<'sick' | 'vacation' | null>(initialParsed.baseType);
  const [portion, setPortion] = useState<'full' | 'first_half' | 'second_half'>(initialParsed.portion);

  // Derive the combined special day type
  const specialDayType = combineSpecialDay(baseType, portion);

  // Sync local state when date changes
  useEffect(() => {
    const record = state.data[date];
    setEntries(record?.entries ?? []);
    const parsed = parseSpecialDay(record?.specialDay ?? null);
    setBaseType(parsed.baseType);
    setPortion(parsed.portion);
  }, [date, state.data]);

  // Calculate total for display
  // Public holidays: 6h base + logged entries
  // Full sick/vacation: flat 6h
  // Half sick/vacation: 3h + logged entries
  // Regular: just logged entries
  const entriesMinutes = calculateEntriesTotal(entries);
  const isHalfDayType = isHalfDay(specialDayType);
  let totalMinutes = 0;
  if (isPublicHoliday) {
    totalMinutes = SPECIAL_DAY_MINUTES + entriesMinutes;
  } else if (specialDayType) {
    const specialMinutes = getSpecialDayMinutes(specialDayType);
    totalMinutes = isHalfDayType ? specialMinutes + entriesMinutes : specialMinutes;
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

  const handleBaseTypeChange = (type: 'sick' | 'vacation' | null) => {
    setBaseType(type);
    // Don't clear entries yet - let user pick portion first
    // Entries are only cleared when "Full Day" is explicitly selected
    if (!type) {
      setPortion('full');
    }
  };

  const handlePortionChange = (newPortion: 'full' | 'first_half' | 'second_half') => {
    setPortion(newPortion);
    // Full days clear entries, half days preserve them
    if (newPortion === 'full') {
      setEntries([]);
    }
  };

  const handleSave = () => {
    if (specialDayType && !isHalfDayType) {
      // Full-day sick/vacation - use setSpecialDay which clears entries
      setSpecialDay(date, specialDayType);
    } else {
      // Regular day or half-day - save entries along with specialDay
      const record: DayRecord = {
        date,
        entries,
        specialDay: specialDayType,
      };
      updateDay(record);
    }
    onClose();
  };

  const handleClear = () => {
    setEntries([]);
    setBaseType(null);
    setPortion('full');
  };

  // Local lunch break handling (works on unsaved entries)
  const canInsertLunch = (entry: TimeEntry, durationMinutes: number): boolean => {
    if (!entry.end) return false;
    const start = new Date(entry.start);
    const end = new Date(entry.end);
    const totalMinutes = (end.getTime() - start.getTime()) / 60000;
    return totalMinutes >= durationMinutes + 60;
  };

  const handleLocalLunchBreak = (entryIndex: number, durationMinutes: number) => {
    const entry = entries[entryIndex];
    if (!entry) return;

    const splitResult = splitEntryForLunch(entry, durationMinutes);
    if (!splitResult) return;

    const [firstEntry, secondEntry] = splitResult;
    // Replace the original entry with the two split entries
    const newEntries = [
      ...entries.slice(0, entryIndex),
      firstEntry,
      secondEntry,
      ...entries.slice(entryIndex + 1),
    ];
    setEntries(newEntries);
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
                  onClick={() => handleBaseTypeChange(null)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${!baseType
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Regular
                </button>
                <button
                  onClick={() => handleBaseTypeChange('sick')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${baseType === 'sick'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Sick Day
                </button>
                <button
                  onClick={() => handleBaseTypeChange('vacation')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${baseType === 'vacation'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  Vacation
                </button>
              </div>

              {/* Portion selector (shown when sick or vacation is selected) */}
              {baseType && (
                <div className="mt-3">
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Duration
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePortionChange('full')}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${portion === 'full'
                          ? baseType === 'sick' ? 'bg-orange-500 text-white' : 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      Full Day
                    </button>
                    <button
                      onClick={() => handlePortionChange('first_half')}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${portion === 'first_half'
                          ? baseType === 'sick' ? 'bg-orange-500 text-white' : 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      First Half
                    </button>
                    <button
                      onClick={() => handlePortionChange('second_half')}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${portion === 'second_half'
                          ? baseType === 'sick' ? 'bg-orange-500 text-white' : 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      Second Half
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Time entries (shown for public holidays, regular days, half-days, or when entries exist) */}
          {(isPublicHoliday || !specialDayType || isHalfDayType || entries.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600">
                  {isPublicHoliday ? 'Extra Work' : isHalfDayType ? 'Work Time' : 'Time Entries'}
                </label>
                <span className="text-sm text-gray-400">
                  {entries.length}/{MAX_ENTRIES_PER_DAY}
                </span>
              </div>

              {entries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {isPublicHoliday ? 'No extra work logged.' : isHalfDayType ? 'No work logged for the other half.' : 'No time entries for this day.'}
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
                      onLunchBreak={(duration) => handleLocalLunchBreak(index, duration)}
                      canInsertLunch={(duration) => canInsertLunch(entry, duration)}
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

            </div>
          )}

          {/* Special day info (sick/vacation - full day only) */}
          {!isPublicHoliday && specialDayType && !isHalfDayType && entries.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-600">
                {baseType === 'sick' ? 'Sick day' : 'Vacation'} - 6 hours will be logged automatically.
              </p>
            </div>
          )}

          {/* Warning when full-day selected but entries exist */}
          {!isPublicHoliday && specialDayType && !isHalfDayType && entries.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                Full {baseType === 'sick' ? 'sick day' : 'vacation'} selected - entries below will be cleared on save. Select "First Half" or "Second Half" to keep them.
              </p>
            </div>
          )}

          {/* Half-day info */}
          {!isPublicHoliday && specialDayType && isHalfDayType && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                {baseType === 'sick' ? 'Sick day' : 'Vacation'} ({portion === 'first_half' ? 'first half' : 'second half'}) - 3 hours will be logged. You can track work for the other half below.
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
              {isHalfDayType && entriesMinutes > 0 && (
                <span className="text-gray-400 ml-1">
                  (3h + {formatMinutes(entriesMinutes)})
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
