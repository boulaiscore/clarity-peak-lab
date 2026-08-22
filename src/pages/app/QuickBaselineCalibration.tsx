/**
 * Quick Baseline Calibration Wizard (v1.3)
 * 
 * Premium, dark, minimal full-screen wizard to compute baseline skill scores.
 * NO visible timers for System 2 drills.
 * 
 * Flow: Intro → AE drill → RA drill → CT drill → IN drill → Results
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackProductEvent } from "@/lib/productAnalytics";
import { useQueryClient } from "@tanstack/react-query";

// Drill components
import { CalibrationIntro } from "@/components/calibration/CalibrationIntro";
import { SignalLockDrill } from "@/components/calibration/SignalLockDrill";
import { LinkSprintDrill } from "@/components/calibration/LinkSprintDrill";
import { CausalLensDrill } from "@/components/calibration/CausalLensDrill";
import { ConstraintSolveDrill } from "@/components/calibration/ConstraintSolveDrill";
import { CalibrationResults } from "@/components/calibration/CalibrationResults";

// Baseline engine
import {
  calculateCalibrationOverall,
  computeDemographicBaseline,
  computeEffectiveBaseline,
  mapDrillScoresToCalibration,
  prepareBaselineDbPayload,
  prepareInitialSkillsPayload,
  rebaseSkillToMeasuredBaseline,
  type CalibrationBaseline,
  type DemographicInput,
} from "@/lib/baselineEngine";

type CalibrationStep = "intro" | "AE" | "RA" | "CT" | "IN" | "results";

interface DrillResult {
  correct: number;
  total: number;
  avgReactionMs?: number;
  sessionScore: number;
  startedAt: string;
  finishedAt: string;
}

interface CalibrationState {
  AE?: DrillResult;
  RA?: DrillResult;
  CT?: DrillResult;
  IN?: DrillResult;
}

function describeCalibrationError(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "";
  return /network|fetch|offline/i.test(message)
    ? "Check your connection, then tap Continue to retry."
    : "Your results are still here. Tap Continue to retry.";
}

export default function QuickBaselineCalibration() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<CalibrationStep>("intro");
  const [results, setResults] = useState<CalibrationState>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleIntroComplete = () => {
    trackProductEvent("calibration_started");
    setStep("AE");
  };

  const handleDrillComplete = useCallback((drillType: "AE" | "RA" | "CT" | "IN", result: DrillResult) => {
    setResults(prev => ({ ...prev, [drillType]: result }));
    
    // Move to next step
    const nextSteps: Record<string, CalibrationStep> = {
      AE: "RA",
      RA: "CT",
      CT: "IN",
      IN: "results",
    };
    setStep(nextSteps[drillType]);
  }, []);

  const handleSaveAndEnter = async () => {
    if (!user?.id || !results.AE || !results.RA || !results.CT || !results.IN) {
      toast.error("Calibration incomplete");
      return;
    }

    setIsSaving(true);

    try {
      // Get drill scores
      const calibrationScores: CalibrationBaseline = mapDrillScoresToCalibration({
        AE: results.AE.sessionScore,
        RA: results.RA.sessionScore,
        CT: results.CT.sessionScore,
        IN: results.IN.sessionScore,
      });
      
      // Compute demographic baseline from user profile
      const demographicInput: DemographicInput = {
        birthDate: user.birthDate ?? null,
        age: user.age ?? null,
        educationLevel: user.educationLevel ?? null,
        workType: user.workType ?? null,
      };
      
      const demographic = computeDemographicBaseline(demographicInput);
      
      // Compute effective baseline: λ × calibration + (1-λ) × demographic
      const effective = computeEffectiveBaseline(demographic, calibrationScores, "completed");
      
      // Prepare full baseline payload
      const baselineResult = {
        demographic,
        calibration: calibrationScores,
        effective,
        calibrationStatus: "completed" as const,
      };
      
      const baselinePayload = prepareBaselineDbPayload(baselineResult);
      
      // Read the previous baseline and current skills so calibration can replace
      // the neutral prior without discarding genuine movement since that prior.
      const { data: currentMetrics, error: currentMetricsError } = await supabase
        .from("user_cognitive_metrics")
        .select("focus_stability, fast_thinking, reasoning_accuracy, slow_thinking, baseline_eff_focus, baseline_eff_fast_thinking, baseline_eff_reasoning, baseline_eff_slow_thinking")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentMetricsError) throw currentMetricsError;
      
      const skillsPayload: Record<string, number> = {};
      
      if (currentMetrics) {
        skillsPayload.focus_stability = rebaseSkillToMeasuredBaseline(
          currentMetrics.focus_stability,
          currentMetrics.baseline_eff_focus,
          effective.AE,
        );
        skillsPayload.fast_thinking = rebaseSkillToMeasuredBaseline(
          currentMetrics.fast_thinking,
          currentMetrics.baseline_eff_fast_thinking,
          effective.RA,
        );
        skillsPayload.reasoning_accuracy = rebaseSkillToMeasuredBaseline(
          currentMetrics.reasoning_accuracy,
          currentMetrics.baseline_eff_reasoning,
          effective.CT,
        );
        skillsPayload.slow_thinking = rebaseSkillToMeasuredBaseline(
          currentMetrics.slow_thinking,
          currentMetrics.baseline_eff_slow_thinking,
          effective.IN,
        );
      } else {
        // No existing metrics, use effective baseline
        skillsPayload.focus_stability = effective.AE;
        skillsPayload.fast_thinking = effective.RA;
        skillsPayload.reasoning_accuracy = effective.CT;
        skillsPayload.slow_thinking = effective.IN;
      }
      
      // Compute derived values
      // Canonical performance score: equal weight for AE, RA, CT and IN.
      const baselinePerformanceAvg = calculateCalibrationOverall({
        AE: skillsPayload.focus_stability,
        RA: skillsPayload.fast_thinking,
        CT: skillsPayload.reasoning_accuracy,
        IN: skillsPayload.slow_thinking,
      });
      const baselineCognitiveAge = user.age || 35;

      // Update user_cognitive_metrics with all baseline data
      const metricsPayload = {
        user_id: user.id,
        // Current skills rebased onto the measured baseline.
        ...skillsPayload,
        // All baseline columns
        ...baselinePayload,
        baseline_cognitive_age: baselineCognitiveAge,
        // Derived
        cognitive_performance_score: baselinePerformanceAvg,
        updated_at: new Date().toISOString(),
      };

      const { error: metricsError } = await supabase
        .from("user_cognitive_metrics")
        .upsert(metricsPayload, {
          onConflict: "user_id",
        });

      if (metricsError) throw metricsError;

      // Publish the committed values immediately. Requiring a returned row here
      // used to turn a successful write into a false failure when PostgREST did
      // not return a representation for an upsert.
      queryClient.setQueryData(["user-metrics", user.id], (current: unknown) => (
        current && typeof current === "object" ? { ...current, ...metricsPayload } : current
      ));

      // CRITICAL: Update AuthContext state to mark onboarding complete
      const onboardingSaved = await updateUser({ onboardingCompleted: true });
      if (!onboardingSaved) throw new Error("Could not finish onboarding");

      // Refresh every view derived from the baseline. Inactive queries are
      // included so returning from Subscription cannot revive the old values.
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["baseline-status", user.id], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["user-cognitive-metrics"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["today-metrics", user.id], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["reasoning-quality-persisted", user.id], refetchType: "all" }),
      ]).catch((error) => console.warn("[Calibration] Cache refresh deferred:", error));

      toast.success("Calibration complete");
      trackProductEvent("calibration_completed");
      trackProductEvent("onboarding_completed", {
        cognitiveRole: user.workType ?? null,
        primaryBottleneck: user.primaryOutcome ?? null,
      });
      navigate("/app/subscription?source=onboarding");
      
    } catch (error) {
      console.error("Error saving calibration:", error);
      toast.error("Could not save your first reading", {
        description: describeCalibrationError(error),
      });
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user?.id) {
      toast.error("You need to be signed in to continue");
      return;
    }
    if (isSaving) return;

    setIsSaving(true);

    try {
      trackProductEvent("calibration_skipped");

      const demographicInput: DemographicInput = {
        birthDate: user.birthDate ?? null,
        age: user.age ?? null,
        educationLevel: user.educationLevel ?? null,
        workType: user.workType ?? null,
      };
      const demographic = computeDemographicBaseline(demographicInput);
      const effective = computeEffectiveBaseline(demographic, null, "skipped");
      const baselinePayload = prepareBaselineDbPayload({
        demographic,
        calibration: null,
        effective,
        calibrationStatus: "skipped",
      });
      const metricsPayload = {
        user_id: user.id,
        ...prepareInitialSkillsPayload(effective),
        ...baselinePayload,
        baseline_cognitive_age: user.age || 35,
        cognitive_performance_score: calculateCalibrationOverall(effective),
        updated_at: new Date().toISOString(),
      };

      // A skipped check uses a neutral prior. Saving that prior is best-effort:
      // a temporary metrics-write failure must never trap the user in onboarding.
      const { error: metricsError } = await supabase
        .from("user_cognitive_metrics")
        .upsert(metricsPayload, { onConflict: "user_id" });

      if (metricsError) {
        console.warn("[Calibration] Neutral baseline will be retried later:", metricsError);
      } else {
        queryClient.setQueryData(["user-metrics", user.id], (current: unknown) => (
          current && typeof current === "object" ? { ...current, ...metricsPayload } : current
        ));
      }

      // This is the durable skip flag. The app can use a neutral prior until
      // the user chooses to take the check later from Settings.
      const onboardingSaved = await updateUser({ onboardingCompleted: true });
      if (!onboardingSaved) throw new Error("Could not finish onboarding");

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["baseline-status", user.id], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["user-cognitive-metrics"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["today-metrics", user.id], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["reasoning-quality-persisted", user.id], refetchType: "all" }),
      ]).catch((error) => console.warn("[Calibration] Cache refresh deferred:", error));
      trackProductEvent("onboarding_completed", {
        cognitiveRole: user.workType ?? null,
        primaryBottleneck: user.primaryOutcome ?? null,
      });
      navigate("/app/subscription?source=onboarding");
    } catch (error) {
      console.error("Error skipping calibration:", error);
      toast.error("Could not continue", {
        description: describeCalibrationError(error),
      });
      setIsSaving(false);
    }
  };

  const finalScores = results.AE && results.RA && results.CT && results.IN ? {
    AE: results.AE.sessionScore,
    RA: results.RA.sessionScore,
    CT: results.CT.sessionScore,
    IN: results.IN.sessionScore,
  } : null;

  return (
    <div className="fixed inset-0 bg-[#06070A] overflow-hidden">
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <CalibrationIntro 
              onBegin={handleIntroComplete}
              isSkipping={isSaving}
              onSkip={handleSkip}
            />
          </motion.div>
        )}

        {step === "AE" && (
          <motion.div
            key="ae"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full"
          >
            <SignalLockDrill 
              onComplete={(result) => handleDrillComplete("AE", result)}
            />
          </motion.div>
        )}

        {step === "RA" && (
          <motion.div
            key="ra"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full"
          >
            <LinkSprintDrill 
              onComplete={(result) => handleDrillComplete("RA", result)}
            />
          </motion.div>
        )}

        {step === "CT" && (
          <motion.div
            key="ct"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full"
          >
            <CausalLensDrill 
              onComplete={(result) => handleDrillComplete("CT", result)}
            />
          </motion.div>
        )}

        {step === "IN" && (
          <motion.div
            key="in"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full"
          >
            <ConstraintSolveDrill 
              onComplete={(result) => handleDrillComplete("IN", result)}
            />
          </motion.div>
        )}

        {step === "results" && finalScores && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <CalibrationResults 
              scores={finalScores}
              onSaveAndEnter={handleSaveAndEnter}
              isSaving={isSaving}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
