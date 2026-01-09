import { useAttendance } from '../../hooks/useAttendance';
import { getTodayDateString } from '../../utils/dateUtils';
import { LUNCH_DURATION_SHORT, LUNCH_DURATION_LONG } from '../../constants';

interface LunchButtonsProps {
  /** If provided, targets a specific date instead of today */
  targetDate?: string;
  /** If provided, targets a specific entry by ID */
  targetEntryId?: string;
}

export function LunchButtons({ targetDate, targetEntryId }: LunchButtonsProps) {
  const { state, addLunchBreak } = useAttendance();
  const { data, isTracking } = state;

  const date = targetDate ?? getTodayDateString();
  const dayRecord = data[date];

  // Find the entry to split
  // If targetEntryId is provided, use that
  // Otherwise, use the most recent closed entry
  let entryToSplit = targetEntryId
    ? dayRecord?.entries.find(e => e.id === targetEntryId)
    : null;

  if (!entryToSplit && dayRecord) {
    // Find the most recent closed entry
    const closedEntries = dayRecord.entries.filter(e => e.end !== null);
    if (closedEntries.length > 0) {
      entryToSplit = closedEntries[closedEntries.length - 1];
    }
  }

  // Check if the entry is long enough to split
  const canSplit = (durationMinutes: number) => {
    if (!entryToSplit || !entryToSplit.end) return false;

    const start = new Date(entryToSplit.start);
    const end = new Date(entryToSplit.end);
    const totalMinutes = (end.getTime() - start.getTime()) / 60000;

    // Need at least lunch duration + 60 minutes (30 on each side)
    return totalMinutes >= durationMinutes + 60;
  };

  const handleLunchBreak = (durationMinutes: number) => {
    if (!entryToSplit) return;
    addLunchBreak(date, entryToSplit.id, durationMinutes);
  };

  // Don't show if currently tracking (can't split ongoing entry)
  // or if no closed entries exist
  const hasClosedEntries = dayRecord?.entries.some(e => e.end !== null);

  if (isTracking && !targetDate) {
    return null;
  }

  if (!hasClosedEntries && !targetEntryId) {
    return null;
  }

  return (
    <div className="flex gap-2 justify-center">
      <button
        onClick={() => handleLunchBreak(LUNCH_DURATION_SHORT)}
        disabled={!canSplit(LUNCH_DURATION_SHORT)}
        className={`
          px-4 py-2 text-sm font-medium rounded-lg
          transition-colors duration-150
          ${canSplit(LUNCH_DURATION_SHORT)
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }
        `}
        title="Insert 30-minute lunch break"
      >
        Lunch 0.5h
      </button>
      <button
        onClick={() => handleLunchBreak(LUNCH_DURATION_LONG)}
        disabled={!canSplit(LUNCH_DURATION_LONG)}
        className={`
          px-4 py-2 text-sm font-medium rounded-lg
          transition-colors duration-150
          ${canSplit(LUNCH_DURATION_LONG)
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }
        `}
        title="Insert 1-hour lunch break"
      >
        Lunch 1h
      </button>
    </div>
  );
}
