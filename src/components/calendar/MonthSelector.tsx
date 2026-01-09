import { useAttendance } from '../../hooks/useAttendance';
import {
  formatMonth,
  getPreviousMonth,
  getNextMonth,
  getCurrentMonthString,
} from '../../utils/dateUtils';

export function MonthSelector() {
  const { state, setMonth } = useAttendance();
  const { selectedMonth } = state;

  const handlePrevious = () => {
    setMonth(getPreviousMonth(selectedMonth));
  };

  const handleNext = () => {
    setMonth(getNextMonth(selectedMonth));
  };

  const handleToday = () => {
    setMonth(getCurrentMonthString());
  };

  const isCurrentMonth = selectedMonth === getCurrentMonthString();

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        onClick={handlePrevious}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
        aria-label="Previous month"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-800 min-w-[180px] text-center">
          {formatMonth(selectedMonth)}
        </h2>
        {!isCurrentMonth && (
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
        aria-label="Next month"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
