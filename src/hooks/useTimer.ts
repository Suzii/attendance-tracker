import { useState, useEffect } from 'react';

/**
 * Hook that returns elapsed seconds since a given start time.
 * Updates every second when active.
 */
export function useTimer(startTime: string | null, isActive: boolean): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsedSeconds(0);
      return;
    }

    // Calculate initial elapsed time
    const start = new Date(startTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const diffMs = now - start;
      setElapsedSeconds(Math.floor(diffMs / 1000));
    };

    // Update immediately
    updateElapsed();

    // Update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  return elapsedSeconds;
}

/**
 * Hook that returns elapsed time formatted as "Xh YYm SSs".
 */
export function useFormattedTimer(startTime: string | null, isActive: boolean): string {
  const elapsedSeconds = useTimer(startTime, isActive);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}
