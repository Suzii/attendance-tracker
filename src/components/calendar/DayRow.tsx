import type { DayStats, DayRecord } from '../../types';
import { TimeSpanVisual } from './TimeSpanVisual';
import { getDayName, formatDayNumber } from '../../utils/dateUtils';
import { formatMinutes, isHalfDay } from '../../utils/timeCalculations';
import { DAY_COLORS } from '../../constants';

interface DayRowProps {
  dayStats: DayStats;
  record: DayRecord | undefined;
  onEdit: () => void;
}

export function DayRow({ dayStats, record, onEdit }: DayRowProps) {
  const { date, totalMinutes, isWeekend, specialDay, isPublicHoliday, holidayName } = dayStats;

  // Check if it's a sick, vacation, or pn_ocr type (full or half)
  const isSickType = specialDay?.startsWith('sick') ?? false;
  const isVacationType = specialDay?.startsWith('vacation') ?? false;
  const isPnOcrType = specialDay?.startsWith('pn_ocr') ?? false;

  // Determine row styling
  let rowClass = '';
  let textClass: string = DAY_COLORS.weekday;

  if (isPublicHoliday) {
    rowClass = DAY_COLORS.publicHoliday;
    textClass = 'text-blue-700';
  } else if (isSickType) {
    rowClass = DAY_COLORS.sick;
    textClass = 'text-orange-700';
  } else if (isVacationType) {
    rowClass = DAY_COLORS.vacation;
    textClass = 'text-teal-700';
  } else if (isPnOcrType) {
    rowClass = DAY_COLORS.pnOcr;
    textClass = 'text-pink-700';
  } else if (isWeekend) {
    rowClass = DAY_COLORS.weekend;
    textClass = 'text-gray-400';
  }

  // Get special day label
  const getSpecialDayLabel = () => {
    if (isPublicHoliday && holidayName) return holidayName;
    if (specialDay === 'sick') return 'Sick Day';
    if (specialDay === 'sick_first_half') return 'Sick Day (AM)';
    if (specialDay === 'sick_second_half') return 'Sick Day (PM)';
    if (specialDay === 'vacation') return 'Vacation';
    if (specialDay === 'vacation_first_half') return 'Vacation (AM)';
    if (specialDay === 'vacation_second_half') return 'Vacation (PM)';
    if (specialDay === 'pn_ocr') return 'PN/OČR';
    if (specialDay === 'pn_ocr_first_half') return 'PN/OČR (AM)';
    if (specialDay === 'pn_ocr_second_half') return 'PN/OČR (PM)';
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
      {specialDayLabel && !record?.entries?.length && !isPublicHoliday && !isHalfDay(specialDay) ? (
        // Full-day special (sick/vacation) with no entries - just show label
        <div className={`flex-1 text-sm font-medium ${textClass}`}>
          {specialDayLabel}
        </div>
      ) : (
        // Public holiday, half-day, or regular day with entries - show label + time spans
        <div className="flex-1 flex items-center gap-2">
          {(isPublicHoliday || isHalfDay(specialDay)) && specialDayLabel && (
            <span className={`text-xs font-medium ${textClass} shrink-0`}>
              {specialDayLabel}
            </span>
          )}
          <TimeSpanVisual entries={record?.entries ?? []} />
        </div>
      )}

      {/* Total time */}
      <div className={`w-20 text-right font-mono text-sm shrink-0 ${textClass}`}>
        {totalMinutes > 0 ? formatMinutes(totalMinutes) : '-'}
      </div>

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="px-2 py-1 text-sm rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={`Edit ${date}`}
      >
        Edit
      </button>
    </div>
  );
}
