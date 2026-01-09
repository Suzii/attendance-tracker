import { useAttendance } from '../../hooks/useAttendance';
import { DayRow } from './DayRow';
import { WeekSummary } from './WeekSummary';
import { MonthSelector } from './MonthSelector';
import { formatMinutes } from '../../utils/timeCalculations';

interface CalendarViewProps {
  onEditDay: (date: string) => void;
}

export function CalendarView({ onEditDay }: CalendarViewProps) {
  const {
    state,
    weekSummaries,
    monthlyTotalMinutes,
    monthlyExpectedMinutes,
    workdaysInMonth,
  } = useAttendance();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Month selector */}
      <div className="px-4 py-4 border-b border-gray-100">
        <MonthSelector />
      </div>

      {/* Calendar content */}
      <div className="divide-y divide-gray-100">
        {weekSummaries.map((week) => (
          <div key={week.weekNumber} className="p-4">
            {/* Week header with summary */}
            <div className="mb-3">
              <WeekSummary summary={week} />
            </div>

            {/* Days in this week */}
            <div className="space-y-1">
              {week.days.map(dayStats => (
                <DayRow
                  key={dayStats.date}
                  dayStats={dayStats}
                  record={state.data[dayStats.date]}
                  onEdit={() => onEditDay(dayStats.date)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly summary */}
      <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            Monthly Total
          </span>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-800">
              {formatMinutes(monthlyTotalMinutes)}
            </span>
            <span className="text-gray-500 mx-2">/</span>
            <span className="text-gray-600">
              {formatMinutes(monthlyExpectedMinutes)} expected
            </span>
            <span className="text-sm text-gray-400 ml-2">
              ({workdaysInMonth} workdays)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              monthlyTotalMinutes >= monthlyExpectedMinutes
                ? 'bg-green-500'
                : monthlyTotalMinutes >= monthlyExpectedMinutes * 0.9
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{
              width: `${Math.min(
                (monthlyTotalMinutes / monthlyExpectedMinutes) * 100,
                100
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
