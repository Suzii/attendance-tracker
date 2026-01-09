import { useState, useEffect } from 'react';

/**
 * Hook that returns elapsed minutes since a given start time.
 * Updates every second when active.
 */
export function useTimer(startTime: string | null, isActive: boolean): number {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsedMinutes(0);
      return;
    }

    // Calculate initial elapsed time
    const start = new Date(startTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const diffMs = now - start;
      setElapsedMinutes(Math.floor(diffMs / 60000));
    };

    // Update immediately
    updateElapsed();

    // Update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  return elapsedMinutes;
}

/**
 * Hook that returns elapsed time formatted as "Xh YYm".
 */
export function useFormattedTimer(startTime: string | null, isActive: boolean): string {
  const elapsedMinutes = useTimer(startTime, isActive);

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}
