import { useState, useCallback, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Target, Lightbulb, Sparkles, ArrowRight, Eye, Activity } from "lucide-react";
import { AssessmentDrillRenderer, ASSESSMENT_DRILLS } from "./AssessmentDrillRenderer";
import { cn } from "@/lib/utils";

// Use the new elite assessment drills
const ASSESSMENT_EXERCISES = ASSESSMENT_DRILLS.map((drill, index) => ({
  id: index + 1,
  area: drill.area,
  thinkingMode: drill.thinkingMode,
  label: drill.label,
  name: drill.name,
}));

/**
 * Assessment Drill → Cognitive State Mapping:
 * 
 * | Drill Area  | Mode  | Target State |
 * |-------------|-------|--------------|
 * | focus       | fast  | AE (Attentional Efficiency) |
 * | focus       | slow  | AE (Attentional Efficiency) |
 * | reasoning   | fast  | CT (Critical Thinking) |
 * | reasoning   | slow  | CT (Critical Thinking) |
 * | creativity  | fast  | RA (Rapid Association) |
 * | creativity  | slow  | IN (Insight) |
 */

interface ExerciseResult {
  exerciseId: number;
  area: string;
  thinkingMode: string;
  score: number;
  correct: number;
  avgReactionTime?: number;
}

// NEW: Assessment results aligned with cognitive engine
export interface AssessmentResults {
  AE: number;  // Attentional Efficiency (from focus drills)
  RA: number;  // Rapid Association (from creativity fast)
  CT: number;  // Critical Thinking (from reasoning drills)
  IN: number;  // Insight (from creativity slow)
  S1: number;  // System 1 = (AE + RA) / 2
  S2: number;  // System 2 = (CT + IN) / 2
  cognitiveAge: number;
}

interface InitialAssessmentProps {
  userAge: number;
  onComplete: (results: AssessmentResults) => void;
  onSkip?: (results: AssessmentResults) => void;
}

const getAreaIcon = (area: string) => {
  switch (area) {
    case "focus":
      return Target;
    case "reasoning":
      return Lightbulb;
    case "creativity":
      return Sparkles;
    default:
      return Brain;
  }
};

export function InitialAssessment({ userAge, onComplete, onSkip }: InitialAssessmentProps) {
  const [phase, setPhase] = useState<"intro" | "testing" | "results">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);

  const defaultResults: AssessmentResults = {
    AE: 50,
    RA: 50,
    CT: 50,
    IN: 50,
    S1: 50,
    S2: 50,
    cognitiveAge: userAge,
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip(defaultResults);
    } else {
      onComplete(defaultResults);
    }
  };

  const currentExercise = ASSESSMENT_EXERCISES[currentIndex];
  const progress = (currentIndex / ASSESSMENT_EXERCISES.length) * 100;

  const handleExerciseComplete = useCallback(
    (result: { score: number; correct: number; avgReactionTime?: number }) => {
      const exercise = ASSESSMENT_EXERCISES[currentIndex];

      const exerciseResult: ExerciseResult = {
        exerciseId: exercise.id,
        area: exercise.area,
        thinkingMode: exercise.thinkingMode,
        score: result.score,
        correct: result.correct,
        avgReactionTime: result.avgReactionTime,
      };

      setResults((prev) => [...prev, exerciseResult]);

      // Move to next exercise or complete
      if (currentIndex + 1 < ASSESSMENT_EXERCISES.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setPhase("results");
      }
    },
    [currentIndex],
  );

  const calculateResults = useMemo((): AssessmentResults => {
    if (results.length === 0) {
      return defaultResults;
    }

    const avg = (arr: ExerciseResult[]) =>
      arr.length > 0 ? arr.reduce((sum, r) => sum + r.score, 0) / arr.length : 50;

    // ===== MAP DRILLS TO COGNITIVE STATES =====
    
    // AE (Attentional Efficiency) ← Focus drills (both fast and slow)
    const focusDrills = results.filter((r) => r.area === "focus");
    const AE = Math.round(avg(focusDrills));

    // CT (Critical Thinking) ← Reasoning drills (both fast and slow)
    const reasoningDrills = results.filter((r) => r.area === "reasoning");
    const CT = Math.round(avg(reasoningDrills));

    // RA (Rapid Association) ← Creativity FAST drill
    const creativityFastDrills = results.filter(
      (r) => r.area === "creativity" && r.thinkingMode === "fast"
    );
    const RA = Math.round(avg(creativityFastDrills));

    // IN (Insight) ← Creativity SLOW drill
    const creativitySlowDrills = results.filter(
      (r) => r.area === "creativity" && r.thinkingMode === "slow"
    );
    const IN = Math.round(avg(creativitySlowDrills));

    // ===== DERIVE SYSTEM SCORES =====
    const S1 = Math.round((AE + RA) / 2);  // System 1 (Intuition/Fast)
    const S2 = Math.round((CT + IN) / 2);  // System 2 (Reasoning/Slow)

    // ===== COGNITIVE AGE =====
    // PerformanceAvg = (AE + RA + CT + IN + S2) / 5
    const performanceAvg = (AE + RA + CT + IN + S2) / 5;
    const performanceDelta = (performanceAvg - 50) / 10; // -5 .. +5
    const cognitiveAge = Math.max(18, Math.round(userAge - performanceDelta));

    return {
      AE,
      RA,
      CT,
      IN,
      S1,
      S2,
      cognitiveAge,
    };
  }, [results, userAge]);

  const handleComplete = () => {
    onComplete(calculateResults);
  };

  // Intro phase
  if (phase === "intro") {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
          <Brain className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold mb-2 tracking-tight">Cognitive Assessment</h1>
        <p className="text-muted-foreground text-[13px] mb-4 leading-relaxed max-w-[280px] mx-auto">
          Quick test to establish your baseline cognitive scores. 6 exercises, ~20 seconds each.
        </p>
        
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-6 max-w-[300px] mx-auto">
          <p className="text-[12px] text-primary/80 leading-relaxed">
            💡 This is an assessment to calibrate your starting point. Don't worry if exercises feel too easy, too hard, or too fast — just do your best.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3 rounded-xl bg-card/50 border border-border/60">
            <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <span className="text-[11px] text-muted-foreground">Focus</span>
          </div>
          <div className="p-3 rounded-xl bg-card/50 border border-border/60">
            <Lightbulb className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
            <span className="text-[11px] text-muted-foreground">Reasoning</span>
          </div>
          <div className="p-3 rounded-xl bg-card/50 border border-border/60">
            <Sparkles className="w-5 h-5 text-violet-400 mx-auto mb-1.5" />
            <span className="text-[11px] text-muted-foreground">Creativity</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8 text-[12px] text-muted-foreground">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Fast Thinking</span>
          <span className="text-border">•</span>
          <Brain className="w-4 h-4 text-teal-400" />
          <span>Slow Thinking</span>
        </div>

        <Button type="button" onClick={() => setPhase("testing")} variant="hero" className="w-full h-[52px] text-[15px] font-medium mb-3">
          Start Assessment
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-white"
          onClick={() => {
            console.log("[InitialAssessment] Skip clicked");
            handleSkip();
          }}
          onPointerUp={() => {
            // fallback utile su mobile/webview se onClick non parte in alcuni casi
            console.log("[InitialAssessment] Skip pointerUp");
          }}
        >
          Skip for now — I'll do it later
        </Button>

      </div>
    );
  }

  // Testing phase
  if (phase === "testing") {
    const AreaIcon = getAreaIcon(currentExercise.area);
    const isFast = currentExercise.thinkingMode === "fast";

    return (
      <div className="animate-fade-in h-full flex flex-col">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isFast ? "bg-amber-500/15" : "bg-teal-500/15",
                )}
              >
                <AreaIcon className={cn("w-4 h-4", isFast ? "text-amber-400" : "text-teal-400")} />
              </div>
              <div>
                <span className="text-[13px] font-medium">{currentExercise.name}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2 text-[10px] px-1.5 py-0",
                    isFast
                      ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      : "border-teal-500/30 text-teal-400 bg-teal-500/10",
                  )}
                >
                  {isFast ? "Fast" : "Slow"}
                </Badge>
              </div>
            </div>
            <span className="text-[12px] text-muted-foreground">
              {currentIndex + 1}/{ASSESSMENT_EXERCISES.length}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Exercise */}
        <div className="flex-1 min-h-[320px]">
          <AssessmentDrillRenderer
            key={currentIndex}
            exerciseIndex={currentIndex}
            onComplete={handleExerciseComplete}
          />
        </div>
      </div>
    );
  }

  // Results phase - NEW UI with 4 cognitive states
  if (phase === "results") {
    const res = calculateResults;
    const ageDiff = userAge - res.cognitiveAge;

    return (
      <div className="text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold mb-1 tracking-tight">Assessment Complete</h1>
        <p className="text-muted-foreground text-[13px] mb-6">Your baseline cognitive profile</p>

        {/* Cognitive Age */}
        <div className="p-4 rounded-xl bg-card/50 border border-border/60 mb-4">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Cognitive Age</span>
          <div className="text-3xl font-bold text-foreground mt-1">
            {res.cognitiveAge}
            <span className="text-lg font-normal text-muted-foreground ml-1">years</span>
          </div>
          {ageDiff !== 0 && (
            <span className={cn("text-[12px]", ageDiff > 0 ? "text-emerald-400" : "text-amber-400")}>
              {ageDiff > 0 ? `${ageDiff} years younger` : `${Math.abs(ageDiff)} years older`} than actual
            </span>
          )}
        </div>

        {/* System Scores */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] text-amber-400">S1 Intuition</span>
            </div>
            <span className="text-lg font-semibold">{res.S1}</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Brain className="w-4 h-4 text-teal-400" />
              <span className="text-[11px] text-teal-400">S2 Reasoning</span>
            </div>
            <span className="text-lg font-semibold">{res.S2}</span>
          </div>
        </div>

        {/* 4 Cognitive States */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          <div className="p-2 rounded-lg bg-card/50 border border-border/40">
            <Eye className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-sm font-medium">{res.AE}</span>
            <span className="text-[9px] text-muted-foreground block">Attention</span>
          </div>
          <div className="p-2 rounded-lg bg-card/50 border border-border/40">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-sm font-medium">{res.RA}</span>
            <span className="text-[9px] text-muted-foreground block">Association</span>
          </div>
          <div className="p-2 rounded-lg bg-card/50 border border-border/40">
            <Lightbulb className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-sm font-medium">{res.CT}</span>
            <span className="text-[9px] text-muted-foreground block">Critical</span>
          </div>
          <div className="p-2 rounded-lg bg-card/50 border border-border/40">
            <Activity className="w-4 h-4 text-violet-400 mx-auto mb-1" />
            <span className="text-sm font-medium">{res.IN}</span>
            <span className="text-[9px] text-muted-foreground block">Insight</span>
          </div>
        </div>

        <Button onClick={handleComplete} variant="hero" className="w-full h-[52px] text-[15px] font-medium">
          Continue
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  return null;
}