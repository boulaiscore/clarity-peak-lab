import { useCallback, useState } from "react";
import { Browser } from "@capacitor/browser";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { usePurchases } from "@/hooks/usePurchases";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_CATALOG, pricingConfig, type PricingOptionId } from "@/config/pricing";
import { getPaddleEnvironment } from "@/lib/paddle";
import { getPlatform, isNative } from "@/lib/platformUtils";
import { supabase } from "@/integrations/supabase/client";
import { trackProductEvent } from "@/lib/productAnalytics";

export interface CheckoutContext {
  sourcePage?: string;
  triggerAction?: string;
  primaryBottleneck?: string | null;
}

export interface TeamWaitlistInput {
  email: string;
  companyOrGroup?: string;
  seats: number;
}

export const PENDING_CHECKOUT_KEY = "looma_pending_checkout_v1";

export function useCheckout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openCheckout, loading: paddleLoading } = usePaddleCheckout();
  const purchases = usePurchases();
  const subscription = useSubscription();
  const [loading, setLoading] = useState(false);

  const startCheckout = useCallback(async (
    optionId: PricingOptionId,
    context: CheckoutContext = {},
  ) => {
    const option = pricingConfig[optionId];
    if (option.planId === "free") {
      navigate("/app");
      return { success: true };
    }
    if (PLAN_CATALOG[option.planId].waitlistOnly || option.planId === "team_waitlist") {
      return { success: false, error: "This plan is currently waitlist only" };
    }

    trackProductEvent("plan_card_clicked", {
      planId: option.planId,
      billingInterval: option.billingInterval,
      sourcePage: context.sourcePage ?? null,
      triggerAction: context.triggerAction ?? null,
      cognitiveRole: user?.workType ?? null,
      primaryBottleneck: context.primaryBottleneck ?? null,
    });

    if (isNative()) {
      setLoading(true);
      trackProductEvent("checkout_started", {
        planId: option.planId,
        billingInterval: option.billingInterval,
        sourcePage: context.sourcePage ?? null,
        triggerAction: context.triggerAction ?? null,
      });
      try {
        const result = await purchases.purchaseProduct(option.nativeProductId);
        trackProductEvent(result.success ? "checkout_completed" : "checkout_failed", {
          planId: option.planId,
          billingInterval: option.billingInterval,
          sourcePage: context.sourcePage ?? null,
        });
        if (result.success) {
          await subscription.refetch();
          navigate("/app/onboarding-premium");
        } else if (result.error !== "Purchase cancelled") {
          toast.error(result.error || "Purchase failed");
        }
        return result;
      } finally {
        setLoading(false);
      }
    }

    if (!option.webPriceId) return { success: false, error: "Web checkout is not configured" };
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({
      planId: option.planId,
      billingInterval: option.billingInterval,
      sourcePage: context.sourcePage ?? null,
    }));
    const opened = await openCheckout(option.webPriceId, {
      planId: option.planId,
      billingInterval: option.billingInterval,
      sourcePage: context.sourcePage,
      triggerAction: context.triggerAction,
      cognitiveRole: user?.workType ?? null,
      primaryBottleneck: context.primaryBottleneck,
    });
    if (!opened) sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    return { success: opened, error: opened ? undefined : "Checkout could not be opened" };
  }, [navigate, openCheckout, purchases, subscription, user?.workType]);

  const restoreAllPurchases = useCallback(async () => {
    if (!isNative()) {
      await subscription.refetch();
      toast.success("Subscription status refreshed");
      return { success: true };
    }
    const result = await purchases.restoreAllPurchases();
    if (result.success) {
      trackProductEvent("subscription_restored");
      await subscription.refetch();
      toast.success("Purchases restored");
    } else {
      toast.error(result.error || "No purchases found");
    }
    return result;
  }, [purchases, subscription]);

  const manageSubscription = useCallback(async () => {
    if (isNative()) {
      const url = getPlatform() === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
      await Browser.open({ url });
      return;
    }
    const { data, error } = await supabase.functions.invoke("paddle-customer-portal", {
      body: { environment: getPaddleEnvironment() },
    });
    if (error || !data?.url) throw new Error(data?.error || error?.message || "Billing portal unavailable");
    window.open(data.url, "_blank");
  }, []);

  const applyPromoCode = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { success: false, error: "Enter a code" };
    // Store-managed promo codes are redeemed in the relevant checkout. This
    // abstraction keeps the UI/provider boundary stable for a future backend.
    return { success: false, error: "Apply this code in the store checkout" };
  }, []);

  const joinTeamWaitlist = useCallback(async (input: TeamWaitlistInput) => {
    const looseSupabase = supabase as unknown as {
      from(table: string): {
        upsert(values: Record<string, unknown>, options: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
      };
    };
    const { error } = await looseSupabase.from("team_waitlist").upsert({
      user_id: user?.id ?? null,
      email: input.email.trim().toLowerCase(),
      company_or_group: input.companyOrGroup?.trim() || null,
      seats: input.seats,
    }, { onConflict: "email" });
    if (error) throw new Error(error.message);
    trackProductEvent("team_waitlist_joined", {
      seats: input.seats,
      sourcePage: "subscription",
    });
  }, [user?.id]);

  return {
    startCheckout,
    restorePurchases: restoreAllPurchases,
    manageSubscription,
    applyPromoCode,
    joinTeamWaitlist,
    loading: loading || paddleLoading || purchases.isPurchasing || purchases.isRestoring,
  };
}
