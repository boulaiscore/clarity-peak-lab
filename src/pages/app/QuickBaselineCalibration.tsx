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
  computeDemographicBaseline,
  computeEffectiveBaseline,
  mapDrillScoresToCalibration,
  prepareBaselineDbPayload,
  prepareInitialSkillsPayload,
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

export default function QuickBaselineCalibration() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<CalibrationStep>("intro");
  const [results, setResults] = useState<CalibrationState>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleIntroComplete = () => {
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
      const skillsPayload = prepareInitialSkillsPayload(effective);
      
      // Compute derived values
      const S2_0 = (effective.CT + effective.IN) / 2;
      const baselinePerformanceAvg = (effective.AE + effective.RA + effective.CT + effective.IN + S2_0) / 5;
      const baselineCognitiveAge = user.age || 35;

      // Update user_cognitive_metrics with all baseline data
      const { error: metricsError } = await supabase
        .from("user_cognitive_metrics")
        .upsert({
          user_id: user.id,
          // Current skills = effective baseline
          ...skillsPayload,
          // All baseline columns
          ...baselinePayload,
          baseline_cognitive_age: baselineCognitiveAge,
          // Derived
          cognitive_performance_score: baselinePerformanceAvg,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (metricsError) throw metricsError;

      // CRITICAL: Update AuthContext state to mark onboarding complete
      await updateUser({ onboardingCompleted: true });

      // Invalidate caches
      await queryClient.invalidateQueries({ queryKey: ["baseline-status", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["user-cognitive-metrics"] });
      await queryClient.invalidateQueries({ queryKey: ["user-metrics"] });

      toast.success("Calibration complete");
      navigate("/app");
      
    } catch (error) {
      console.error("Error saving calibration:", error);
      toast.error("Failed to save calibration");
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
              onSkip={async () => {
                if (!user?.id) return;
                
                // Compute demographic-only baseline (calibration skipped)
                const demographicInput: DemographicInput = {
                  birthDate: user.birthDate ?? null,
                  age: user.age ?? null,
                  educationLevel: user.educationLevel ?? null,
                  workType: user.workType ?? null,
                };
                
                const demographic = computeDemographicBaseline(demographicInput);
                const effective = computeEffectiveBaseline(demographic, null, "skipped");
                
                const baselineResult = {
                  demographic,
                  calibration: null,
                  effective,
                  calibrationStatus: "skipped" as const,
                };
                
                const baselinePayload = prepareBaselineDbPayload(baselineResult);
                const skillsPayload = prepareInitialSkillsPayload(effective);
                
                // Upsert with demographic-only baseline
                await supabase
                  .from("user_cognitive_metrics")
                  .upsert({
                    user_id: user.id,
                    ...skillsPayload,
                    ...baselinePayload,
                    baseline_cognitive_age: user.age || 35,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: "user_id" });
                
                // Mark onboarding complete
                await updateUser({ onboardingCompleted: true });
                
                // Invalidate caches
                await queryClient.invalidateQueries({ queryKey: ["baseline-status", user.id] });
                await queryClient.invalidateQueries({ queryKey: ["user-metrics"] });
                
                navigate("/app");
              }}
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

      {/* Progress indicator */}
      {step !== "intro" && step !== "results" && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {["AE", "RA", "CT", "IN"].map((s, i) => {
            const stepOrder = ["AE", "RA", "CT", "IN"];
            const currentIndex = stepOrder.indexOf(step);
            const isComplete = i < currentIndex;
            const isCurrent = s === step;
            
            return (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  isComplete 
                    ? "bg-primary" 
                    : isCurrent 
                      ? "bg-primary/50 w-6" 
                      : "bg-muted-foreground/20"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
