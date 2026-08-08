import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getRedirectUrl } from "@/lib/platformUtils";
import { trackProductEvent } from "@/lib/productAnalytics";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const openCheckout = async (priceId: string) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setLoading(true);
    try {
      trackProductEvent("checkout_started", { priceId });
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(priceId);
      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: { email: user.email ?? undefined },
        customData: { userId: user.id },
        settings: {
          displayMode: "overlay",
          successUrl: getRedirectUrl("/app?checkout=success"),
          allowLogout: false,
          variant: "one-page",
          locale: "en",
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Could not open checkout");
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
