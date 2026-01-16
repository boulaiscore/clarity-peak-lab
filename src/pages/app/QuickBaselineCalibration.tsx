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

// Drill components
import { CalibrationIntro } from "@/components/calibration/CalibrationIntro";
import { SignalLockDrill } from "@/components/calibration/SignalLockDrill";
import { LinkSprintDrill } from "@/components/calibration/LinkSprintDrill";
import { CausalLensDrill } from "@/components/calibration/CausalLensDrill";
import { ConstraintSolveDrill } from "@/components/calibration/ConstraintSolveDrill";
import { CalibrationResults } from "@/components/calibration/CalibrationResults";

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
  const { user } = useAuth();
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

  const handleSaveAndComplete = async () => {
    if (!user?.id || !results.AE || !results.RA || !results.CT || !results.IN) {
      toast.error("Calibration incomplete");
      return;
    }

    setIsSaving(true);

    try {
      const AE0 = results.AE.sessionScore;
      const RA0 = results.RA.sessionScore;
      const CT0 = results.CT.sessionScore;
      const IN0 = results.IN.sessionScore;
      
      const S2_0 = (CT0 + IN0) / 2;
      const baselinePerformanceAvg = (AE0 + RA0 + CT0 + IN0 + S2_0) / 5;
      const baselineCognitiveAge = user.age || 35;

      // Update user_cognitive_metrics with baseline and current values
      const { error: metricsError } = await supabase
        .from("user_cognitive_metrics")
        .upsert({
          user_id: user.id,
          // Current skills = baseline
          focus_stability: AE0,        // AE
          fast_thinking: RA0,          // RA
          reasoning_accuracy: CT0,     // CT
          slow_thinking: IN0,          // IN
          // Baseline reference values
          baseline_focus: AE0,         // AE0
          baseline_fast_thinking: RA0, // RA0
          baseline_reasoning: CT0,     // CT0
          baseline_slow_thinking: IN0, // IN0
          baseline_cognitive_age: baselineCognitiveAge,
          baseline_captured_at: new Date().toISOString(),
          // Derived
          cognitive_performance_score: baselinePerformanceAvg,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (metricsError) throw metricsError;

      // Update profile to mark calibration complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast.success("Calibration complete");
      
    } catch (error) {
      console.error("Error saving calibration:", error);
      toast.error("Failed to save calibration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnterApp = () => {
    navigate("/app");
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
              onSkip={() => navigate("/app")}
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
              onSave={handleSaveAndComplete}
              onEnter={handleEnterApp}
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
