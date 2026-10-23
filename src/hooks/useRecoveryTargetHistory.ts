import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  buildRecoveryTargetResolver,
  type PhoneTargetRow,
  type WearableTargetRow,
} from "@/lib/recoveryTargetHistory";

/**
 * Last 45 days of passive inputs: dated Recovery targets for missed days and
 * the personal HRV baseline. Shared by every live Recovery consumer.
 */
export function useRecoveryTargetHistory(userId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["recovery-target-history", userId, format(new Date(), "yyyy-MM-dd")],
    queryFn: async () => {
      const start = format(subDays(new Date(), 45), "yyyy-MM-dd");
      const [phone, wearable] = await Promise.all([
        supabase.from("phone_health_snapshots").select("date, target_rec, sleep_min")
          .eq("user_id", userId!).gte("date", start),
        supabase.from("wearable_daily_canonical")
          .select("date, hrv_ms, resting_hr, sleep_duration_min, sleep_efficiency, source")
          .eq("user_id", userId!).gte("date", start),
      ]);
      return {
        phone: (phone.data ?? []) as PhoneTargetRow[],
        wearable: (wearable.data ?? []) as WearableTargetRow[],
      };
    },
    enabled: !!userId,
    staleTime: 10 * 60_000,
  });

  return useMemo(() => ({
    wearableHistory: data?.wearable ?? [],
    resolver: data ? buildRecoveryTargetResolver(data.phone, data.wearable) : null,
  }), [data]);
}
