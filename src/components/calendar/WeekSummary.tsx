import { WeekSummary as WeekSummaryType } from '../../types';
import { formatMinutes } from '../../utils/timeCalculations';
import { STATUS_COLORS } from '../../constants';

interface WeekSummaryProps {
  summary: WeekSummaryType;
}

export function WeekSummary({ summary }: WeekSummaryProps) {
  const colors = STATUS_COLORS[summary.status];

  return (
    <div
      className={`
        flex items-center justify-between px-3 py-2 rounded-lg
        ${colors.bg} ${colors.border} border
      `}
    >
      <span className="text-sm font-medium text-gray-600">
        Week {summary.weekNumber}
      </span>
      <span className={`text-lg font-semibold ${colors.text}`}>
        {formatMinutes(summary.totalMinutes)}
      </span>
    </div>
  );
}
