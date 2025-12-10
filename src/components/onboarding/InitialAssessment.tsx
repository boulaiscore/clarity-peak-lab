import { useState, useEffect, useCallback, useMemo } from "react";
import { CognitiveExercise } from "@/lib/exercises";
import { DrillRenderer } from "@/components/drills/DrillRenderer";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Target, Lightbulb, Sparkles, ArrowRight } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { cn } from "@/lib/utils";

// Assessment exercises - 1 fast + 1 slow per area = 6 total
const ASSESSMENT_CONFIG = [
  { area: "focus", thinkingMode: "fast", label: "Focus Arena" },
  { area: "focus", thinkingMode: "slow", label: "Focus Arena" },
  { area: "reasoning", thinkingMode: "fast", label: "Critical Reasoning" },
  { area: "reasoning", thinkingMode: "slow", label: "Critical Reasoning" },
  { area: "creativity", thinkingMode: "fast", label: "Creativity Hub" },
  { area: "creativity", thinkingMode: "slow", label: "Creativity Hub" },
] as const;

interface ExerciseResult {
  exerciseId: string;
  area: string;
  thinkingMode: string;
  score: number;
  correct: number;
  avgReactionTime?: number;
}

interface AssessmentResults {
  fastScore: number;
  slowScore: number;
  focusScore: number;
  reasoningScore: number;
  creativityScore: number;
  overallScore: number;
  cognitiveAge: number;
}

interface InitialAssessmentProps {
  userAge: number;
  onComplete: (results: AssessmentResults) => void;
}

const getAreaIcon = (area: string) => {
  switch (area) {
    case "focus": return Target;
    case "reasoning": return Lightbulb;
    case "creativity": return Sparkles;
    default: return Brain;
  }
};

export function InitialAssessment({ userAge, onComplete }: InitialAssessmentProps) {
  const { data: allExercises, isLoading } = useExercises();
  const [phase, setPhase] = useState<"intro" | "testing" | "results">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [assessmentExercises, setAssessmentExercises] = useState<CognitiveExercise[]>([]);

  // Select one exercise per assessment config
  useEffect(() => {
    if (!allExercises || allExercises.length === 0) return;

    const selected: CognitiveExercise[] = [];
    
    for (const config of ASSESSMENT_CONFIG) {
      const candidates = allExercises.filter(
        e => e.gym_area === config.area && e.thinking_mode === config.thinkingMode
      );
      
      if (candidates.length > 0) {
        // Pick random exercise from candidates
        const randomIdx = Math.floor(Math.random() * candidates.length);
        selected.push(candidates[randomIdx]);
      }
    }
    
    setAssessmentExercises(selected);
  }, [allExercises]);

  const currentExercise = assessmentExercises[currentIndex];
  const currentConfig = ASSESSMENT_CONFIG[currentIndex];
  const progress = ((currentIndex) / assessmentExercises.length) * 100;

  const handleExerciseComplete = useCallback((result: { score: number; correct: number; avgReactionTime?: number }) => {
    if (!currentExercise || !currentConfig) return;

    const exerciseResult: ExerciseResult = {
      exerciseId: currentExercise.id,
      area: currentConfig.area,
      thinkingMode: currentConfig.thinkingMode,
      score: result.score,
      correct: result.correct,
      avgReactionTime: result.avgReactionTime,
    };

    setResults(prev => [...prev, exerciseResult]);

    // Move to next exercise or complete
    if (currentIndex + 1 < assessmentExercises.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setPhase("results");
    }
  }, [currentExercise, currentConfig, currentIndex, assessmentExercises.length]);

  // Calculate final results
  const calculateResults = useMemo((): AssessmentResults => {
    if (results.length === 0) {
      return {
        fastScore: 50,
        slowScore: 50,
        focusScore: 50,
        reasoningScore: 50,
        creativityScore: 50,
        overallScore: 50,
        cognitiveAge: userAge,
      };
    }

    // Calculate thinking mode scores
    const fastResults = results.filter(r => r.thinkingMode === "fast");
    const slowResults = results.filter(r => r.thinkingMode === "slow");
    
    const fastScore = fastResults.length > 0 
      ? Math.round(fastResults.reduce((sum, r) => sum + r.score, 0) / fastResults.length)
      : 50;
    const slowScore = slowResults.length > 0
      ? Math.round(slowResults.reduce((sum, r) => sum + r.score, 0) / slowResults.length)
      : 50;

    // Calculate area scores
    const focusResults = results.filter(r => r.area === "focus");
    const reasoningResults = results.filter(r => r.area === "reasoning");
    const creativityResults = results.filter(r => r.area === "creativity");

    const focusScore = focusResults.length > 0
      ? Math.round(focusResults.reduce((sum, r) => sum + r.score, 0) / focusResults.length)
      : 50;
    const reasoningScore = reasoningResults.length > 0
      ? Math.round(reasoningResults.reduce((sum, r) => sum + r.score, 0) / reasoningResults.length)
      : 50;
    const creativityScore = creativityResults.length > 0
      ? Math.round(creativityResults.reduce((sum, r) => sum + r.score, 0) / creativityResults.length)
      : 50;

    // Overall score
    const overallScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

    // Calculate cognitive age
    // Base: user's actual age, adjusted by performance
    // Score of 50 = age equals chronological age
    // Score > 50 = younger cognitive age
    // Score < 50 = older cognitive age
    const performanceDelta = (overallScore - 50) / 10; // -5 to +5 range
    const cognitiveAge = Math.max(18, Math.round(userAge - performanceDelta));

    return {
      fastScore,
      slowScore,
      focusScore,
      reasoningScore,
      creativityScore,
      overallScore,
      cognitiveAge,
    };
  }, [results, userAge]);

  const handleComplete = () => {
    onComplete(calculateResults);
  };

  if (isLoading || assessmentExercises.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <p className="text-muted-foreground text-sm">Preparing assessment...</p>
      </div>
    );
  }

  // Intro phase
  if (phase === "intro") {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
          <Brain className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold mb-2 tracking-tight">
          Cognitive Assessment
        </h1>
        <p className="text-muted-foreground text-[13px] mb-6 leading-relaxed max-w-[280px] mx-auto">
          Quick test to establish your baseline cognitive scores. 6 exercises, 15 seconds each.
        </p>

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

        <Button 
          onClick={() => setPhase("testing")} 
          variant="hero" 
          className="w-full h-[52px] text-[15px] font-medium"
        >
          Start Assessment
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  // Testing phase
  if (phase === "testing" && currentExercise) {
    const AreaIcon = getAreaIcon(currentConfig.area);
    const isFast = currentConfig.thinkingMode === "fast";

    return (
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isFast ? "bg-amber-500/15" : "bg-teal-500/15"
              )}>
                <AreaIcon className={cn(
                  "w-4 h-4",
                  isFast ? "text-amber-400" : "text-teal-400"
                )} />
              </div>
              <div>
                <span className="text-[13px] font-medium">{currentConfig.label}</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "ml-2 text-[10px] px-1.5 py-0",
                    isFast 
                      ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      : "border-teal-500/30 text-teal-400 bg-teal-500/10"
                  )}
                >
                  {isFast ? "Fast" : "Slow"}
                </Badge>
              </div>
            </div>
            <span className="text-[12px] text-muted-foreground">
              {currentIndex + 1}/{assessmentExercises.length}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Exercise */}
        <div className="min-h-[320px]">
          <DrillRenderer 
            exercise={currentExercise} 
            onComplete={handleExerciseComplete}
          />
        </div>
      </div>
    );
  }

  // Results phase
  if (phase === "results") {
    const res = calculateResults;
    const ageDiff = userAge - res.cognitiveAge;

    return (
      <div className="text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-semibold mb-1 tracking-tight">
          Assessment Complete
        </h1>
        <p className="text-muted-foreground text-[13px] mb-6">
          Your baseline cognitive profile
        </p>

        {/* Cognitive Age */}
        <div className="p-4 rounded-xl bg-card/50 border border-border/60 mb-4">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Cognitive Age</span>
          <div className="text-3xl font-bold text-foreground mt-1">
            {res.cognitiveAge}
            <span className="text-lg font-normal text-muted-foreground ml-1">years</span>
          </div>
          {ageDiff !== 0 && (
            <span className={cn(
              "text-[12px]",
              ageDiff > 0 ? "text-emerald-400" : "text-amber-400"
            )}>
              {ageDiff > 0 ? `${ageDiff} years younger` : `${Math.abs(ageDiff)} years older`} than actual
            </span>
          )}
        </div>

        {/* Thinking Systems */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] text-amber-400">Fast Thinking</span>
            </div>
            <span className="text-lg font-semibold">{res.fastScore}</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Brain className="w-4 h-4 text-teal-400" />
              <span className="text-[11px] text-teal-400">Slow Thinking</span>
            </div>
            <span className="text-lg font-semibold">{res.slowScore}</span>
          </div>
        </div>

        {/* Area Scores */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          <div className="p-2 rounded-lg bg-card/50 border border-border/40">
            <Target className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-sm font-medium">{res.focusScore}</span>
          </div>
          <div className="p-2 rounded-lg bg-card/50 border border-border/40">
            <Lightbulb className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-sm font-medium">{res.reasoningScore}</span>
          </div>
          <div className="p-2 rounded-lg bg-card/50 border border-border/40">
            <Sparkles className="w-4 h-4 text-violet-400 mx-auto mb-1" />
            <span className="text-sm font-medium">{res.creativityScore}</span>
          </div>
        </div>

        <Button 
          onClick={handleComplete} 
          variant="hero" 
          className="w-full h-[52px] text-[15px] font-medium"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  return null;
}
