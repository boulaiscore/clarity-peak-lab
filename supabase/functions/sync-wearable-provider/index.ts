import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthedUser, unauthorizedResponse } from "../_shared/auth.ts";
import {
  decryptProviderToken,
  encryptProviderToken,
  fetchProviderDays,
  isDirectProvider,
  refreshProviderToken,
  tokenScopes,
} from "../_shared/wearableProviders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const user = await getAuthedUser(req);
  if (!user) return unauthorizedResponse(corsHeaders);
  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  let provider: "whoop" | "oura" | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (!isDirectProvider(body.provider)) throw new Error("Unsupported wearable provider");
    provider = body.provider;
    const { data: tokenRow, error: tokenReadError } = await service
      .from("wearable_provider_tokens")
      .select("access_token_encrypted, refresh_token_encrypted, expires_at")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .maybeSingle();
    if (tokenReadError) throw tokenReadError;
    if (!tokenRow) throw new Error(`${provider.toUpperCase()} is not connected`);

    let accessToken = await decryptProviderToken(tokenRow.access_token_encrypted);
    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() <= Date.now() + 60_000) {
      if (!tokenRow.refresh_token_encrypted) throw new Error("Wearable authorization expired. Reconnect the device.");
      const refreshed = await refreshProviderToken(provider, await decryptProviderToken(tokenRow.refresh_token_encrypted));
      accessToken = refreshed.access_token;
      const scopes = tokenScopes(provider, refreshed);
      await service.from("wearable_provider_tokens").update({
        access_token_encrypted: await encryptProviderToken(refreshed.access_token),
        refresh_token_encrypted: refreshed.refresh_token
          ? await encryptProviderToken(refreshed.refresh_token)
          : tokenRow.refresh_token_encrypted,
        expires_at: refreshed.expires_in
          ? new Date(Date.now() + Math.max(60, refreshed.expires_in - 60) * 1000).toISOString()
          : null,
        scopes,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id).eq("provider", provider);
    }

    const days = await fetchProviderDays(provider, accessToken, 7);
    if (days.length > 0) {
      const { error: upsertError } = await service.from("wearable_snapshots").upsert(
        days.map((day) => ({
          user_id: user.id,
          date: day.date,
          source: day.source,
          hrv_ms: day.hrvMs,
          resting_hr: day.restingHr,
          sleep_duration_min: day.sleepDurationMin,
          sleep_efficiency: day.sleepEfficiency,
          activity_score: day.activityScore,
          raw_json: day.rawJson,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,date,source" },
      );
      if (upsertError) throw upsertError;
    }
    const syncedAt = new Date().toISOString();
    await service.from("wearable_provider_connections").update({
      status: "connected",
      last_sync_at: syncedAt,
      last_error: null,
      updated_at: syncedAt,
    }).eq("user_id", user.id).eq("provider", provider);
    return new Response(JSON.stringify({ success: true, provider, days: days.length, syncedAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wearable sync failed";
    if (provider) {
      await service.from("wearable_provider_connections").update({
        status: "error",
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id).eq("provider", provider);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

