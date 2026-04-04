/**
 * Hook for managing in-app purchases (placeholder — no real billing wired)
 */

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface PurchaseResult {
  success: boolean;
  error?: string;
  entitlements?: string[];
}

export interface CustomerInfo {
  isPro: boolean;
  isPremium: boolean;
}

interface UsePurchasesReturn {
  isLoading: boolean;
  isRestoring: boolean;
  isPurchasing: boolean;
  customerInfo: CustomerInfo | null;
  purchasePremium: () => Promise<PurchaseResult>;
  purchasePro: () => Promise<PurchaseResult>;
  restoreAllPurchases: () => Promise<PurchaseResult>;
  refreshCustomerInfo: () => Promise<void>;
  useNativeIAP: boolean;
}

export function usePurchases(): UsePurchasesReturn {
  const [isLoading] = useState(false);
  const [isRestoring] = useState(false);
  const [isPurchasing] = useState(false);
  const [customerInfo] = useState<CustomerInfo | null>(null);

  const placeholderResult = useCallback(async (): Promise<PurchaseResult> => {
    toast({
      title: "Plan selected",
      description: "Billing activation will be connected in the next release.",
    });
    return { success: false, error: 'Billing not yet active' };
  }, []);

  const refreshCustomerInfo = useCallback(async () => {}, []);

  return {
    isLoading,
    isRestoring,
    isPurchasing,
    customerInfo,
    purchasePremium: placeholderResult,
    purchasePro: placeholderResult,
    restoreAllPurchases: placeholderResult,
    refreshCustomerInfo,
    useNativeIAP: false,
  };
}
