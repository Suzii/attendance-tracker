import type { DayStats, DayRecord } from '../../types';
import { TimeSpanVisual } from './TimeSpanVisual';
import { getDayName, formatDayNumber } from '../../utils/dateUtils';
import { formatMinutes } from '../../utils/timeCalculations';
import { DAY_COLORS } from '../../constants';

interface DayRowProps {
  dayStats: DayStats;
  record: DayRecord | undefined;
  onEdit: () => void;
}

export function DayRow({ dayStats, record, onEdit }: DayRowProps) {
  const { date, totalMinutes, isWeekend, specialDay, isPublicHoliday, holidayName } = dayStats;

  // Determine row styling
  let rowClass = '';
  let textClass = DAY_COLORS.weekday;

  if (isPublicHoliday) {
    rowClass = DAY_COLORS.publicHoliday;
    textClass = 'text-blue-700';
  } else if (specialDay === 'sick') {
    rowClass = DAY_COLORS.sick;
    textClass = 'text-orange-700';
  } else if (specialDay === 'vacation') {
    rowClass = DAY_COLORS.vacation;
    textClass = 'text-teal-700';
  } else if (isWeekend) {
    rowClass = DAY_COLORS.weekend;
    textClass = 'text-gray-400';
  }

  // Get special day label
  const getSpecialDayLabel = () => {
    if (isPublicHoliday && holidayName) return holidayName;
    if (specialDay === 'sick') return 'Sick Day';
    if (specialDay === 'vacation') return 'Vacation';
    return null;
  };

  const specialDayLabel = getSpecialDayLabel();

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        ${rowClass}
        hover:bg-opacity-80 transition-colors
      `}
    >
      {/* Day name and number */}
      <div className={`flex items-center gap-2 w-16 shrink-0 ${textClass}`}>
        <span className="font-medium">{getDayName(date)}</span>
        <span>{formatDayNumber(date)}</span>
      </div>

      {/* Time visualization or special day label */}
      {specialDayLabel ? (
        <div className={`flex-1 text-sm font-medium ${textClass}`}>
          {specialDayLabel}
        </div>
      ) : (
        <TimeSpanVisual entries={record?.entries ?? []} />
      )}

      {/* Total time */}
      <div className={`w-20 text-right font-mono text-sm shrink-0 ${textClass}`}>
        {totalMinutes > 0 ? formatMinutes(totalMinutes) : '-'}
      </div>

      {/* Edit button */}
      <button
        onClick={onEdit}
        disabled={isPublicHoliday}
        className={`
          px-2 py-1 text-sm rounded
          ${isPublicHoliday
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }
          transition-colors
        `}
        aria-label={`Edit ${date}`}
      >
        Edit
      </button>
    </div>
  );
}
