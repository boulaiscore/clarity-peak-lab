import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getRedirectUrl } from "@/lib/platformUtils";
import { trackProductEvent } from "@/lib/productAnalytics";
import type { BillingInterval, PlanId } from "@/config/pricing";

interface PaddleCheckoutMetadata {
  planId?: PlanId;
  billingInterval?: BillingInterval;
  sourcePage?: string;
  triggerAction?: string;
  cognitiveRole?: string | null;
  primaryBottleneck?: string | null;
}

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const openCheckout = async (priceId: string, metadata: PaddleCheckoutMetadata = {}) => {
    if (!user) {
      toast.error("Please sign in first");
      return false;
    }
    setLoading(true);
    try {
      trackProductEvent("checkout_started", {
        priceId,
        planId: metadata.planId ?? null,
        billingInterval: metadata.billingInterval ?? null,
        sourcePage: metadata.sourcePage ?? null,
        triggerAction: metadata.triggerAction ?? null,
        cognitiveRole: metadata.cognitiveRole ?? null,
        primaryBottleneck: metadata.primaryBottleneck ?? null,
      });
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(priceId);
      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: { email: user.email ?? undefined },
        customData: {
          userId: user.id,
          selectedPlanId: metadata.planId,
          billingInterval: metadata.billingInterval,
          sourcePage: metadata.sourcePage,
        },
        settings: {
          displayMode: "overlay",
          successUrl: getRedirectUrl("/app/subscription?checkout=success"),
          allowLogout: false,
          variant: "one-page",
          locale: "en",
        },
      });
      return true;
    } catch (e) {
      console.error(e);
      trackProductEvent("checkout_failed", {
        priceId,
        planId: metadata.planId ?? null,
        billingInterval: metadata.billingInterval ?? null,
        sourcePage: metadata.sourcePage ?? null,
      });
      toast.error("Could not open checkout");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
