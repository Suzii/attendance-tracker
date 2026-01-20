import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AttendanceProvider } from './context/AttendanceContext';
import { SettingsProvider } from './context/SettingsContext';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AttendanceProvider>
        <Routes>
          {/* Main view - defaults to current month */}
          <Route path="/" element={<HomePage />} />

          {/* Month-specific view (for bookmarking/sharing) */}
          <Route path="/:year/:month" element={<HomePage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AttendanceProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
