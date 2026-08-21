import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";
import { getCustomerInfo, initializePurchases } from "@/lib/capacitor/purchases";
import { isNative } from "@/lib/platformUtils";
import {
  normalizeLegacyProfileTier,
  normalizePlanId,
  resolvePlanFromProductId,
} from "@/lib/entitlements";
import type { PlanId } from "@/config/pricing";

export type Tier = Exclude<PlanId, "team_waitlist">;

interface SubscriptionRow {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  paddle_subscription_id: string | null;
  price_id: string | null;
  product_id: string | null;
  plan_id?: string | null;
  provider?: string | null;
}

export interface SubscriptionInfo {
  tier: Tier;
  status: string | null;
  isActive: boolean;
  isCore: boolean;
  isPro: boolean;
  isFounding: boolean;
  /** Backwards-compatible alias for the former top tier. */
  isElite: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  paddleSubscriptionId: string | null;
  priceId: string | null;
  provider: "paddle" | "revenuecat" | "profile" | null;
}

const FREE: SubscriptionInfo = {
  tier: "free",
  status: null,
  isActive: false,
  isCore: false,
  isPro: false,
  isFounding: false,
  isElite: false,
  isTrialing: false,
  isPastDue: false,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  paddleSubscriptionId: null,
  priceId: null,
  provider: null,
};

function fromPlan(
  tier: Tier,
  values: Partial<SubscriptionInfo> = {},
): SubscriptionInfo {
  const isActive = tier !== "free";
  const isPro = tier === "pro" || tier === "founding_pro";
  return {
    ...FREE,
    tier,
    isActive,
    isCore: isActive,
    isPro,
    isFounding: tier === "founding_pro",
    isElite: isPro,
    ...values,
  };
}

function activeEntitlementPlan(entitlements: string[]): Tier | null {
  const normalized = entitlements.map((value) => value.toLowerCase());
  if (normalized.some((value) => value.includes("founding"))) return "founding_pro";
  if (normalized.includes("pro")) return "pro";
  if (normalized.includes("core") || normalized.includes("premium")) return "core";
  return null;
}

type SubscriptionContextValue = SubscriptionInfo & {
  loading: boolean;
  refetch: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function useSubscriptionState(): SubscriptionContextValue {
  const { user } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo>(FREE);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setInfo(FREE);
      setLoading(false);
      return;
    }

    if (isNative()) {
      const initialized = await initializePurchases(user.id);
      if (initialized.initialized) {
        const customer = await getCustomerInfo();
        const nativePlan = customer.planId !== "free"
          ? customer.planId
          : activeEntitlementPlan(customer.activeEntitlements);
        if (nativePlan) {
          setInfo(fromPlan(nativePlan, {
            status: "active",
            provider: "revenuecat",
            currentPeriodEnd: customer.expirationDate ?? null,
          }));
          setLoading(false);
          return;
        }
      }
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

    const row = data as unknown as SubscriptionRow | null;
    if (row) {
      const periodEnd = row.current_period_end ? new Date(row.current_period_end) : null;
      const inWindow = !periodEnd || periodEnd.getTime() > Date.now();
      const isActive =
        (["active", "trialing", "past_due"].includes(row.status) && inWindow) ||
        (row.status === "canceled" && inWindow);

      if (isActive) {
        const resolved = row.plan_id
          ? normalizePlanId(row.plan_id)
          : resolvePlanFromProductId(row.price_id ?? row.product_id);
        const tier = resolved === "team_waitlist" ? "free" : resolved;
        setInfo(fromPlan(tier, {
          status: row.status,
          isTrialing: row.status === "trialing",
          isPastDue: row.status === "past_due",
          cancelAtPeriodEnd: Boolean(row.cancel_at_period_end) || row.status === "canceled",
          currentPeriodEnd: row.current_period_end,
          paddleSubscriptionId: row.paddle_subscription_id,
          priceId: row.price_id,
          provider: row.provider === "revenuecat" ? "revenuecat" : "paddle",
        }));
        setLoading(false);
        return;
      }

      // A provider record is authoritative even after access expires. Falling
      // back to a stale profile tier here would reactivate canceled accounts.
      setInfo(FREE);
      setLoading(false);
      return;
    }

    // Staged-rollout fallback for legacy/manual entitlements. Provider records
    // remain authoritative whenever they exist.
    const fallback = normalizeLegacyProfileTier(user.subscriptionStatus);
    const fallbackTier = fallback === "team_waitlist" ? "free" : fallback;
    setInfo(fallbackTier === "free" ? FREE : fromPlan(fallbackTier, {
      status: "active",
      provider: "profile",
    }));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setInfo(FREE);
      setLoading(false);
      return;
    }

    // The already-loaded profile is sufficient for the first paint. Provider
    // verification happens in the background and replaces this optimistic
    // value if RevenueCat/Paddle has a newer authoritative state.
    const fallback = normalizeLegacyProfileTier(user.subscriptionStatus);
    const fallbackTier = fallback === "team_waitlist" ? "free" : fallback;
    setInfo(fallbackTier === "free" ? FREE : fromPlan(fallbackTier, {
      status: "active",
      provider: "profile",
    }));
    setLoading(false);
    void refetch();
  }, [user, refetch]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => void refetch(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  useEffect(() => {
    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetch]);

  return { ...info, loading, refetch };
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const value = useSubscriptionState();
  return createElement(SubscriptionContext.Provider, { value }, children);
}

export function useSubscription(): SubscriptionContextValue {
  const value = useContext(SubscriptionContext);
  if (!value) {
    throw new Error("useSubscription must be used inside SubscriptionProvider");
  }
  return value;
}
