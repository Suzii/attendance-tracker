import { AttendanceProvider } from './context/AttendanceContext';
import { StartStopButton, CurrentSession, LunchButtons } from './components/tracking';

function App() {
  return (
    <AttendanceProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header will be replaced with MonthSelector in Phase 4 */}
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Attendance Tracker
          </h1>

          {/* Tracking Section */}
          <div className="flex flex-col items-center gap-4 py-8">
            <StartStopButton />
            <CurrentSession />
            <LunchButtons />
          </div>

          {/* Calendar will be added in Phase 4 */}
        </div>
      </div>
    </AttendanceProvider>
  );
}

export default App;
