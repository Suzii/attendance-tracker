interface TimestampInputProps {
  label: string;
  value: string; // ISO timestamp or empty
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimestampInput({ label, value, onChange, disabled }: TimestampInputProps) {
  // Convert ISO timestamp to time input value (HH:MM)
  const getTimeValue = (): string => {
    if (!value) return '';
    const date = new Date(value);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Convert time input value to ISO timestamp
  const handleTimeChange = (timeValue: string) => {
    if (!timeValue) {
      onChange('');
      return;
    }

    // Get the date part from the current value or use today
    let baseDate: Date;
    if (value) {
      baseDate = new Date(value);
    } else {
      baseDate = new Date();
    }

    const [hours, minutes] = timeValue.split(':').map(Number);
    baseDate.setHours(hours, minutes, 0, 0);

    onChange(baseDate.toISOString());
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type="time"
        value={getTimeValue()}
        onChange={(e) => handleTimeChange(e.target.value)}
        disabled={disabled}
        step="300"
        className={`
          px-3 py-2 border rounded-lg text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-800'
          }
        `}
      />
    </div>
  );
}

interface TimeRangeInputProps {
  entry: { id: string; start: string; end: string | null };
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onDelete: () => void;
  disabled?: boolean;
  /** Optional: show lunch break buttons */
  onLunchBreak?: (durationMinutes: number) => void;
  canInsertLunch?: (durationMinutes: number) => boolean;
}

export function TimeRangeInput({
  entry,
  onStartChange,
  onEndChange,
  onDelete,
  disabled,
  onLunchBreak,
  canInsertLunch,
}: TimeRangeInputProps) {
  const showLunchButtons = onLunchBreak && canInsertLunch && entry.end;
  const canShort = showLunchButtons && canInsertLunch(30);
  const canLong = showLunchButtons && canInsertLunch(60);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <TimestampInput
        label="Start"
        value={entry.start}
        onChange={onStartChange}
        disabled={disabled}
      />
      <TimestampInput
        label="End"
        value={entry.end ?? ''}
        onChange={onEndChange}
        disabled={disabled}
      />

      <button
        onClick={onDelete}
        disabled={disabled}
        className={`
          p-2 rounded-lg self-end
          ${disabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-red-500 hover:bg-red-50 hover:text-red-600'
          }
          transition-colors
        `}
        title="Delete entry"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {/* Lunch break buttons - after delete, aligned to bottom like delete button */}
      {showLunchButtons && (canShort || canLong) && (
        <div className="flex items-center gap-1 self-end pb-1">
          <button
            onClick={() => onLunchBreak!(30)}
            disabled={!canShort}
            className={`
              px-2 py-1.5 text-xs font-medium rounded
              transition-colors
              ${canShort
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }
            `}
            title="Insert 30-minute lunch break"
          >
            -0.5h
          </button>
          <button
            onClick={() => onLunchBreak!(60)}
            disabled={!canLong}
            className={`
              px-2 py-1.5 text-xs font-medium rounded
              transition-colors
              ${canLong
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }
            `}
            title="Insert 1-hour lunch break"
          >
            -1h
          </button>
        </div>
      )}
    </div>
  );
}
