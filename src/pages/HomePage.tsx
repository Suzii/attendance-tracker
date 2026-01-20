import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAttendance } from '../hooks/useAttendance';
import { StartStopButton, CurrentSession, LunchButtons } from '../components/tracking';
import { CalendarView } from '../components/calendar';
import { EditDayModal, ValidationBanner } from '../components/editing';
import { SettingsModal } from '../components/settings';
import { isValidYearMonth, parseYearMonth } from '../utils/dateUtils';

export function HomePage() {
  const { year, month } = useParams<{ year?: string; month?: string }>();
  const navigate = useNavigate();
  const { state, setMonth } = useAttendance();

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Sync URL params to state on initial load
  useEffect(() => {
    if (year && month) {
      const yearMonth = `${year}-${month.padStart(2, '0')}`;
      if (isValidYearMonth(yearMonth)) {
        if (state.selectedMonth !== yearMonth) {
          setMonth(yearMonth);
        }
      } else {
        // Invalid URL, redirect to current month
        navigate('/', { replace: true });
      }
    }
  }, [year, month]);

  // Update URL when month changes (but avoid infinite loops)
  useEffect(() => {
    const { year: stateYear, month: stateMonth } = parseYearMonth(state.selectedMonth);
    const expectedPath = `/${stateYear}/${String(stateMonth).padStart(2, '0')}`;

    // Only navigate if we're not at the root and the URL doesn't match
    const currentPath = year && month ? `/${year}/${month.padStart(2, '0')}` : null;
    if (currentPath !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [state.selectedMonth]);

  const handleEditDay = (date: string) => {
    setEditingDate(date);
  };

  const handleCloseModal = () => {
    setEditingDate(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="w-10" /> {/* Spacer for centering */}
          <h1 className="text-2xl font-bold text-gray-800">
            Attendance Tracker
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Settings"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </header>

        {/* Tracking Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center gap-4">
            <StartStopButton />
            <CurrentSession />
            <LunchButtons />
          </div>
        </div>

        {/* Validation Banner */}
        <ValidationBanner onEditDay={handleEditDay} />

        {/* Calendar Section */}
        <CalendarView onEditDay={handleEditDay} />

        {/* Edit Modal */}
        {editingDate && (
          <EditDayModal date={editingDate} onClose={handleCloseModal} />
        )}

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </div>
    </div>
  );
}
