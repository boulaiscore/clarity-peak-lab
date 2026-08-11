/**
 * RevenueCat Purchases integration for native (iOS/Android) In-App Purchases.
 */

import { Capacitor } from '@capacitor/core';
import { isIOS, isAndroid, isNative } from '@/lib/platformUtils';

// RevenueCat Product IDs - must match RevenueCat products/store products
export const PRODUCT_IDS = {
  CORE_MONTHLY: 'looma_core_monthly',
  CORE_ANNUAL: 'looma_core_annual',
  PRO_MONTHLY: 'looma_pro_monthly',
  PRO_ANNUAL: 'looma_pro_annual',
  FOUNDING_PRO_ANNUAL: 'looma_founding_pro_annual',
  REPORT_SINGLE: 'looma_report_single',
  REPORT_PACK_5: 'looma_report_pack_5',
  REPORT_PACK_10: 'looma_report_pack_10',
} as const;

// Entitlement identifiers in RevenueCat
export const ENTITLEMENTS = {
  CORE: 'core',
  PREMIUM_LEGACY: 'premium',
  PRO: 'pro',
  FOUNDING_PRO: 'founding_pro',
} as const;

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
  entitlements?: string[];
}

export interface CustomerInfo {
  planId: 'free' | 'core' | 'pro' | 'founding_pro';
  isPremium: boolean;
  isPro: boolean;
  activeEntitlements: string[];
  expirationDate?: string;
}

export interface PurchasesInitResult {
  initialized: boolean;
  error?: string;
  code?: 'not_native' | 'missing_api_key' | 'configure_failed';
}

let purchasesInstance: typeof import('@revenuecat/purchases-capacitor').Purchases | null = null;
let isInitialized = false;
let identifiedUserId: string | null = null;

function getMissingApiKeyError(): string {
  return isIOS()
    ? 'RevenueCat iOS key is missing (VITE_REVENUECAT_IOS_KEY).'
    : 'RevenueCat Android key is missing (VITE_REVENUECAT_ANDROID_KEY).';
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

function errorCode(error: unknown): string | null {
  if (typeof error === 'object' && error && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return null;
}

/**
 * Initialize RevenueCat SDK
 * Must be called on app startup for native platforms
 */
export async function initializePurchases(userId?: string): Promise<PurchasesInitResult> {
  if (!isNative()) {
    console.log('[Purchases] Web platform - skipping RevenueCat initialization');
    return { initialized: false, code: 'not_native', error: 'Not running on native platform' };
  }

  if (isInitialized && purchasesInstance) {
    if (userId && userId !== identifiedUserId) {
      await purchasesInstance.logIn({ appUserID: userId });
      identifiedUserId = userId;
    }
    return { initialized: true };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    purchasesInstance = Purchases;

    // Get API key based on platform
    const apiKey = isIOS() 
      ? import.meta.env.VITE_REVENUECAT_IOS_KEY 
      : import.meta.env.VITE_REVENUECAT_ANDROID_KEY;

    const normalizedApiKey = (apiKey || '').trim();
    const hasApiKey = Boolean(normalizedApiKey) && normalizedApiKey !== 'undefined' && normalizedApiKey !== 'null';

    console.log('[Purchases] Initialization context', {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      hasApiKey,
      apiKeyLength: normalizedApiKey.length,
    });

    if (!hasApiKey) {
      console.warn('[Purchases] RevenueCat API key not configured:', getMissingApiKeyError());
      return { initialized: false, code: 'missing_api_key', error: getMissingApiKeyError() };
    }

    await Purchases.configure({
      apiKey: normalizedApiKey,
      appUserID: userId || undefined,
    });

    isInitialized = true;
    identifiedUserId = userId ?? null;
    console.log('[Purchases] RevenueCat initialized successfully');
    return { initialized: true };
  } catch (error) {
    console.error('[Purchases] Failed to initialize RevenueCat:', error);
    return {
      initialized: false,
      code: 'configure_failed',
      error: error instanceof Error ? error.message : 'RevenueCat initialization failed',
    };
  }
}

/**
 * Set the user ID for RevenueCat (after login)
 */
export async function loginPurchases(userId: string): Promise<void> {
  if (!isInitialized || !purchasesInstance) return;

  try {
    await purchasesInstance.logIn({ appUserID: userId });
    identifiedUserId = userId;
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
    identifiedUserId = null;
    console.log('[Purchases] User logged out');
  } catch (error) {
    console.error('[Purchases] Logout failed:', error);
  }
}

/**
 * Get available products/packages
 */
export async function getOfferings(): Promise<unknown> {
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
  productId: string,
): Promise<PurchaseResult> {
  if (!isInitialized || !purchasesInstance) {
    return {
      success: false,
      error: isNative() ? `Purchases not initialized. ${getMissingApiKeyError()}` : 'Purchases not initialized',
    };
  }

  try {
    const offerings = await purchasesInstance.getOfferings();
    const currentOffering = offerings.current;
    
    if (!currentOffering) {
      return { success: false, error: 'No offerings available' };
    }

    // Find the package that contains our product
    const packages = currentOffering.availablePackages;
    const targetPackage = packages.find((pkg) =>
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
  } catch (error: unknown) {
    // Check if user cancelled
    if (errorCode(error) === 'PURCHASE_CANCELLED') {
      return { success: false, error: 'Purchase cancelled' };
    }
    console.error('[Purchases] Purchase failed:', error);
    return { success: false, error: errorMessage(error, 'Purchase failed') };
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
  } catch (error: unknown) {
    console.error('[Purchases] Restore failed:', error);
    return { success: false, error: errorMessage(error, 'Restore failed') };
  }
}

/**
 * Get current customer info / entitlements
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  const defaultInfo: CustomerInfo = {
    planId: 'free',
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

    const isFounding = activeEntitlements.includes(ENTITLEMENTS.FOUNDING_PRO);
    const isPro = isFounding || activeEntitlements.includes(ENTITLEMENTS.PRO);
    const isCore = isPro || activeEntitlements.includes(ENTITLEMENTS.CORE) || activeEntitlements.includes(ENTITLEMENTS.PREMIUM_LEGACY);
    return {
      planId: isFounding ? 'founding_pro' : isPro ? 'pro' : isCore ? 'core' : 'free',
      isPremium: isCore,
      isPro,
      activeEntitlements,
      expirationDate: customerInfo.entitlements.active?.founding_pro?.expirationDate ||
                      customerInfo.entitlements.active?.pro?.expirationDate ||
                      customerInfo.entitlements.active?.core?.expirationDate ||
                      customerInfo.entitlements.active?.premium?.expirationDate,
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
 * Check if we should use native IAP vs web billing
 * On iOS: Must use IAP for digital content (App Store rules)
 * On Android: Can use either, but IAP is recommended
 * On Web: Use Paddle
 */
export function shouldUseNativeIAP(): boolean {
  return isNative() && (isIOS() || isAndroid());
}
