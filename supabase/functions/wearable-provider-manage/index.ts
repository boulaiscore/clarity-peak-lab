import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthedUser, unauthorizedResponse } from "../_shared/auth.ts";
import {
  decryptProviderToken,
  isDirectProvider,
  revokeProviderAccess,
} from "../_shared/wearableProviders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const user = await getAuthedUser(req);
  if (!user) return unauthorizedResponse(corsHeaders);
  try {
    const body = await req.json().catch(() => ({}));
    if (!isDirectProvider(body.provider)) throw new Error("Unsupported wearable provider");
    if (body.action !== "disconnect" && body.action !== "set_primary") throw new Error("Unsupported action");
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    if (body.action === "disconnect") {
      const { data: tokenRow } = await service.from("wearable_provider_tokens")
        .select("access_token_encrypted")
        .eq("user_id", user.id)
        .eq("provider", body.provider)
        .maybeSingle();
      if (tokenRow?.access_token_encrypted) {
        try {
          await revokeProviderAccess(
            body.provider,
            await decryptProviderToken(tokenRow.access_token_encrypted),
          );
        } catch (revokeError) {
          // Local deletion must still succeed so LOOMA immediately loses access.
          console.warn("Provider revoke failed; deleting local credentials", revokeError);
        }
      }
      const { error } = await service.from("wearable_provider_connections")
        .delete().eq("user_id", user.id).eq("provider", body.provider);
      if (error) throw error;
    } else {
      await service.from("wearable_provider_connections")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      const { error } = await service.from("wearable_provider_connections")
        .update({ is_primary: true, status: "connected", updated_at: new Date().toISOString() })
        .eq("user_id", user.id).eq("provider", body.provider);
      if (error) throw error;
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
