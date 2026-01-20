import { useAttendance } from '../../hooks/useAttendance';
import { hasBlockingErrors } from '../../utils/validation';
import { getTodayDateString } from '../../utils/dateUtils';
import { isHalfDay } from '../../utils/timeCalculations';
import { MAX_ENTRIES_PER_DAY } from '../../constants';

export function StartStopButton() {
  const { state, startTracking, stopTracking, validationErrors } = useAttendance();
  const { isTracking, data } = state;

  const today = getTodayDateString();
  const todayRecord = data[today];

  // Check all conditions that prevent starting
  const hasErrors = hasBlockingErrors(validationErrors);
  // Full-day special days block tracking, half-days allow it
  const specialDay = todayRecord?.specialDay;
  const isFullDaySpecial = specialDay !== null && specialDay !== undefined && !isHalfDay(specialDay);
  const maxEntriesReached = (todayRecord?.entries.length ?? 0) >= MAX_ENTRIES_PER_DAY;

  // Determine if disabled and why (public holidays are now allowed, half-days allow tracking)
  const cannotStart = !isTracking && (hasErrors || isFullDaySpecial || maxEntriesReached);
  const isDisabled = cannotStart;

  // Get reason for being disabled
  const getDisabledReason = (): string | null => {
    if (isTracking) return null;
    if (hasErrors) return 'Fix unclosed entries first';
    if (isFullDaySpecial) return specialDay === 'sick' ? 'Sick day' : 'Vacation';
    if (maxEntriesReached) return 'Max entries reached';
    return null;
  };

  const disabledReason = getDisabledReason();

  const handleClick = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          w-32 h-32 rounded-full text-2xl font-bold
          transition-colors duration-150 shadow-lg
          focus:outline-none focus:ring-4
          ${isTracking
            ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-200'
            : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-200'
          }
          ${isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer active:scale-95'
          }
        `}
        aria-label={isTracking ? 'Stop time tracking' : 'Start time tracking'}
      >
        {isTracking ? 'STOP' : 'START'}
      </button>
      {disabledReason && (
        <span className="text-sm text-gray-500">{disabledReason}</span>
      )}
    </div>
  );
}
