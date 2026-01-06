import { useState, useEffect, useCallback } from 'react';
import AppBlocker, { isNativeAndroid, SocialApp, AppUsageStat, ViolationEvent } from '@/lib/capacitor/appBlocker';
import { PluginListenerHandle } from '@capacitor/core';

interface BlockerState {
  isNative: boolean;
  hasUsagePermission: boolean;
  hasOverlayPermission: boolean;
  isBlockingActive: boolean;
  remainingMinutes: number;
  violationCount: number;
  socialApps: SocialApp[];
  usageStats: AppUsageStat[];
  isLoading: boolean;
  lastViolation: ViolationEvent | null;
}

export function useAppBlocker() {
  const [state, setState] = useState<BlockerState>({
    isNative: false,
    hasUsagePermission: false,
    hasOverlayPermission: false,
    isBlockingActive: false,
    remainingMinutes: 0,
    violationCount: 0,
    socialApps: [],
    usageStats: [],
    isLoading: true,
    lastViolation: null,
  });

  const [violationListeners, setViolationListeners] = useState<((event: ViolationEvent) => void)[]>([]);

  const checkPermissions = useCallback(async () => {
    if (!isNativeAndroid()) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const [usageResult, overlayResult] = await Promise.all([
        AppBlocker.hasUsageAccessPermission(),
        AppBlocker.hasOverlayPermission(),
      ]);

      setState(prev => ({
        ...prev,
        isNative: true,
        hasUsagePermission: usageResult.granted,
        hasOverlayPermission: overlayResult.granted,
        isLoading: false,
      }));
    } catch (error) {
      console.error('[useAppBlocker] Error checking permissions:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const loadSocialApps = useCallback(async () => {
    try {
      const result = await AppBlocker.getSocialApps();
      setState(prev => ({ ...prev, socialApps: result.apps }));
    } catch (error) {
      console.error('[useAppBlocker] Error loading social apps:', error);
    }
  }, []);

  const loadUsageStats = useCallback(async () => {
    if (!state.hasUsagePermission) return;
    
    try {
      const result = await AppBlocker.getUsageStats();
      setState(prev => ({ ...prev, usageStats: result.stats }));
    } catch (error) {
      console.error('[useAppBlocker] Error loading usage stats:', error);
    }
  }, [state.hasUsagePermission]);

  const checkBlockingStatus = useCallback(async () => {
    try {
      const result = await AppBlocker.isBlockingActive();
      setState(prev => ({
        ...prev,
        isBlockingActive: result.active,
        remainingMinutes: result.remainingMinutes,
        violationCount: result.violationCount,
      }));
    } catch (error) {
      console.error('[useAppBlocker] Error checking blocking status:', error);
    }
  }, []);

  const requestUsagePermission = useCallback(async () => {
    try {
      await AppBlocker.requestUsageAccessPermission();
      // Permission is granted in system settings, so we need to re-check
      setTimeout(checkPermissions, 1000);
    } catch (error) {
      console.error('[useAppBlocker] Error requesting usage permission:', error);
    }
  }, [checkPermissions]);

  const requestOverlayPermission = useCallback(async () => {
    try {
      await AppBlocker.requestOverlayPermission();
      setTimeout(checkPermissions, 1000);
    } catch (error) {
      console.error('[useAppBlocker] Error requesting overlay permission:', error);
    }
  }, [checkPermissions]);

  const startBlocking = useCallback(async (
    packageNames: string[],
    durationMinutes: number,
    message?: string
  ) => {
    try {
      await AppBlocker.startBlocking({ packageNames, durationMinutes, message });
      setState(prev => ({
        ...prev,
        isBlockingActive: true,
        remainingMinutes: durationMinutes,
        violationCount: 0,
      }));
      return true;
    } catch (error) {
      console.error('[useAppBlocker] Error starting blocking:', error);
      return false;
    }
  }, []);

  const stopBlocking = useCallback(async () => {
    try {
      await AppBlocker.stopBlocking();
      setState(prev => ({
        ...prev,
        isBlockingActive: false,
        remainingMinutes: 0,
        violationCount: 0,
      }));
      return true;
    } catch (error) {
      console.error('[useAppBlocker] Error stopping blocking:', error);
      return false;
    }
  }, []);

  // Subscribe to violation events
  const onViolation = useCallback((callback: (event: ViolationEvent) => void) => {
    setViolationListeners(prev => [...prev, callback]);
    return () => {
      setViolationListeners(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Setup native violation listener
  useEffect(() => {
    if (!isNativeAndroid()) return;

    let listenerHandle: PluginListenerHandle | null = null;

    const setupListener = async () => {
      try {
        listenerHandle = await AppBlocker.addListener('violationDetected', (event: ViolationEvent) => {
          console.log('[useAppBlocker] Violation detected:', event);
          
          // Update state
          setState(prev => ({
            ...prev,
            violationCount: event.violationCount,
            lastViolation: event,
          }));

          // Notify all registered listeners
          violationListeners.forEach(listener => listener(event));
        });
      } catch (error) {
        console.error('[useAppBlocker] Error setting up violation listener:', error);
      }
    };

    setupListener();

    return () => {
      listenerHandle?.remove();
    };
  }, [violationListeners]);

  useEffect(() => {
    checkPermissions();
    loadSocialApps();
  }, [checkPermissions, loadSocialApps]);

  useEffect(() => {
    if (state.hasUsagePermission) {
      loadUsageStats();
    }
  }, [state.hasUsagePermission, loadUsageStats]);

  useEffect(() => {
    checkBlockingStatus();
    const interval = setInterval(checkBlockingStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkBlockingStatus]);

  return {
    ...state,
    requestUsagePermission,
    requestOverlayPermission,
    startBlocking,
    stopBlocking,
    refreshPermissions: checkPermissions,
    refreshUsageStats: loadUsageStats,
    onViolation,
  };
}
