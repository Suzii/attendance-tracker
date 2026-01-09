import { useAttendance } from '../../hooks/useAttendance';
import { hasBlockingErrors } from '../../utils/validation';

export function StartStopButton() {
  const { state, startTracking, stopTracking, validationErrors } = useAttendance();
  const { isTracking } = state;

  // Disable if there are unclosed entries on previous days
  const hasErrors = hasBlockingErrors(validationErrors);
  const isDisabled = hasErrors && !isTracking;

  const handleClick = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        w-32 h-32 rounded-full text-2xl font-bold
        transition-all duration-200 shadow-lg
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
  );
}
