import { useAttendance } from '../../hooks/useAttendance';
import { useFormattedTimer } from '../../hooks/useTimer';
import { getTodayDateString } from '../../utils/dateUtils';

export function CurrentSession() {
  const { state } = useAttendance();
  const { isTracking, currentEntryId, data } = state;

  // Find the current entry's start time
  const today = getTodayDateString();
  const todayRecord = data[today];
  const currentEntry = todayRecord?.entries.find(e => e.id === currentEntryId);
  const startTime = currentEntry?.start ?? null;

  const elapsedTime = useFormattedTimer(startTime, isTracking);

  if (!isTracking) {
    return null;
  }

  return (
    <div className="text-center mt-4">
      <div className="text-sm text-gray-500 uppercase tracking-wide">
        Current session
      </div>
      <div className="text-3xl font-mono font-semibold text-gray-800 animate-pulse">
        {elapsedTime}
      </div>
    </div>
  );
}
