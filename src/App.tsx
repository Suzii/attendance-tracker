import { useState } from 'react';
import { AttendanceProvider } from './context/AttendanceContext';
import { StartStopButton, CurrentSession, LunchButtons } from './components/tracking';
import { CalendarView } from './components/calendar';

function AppContent() {
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const handleEditDay = (date: string) => {
    setEditingDate(date);
    // Edit modal will be implemented in Phase 5
    console.log('Edit day:', date);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tracking Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center gap-4">
            <StartStopButton />
            <CurrentSession />
            <LunchButtons />
          </div>
        </div>

        {/* Calendar Section */}
        <CalendarView onEditDay={handleEditDay} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AttendanceProvider>
      <AppContent />
    </AttendanceProvider>
  );
}

export default App;
