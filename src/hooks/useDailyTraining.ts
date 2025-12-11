import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDailyTraining() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Check if today's daily training has been completed
  const { data: todaysSession, isLoading } = useQuery({
    queryKey: ['daily-training-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('neuro_gym_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_daily_training', true)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });
  
  const isDailyCompleted = !!todaysSession;
  
  // Check if we're within the reminder window (±30 minutes)
  const isInReminderWindow = useMemo(() => {
    if (!user?.reminderTime) return false;
    
    const now = new Date();
    const [hours, minutes] = user.reminderTime.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);
    
    const diffMinutes = Math.abs(now.getTime() - reminderTime.getTime()) / 60000;
    return diffMinutes <= 30;
  }, [user?.reminderTime]);
  
  // Invalidate daily training query
  const invalidateDailyTraining = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-training-today', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['daily-training-history', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['daily-training-streak', user?.id] });
  };
  
  return {
    isDailyCompleted,
    isInReminderWindow,
    todaysSession,
    isLoading,
    reminderTime: user?.reminderTime,
    invalidateDailyTraining,
  };
}

// Get daily training history for dashboard
export function useDailyTrainingHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['daily-training-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('neuro_gym_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_daily_training', true)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

// Calculate streak
export function useDailyTrainingStreak(userId: string | undefined) {
  return useQuery({
    queryKey: ['daily-training-streak', userId],
    queryFn: async () => {
      if (!userId) return { streak: 0, longestStreak: 0 };
      
      const { data, error } = await supabase
        .from('neuro_gym_sessions')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('is_daily_training', true)
        .order('completed_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      if (!data || data.length === 0) return { streak: 0, longestStreak: 0 };
      
      // Get unique dates
      const dates = [...new Set(
        data.map(s => new Date(s.completed_at).toISOString().split('T')[0])
      )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      // Calculate current streak
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Check if trained today or yesterday to start counting
      if (dates[0] === today || dates[0] === yesterday) {
        streak = 1;
        let expectedDate = new Date(dates[0]);
        
        for (let i = 1; i < dates.length; i++) {
          expectedDate.setDate(expectedDate.getDate() - 1);
          const expected = expectedDate.toISOString().split('T')[0];
          
          if (dates[i] === expected) {
            streak++;
          } else {
            break;
          }
        }
      }
      
      return { streak, longestStreak: streak }; // Simplified - just track current streak
    },
    enabled: !!userId,
  });
}
