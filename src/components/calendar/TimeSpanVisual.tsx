import type { TimeEntry } from '../../types';
import { getTimePosition, getSpanWidth } from '../../utils/timeCalculations';

interface TimeSpanVisualProps {
  entries: TimeEntry[];
}

export function TimeSpanVisual({ entries }: TimeSpanVisualProps) {
  if (entries.length === 0) {
    return (
      <div className="relative h-4 bg-gray-100 rounded flex-1 min-w-0" />
    );
  }

  return (
    <div className="relative h-4 bg-gray-100 rounded flex-1 min-w-0 overflow-hidden">
      {entries.map(entry => {
        const left = getTimePosition(entry.start);
        const width = getSpanWidth(entry.start, entry.end);
        const isOngoing = entry.end === null;

        return (
          <div
            key={entry.id}
            className={`
              absolute h-full rounded
              ${isOngoing ? 'bg-blue-400 animate-pulse' : 'bg-blue-500'}
            `}
            style={{
              left: `${left}%`,
              width: `${Math.max(width, 0.5)}%`,
            }}
            title={formatEntryTooltip(entry)}
          />
        );
      })}

      {/* Hour markers (every 6 hours) */}
      {[6, 12, 18].map(hour => (
        <div
          key={hour}
          className="absolute h-full w-px bg-gray-200"
          style={{ left: `${(hour / 24) * 100}%` }}
        />
      ))}
    </div>
  );
}

function formatEntryTooltip(entry: TimeEntry): string {
  const start = new Date(entry.start);
  const startStr = start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (!entry.end) {
    return `${startStr} - ongoing`;
  }

  const end = new Date(entry.end);
  const endStr = end.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return `${startStr} - ${endStr} (${hours}h ${minutes}m)`;
}
