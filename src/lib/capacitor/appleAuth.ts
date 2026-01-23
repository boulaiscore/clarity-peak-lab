/**
 * Sign in with Apple integration for Capacitor
 * Required for App Store if app offers social login
 */

import { isIOS, isNative } from '@/lib/platformUtils';
import { supabase } from '@/integrations/supabase/client';

export interface AppleAuthResult {
  success: boolean;
  error?: string;
}

/**
 * Check if Sign in with Apple is available
 * Only available on iOS 13+ natively
 */
export function isAppleAuthAvailable(): boolean {
  return isIOS();
}

/**
 * Sign in with Apple using Supabase OAuth
 * Works on both native iOS and web
 */
export async function signInWithApple(): Promise<AppleAuthResult> {
  try {
    // Use Supabase OAuth for Apple Sign In
    // This works on both native (via in-app browser) and web
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: isNative() 
          ? 'nloop://auth/callback' 
          : `${window.location.origin}/#/auth`,
        skipBrowserRedirect: isNative(),
      },
    });

    if (error) {
      console.error('[AppleAuth] OAuth error:', error);
      return { success: false, error: error.message };
    }

    // On native, open the OAuth URL in the in-app browser
    if (isNative() && data.url) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url });
      
      // The auth callback will be handled by deep links
      return { success: true };
    }

    // On web, the redirect happens automatically
    return { success: true };
  } catch (error: any) {
    console.error('[AppleAuth] Sign in failed:', error);
    return { success: false, error: error.message || 'Sign in with Apple failed' };
  }
}

/**
 * Handle Apple auth callback from deep link
 */
export async function handleAppleAuthCallback(url: string): Promise<AppleAuthResult> {
  try {
    // Extract the tokens from the URL
    const urlObj = new URL(url.replace('nloop://', 'https://app.'));
    const accessToken = urlObj.searchParams.get('access_token');
    const refreshToken = urlObj.searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    }

    // Try to exchange the code if present
    const code = urlObj.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }

    return { success: false, error: 'No auth tokens found in callback' };
  } catch (error: any) {
    console.error('[AppleAuth] Callback handling failed:', error);
    return { success: false, error: error.message || 'Failed to process auth callback' };
  }
}
