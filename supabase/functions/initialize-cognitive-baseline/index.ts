/**
 * ============================================
 * INITIALIZE COGNITIVE BASELINE
 * ============================================
 * 
 * Called after onboarding to create initial baseline record.
 * Also updates baseline when user has enough data (21+ days).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`[initialize-cognitive-baseline] Processing user ${userId}`);

    // Get user profile for age
    const { data: profile } = await supabase
      .from("profiles")
      .select("age, created_at")
      .eq("user_id", userId)
      .maybeSingle();

    const chronoAge = profile?.age ?? 30;
    const onboardingDate = profile?.created_at 
      ? new Date(profile.created_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Check if baseline already exists
    const { data: existingBaseline } = await supabase
      .from("user_cognitive_baselines")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Get daily snapshots count
    const { data: snapshots, error: snapError } = await supabase
      .from("daily_metric_snapshots")
      .select("snapshot_date, ae, ra, ct, in_score, s2, reasoning_quality")
      .eq("user_id", userId)
      .order("snapshot_date", { ascending: true });

    if (snapError) throw snapError;

    const daysWithData = snapshots?.filter((s) => {
      const skills = [s.ae, s.ra, s.ct, s.in_score, s.s2].filter((v) => v !== null);
      return skills.length > 0;
    }) || [];

    console.log(`User has ${daysWithData.length} days with data`);

    // Determine if baseline should be calibrated (21+ days)
    const isCalibrated = daysWithData.length >= 21;

    // Calculate baseline scores if we have data
    let baselineScore90d: number | null = null;
    let baselineRq90d: number | null = null;

    if (daysWithData.length >= 10) {
      // Use available data for baseline
      const dailyAvgs = daysWithData.map((snap) => {
        const skills = [snap.ae, snap.ra, snap.ct, snap.in_score, snap.s2]
          .filter((v): v is number => v !== null)
          .map(Number);
        return {
          avg: skills.length > 0 ? skills.reduce((a, b) => a + b, 0) / skills.length : null,
          rq: snap.reasoning_quality != null ? Number(snap.reasoning_quality) : null,
        };
      }).filter((d) => d.avg !== null);

      if (dailyAvgs.length >= 10) {
        baselineScore90d = dailyAvgs.reduce((a, b) => a + b.avg!, 0) / dailyAvgs.length;
        
        const rqValues = dailyAvgs.filter((d) => d.rq !== null);
        if (rqValues.length >= 10) {
          baselineRq90d = rqValues.reduce((a, b) => a + b.rq!, 0) / rqValues.length;
        }
      }
    }

    // Calculate baseline dates
    const baselineStartDate = new Date(onboardingDate);
    baselineStartDate.setDate(baselineStartDate.getDate() + 14);
    
    const baselineEndDate = new Date(onboardingDate);
    baselineEndDate.setDate(baselineEndDate.getDate() + 90);

    const baselineData = {
      user_id: userId,
      chrono_age_at_onboarding: chronoAge,
      baseline_score_90d: baselineScore90d !== null ? Math.round(baselineScore90d * 10) / 10 : null,
      baseline_rq_90d: baselineRq90d !== null ? Math.round(baselineRq90d * 10) / 10 : null,
      baseline_start_date: baselineStartDate.toISOString().split("T")[0],
      baseline_end_date: baselineEndDate.toISOString().split("T")[0],
      is_baseline_calibrated: isCalibrated,
      updated_at: new Date().toISOString(),
    };

    if (existingBaseline) {
      // Update existing baseline
      const { error: updateError } = await supabase
        .from("user_cognitive_baselines")
        .update(baselineData)
        .eq("user_id", userId);

      if (updateError) throw updateError;
      console.log(`Updated baseline for user ${userId}`);
    } else {
      // Insert new baseline
      const { error: insertError } = await supabase
        .from("user_cognitive_baselines")
        .insert(baselineData);

      if (insertError) throw insertError;
      console.log(`Created baseline for user ${userId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        isCalibrated,
        daysWithData: daysWithData.length,
        baselineScore90d,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[initialize-cognitive-baseline] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
