import { useContext } from 'react';
import { AttendanceContext } from '../context/AttendanceContext';
import type { AttendanceContextValue } from '../context/AttendanceContext';

/**
 * Hook to access attendance context.
 * Must be used within an AttendanceProvider.
 */
export function useAttendance(): AttendanceContextValue {
  const context = useContext(AttendanceContext);

  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }

  return context;
}
