import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { walkingTracker, WalkingProgress } from '@/lib/capacitor/walkingTracker';
import { format } from 'date-fns';

export interface WalkingSession {
  id: string;
  user_id: string;
  detox_session_id: string | null;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number;
  distance_meters: number;
  status: 'active' | 'completed' | 'cancelled';
}

// Minimum walking minutes required during recovery (30 min)
export const MIN_WALKING_MINUTES = 30;
// XP multiplier when walking is completed (full XP)
export const WALKING_XP_MULTIPLIER = 1.0;
// XP multiplier when walking is NOT completed (reduced XP)
export const NO_WALKING_XP_MULTIPLIER = 0.5;

export function useWalkingTracker(detoxSessionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<WalkingProgress>({
    distanceMeters: 0,
    durationMinutes: 0,
    isTracking: false,
    lastPosition: null,
  });
  const [walkingSessionId, setWalkingSessionId] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Start walking session
  const startWalking = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    const hasPermission = await walkingTracker.checkPermissions();
    if (!hasPermission) {
      const granted = await walkingTracker.requestPermissions();
      if (!granted) {
        setPermissionDenied(true);
        return false;
      }
    }

    // Create walking session in database
    const { data, error } = await supabase
      .from('walking_sessions')
      .insert({
        user_id: user.id,
        detox_session_id: detoxSessionId || null,
        status: 'active',
        duration_minutes: 0,
        distance_meters: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating walking session:', error);
      return false;
    }

    setWalkingSessionId(data.id);

    // Start GPS tracking
    const started = await walkingTracker.startTracking((newProgress) => {
      setProgress(newProgress);
    });

    if (!started) {
      // Cleanup db entry if tracking failed to start
      await supabase.from('walking_sessions').delete().eq('id', data.id);
      setWalkingSessionId(null);
      return false;
    }

    return true;
  }, [user?.id, detoxSessionId]);

  // Stop walking and save results
  const stopWalking = useCallback(async (): Promise<WalkingProgress | null> => {
    const finalProgress = await walkingTracker.stopTracking();
    setProgress(finalProgress);

    if (walkingSessionId) {
      const { error } = await supabase
        .from('walking_sessions')
        .update({
          completed_at: new Date().toISOString(),
          duration_minutes: finalProgress.durationMinutes,
          distance_meters: finalProgress.distanceMeters,
          status: 'completed',
        })
        .eq('id', walkingSessionId);

      if (error) {
        console.error('Error updating walking session:', error);
      }

      setWalkingSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['walking-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['today-walking-minutes'] });
    }

    return finalProgress;
  }, [walkingSessionId, queryClient]);

  // Cancel walking session
  const cancelWalking = useCallback(async () => {
    await walkingTracker.stopTracking();
    setProgress({
      distanceMeters: 0,
      durationMinutes: 0,
      isTracking: false,
      lastPosition: null,
    });

    if (walkingSessionId) {
      await supabase
        .from('walking_sessions')
        .update({ status: 'cancelled' })
        .eq('id', walkingSessionId);
      setWalkingSessionId(null);
    }
  }, [walkingSessionId]);

  // Calculate XP multiplier based on walking completion
  const getXPMultiplier = useCallback((walkingMinutes: number): number => {
    return walkingMinutes >= MIN_WALKING_MINUTES 
      ? WALKING_XP_MULTIPLIER 
      : NO_WALKING_XP_MULTIPLIER;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (walkingTracker.isTracking()) {
        walkingTracker.stopTracking();
      }
    };
  }, []);

  return {
    progress,
    isTracking: progress.isTracking,
    walkingSessionId,
    permissionDenied,
    startWalking,
    stopWalking,
    cancelWalking,
    getXPMultiplier,
    meetsMinimum: progress.durationMinutes >= MIN_WALKING_MINUTES,
  };
}

// Hook to get today's walking minutes
export function useTodayWalkingMinutes() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['today-walking-minutes', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data, error } = await supabase
        .from('walking_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);

      if (error) {
        console.error('Error fetching walking minutes:', error);
        return 0;
      }

      return (data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    },
    enabled: !!user?.id,
  });
}

// Hook to get daily recovery progress (combined detox + walking)
export function useDailyRecoveryProgress() {
  const { data: todayDetoxMinutes = 0 } = useTodayDetoxMinutesInternal();
  const { data: todayWalkingMinutes = 0 } = useTodayWalkingMinutes();

  const dailyMinimum = 30; // 30 min minimum daily
  const recoveryComplete = todayDetoxMinutes >= dailyMinimum;
  const walkingComplete = todayWalkingMinutes >= MIN_WALKING_MINUTES;
  const fullyComplete = recoveryComplete && walkingComplete;

  return {
    detoxMinutes: todayDetoxMinutes,
    walkingMinutes: todayWalkingMinutes,
    dailyMinimum,
    recoveryComplete,
    walkingComplete,
    fullyComplete,
    xpMultiplier: walkingComplete ? WALKING_XP_MULTIPLIER : NO_WALKING_XP_MULTIPLIER,
  };
}

// Internal helper - reuses existing logic
function useTodayDetoxMinutesInternal() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['today-detox-minutes', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data, error } = await supabase
        .from('detox_completions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`);

      if (error) return 0;
      return (data || []).reduce((sum, c) => sum + c.duration_minutes, 0);
    },
    enabled: !!user?.id,
  });
}
