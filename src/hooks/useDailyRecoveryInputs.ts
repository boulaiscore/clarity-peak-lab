import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePhoneHealthDailyContext(userId: string | undefined, date: string) {
  return useQuery({
    queryKey: ["phone-health-daily-context", userId, date],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("phone_health_snapshots")
        .select("target_rec, phi, confidence, sleep_min, available_sources, updated_at, source")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useWearableDailySnapshot(userId: string | undefined, date: string) {
  return useQuery({
    queryKey: ["wearable-snapshot", userId, date],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("wearable_daily_canonical")
        .select("hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency, updated_at, source")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
