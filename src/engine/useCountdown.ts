import { useEffect, useRef, useState } from 'react';

/**
 * Wall-clock countdown that can be paused (exit dialog, app backgrounded)
 * without drifting. `onExpire` fires exactly once.
 */
export function useCountdown({
  durationMs,
  running,
  onExpire,
}: {
  durationMs: number;
  running: boolean;
  onExpire: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const remainingRef = useRef(durationMs);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!running || expiredRef.current) return;
    const deadline = Date.now() + remainingRef.current;

    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      remainingRef.current = left;
      setRemainingMs(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(id);
        onExpireRef.current();
      }
    };

    const id = setInterval(tick, 100);
    return () => {
      clearInterval(id);
      remainingRef.current = Math.max(0, deadline - Date.now());
    };
  }, [running]);

  return {
    remainingMs,
    /** Whole seconds remaining, rounded up so "0:01" shows until the end. */
    secondsLeft: Math.ceil(remainingMs / 1000),
    expired: remainingMs <= 0,
  };
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
