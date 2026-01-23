import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

/**
 * Check if running on native platform (iOS or Android)
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * URL scheme for deep linking
 */
export const URL_SCHEME = 'nloop';

/**
 * Get platform-aware redirect URL
 * On native: uses custom URL scheme (nloop://)
 * On web: uses window.location.origin
 */
export function getRedirectUrl(path: string = ''): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  if (isNative()) {
    // For native apps, use custom URL scheme
    return `${URL_SCHEME}:/${normalizedPath}`;
  }
  
  // For web, use origin
  return `${window.location.origin}/#${normalizedPath}`;
}

/**
 * Get the base URL for Supabase auth redirects
 */
export function getAuthRedirectUrl(): string {
  return getRedirectUrl('/auth');
}

/**
 * Get redirect URL for password reset
 */
export function getPasswordResetRedirectUrl(): string {
  return getRedirectUrl('/auth?reset=true');
}

/**
 * Get redirect URLs for Stripe checkout
 */
export function getStripeRedirectUrls(successPath: string, cancelPath: string): {
  successUrl: string;
  cancelUrl: string;
} {
  return {
    successUrl: getRedirectUrl(successPath),
    cancelUrl: getRedirectUrl(cancelPath),
  };
}

/**
 * Parse a deep link URL and extract the path
 */
export function parseDeepLink(url: string): { path: string; params: URLSearchParams } | null {
  try {
    // Handle neuroloop:// scheme
    if (url.startsWith(`${URL_SCHEME}://`)) {
      const withoutScheme = url.replace(`${URL_SCHEME}://`, '');
      const [path, query] = withoutScheme.split('?');
      return {
        path: path.startsWith('/') ? path : `/${path}`,
        params: new URLSearchParams(query || ''),
      };
    }
    
    // Handle http/https URLs (for web)
    const urlObj = new URL(url);
    return {
      path: urlObj.hash ? urlObj.hash.slice(1) : urlObj.pathname,
      params: urlObj.searchParams,
    };
  } catch {
    console.error('[platformUtils] Failed to parse deep link:', url);
    return null;
  }
}
