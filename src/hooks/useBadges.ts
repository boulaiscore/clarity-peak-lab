import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserBadge, Badge, BadgeMetrics, checkEarnedBadges, XP_REWARDS } from "@/lib/badges";

// Fetch user's badges
export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });
      
      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!userId,
  });
}

// Award a badge to user
export function useAwardBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      badge 
    }: { 
      userId: string; 
      badge: Badge;
    }) => {
      const { data, error } = await supabase
        .from("user_badges")
        .insert({
          user_id: userId,
          badge_id: badge.id,
          badge_name: badge.name,
          badge_description: badge.description,
          badge_category: badge.category,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-badges", userId] });
    },
  });
}

// Check and award new badges
export function useCheckAndAwardBadges() {
  const awardBadge = useAwardBadge();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      metrics,
      existingBadgeIds,
    }: { 
      userId: string;
      metrics: BadgeMetrics;
      existingBadgeIds: string[];
    }) => {
      const newBadges = checkEarnedBadges(metrics, existingBadgeIds);
      const awarded: Badge[] = [];
      
      for (const badge of newBadges) {
        try {
          await awardBadge.mutateAsync({ userId, badge });
          awarded.push(badge);
        } catch (e) {
          console.error(`Failed to award badge ${badge.id}:`, e);
        }
      }
      
      // Add XP for each badge earned
      if (awarded.length > 0) {
        const xpToAdd = awarded.length * XP_REWARDS.badgeEarned;
        
        await supabase
          .from("user_cognitive_metrics")
          .update({
            experience_points: metrics.experiencePoints + xpToAdd,
          })
          .eq("user_id", userId);
      }
      
      return awarded;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-badges", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
    },
  });
}

// Update user XP and level
export function useUpdateXP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      xpToAdd,
      currentXP,
    }: { 
      userId: string;
      xpToAdd: number;
      currentXP: number;
    }) => {
      const newXP = currentXP + xpToAdd;
      
      // Calculate new level
      let newLevel = 1;
      const levelThresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000];
      for (let i = levelThresholds.length - 1; i >= 0; i--) {
        if (newXP >= levelThresholds[i]) {
          newLevel = i + 1;
          break;
        }
      }
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          experience_points: newXP,
          cognitive_level: newLevel,
        })
        .eq("user_id", userId)
        .select()
        .single();
      
      if (error) throw error;
      return { newXP, newLevel, data };
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
    },
  });
}

// Save baseline metrics (during initial assessment)
export function useSaveBaseline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId,
      fastThinking,
      slowThinking,
      focus,
      reasoning,
      creativity,
      cognitiveAge,
    }: { 
      userId: string;
      fastThinking: number;
      slowThinking: number;
      focus: number;
      reasoning: number;
      creativity: number;
      cognitiveAge: number;
    }) => {
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          baseline_fast_thinking: fastThinking,
          baseline_slow_thinking: slowThinking,
          baseline_focus: focus,
          baseline_reasoning: reasoning,
          baseline_creativity: creativity,
          baseline_cognitive_age: cognitiveAge,
          baseline_captured_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
    },
  });
}

// Get user's current XP and level
export function useBadges() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["user-xp-level"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { experiencePoints: 0, cognitiveLevel: 1 };
      
      const { data, error } = await supabase
        .from("user_cognitive_metrics")
        .select("experience_points, cognitive_level")
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching XP:", error);
        return { experiencePoints: 0, cognitiveLevel: 1 };
      }
      
      return {
        experiencePoints: data?.experience_points || 0,
        cognitiveLevel: data?.cognitive_level || 1,
      };
    },
  });
  
  return {
    experiencePoints: metrics?.experiencePoints || 0,
    cognitiveLevel: metrics?.cognitiveLevel || 1,
    isLoading,
  };
}
