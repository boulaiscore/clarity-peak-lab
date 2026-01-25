import { useEffect, useState } from "react";

/**
 * Returns `true` only if `value` stays true for at least `delayMs`.
 * Useful to avoid skeleton/UI flashes on fast queries.
 */
export function useDelayedBoolean(value: boolean, delayMs = 150) {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (!value) {
      setDelayed(false);
      return;
    }

    const t = window.setTimeout(() => setDelayed(true), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return delayed;
}
