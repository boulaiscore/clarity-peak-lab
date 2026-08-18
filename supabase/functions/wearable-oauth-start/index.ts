import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthedUser, unauthorizedResponse } from "../_shared/auth.ts";
import {
  isDirectProvider,
  oauthCallbackUrl,
  providerAuthorizeUrl,
} from "../_shared/wearableProviders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function allowedReturnUrl(requested: unknown, origin: string | null): string {
  if (requested === "looma://wearable-connected") return requested;
  if (!origin) throw new Error("Missing app origin");
  const url = new URL(origin);
  const hostname = url.hostname.toLowerCase();
  const allowed = hostname === "localhost" || hostname === "127.0.0.1" ||
    hostname === "neurolooplabs.com" || hostname.endsWith(".neurolooplabs.com") ||
    hostname.endsWith(".lovable.app") || hostname.endsWith(".lovableproject.com");
  if (!allowed) throw new Error("Unsupported app origin");
  return `${url.origin}/#/app/wearable`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const user = await getAuthedUser(req);
    if (!user) return unauthorizedResponse(corsHeaders);
    const body = await req.json().catch(() => ({}));
    if (!isDirectProvider(body.provider)) {
      return new Response(JSON.stringify({ error: "Unsupported wearable provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const returnUrl = allowedReturnUrl(body.returnUrl, req.headers.get("origin"));
    const state = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-", "")}`;
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { error } = await service.from("wearable_oauth_states").insert({
      state,
      user_id: user.id,
      provider: body.provider,
      return_url: returnUrl,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    if (error) throw error;

    const authorizationUrl = providerAuthorizeUrl(body.provider, oauthCallbackUrl(), state);
    return new Response(JSON.stringify({ authorizationUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start wearable connection";
    const status = message.includes("not configured") || message.includes("encryption") ? 503 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

