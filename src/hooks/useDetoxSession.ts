import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AppBlocker, { isNativeAndroid, ViolationEvent } from '@/lib/capacitor/appBlocker';
import { DETOX_XP_PER_MINUTE } from '@/hooks/useDetoxProgress';

interface DetoxSession {
  id: string;
  started_at: string;
  duration_minutes: number;
  end_time: string;
  blocked_apps: string[];
  status: 'active' | 'completed' | 'cancelled';
  xp_earned: number;
}

// Schedule notification via Service Worker
function scheduleDetoxEndNotification(sessionId: string, endTime: string, durationMinutes: number) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_DETOX_END',
      data: { sessionId, endTime, durationMinutes }
    });
    console.log('[DetoxSession] Scheduled end notification for:', endTime);
  }
}

// Cancel scheduled notification
function cancelDetoxEndNotification(sessionId: string) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CANCEL_DETOX_NOTIFICATION',
      data: { sessionId }
    });
    console.log('[DetoxSession] Cancelled notification for session:', sessionId);
  }
}

export function useDetoxSession() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<DetoxSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [lastViolation, setLastViolation] = useState<ViolationEvent | null>(null);
  const [timerResetAt, setTimerResetAt] = useState<Date | null>(null);
  
  // Track session start for timer reset calculation
  const effectiveStartTimeRef = useRef<Date | null>(null);

  // Load active session on mount
  const loadActiveSession = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('detox_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const endTime = new Date(data.end_time).getTime();
        const now = Date.now();
        
        if (endTime > now) {
          setActiveSession(data as DetoxSession);
          setRemainingMinutes(Math.ceil((endTime - now) / 1000 / 60));
          effectiveStartTimeRef.current = new Date(data.started_at);
          
          // Sync with native blocker if on Android
          if (isNativeAndroid()) {
            await AppBlocker.startBlocking({
              packageNames: data.blocked_apps,
              durationMinutes: Math.ceil((endTime - now) / 1000 / 60),
              message: 'Stay focused! Detox session in progress.',
            });
            
            // Get current violation count
            const { violationCount: count } = await AppBlocker.isBlockingActive();
            setViolationCount(count);
          }
        } else {
          // Session expired, mark as completed
          await completeSession(data.id, data.duration_minutes);
        }
      }
    } catch (error) {
      console.error('[useDetoxSession] Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Reset timer when violation is detected
  const handleViolation = useCallback((event: ViolationEvent) => {
    if (!activeSession) return;

    console.log('[useDetoxSession] Timer reset due to violation:', event.appName);
    
    // Update violation tracking
    setViolationCount(event.violationCount);
    setLastViolation(event);
    setTimerResetAt(new Date());
    
    // Reset the effective start time to now
    effectiveStartTimeRef.current = new Date();
    
    // Show toast about the reset
    toast({
      title: `⚠️ Timer azzerato!`,
      description: `Hai aperto ${event.appName}. Violazione #${event.violationCount}`,
      variant: "destructive",
    });
  }, [activeSession, toast]);

  // Setup violation listener
  useEffect(() => {
    if (!isNativeAndroid() || !activeSession) return;

    let cleanup: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const handle = await AppBlocker.addListener('violationDetected', handleViolation);
        cleanup = () => handle.remove();
      } catch (error) {
        console.error('[useDetoxSession] Error setting up violation listener:', error);
      }
    };

    setupListener();

    return () => {
      cleanup?.();
    };
  }, [activeSession, handleViolation]);

  // Start a new detox session
  const startSession = useCallback(async (
    durationMinutes: number,
    blockedApps: string[]
  ): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per iniziare una sessione detox",
        variant: "destructive",
      });
      return false;
    }

    try {
      const startedAt = new Date();
      const endTime = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

      const { data, error } = await supabase
        .from('detox_sessions')
        .insert({
          user_id: user.id,
          duration_minutes: durationMinutes,
          end_time: endTime.toISOString(),
          blocked_apps: blockedApps,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      setActiveSession(data as DetoxSession);
      setRemainingMinutes(durationMinutes);
      setViolationCount(0);
      setLastViolation(null);
      setTimerResetAt(null);
      effectiveStartTimeRef.current = startedAt;

      // Start native blocking on Android
      if (isNativeAndroid()) {
        await AppBlocker.startBlocking({
          packageNames: blockedApps,
          durationMinutes,
          message: 'Stay focused! Detox session in progress.',
        });
      }

      // Schedule background notification for when session ends
      scheduleDetoxEndNotification(data.id, endTime.toISOString(), durationMinutes);

      toast({
        title: "Detox iniziato",
        description: `Sessione di ${durationMinutes} minuti avviata. Riceverai una notifica a fine sessione.`,
      });

      return true;
    } catch (error) {
      console.error('[useDetoxSession] Error starting session:', error);
      toast({
        title: "Errore",
        description: "Impossibile avviare la sessione detox",
        variant: "destructive",
      });
      return false;
    }
  }, [user?.id, toast]);

  // Complete a session (called when time is up or manually completed)
  const completeSession = useCallback(async (
    sessionId?: string,
    durationMinutes?: number
  ): Promise<boolean> => {
    const id = sessionId || activeSession?.id;
    const duration = durationMinutes || activeSession?.duration_minutes || 0;
    
    if (!id) return false;

    try {
      // Calculate actual elapsed time from last reset (or session start)
      const effectiveStart = effectiveStartTimeRef.current || (activeSession ? new Date(activeSession.started_at) : new Date());
      const elapsedMinutes = Math.floor((Date.now() - effectiveStart.getTime()) / 1000 / 60);
      
      // XP is based on actual elapsed time since last violation (or start)
      const actualMinutes = Math.min(elapsedMinutes, duration);
      const xpEarned = Math.round(actualMinutes * DETOX_XP_PER_MINUTE * 100) / 100;

      // Cancel any pending notification for this session
      cancelDetoxEndNotification(id);

      const { error } = await supabase
        .from('detox_sessions')
        .update({
          status: 'completed',
          xp_earned: xpEarned,
        })
        .eq('id', id);

      if (error) throw error;

      // Also record in detox_completions for weekly tracking
      if (user?.id && actualMinutes >= 30) {
        await supabase.from('detox_completions').insert({
          user_id: user.id,
          duration_minutes: actualMinutes,
          xp_earned: xpEarned,
        });
      }

      setActiveSession(null);
      setRemainingMinutes(0);
      setViolationCount(0);
      setLastViolation(null);
      setTimerResetAt(null);
      effectiveStartTimeRef.current = null;

      // Stop native blocking
      if (isNativeAndroid()) {
        await AppBlocker.stopBlocking();
      }

      toast({
        title: "Detox completato! 🎉",
        description: actualMinutes >= 30 
          ? `Hai guadagnato ${xpEarned.toFixed(1)} XP (${actualMinutes} min effettivi)`
          : `Sessione troppo breve per XP (${actualMinutes} min, min 30)`,
      });

      return true;
    } catch (error) {
      console.error('[useDetoxSession] Error completing session:', error);
      return false;
    }
  }, [activeSession, user?.id, toast]);

  // Cancel active session
  const cancelSession = useCallback(async (): Promise<boolean> => {
    if (!activeSession?.id) return false;

    try {
      // Cancel scheduled notification
      cancelDetoxEndNotification(activeSession.id);

      const { error } = await supabase
        .from('detox_sessions')
        .update({ status: 'cancelled' })
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(null);
      setRemainingMinutes(0);
      setViolationCount(0);
      setLastViolation(null);
      setTimerResetAt(null);
      effectiveStartTimeRef.current = null;

      // Stop native blocking
      if (isNativeAndroid()) {
        await AppBlocker.stopBlocking();
      }

      toast({
        title: "Detox annullato",
        description: "La sessione è stata interrotta",
      });

      return true;
    } catch (error) {
      console.error('[useDetoxSession] Error cancelling session:', error);
      return false;
    }
  }, [activeSession?.id, toast]);

  // Calculate elapsed seconds since last reset
  const getElapsedSeconds = useCallback(() => {
    if (!effectiveStartTimeRef.current) return 0;
    return Math.floor((Date.now() - effectiveStartTimeRef.current.getTime()) / 1000);
  }, []);

  // Update remaining time every minute
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const endTime = new Date(activeSession.end_time).getTime();
      const now = Date.now();
      const remaining = Math.ceil((endTime - now) / 1000 / 60);

      if (remaining <= 0) {
        completeSession();
        clearInterval(interval);
      } else {
        setRemainingMinutes(remaining);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeSession, completeSession]);

  // Load session on mount
  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  return {
    activeSession,
    isLoading,
    remainingMinutes,
    isActive: !!activeSession,
    violationCount,
    lastViolation,
    timerResetAt,
    getElapsedSeconds,
    startSession,
    completeSession: () => completeSession(),
    cancelSession,
    refreshSession: loadActiveSession,
  };
}
