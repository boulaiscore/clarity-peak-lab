// Background phone-use ingest.
// POST {action:"register"} with the user's JWT → returns a device token (only its hash is stored).
// POST {action:"ingest", ...aggregate} with header x-device-token → upserts today's aggregate.
// Only six daily counts are accepted; app names never reach this function.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const count = z.number().int().min(0).max(100_000).nullable();
const IngestSchema = z.object({
  action: z.literal("ingest"),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attentionUsageMin: z.number().int().min(0).max(1440),
  activeAppCount: z.number().int().min(0).max(50),
  lastAttentionUseAt: z.number().int().positive().nullable(),
  attentionSessionCount: count,
  attentionSwitchCount: count,
  briefSessionCount: count,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.action === "register" || body.action === "revoke") {
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { data: userData, error } = await admin.auth.getUser(auth);
    if (error || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    if (body.action === "revoke") {
      await admin.from("device_ingest_tokens").delete().eq("user_id", userId);
      return json({ ok: true });
    }

    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error: upsertError } = await admin.from("device_ingest_tokens").upsert({
      user_id: userId,
      token_hash: await sha256(token),
      platform: "android",
      created_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (upsertError) return json({ error: "Could not register device" }, 500);
    return json({ token });
  }

  const parsed = IngestSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const token = req.headers.get("x-device-token");
  if (!token || token.length !== 64) return json({ error: "Unauthorized" }, 401);

  const { data: owner } = await admin
    .from("device_ingest_tokens")
    .select("user_id")
    .eq("token_hash", await sha256(token))
    .maybeSingle();
  if (!owner) return json({ error: "Unauthorized" }, 401);

  const d = parsed.data;
  const { error } = await admin.from("device_usage_snapshots").upsert({
    user_id: owner.user_id,
    snapshot_date: d.snapshotDate,
    source: "android_usage_stats",
    coverage: "attention_apps",
    attention_usage_min: d.attentionUsageMin,
    active_app_count: d.activeAppCount,
    last_attention_use_at: d.lastAttentionUseAt ? new Date(d.lastAttentionUseAt).toISOString() : null,
    attention_session_count: d.attentionSessionCount,
    attention_switch_count: d.attentionSwitchCount,
    brief_session_count: d.briefSessionCount,
    permission_state: "granted",
    confidence: 0.85,
  }, { onConflict: "user_id,snapshot_date,source" });
  if (error) return json({ error: "Could not store aggregate" }, 500);

  await admin.from("device_ingest_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("user_id", owner.user_id);
  return json({ ok: true });
});
