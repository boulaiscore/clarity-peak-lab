/**
 * ============================================
 * USE INITIALIZE COGNITIVE BASELINE
 * ============================================
 * 
 * Calls the edge function to create/update user's cognitive baseline.
 * Should be called on app load or after onboarding.
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useInitializeCognitiveBaseline() {
  const { user } = useAuth();
  const hasInitialized = useRef(false);
  const queryClient = useQueryClient();

  // Check if baseline exists
  const { data: hasBaseline } = useQuery({
    queryKey: ["cognitive-baselines-exists", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from("user_cognitive_baselines")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking baseline:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    // Only initialize once per session
    if (hasInitialized.current || !user?.id) return;
    
    // If baseline already exists, still call to potentially update calibration status
    const initBaseline = async () => {
      try {
        hasInitialized.current = true;
        
        const { data, error } = await supabase.functions.invoke("initialize-cognitive-baseline");
        
        if (error) {
          console.error("Error initializing cognitive baseline:", error);
          return;
        }

        console.log("[useInitializeCognitiveBaseline] Result:", data);

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ["cognitive-baselines"] });
        queryClient.invalidateQueries({ queryKey: ["cognitive-baselines-exists"] });
        queryClient.invalidateQueries({ queryKey: ["cognitive-age-weekly"] });

      } catch (err) {
        console.error("Failed to initialize cognitive baseline:", err);
      }
    };

    // Delay to avoid race conditions on app load
    const timer = setTimeout(initBaseline, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, queryClient]);

  return { hasBaseline };
}
