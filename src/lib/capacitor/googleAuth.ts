/**
 * Google sign-in.
 *
 * Web/preview: the Lovable Cloud helper (popup + web_message) handles it.
 * Native (Capacitor WebView): popups are not available, so we run the standard
 * Supabase OAuth redirect inside the in-app browser and come back through the
 * `looma://auth/callback` deep link.
 */

import { isNative } from "@/lib/platformUtils";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export interface GoogleAuthResult {
  success: boolean;
  error?: string;
}

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    if (isNative()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "looma://auth/callback",
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error("[GoogleAuth] OAuth error:", error);
        return { success: false, error: error.message };
      }

      if (!data?.url) {
        return { success: false, error: "Could not start Google sign-in." };
      }

      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: data.url });
      // The session is established by the deep link handler.
      return { success: true };
    }

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Sign in with Google failed",
      };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("[GoogleAuth] Sign in failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sign in with Google failed",
    };
  }
}
