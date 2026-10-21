import { useEffect, useState } from 'react';

const secondsUntil = (target) =>
  target ? Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000)) : 0;

// Counts down to an ISO date. Returns { secondsLeft, expired, label: "06:42" }.
export default function useCountdown(target) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(target));

  useEffect(() => {
    setSecondsLeft(secondsUntil(target));
    if (!target) return undefined;

    const timer = setInterval(() => {
      const remaining = secondsUntil(target);
      setSecondsLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return { secondsLeft, expired: Boolean(target) && secondsLeft === 0, label: `${minutes}:${seconds}` };
}
