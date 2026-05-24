import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";

const PRICE_TIER: Record<string, "pro" | "elite"> = {
  looma_pro_monthly: "pro",
  looma_pro_yearly: "pro",
  looma_elite_monthly: "elite",
  looma_elite_yearly: "elite",
};

export type Tier = "free" | "pro" | "elite";

export interface SubscriptionInfo {
  tier: Tier;
  status: string | null;
  isActive: boolean;
  isPro: boolean;
  isElite: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  paddleSubscriptionId: string | null;
  priceId: string | null;
}

const FREE: SubscriptionInfo = {
  tier: "free",
  status: null,
  isActive: false,
  isPro: false,
  isElite: false,
  isTrialing: false,
  isPastDue: false,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  paddleSubscriptionId: null,
  priceId: null,
};

export function useSubscription() {
  const { user } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo>(FREE);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setInfo(FREE);
      setLoading(false);
      return;
    }
    const env = getPaddleEnvironment();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      setInfo(FREE);
    } else {
      const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
      const inWindow = !periodEnd || periodEnd.getTime() > Date.now();
      const isActive =
        (["active", "trialing", "past_due"].includes(data.status) && inWindow) ||
        (data.status === "canceled" && inWindow);
      const tier: Tier = isActive ? PRICE_TIER[data.price_id] ?? "pro" : "free";
      setInfo({
        tier,
        status: data.status,
        isActive,
        isPro: isActive && (tier === "pro" || tier === "elite"),
        isElite: isActive && tier === "elite",
        isTrialing: data.status === "trialing" && inWindow,
        isPastDue: data.status === "past_due" && inWindow,
        cancelAtPeriodEnd: !!data.cancel_at_period_end || data.status === "canceled",
        currentPeriodEnd: data.current_period_end,
        paddleSubscriptionId: data.paddle_subscription_id,
        priceId: data.price_id,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return { ...info, loading, refetch };
}
