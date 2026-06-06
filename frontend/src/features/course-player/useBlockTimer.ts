import { useEffect, useRef, useState } from 'react';

/**
 * Tracks real elapsed seconds for a block.
 * Pauses when the tab is hidden (document.visibilityState).
 */
export function useBlockTimer(requiredSeconds: number) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setElapsed((s) => s + 1);
      }
    }, 1000);
  };

  const reset = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setElapsed(0);
  };

  useEffect(() => {
    start();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const canAdvance = elapsed >= requiredSeconds;
  const remaining = Math.max(0, requiredSeconds - elapsed);

  return { elapsed, canAdvance, remaining, reset };
}
