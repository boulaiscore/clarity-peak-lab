/**
 * ============================================
 * TEST MODE TOGGLE v1.0
 * ============================================
 * 
 * Provides a simple on/off switch for disabling all
 * game gating and XP caps during testing.
 * 
 * Toggle via browser console:
 *   localStorage.setItem('NLOOP_TEST_MODE', 'true')  // Enable
 *   localStorage.removeItem('NLOOP_TEST_MODE')       // Disable
 * 
 * Or via the exported helper functions.
 */

import { useState, useEffect, useCallback } from "react";

const TEST_MODE_KEY = "LUMA_TEST_MODE";

/**
 * Hook to check if test mode is enabled.
 * Listens for storage changes to react in real-time.
 */
export function useTestMode(): {
  isTestMode: boolean;
  enableTestMode: () => void;
  disableTestMode: () => void;
  toggleTestMode: () => void;
} {
  const [isTestMode, setIsTestMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(TEST_MODE_KEY) === "true";
  });

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TEST_MODE_KEY) {
        setIsTestMode(event.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const enableTestMode = useCallback(() => {
    localStorage.setItem(TEST_MODE_KEY, "true");
    setIsTestMode(true);
    console.log("[TestMode] ✅ Test mode ENABLED - All game restrictions bypassed");
  }, []);

  const disableTestMode = useCallback(() => {
    localStorage.removeItem(TEST_MODE_KEY);
    setIsTestMode(false);
    console.log("[TestMode] ❌ Test mode DISABLED - Normal gating active");
  }, []);

  const toggleTestMode = useCallback(() => {
    if (isTestMode) {
      disableTestMode();
    } else {
      enableTestMode();
    }
  }, [isTestMode, enableTestMode, disableTestMode]);

  return { isTestMode, enableTestMode, disableTestMode, toggleTestMode };
}

/**
 * Simple check function for use outside of React components.
 */
export function isTestModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TEST_MODE_KEY) === "true";
}
