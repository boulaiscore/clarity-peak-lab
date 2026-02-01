/**
 * ============================================
 * COMPUTE COGNITIVE AGE DAILY (v2)
 * ============================================
 * 
 * Edge function triggered daily via pg_cron.
 * Implements Cognitive Age v2 formula:
 * - 4 variables (AE, RA, CT, IN) × 25% weight (no S2 double-counting)
 * - 180d main window for slow-moving age
 * - 30d window for Pace calculation
 * - Daily streak tracking for regression warnings
 * - Cumulative regression penalty (max 1/month)
 * 
 * Formula:
 * perf = 0.25 * (AE + RA + CT + IN)
 * improvement = perf_180d - baseline_perf
 * rqMultiplier = 0.85 + 0.15 * (RQ / 100)
 * ageDelta = -(improvement / 10) * rqMultiplier
 * cognitiveAge = clamp(baselineChronAge + ageDelta + penaltyYears, chronAge ± 15)
 * pace = clamp(1 - ((perf_30d - perf_180d) / 10), 0.5, 2.5)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==========================================
// CONFIGURATION
// ==========================================

const CFG = {
  pointsPerYear: 10,
  rqMin: 0.85,
  rqMax: 1.0,
  shortWindowDays: 30,
  longWindowDays: 180,
  regressionWindowDays: 21,
  regressionThresholdPoints: 10,
  regressionConsecutiveDays: 21,
  regressionCooldownDays: 31,
  capYears: 15,
  engagementTargetSessions30d: 21,
  preWarningStartDays: 14,
};

// ==========================================
// TYPES
// ==========================================

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
  reasoning_quality: number | null;
}

interface PreviousDailyRecord {
  regression_streak_days: number;
}

interface WeeklyRecord {
  regression_penalty_years: number;
  last_regression_trigger_at: string | null;
}

// ==========================================
// HELPERS
// ==========================================

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate daily cognitive performance without S2 double-counting
 * perf = 0.25 * (AE + RA + CT + IN)
 */
function calcDailyPerf(ae: number | null, ra: number | null, ct: number | null, inScore: number | null): number | null {
  const skills = [ae, ra, ct, inScore].filter((v): v is number => v !== null);
  if (skills.length < 2) return null; // Need at least 2 skills
  return avg(skills);
}

/**
 * Calculate rolling average from an array of values
 */
function rollingAvg(values: (number | null)[], days: number): number | null {
  const validValues = values.slice(0, days).filter((v): v is number => v !== null);
  if (validValues.length < Math.min(10, days / 3)) return null; // Need minimum data
  return avg(validValues);
}

// ==========================================
// MAIN HANDLER
// ==========================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    console.log(`[compute-cognitive-age-daily] Starting daily computation for ${todayStr}...`);

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

    let processed = 0;
    let errors = 0;

    for (const baseline of baselines as UserBaseline[]) {
      try {
        const userId = baseline.user_id;
        const chronoAge = Number(baseline.chrono_age_at_onboarding) || 30;
        const baselinePerf = baseline.baseline_score_90d ? Number(baseline.baseline_score_90d) : null;

        // 2) Fetch last 180 days of snapshots
        const windowStart = new Date(today);
        windowStart.setUTCDate(today.getUTCDate() - CFG.longWindowDays);
        const windowStartStr = windowStart.toISOString().split("T")[0];

        const { data: snapshots, error: snapError } = await supabase
          .from("daily_metric_snapshots")
          .select("snapshot_date, ae, ra, ct, in_score, reasoning_quality")
          .eq("user_id", userId)
          .gte("snapshot_date", windowStartStr)
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

        // 3) Calculate daily performance values (no S2 double-counting)
        const perfValues: (number | null)[] = [];
        const rqValues: (number | null)[] = [];
        
        for (const snap of snapshots as DailySnapshot[]) {
          const perf = calcDailyPerf(snap.ae, snap.ra, snap.ct, snap.in_score);
          perfValues.push(perf);
          rqValues.push(snap.reasoning_quality != null ? Number(snap.reasoning_quality) : null);
        }

        // 4) Calculate rolling averages
        const perfDaily = perfValues[0];
        const perf21d = rollingAvg(perfValues, CFG.regressionWindowDays);
        const perf30d = rollingAvg(perfValues, CFG.shortWindowDays);
        const perf180d = rollingAvg(perfValues, CFG.longWindowDays);
        const rqToday = rqValues[0] ?? 50;

        // 5) Get previous day's streak
        const { data: previousDaily } = await supabase
          .from("user_cognitive_age_daily")
          .select("regression_streak_days")
          .eq("user_id", userId)
          .lt("calc_date", todayStr)
          .order("calc_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        const prevStreak = (previousDaily as PreviousDailyRecord | null)?.regression_streak_days ?? 0;

        // 6) Check if below regression threshold
        const belowThreshold = baselinePerf !== null && perf21d !== null 
          ? perf21d <= (baselinePerf - CFG.regressionThresholdPoints)
          : false;
        
        const newStreak = belowThreshold ? prevStreak + 1 : 0;

        // 7) Get weekly record for penalty tracking
        const { data: weeklyRecord } = await supabase
          .from("user_cognitive_age_weekly")
          .select("regression_penalty_years, last_regression_trigger_at")
          .eq("user_id", userId)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();

        const currentPenaltyYears = (weeklyRecord as WeeklyRecord | null)?.regression_penalty_years ?? 0;
        const lastTriggerAt = (weeklyRecord as WeeklyRecord | null)?.last_regression_trigger_at;

        // 8) Check if we can apply regression penalty (cooldown 31 days)
        const daysSinceLastTrigger = lastTriggerAt 
          ? Math.floor((today.getTime() - new Date(lastTriggerAt).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        const canApplyPenalty = daysSinceLastTrigger >= CFG.regressionCooldownDays;
        let didApplyPenalty = false;
        let newPenaltyYears = currentPenaltyYears;

        if (belowThreshold && newStreak >= CFG.regressionConsecutiveDays && canApplyPenalty) {
          newPenaltyYears = currentPenaltyYears + 1;
          didApplyPenalty = true;
          console.log(`User ${userId}: Regression penalty applied (+1 year, total: ${newPenaltyYears})`);
        }

        // 9) Calculate Cognitive Age (v2 formula)
        let cognitiveAge: number | null = null;
        let ageDeltaFromPerformance: number | null = null;
        let improvementLong: number | null = null;
        let rqMultiplier = 1.0;

        if (perf180d !== null && baselinePerf !== null) {
          improvementLong = perf180d - baselinePerf;
          rqMultiplier = CFG.rqMin + (CFG.rqMax - CFG.rqMin) * (rqToday / 100);
          ageDeltaFromPerformance = -(improvementLong / CFG.pointsPerYear) * rqMultiplier;
          
          const cognitiveAgeRaw = chronoAge + ageDeltaFromPerformance + newPenaltyYears;
          cognitiveAge = clamp(cognitiveAgeRaw, chronoAge - CFG.capYears, chronoAge + CFG.capYears);
        }

        // 10) Calculate Pace of Aging (0.5x - 2.5x)
        let paceOfAgingX: number | null = null;
        if (perf30d !== null && perf180d !== null) {
          const deltaShort = perf30d - perf180d;
          paceOfAgingX = clamp(1 - (deltaShort / CFG.pointsPerYear), 0.5, 2.5);
        }

        // 11) Calculate Engagement Index
        const { data: sessions30d } = await supabase
          .from("game_sessions")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const sessionsCount = sessions30d?.length ?? 0;
        const engagementIndex = clamp(sessionsCount / CFG.engagementTargetSessions30d, 0, 1);

        // 12) Build pre-regression warning
        let preRegressionWarning: object | null = null;
        if (belowThreshold && newStreak >= CFG.preWarningStartDays && newStreak < CFG.regressionConsecutiveDays) {
          const daysToRegression = CFG.regressionConsecutiveDays - newStreak;
          preRegressionWarning = {
            streakDays: newStreak,
            daysToRegression,
            message: `Performance is ≥${CFG.regressionThresholdPoints} pts below baseline for ${newStreak} days. ` +
              `If this continues for ${daysToRegression} more day(s), Cognitive Age will increase by +1 year.`,
          };
        }

        // 13) Determine regression risk level
        let regressionRisk = "low";
        if (newStreak >= CFG.regressionConsecutiveDays) {
          regressionRisk = "high";
        } else if (newStreak >= CFG.preWarningStartDays) {
          regressionRisk = "medium";
        }

        // 14) Upsert daily record
        const dailyData = {
          user_id: userId,
          calc_date: todayStr,
          perf_daily: perfDaily !== null ? Math.round(perfDaily * 10) / 10 : null,
          perf_21d: perf21d !== null ? Math.round(perf21d * 10) / 10 : null,
          perf_30d: perf30d !== null ? Math.round(perf30d * 10) / 10 : null,
          perf_180d: perf180d !== null ? Math.round(perf180d * 10) / 10 : null,
          below_threshold: belowThreshold,
          regression_streak_days: newStreak,
          rq_today: rqToday,
          sessions_today: 0, // Will be updated by session completion
        };

        const { error: dailyError } = await supabase
          .from("user_cognitive_age_daily")
          .upsert(dailyData, { onConflict: "user_id,calc_date" });

        if (dailyError) {
          console.error(`Error upserting daily for ${userId}:`, dailyError);
          errors++;
          continue;
        }

        // 15) Update weekly record (if Sunday or significant change)
        const dayOfWeek = today.getUTCDay();
        const isSunday = dayOfWeek === 0;
        
        if (isSunday || didApplyPenalty) {
          const weekStart = new Date(today);
          weekStart.setUTCDate(today.getUTCDate() - dayOfWeek);
          const weekStartStr = weekStart.toISOString().split("T")[0];

          const weeklyData = {
            user_id: userId,
            week_start: weekStartStr,
            cognitive_age: cognitiveAge !== null ? Math.round(cognitiveAge * 10) / 10 : null,
            score_90d: perf180d !== null ? Math.round(perf180d * 10) / 10 : null, // Using 180d as main score
            score_30d: perf30d !== null ? Math.round(perf30d * 10) / 10 : null,
            rq_30d: rqToday,
            improvement_points: improvementLong !== null ? Math.round(improvementLong * 10) / 10 : null,
            regression_risk: regressionRisk,
            regression_streak_days: newStreak,
            regression_triggered: didApplyPenalty,
            regression_penalty_years: newPenaltyYears,
            perf_short_30d: perf30d !== null ? Math.round(perf30d * 10) / 10 : null,
            perf_long_180d: perf180d !== null ? Math.round(perf180d * 10) / 10 : null,
            pace_of_aging_x: paceOfAgingX !== null ? Math.round(paceOfAgingX * 100) / 100 : null,
            engagement_index: Math.round(engagementIndex * 100) / 100,
            sessions_30d: sessionsCount,
            pre_regression_warning: preRegressionWarning,
            cap_applied: cognitiveAge !== null && baselinePerf !== null && 
              (cognitiveAge === chronoAge - CFG.capYears || cognitiveAge === chronoAge + CFG.capYears),
            last_regression_trigger_at: didApplyPenalty ? today.toISOString() : lastTriggerAt,
          };

          const { error: weeklyError } = await supabase
            .from("user_cognitive_age_weekly")
            .upsert(weeklyData, { onConflict: "user_id,week_start" });

          if (weeklyError) {
            console.error(`Error upserting weekly for ${userId}:`, weeklyError);
          }
        }

        processed++;
        console.log(
          `User ${userId}: CA=${cognitiveAge?.toFixed(1) ?? 'N/A'}, ` +
          `Pace=${paceOfAgingX?.toFixed(2) ?? 'N/A'}x, ` +
          `Streak=${newStreak}, Risk=${regressionRisk}`
        );

      } catch (userError) {
        console.error(`Error processing user:`, userError);
        errors++;
      }
    }

    console.log(`[compute-cognitive-age-daily] Completed. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({ success: true, processed, errors, date: todayStr }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[compute-cognitive-age-daily] Fatal error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
