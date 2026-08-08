import { useCallback, useEffect, useRef } from "react";

/** Schedule short UI transitions that are automatically cancelled on unmount. */
export function useSafeTimeout() {
  const pendingRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => () => {
    pendingRef.current.forEach(timeout => clearTimeout(timeout));
    pendingRef.current.clear();
  }, []);

  return useCallback((callback: () => void, delayMs: number) => {
    const timeout = setTimeout(() => {
      pendingRef.current.delete(timeout);
      callback();
    }, delayMs);
    pendingRef.current.add(timeout);
    return timeout;
  }, []);
}
