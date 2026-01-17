/**
 * RevenueCat Purchases integration for iOS In-App Purchases
 * This module handles all IAP functionality required for App Store compliance
 */

import { Capacitor } from '@capacitor/core';
import { isIOS, isAndroid, isNative } from '@/lib/platformUtils';

// RevenueCat Product IDs - must match App Store Connect
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'neuroloop_premium_monthly',
  PRO_MONTHLY: 'neuroloop_pro_monthly',
  REPORT_SINGLE: 'neuroloop_report_single',
  REPORT_PACK_5: 'neuroloop_report_pack_5',
  REPORT_PACK_10: 'neuroloop_report_pack_10',
} as const;

// Entitlement identifiers in RevenueCat
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  PRO: 'pro',
} as const;

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
  entitlements?: string[];
}

export interface CustomerInfo {
  isPremium: boolean;
  isPro: boolean;
  activeEntitlements: string[];
  expirationDate?: string;
}

let purchasesInstance: typeof import('@revenuecat/purchases-capacitor').Purchases | null = null;
let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Must be called on app startup for native platforms
 */
export async function initializePurchases(userId?: string): Promise<boolean> {
  if (!isNative()) {
    console.log('[Purchases] Web platform - skipping RevenueCat initialization');
    return false;
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    purchasesInstance = Purchases;

    // Get API key based on platform
    const apiKey = isIOS() 
      ? import.meta.env.VITE_REVENUECAT_IOS_KEY 
      : import.meta.env.VITE_REVENUECAT_ANDROID_KEY;

    if (!apiKey) {
      console.warn('[Purchases] RevenueCat API key not configured');
      return false;
    }

    await Purchases.configure({
      apiKey,
      appUserID: userId || undefined,
    });

    isInitialized = true;
    console.log('[Purchases] RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('[Purchases] Failed to initialize RevenueCat:', error);
    return false;
  }
}

/**
 * Set the user ID for RevenueCat (after login)
 */
export async function loginPurchases(userId: string): Promise<void> {
  if (!isInitialized || !purchasesInstance) return;

  try {
    await purchasesInstance.logIn({ appUserID: userId });
    console.log('[Purchases] User logged in:', userId);
  } catch (error) {
    console.error('[Purchases] Login failed:', error);
  }
}

/**
 * Log out user from RevenueCat (on logout)
 */
export async function logoutPurchases(): Promise<void> {
  if (!isInitialized || !purchasesInstance) return;

  try {
    await purchasesInstance.logOut();
    console.log('[Purchases] User logged out');
  } catch (error) {
    console.error('[Purchases] Logout failed:', error);
  }
}

/**
 * Get available products/packages
 */
export async function getOfferings(): Promise<any> {
  if (!isInitialized || !purchasesInstance) {
    return null;
  }

  try {
    const offerings = await purchasesInstance.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[Purchases] Failed to get offerings:', error);
    return null;
  }
}

/**
 * Purchase a subscription product
 */
export async function purchaseSubscription(
  productId: typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS]
): Promise<PurchaseResult> {
  if (!isInitialized || !purchasesInstance) {
    return { success: false, error: 'Purchases not initialized' };
  }

  try {
    const offerings = await purchasesInstance.getOfferings();
    const currentOffering = offerings.current;
    
    if (!currentOffering) {
      return { success: false, error: 'No offerings available' };
    }

    // Find the package that contains our product
    const packages = currentOffering.availablePackages;
    const targetPackage = packages.find((pkg: any) => 
      pkg.product?.identifier === productId || 
      pkg.identifier === productId
    );

    if (!targetPackage) {
      return { success: false, error: `Product ${productId} not found` };
    }

    const { customerInfo } = await purchasesInstance.purchasePackage({
      aPackage: targetPackage,
    });

    const activeEntitlements = Object.keys(customerInfo.entitlements.active || {});

    return {
      success: true,
      productId,
      entitlements: activeEntitlements,
    };
  } catch (error: any) {
    // Check if user cancelled
    if (error.code === 'PURCHASE_CANCELLED') {
      return { success: false, error: 'Purchase cancelled' };
    }
    console.error('[Purchases] Purchase failed:', error);
    return { success: false, error: error.message || 'Purchase failed' };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isInitialized || !purchasesInstance) {
    return { success: false, error: 'Purchases not initialized' };
  }

  try {
    const { customerInfo } = await purchasesInstance.restorePurchases();
    const activeEntitlements = Object.keys(customerInfo.entitlements.active || {});

    if (activeEntitlements.length > 0) {
      return {
        success: true,
        entitlements: activeEntitlements,
      };
    } else {
      return { success: false, error: 'No purchases to restore' };
    }
  } catch (error: any) {
    console.error('[Purchases] Restore failed:', error);
    return { success: false, error: error.message || 'Restore failed' };
  }
}

/**
 * Get current customer info / entitlements
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  const defaultInfo: CustomerInfo = {
    isPremium: false,
    isPro: false,
    activeEntitlements: [],
  };

  if (!isInitialized || !purchasesInstance) {
    return defaultInfo;
  }

  try {
    const { customerInfo } = await purchasesInstance.getCustomerInfo();
    const activeEntitlements = Object.keys(customerInfo.entitlements.active || {});

    return {
      isPremium: activeEntitlements.includes(ENTITLEMENTS.PREMIUM),
      isPro: activeEntitlements.includes(ENTITLEMENTS.PRO),
      activeEntitlements,
      expirationDate: customerInfo.entitlements.active?.premium?.expirationDate || 
                      customerInfo.entitlements.active?.pro?.expirationDate,
    };
  } catch (error) {
    console.error('[Purchases] Failed to get customer info:', error);
    return defaultInfo;
  }
}

/**
 * Check if the platform supports IAP
 */
export function supportsIAP(): boolean {
  return isNative() && (isIOS() || isAndroid());
}

/**
 * Check if we should use native IAP vs Stripe
 * On iOS: Must use IAP for digital content (App Store rules)
 * On Android: Can use either, but IAP is recommended
 * On Web: Use Stripe
 */
export function shouldUseNativeIAP(): boolean {
  return isIOS(); // iOS requires IAP for digital content
}
