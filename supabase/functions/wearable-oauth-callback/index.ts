import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  encryptProviderToken,
  exchangeAuthorizationCode,
  isDirectProvider,
  oauthCallbackUrl,
  tokenScopes,
} from "../_shared/wearableProviders.ts";

function redirect(returnUrl: string, provider: string, status: "connected" | "error", detail?: string) {
  const separator = returnUrl.includes("?") ? "&" : "?";
  const params = new URLSearchParams({ provider, status });
  if (detail) params.set("detail", detail.slice(0, 180));
  return Response.redirect(`${returnUrl}${separator}${params}`, 302);
}

serve(async (req) => {
  const url = new URL(req.url);
  const stateValue = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  if (!stateValue) return new Response("Invalid wearable connection state", { status: 400 });
  const { data: state } = await service
    .from("wearable_oauth_states")
    .delete()
    .eq("state", stateValue)
    .gt("expires_at", new Date().toISOString())
    .select("user_id, provider, return_url")
    .maybeSingle();
  if (!state || !isDirectProvider(state.provider)) {
    return new Response("Wearable connection expired. Return to LOOMA and try again.", { status: 400 });
  }
  if (oauthError || !code) return redirect(state.return_url, state.provider, "error", oauthError || "Authorization cancelled");

  try {
    const token = await exchangeAuthorizationCode(state.provider, code, oauthCallbackUrl());
    const scopes = tokenScopes(state.provider, token);
    const accessEncrypted = await encryptProviderToken(token.access_token);
    const refreshEncrypted = token.refresh_token ? await encryptProviderToken(token.refresh_token) : null;
    const expiresAt = token.expires_in
      ? new Date(Date.now() + Math.max(60, token.expires_in - 60) * 1000).toISOString()
      : null;

    const { data: primary } = await service
      .from("wearable_provider_connections")
      .select("provider")
      .eq("user_id", state.user_id)
      .eq("is_primary", true)
      .maybeSingle();

    const { error: connectionError } = await service.from("wearable_provider_connections").upsert({
      user_id: state.user_id,
      provider: state.provider,
      status: "connected",
      scopes,
      is_primary: primary == null || primary.provider === state.provider,
      connected_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider" });
    if (connectionError) throw connectionError;

    const { error: tokenError } = await service.from("wearable_provider_tokens").upsert({
      user_id: state.user_id,
      provider: state.provider,
      access_token_encrypted: accessEncrypted,
      refresh_token_encrypted: refreshEncrypted,
      expires_at: expiresAt,
      token_type: token.token_type || "Bearer",
      scopes,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider" });
    if (tokenError) throw tokenError;
    return redirect(state.return_url, state.provider, "connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    await service.from("wearable_provider_connections").upsert({
      user_id: state.user_id,
      provider: state.provider,
      status: "error",
      is_primary: false,
      last_error: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,provider" });
    return redirect(state.return_url, state.provider, "error", message);
  }
});

