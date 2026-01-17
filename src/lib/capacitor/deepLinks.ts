import { App, URLOpenListenerEvent } from '@capacitor/app';
import { isNative, parseDeepLink } from '@/lib/platformUtils';

type DeepLinkHandler = (path: string, params: URLSearchParams) => void;

let deepLinkHandler: DeepLinkHandler | null = null;
let isInitialized = false;

/**
 * Initialize deep link listener for native platforms
 * Should be called once at app startup
 */
export async function initializeDeepLinks(handler: DeepLinkHandler): Promise<void> {
  if (!isNative()) {
    console.log('[deepLinks] Web platform, skipping deep link initialization');
    return;
  }

  if (isInitialized) {
    console.log('[deepLinks] Already initialized');
    deepLinkHandler = handler;
    return;
  }

  deepLinkHandler = handler;

  try {
    // Listen for app URL open events
    await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('[deepLinks] App opened with URL:', event.url);
      
      const parsed = parseDeepLink(event.url);
      if (parsed && deepLinkHandler) {
        console.log('[deepLinks] Parsed deep link:', parsed);
        deepLinkHandler(parsed.path, parsed.params);
      }
    });

    // Check if app was opened with a URL (cold start)
    const launchUrl = await App.getLaunchUrl();
    if (launchUrl?.url) {
      console.log('[deepLinks] App launched with URL:', launchUrl.url);
      const parsed = parseDeepLink(launchUrl.url);
      if (parsed && deepLinkHandler) {
        // Delay to ensure router is ready
        setTimeout(() => {
          deepLinkHandler?.(parsed.path, parsed.params);
        }, 500);
      }
    }

    isInitialized = true;
    console.log('[deepLinks] Deep link listener initialized');
  } catch (error) {
    console.error('[deepLinks] Failed to initialize deep links:', error);
  }
}

/**
 * Handle Supabase auth deep link
 * Returns true if the URL was an auth callback
 */
export function isAuthDeepLink(path: string, params: URLSearchParams): boolean {
  // Check for auth-related paths
  if (path.includes('/auth')) {
    return true;
  }
  
  // Check for Supabase auth tokens in params
  if (params.has('access_token') || params.has('refresh_token') || params.has('error')) {
    return true;
  }
  
  return false;
}

/**
 * Handle Stripe payment deep link
 * Returns true if the URL was a payment callback
 */
export function isPaymentDeepLink(path: string): boolean {
  return path.includes('payment-success') || 
         path.includes('payment-cancel') ||
         path.includes('success=true') ||
         path.includes('canceled=true');
}

/**
 * Clean up deep link listeners
 */
export async function removeDeepLinkListeners(): Promise<void> {
  if (!isNative()) return;
  
  try {
    await App.removeAllListeners();
    isInitialized = false;
    deepLinkHandler = null;
    console.log('[deepLinks] Deep link listeners removed');
  } catch (error) {
    console.error('[deepLinks] Failed to remove listeners:', error);
  }
}
