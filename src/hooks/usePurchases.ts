/**
 * Hook for managing in-app purchases
 * Handles both native IAP (iOS/Android) and Stripe (Web)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Browser } from '@capacitor/browser';
import { getStripeRedirectUrls, isNative, isIOS } from '@/lib/platformUtils';
import {
  initializePurchases,
  loginPurchases,
  logoutPurchases,
  purchaseSubscription,
  restorePurchases,
  getCustomerInfo,
  shouldUseNativeIAP,
  PRODUCT_IDS,
  type CustomerInfo,
  type PurchaseResult,
} from '@/lib/capacitor/purchases';

interface UsePurchasesReturn {
  // State
  isLoading: boolean;
  isRestoring: boolean;
  isPurchasing: boolean;
  customerInfo: CustomerInfo | null;
  
  // Actions
  purchasePremium: () => Promise<PurchaseResult>;
  purchasePro: () => Promise<PurchaseResult>;
  restoreAllPurchases: () => Promise<PurchaseResult>;
  refreshCustomerInfo: () => Promise<void>;
  
  // Platform info
  useNativeIAP: boolean;
}

export function usePurchases(): UsePurchasesReturn {
  const { user, session, upgradeToPremium } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  
  const useNativeIAP = shouldUseNativeIAP();

  // Initialize RevenueCat on mount
  useEffect(() => {
    const init = async () => {
      if (useNativeIAP && user?.id) {
        await initializePurchases(user.id);
        await loginPurchases(user.id);
        await refreshCustomerInfo();
      }
      setIsLoading(false);
    };
    
    init();
  }, [user?.id, useNativeIAP]);

  // Logout from RevenueCat when user logs out
  useEffect(() => {
    if (!user && useNativeIAP) {
      logoutPurchases();
      setCustomerInfo(null);
    }
  }, [user, useNativeIAP]);

  const refreshCustomerInfo = useCallback(async () => {
    if (!useNativeIAP) return;
    
    const info = await getCustomerInfo();
    setCustomerInfo(info);
    
    // Sync entitlements with backend
    if (info.isPro || info.isPremium) {
      const status = info.isPro ? 'pro' : 'premium';
      await supabase
        .from('profiles')
        .update({ subscription_status: status })
        .eq('user_id', user?.id);
    }
  }, [useNativeIAP, user?.id]);

  // Stripe checkout for web
  const handleStripeCheckout = async (tier: 'premium' | 'pro'): Promise<PurchaseResult> => {
    if (!user?.id || !session) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const { successUrl, cancelUrl } = getStripeRedirectUrls(
        '/app/account?success=true',
        '/app/account?canceled=true'
      );
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
          userEmail: user.email,
          tier,
          successUrl,
          cancelUrl,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        if (isNative()) {
          await Browser.open({ url: data.url });
        } else {
          window.location.href = data.url;
        }
        return { success: true };
      }
      
      return { success: false, error: 'No checkout URL returned' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Checkout failed' };
    }
  };

  // Purchase Premium subscription
  const purchasePremium = useCallback(async (): Promise<PurchaseResult> => {
    setIsPurchasing(true);
    
    try {
      if (useNativeIAP) {
        // Use RevenueCat for iOS
        const result = await purchaseSubscription(PRODUCT_IDS.PREMIUM_MONTHLY);
        
        if (result.success) {
          await refreshCustomerInfo();
          await upgradeToPremium();
          toast({
            title: "Welcome to Premium! 🎉",
            description: "You now have access to all premium features.",
          });
        } else if (result.error !== 'Purchase cancelled') {
          toast({
            title: "Purchase failed",
            description: result.error,
            variant: "destructive",
          });
        }
        
        return result;
      } else {
        // Use Stripe for web
        return await handleStripeCheckout('premium');
      }
    } finally {
      setIsPurchasing(false);
    }
  }, [useNativeIAP, refreshCustomerInfo, upgradeToPremium, user, session]);

  // Purchase Pro subscription
  const purchasePro = useCallback(async (): Promise<PurchaseResult> => {
    setIsPurchasing(true);
    
    try {
      if (useNativeIAP) {
        const result = await purchaseSubscription(PRODUCT_IDS.PRO_MONTHLY);
        
        if (result.success) {
          await refreshCustomerInfo();
          toast({
            title: "Welcome to Pro! 🚀",
            description: "You now have access to all Pro features.",
          });
        } else if (result.error !== 'Purchase cancelled') {
          toast({
            title: "Purchase failed",
            description: result.error,
            variant: "destructive",
          });
        }
        
        return result;
      } else {
        return await handleStripeCheckout('pro');
      }
    } finally {
      setIsPurchasing(false);
    }
  }, [useNativeIAP, refreshCustomerInfo, user, session]);

  // Restore purchases (required by App Store)
  const restoreAllPurchases = useCallback(async (): Promise<PurchaseResult> => {
    if (!useNativeIAP) {
      toast({
        title: "Not available",
        description: "Purchase restoration is only available on the iOS app.",
        variant: "destructive",
      });
      return { success: false, error: 'Not on native platform' };
    }

    setIsRestoring(true);
    
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        await refreshCustomerInfo();
        
        // Update backend with restored entitlements
        if (result.entitlements?.includes('pro')) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'pro' })
            .eq('user_id', user?.id);
        } else if (result.entitlements?.includes('premium')) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'premium' })
            .eq('user_id', user?.id);
        }
        
        toast({
          title: "Purchases restored",
          description: "Your previous purchases have been restored.",
        });
      } else {
        toast({
          title: "No purchases found",
          description: "No previous purchases were found to restore.",
        });
      }
      
      return result;
    } finally {
      setIsRestoring(false);
    }
  }, [useNativeIAP, refreshCustomerInfo, user?.id]);

  return {
    isLoading,
    isRestoring,
    isPurchasing,
    customerInfo,
    purchasePremium,
    purchasePro,
    restoreAllPurchases,
    refreshCustomerInfo,
    useNativeIAP,
  };
}
