import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AUTO_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

function syncKey(userId: string, provider: string) {
  return `looma-direct-wearable-sync:${userId}:${provider}`;
}

/**
 * Refreshes connected provider data when the app opens or returns to use.
 * The six-hour client throttle avoids unnecessary provider/API traffic while
 * still giving Home and Monitor fresh daily inputs without manual syncing.
 */
export function useDirectWearableAutoSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!user?.id || runningRef.current) return;
    let cancelled = false;

    const run = async () => {
      runningRef.current = true;
      try {
        const { data, error } = await supabase
          .from("wearable_provider_connections")
          .select("provider, last_sync_at")
          .eq("user_id", user.id)
          .eq("status", "connected");
        if (error || cancelled) return;

        let synced = false;
        for (const connection of data ?? []) {
          if (connection.provider !== "whoop" && connection.provider !== "oura") continue;
          const key = syncKey(user.id, connection.provider);
          const lastLocal = Number(localStorage.getItem(key) || 0);
          const lastCloud = connection.last_sync_at ? new Date(connection.last_sync_at).getTime() : 0;
          if (Date.now() - Math.max(lastLocal, lastCloud) < AUTO_SYNC_INTERVAL_MS) continue;

          const { error: syncError } = await supabase.functions.invoke("sync-wearable-provider", {
            body: { provider: connection.provider },
          });
          if (!syncError) {
            localStorage.setItem(key, String(Date.now()));
            synced = true;
          }
        }
        if (synced && !cancelled) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["wearable-snapshot"] }),
            queryClient.invalidateQueries({ queryKey: ["today-metrics"] }),
            queryClient.invalidateQueries({ queryKey: ["metric-history"] }),
          ]);
        }
      } finally {
        runningRef.current = false;
      }
    };

    void run();
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queryClient, user?.id]);
}

