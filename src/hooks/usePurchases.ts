import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCustomerInfo,
  initializePurchases,
  purchaseSubscription,
  restorePurchases,
  supportsIAP,
  type CustomerInfo,
  type PurchaseResult,
} from "@/lib/capacitor/purchases";
import { pricingConfig } from "@/config/pricing";

export function usePurchases() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(supportsIAP());
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const refreshCustomerInfo = useCallback(async () => {
    if (!supportsIAP()) {
      setIsLoading(false);
      return;
    }
    const initialized = await initializePurchases(user?.id);
    if (!initialized.initialized) {
      setIsLoading(false);
      return;
    }
    setCustomerInfo(await getCustomerInfo());
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refreshCustomerInfo();
  }, [refreshCustomerInfo]);

  const purchase = useCallback(async (productId: string | null): Promise<PurchaseResult> => {
    if (!productId) return { success: false, error: "Product is not configured" };
    setIsPurchasing(true);
    try {
      const initialized = await initializePurchases(user?.id);
      if (!initialized.initialized) return { success: false, error: initialized.error };
      const result = await purchaseSubscription(productId);
      if (result.success) await refreshCustomerInfo();
      return result;
    } finally {
      setIsPurchasing(false);
    }
  }, [refreshCustomerInfo, user?.id]);

  const restoreAllPurchases = useCallback(async (): Promise<PurchaseResult> => {
    setIsRestoring(true);
    try {
      const initialized = await initializePurchases(user?.id);
      if (!initialized.initialized) return { success: false, error: initialized.error };
      const result = await restorePurchases();
      if (result.success) await refreshCustomerInfo();
      return result;
    } finally {
      setIsRestoring(false);
    }
  }, [refreshCustomerInfo, user?.id]);

  return {
    isLoading,
    isRestoring,
    isPurchasing,
    customerInfo,
    purchaseCore: () => purchase(pricingConfig.core_annual.nativeProductId),
    purchasePro: () => purchase(pricingConfig.pro_annual.nativeProductId),
    purchaseFoundingPro: () => purchase(pricingConfig.founding_pro_annual.nativeProductId),
    purchaseProduct: purchase,
    restoreAllPurchases,
    refreshCustomerInfo,
    useNativeIAP: supportsIAP(),
  };
}
