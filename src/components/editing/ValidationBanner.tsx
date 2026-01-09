import { useAttendance } from '../../hooks/useAttendance';
import { hasBlockingErrors, formatValidationError } from '../../utils/validation';

interface ValidationBannerProps {
  onEditDay: (date: string) => void;
}

export function ValidationBanner({ onEditDay }: ValidationBannerProps) {
  const { validationErrors } = useAttendance();

  if (validationErrors.length === 0) {
    return null;
  }

  const hasBlocking = hasBlockingErrors(validationErrors);
  const unclosedErrors = validationErrors.filter(e => e.type === 'unclosed_entry');

  return (
    <div
      className={`
        rounded-lg p-4 mb-4
        ${hasBlocking ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 ${hasBlocking ? 'text-red-500' : 'text-yellow-500'}`}>
          <svg
            className="w-5 h-5 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className={`font-medium ${hasBlocking ? 'text-red-800' : 'text-yellow-800'}`}>
            {hasBlocking
              ? 'Action Required: Unclosed Time Entries'
              : 'Warning: Data Issues Detected'
            }
          </h3>
          <p className={`text-sm mt-1 ${hasBlocking ? 'text-red-600' : 'text-yellow-600'}`}>
            {hasBlocking
              ? 'You have unclosed time entries from previous days. Please fix them before starting new tracking.'
              : 'Some entries have issues that should be reviewed.'
            }
          </p>

          {/* List of errors */}
          <ul className="mt-3 space-y-2">
            {unclosedErrors.map((error, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className={`text-sm ${hasBlocking ? 'text-red-600' : 'text-yellow-600'}`}>
                  {formatValidationError(error)}
                </span>
                <button
                  onClick={() => onEditDay(error.date)}
                  className={`
                    text-sm font-medium px-3 py-1 rounded
                    ${hasBlocking
                      ? 'text-red-700 hover:bg-red-100'
                      : 'text-yellow-700 hover:bg-yellow-100'
                    }
                    transition-colors
                  `}
                >
                  Fix
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
