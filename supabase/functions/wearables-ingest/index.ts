import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WearableIngestPayload {
  date: string;
  source: string;
  hrvMs?: number | null;
  restingHr?: number | null;
  sleepDurationMin?: number | null;
  sleepEfficiency?: number | null;
  activityScore?: number | null;
  rawJson?: Record<string, unknown> | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const payload: WearableIngestPayload = await req.json();
    console.log("Received wearable data:", { userId: user.id, payload });

    // Validate required fields
    if (!payload.date || !payload.source) {
      return new Response(
        JSON.stringify({ error: "date and source are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert wearable snapshot
    const { data, error } = await supabase
      .from("wearable_snapshots")
      .upsert(
        {
          user_id: user.id,
          date: payload.date,
          source: payload.source,
          hrv_ms: payload.hrvMs ?? null,
          resting_hr: payload.restingHr ?? null,
          sleep_duration_min: payload.sleepDurationMin ?? null,
          sleep_efficiency: payload.sleepEfficiency ?? null,
          activity_score: payload.activityScore ?? null,
          raw_json: payload.rawJson ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,date,source" }
      )
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save wearable data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Saved wearable snapshot:", data);

    // Optionally trigger readiness recalculation here
    // For now, the client will handle this

    return new Response(
      JSON.stringify({ success: true, snapshot: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
