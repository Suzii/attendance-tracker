import { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useAttendance } from '../../hooks/useAttendance';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, getWorkHoursForMonth, setDefaultWorkHours, setWorkHoursForMonth } = useSettings();
  const { state } = useAttendance();

  const currentMonth = state.selectedMonth;
  const currentMonthHours = getWorkHoursForMonth(currentMonth);

  const [defaultHours, setDefaultHours] = useState(settings.dailyWorkHours);
  const [monthHours, setMonthHours] = useState(currentMonthHours);

  const handleSave = () => {
    setDefaultWorkHours(defaultHours);
    setWorkHoursForMonth(currentMonth, monthHours);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Default hours */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Default Daily Work Hours
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Used for new months that don't have a specific setting yet.
            </p>
            <input
              type="number"
              min="1"
              max="12"
              step="0.5"
              value={defaultHours}
              onChange={(e) => setDefaultHours(parseFloat(e.target.value) || 6)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Current month hours */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Hours for {currentMonth}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              This setting is baked into this month's data and won't change if you update the default later.
            </p>
            <input
              type="number"
              min="1"
              max="12"
              step="0.5"
              value={monthHours}
              onChange={(e) => setMonthHours(parseFloat(e.target.value) || 6)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
