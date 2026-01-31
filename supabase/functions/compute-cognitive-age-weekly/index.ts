/**
 * ============================================
 * COMPUTE COGNITIVE AGE WEEKLY
 * ============================================
 * 
 * Edge function triggered weekly (Sunday 23:00 user timezone)
 * Calculates Cognitive Age for all users and stores in user_cognitive_age_weekly.
 * 
 * Formula:
 * cognitive_age = chrono_age - (improvement_points / 10) * effective_multiplier
 * 
 * Where:
 * - improvement_points = score_90d - baseline_score_90d
 * - effective_multiplier = rq_multiplier if improvement > 0, else 1.0
 * - rq_multiplier = 0.85 + 0.15 * (rq_30d / 100), clamped to [0.85, 1.00]
 * - Cap: ±15 years from chrono_age
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserBaseline {
  user_id: string;
  chrono_age_at_onboarding: number;
  baseline_score_90d: number | null;
  baseline_rq_90d: number | null;
  is_baseline_calibrated: boolean;
}

interface DailySnapshot {
  snapshot_date: string;
  ae: number | null;
  ra: number | null;
  ct: number | null;
  in_score: number | null;
  s2: number | null;
  reasoning_quality: number | null;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[compute-cognitive-age-weekly] Starting weekly computation...");

    // 1) Get all users with baselines
    const { data: baselines, error: baselineError } = await supabase
      .from("user_cognitive_baselines")
      .select("*");

    if (baselineError) {
      console.error("Error fetching baselines:", baselineError);
      throw baselineError;
    }

    if (!baselines || baselines.length === 0) {
      console.log("No users with baselines found.");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${baselines.length} users...`);

    // Calculate week_start (previous Sunday or today if Sunday)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - dayOfWeek);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    let processed = 0;
    let errors = 0;

    for (const baseline of baselines as UserBaseline[]) {
      try {
        const userId = baseline.user_id;
        const chronoAge = Number(baseline.chrono_age_at_onboarding) || 30;
        const baselineScore = baseline.baseline_score_90d ? Number(baseline.baseline_score_90d) : null;
        const baselineRq = baseline.baseline_rq_90d ? Number(baseline.baseline_rq_90d) : null;

        // 2) Fetch last 90 days of snapshots for this user
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setUTCDate(now.getUTCDate() - 90);
        const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

        const { data: snapshots, error: snapError } = await supabase
          .from("daily_metric_snapshots")
          .select("snapshot_date, ae, ra, ct, in_score, s2, reasoning_quality")
          .eq("user_id", userId)
          .gte("snapshot_date", ninetyDaysAgoStr)
          .order("snapshot_date", { ascending: false });

        if (snapError) {
          console.error(`Error fetching snapshots for ${userId}:`, snapError);
          errors++;
          continue;
        }

        if (!snapshots || snapshots.length < 10) {
          console.log(`User ${userId}: Not enough data (${snapshots?.length || 0} days), skipping.`);
          continue;
        }

        // 3) Calculate rolling averages
        const dailySkillAvgs: { date: string; avg: number; rq: number | null }[] = [];

        for (const snap of snapshots as DailySnapshot[]) {
          const skills = [snap.ae, snap.ra, snap.ct, snap.in_score, snap.s2]
            .filter((v): v is number => v !== null)
            .map(Number);

          if (skills.length > 0) {
            dailySkillAvgs.push({
              date: snap.snapshot_date,
              avg: skills.reduce((a, b) => a + b, 0) / skills.length,
              rq: snap.reasoning_quality != null ? Number(snap.reasoning_quality) : null,
            });
          }
        }

        // Split into 30d and 90d windows
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setUTCDate(now.getUTCDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

        const last30 = dailySkillAvgs.filter((d) => d.date >= thirtyDaysAgoStr);
        const last90 = dailySkillAvgs;

        // Calculate score_30d (need min 10 days)
        let score30d: number | null = null;
        if (last30.length >= 10) {
          score30d = last30.reduce((a, b) => a + b.avg, 0) / last30.length;
        }

        // Calculate score_90d (need min 21 days)
        let score90d: number | null = null;
        if (last90.length >= 21) {
          score90d = last90.reduce((a, b) => a + b.avg, 0) / last90.length;
        }

        // Calculate RQ averages
        const rqValues30 = last30.filter((d) => d.rq !== null).map((d) => d.rq!);
        const rqValues90 = last90.filter((d) => d.rq !== null).map((d) => d.rq!);

        let rq30d: number | null = null;
        if (rqValues30.length >= 10) {
          rq30d = rqValues30.reduce((a, b) => a + b, 0) / rqValues30.length;
        }

        let rq90d: number | null = null;
        if (rqValues90.length >= 21) {
          rq90d = rqValues90.reduce((a, b) => a + b, 0) / rqValues90.length;
        }

        // 4) Calculate improvement points
        let improvementPoints: number | null = null;
        if (score90d !== null && baselineScore !== null) {
          improvementPoints = score90d - baselineScore;
        }

        // 5) Calculate RQ multiplier (asymmetric)
        let effectiveMultiplier = 1.0;
        if (improvementPoints !== null && improvementPoints > 0 && rq30d !== null) {
          // Only apply multiplier for positive improvement
          const rqNormalized = Math.min(100, Math.max(0, rq30d));
          effectiveMultiplier = 0.85 + 0.15 * (rqNormalized / 100);
          effectiveMultiplier = Math.min(1.0, Math.max(0.85, effectiveMultiplier));
        }

        // 6) Calculate cognitive age
        let cognitiveAgeRaw = chronoAge;
        if (improvementPoints !== null) {
          cognitiveAgeRaw = chronoAge - (improvementPoints / 10) * effectiveMultiplier;
        }

        // Cap ±15 years
        const minAge = chronoAge - 15;
        const maxAge = chronoAge + 15;
        const cognitiveAgeCapped = Math.min(maxAge, Math.max(minAge, cognitiveAgeRaw));
        const capApplied = cognitiveAgeCapped !== cognitiveAgeRaw;

        // 7) Calculate regression streak
        let regressionStreakDays = 0;
        if (baselineScore !== null) {
          const threshold = baselineScore - 10;
          for (const day of dailySkillAvgs) {
            if (day.avg <= threshold) {
              regressionStreakDays++;
            } else {
              break;
            }
          }
        }

        // Determine regression risk
        let regressionRisk = "low";
        if (regressionStreakDays >= 21) {
          regressionRisk = "high";
        } else if (regressionStreakDays >= 10) {
          regressionRisk = "medium";
        }

        // 8) Check if +1 year regression should be applied
        let regressionTriggered = false;
        let finalCognitiveAge = cognitiveAgeCapped;

        if (regressionStreakDays >= 21) {
          // Check last trigger date
          const { data: lastWeekly } = await supabase
            .from("user_cognitive_age_weekly")
            .select("last_regression_trigger_at")
            .eq("user_id", userId)
            .order("week_start", { ascending: false })
            .limit(1)
            .maybeSingle();

          const lastTrigger = lastWeekly?.last_regression_trigger_at
            ? new Date(lastWeekly.last_regression_trigger_at)
            : null;

          const daysSinceLastTrigger = lastTrigger
            ? Math.floor((now.getTime() - lastTrigger.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysSinceLastTrigger >= 30) {
            finalCognitiveAge = Math.min(maxAge, cognitiveAgeCapped + 1);
            regressionTriggered = true;
            console.log(`User ${userId}: Regression triggered (+1 year)`);
          }
        }

        // 9) Upsert weekly snapshot
        const weeklyData = {
          user_id: userId,
          week_start: weekStartStr,
          cognitive_age: Math.round(finalCognitiveAge * 10) / 10,
          score_90d: score90d !== null ? Math.round(score90d * 10) / 10 : null,
          score_30d: score30d !== null ? Math.round(score30d * 10) / 10 : null,
          rq_30d: rq30d !== null ? Math.round(rq30d * 10) / 10 : null,
          rq_90d: rq90d !== null ? Math.round(rq90d * 10) / 10 : null,
          improvement_points: improvementPoints !== null ? Math.round(improvementPoints * 10) / 10 : null,
          regression_risk: regressionRisk,
          regression_streak_days: regressionStreakDays,
          regression_triggered: regressionTriggered,
          cap_applied: capApplied,
          last_regression_trigger_at: regressionTriggered ? now.toISOString() : undefined,
        };

        const { error: upsertError } = await supabase
          .from("user_cognitive_age_weekly")
          .upsert(weeklyData, { onConflict: "user_id,week_start" });

        if (upsertError) {
          console.error(`Error upserting weekly for ${userId}:`, upsertError);
          errors++;
          continue;
        }

        processed++;
        console.log(`User ${userId}: Cognitive Age = ${finalCognitiveAge.toFixed(1)}, Risk = ${regressionRisk}`);

      } catch (userError) {
        console.error(`Error processing user:`, userError);
        errors++;
      }
    }

    console.log(`[compute-cognitive-age-weekly] Completed. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ success: true, processed, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[compute-cognitive-age-weekly] Fatal error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
