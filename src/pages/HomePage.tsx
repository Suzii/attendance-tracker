import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAttendance } from '../hooks/useAttendance';
import { StartStopButton, CurrentSession, LunchButtons } from '../components/tracking';
import { CalendarView } from '../components/calendar';
import { EditDayModal, ValidationBanner } from '../components/editing';
import { isValidYearMonth, parseYearMonth } from '../utils/dateUtils';

export function HomePage() {
  const { year, month } = useParams<{ year?: string; month?: string }>();
  const navigate = useNavigate();
  const { state, setMonth } = useAttendance();

  const [editingDate, setEditingDate] = useState<string | null>(null);

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
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Attendance Tracker
          </h1>
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
      </div>
    </div>
  );
}
