import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Trophy, Brain, Star, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useExercises, useUpdateUserMetrics, useUserMetrics } from "@/hooks/useExercises";
import { useSaveNeuroLabSession, useCompletedExerciseIds } from "@/hooks/useNeuroLab";
import { useUpdateXP, useCheckAndAwardBadges, useUserBadges } from "@/hooks/useBadges";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { useDailyTraining } from "@/hooks/useDailyTraining";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useRecordExerciseCompletion } from "@/hooks/useExerciseXP";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { XP_REWARDS, BadgeMetrics, Badge } from "@/lib/badges";
import { getExerciseXP } from "@/lib/trainingPlans";
import { 
  NeuroLabArea, 
  NeuroLabDuration, 
  NEURO_LAB_AREAS,
  generateNeuroLabSession,
} from "@/lib/neuroLab";
import { SessionType } from "@/lib/trainingPlans";
import { CognitiveExercise, getMetricUpdates } from "@/lib/exercises";
import { toast } from "sonner";
import { DrillRenderer } from "@/components/drills/DrillRenderer";

export default function NeuroLabSessionRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canStartSession, incrementSession } = usePremiumGating();
  const { isDailyCompleted, invalidateDailyTraining } = useDailyTraining();
  const { recordSession, getNextSession } = useWeeklyProgress();
  const recordExerciseCompletion = useRecordExerciseCompletion();
  const area = searchParams.get("area") as NeuroLabArea;
  const duration = searchParams.get("duration") as NeuroLabDuration;
  const thinkingMode = searchParams.get("mode") as "fast" | "slow" | null;
  const isDailyTraining = searchParams.get("daily") === "true" && !isDailyCompleted;
  const sessionTypeParam = searchParams.get("sessionType") as SessionType | null;
  
  const { data: allExercises, isLoading: exercisesLoading } = useExercises();
  const { data: completedExerciseIds, isLoading: completedLoading } = useCompletedExerciseIds(user?.id);
  const { data: userMetrics } = useUserMetrics(user?.id);
  const { data: userBadges } = useUserBadges(user?.id);
  const saveSession = useSaveNeuroLabSession();
  const updateMetrics = useUpdateUserMetrics();
  const updateXP = useUpdateXP();
  const checkBadges = useCheckAndAwardBadges();
  
  // Get current session type from param or from next session
  const nextSession = getNextSession();
  const currentSessionType = sessionTypeParam || nextSession?.id || null;
  
  const [sessionExercises, setSessionExercises] = useState<CognitiveExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, { score: number; correct: number }>>(new Map());
  const responsesRef = useRef<Map<string, { score: number; correct: number }>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState({ score: 0, correctAnswers: 0, totalQuestions: 0 });
  const [earnedXP, setEarnedXP] = useState(0);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasCompletedRef = useRef(false);

  // Check session limit and generate exercises
  useEffect(() => {
    if (!canStartSession() && !sessionStarted) {
      setShowPaywall(true);
      return;
    }
    
    if (allExercises && allExercises.length > 0 && area && !sessionStarted && !completedLoading) {
      const exercises = generateNeuroLabSession(
        area, 
        duration || "2min", 
        allExercises,
        user?.trainingGoals,
        thinkingMode || undefined,
        completedExerciseIds
      );
      setSessionExercises(exercises);
      setSessionStarted(true);
      
      // Increment session counter for free users
      incrementSession.mutate();
    }
  }, [allExercises, area, duration, user?.trainingGoals, thinkingMode, canStartSession, sessionStarted, completedExerciseIds, completedLoading]);

  const areaConfig = useMemo(() => {
    if (area === "neuro-activation") {
      return {
        title: "Neuro Activation Session™",
        subtitle: "Complete Cognitive Activation Protocol",
        description: "A complete cognitive warm-up protocol"
      };
    }
    const found = NEURO_LAB_AREAS.find(a => a.id === area);
    if (!found) {
      return {
        title: "Cognitive Training",
        subtitle: "Training Session",
        description: "Cognitive training exercises"
      };
    }
    return found;
  }, [area]);

  const currentExercise = sessionExercises[currentIndex];
  const progress = sessionExercises.length > 0 ? ((currentIndex + 1) / sessionExercises.length) * 100 : 0;

  const handleExerciseComplete = useCallback(async (result: { score: number; correct: number }) => {
    if (!currentExercise) return;
    
    // Update both state and ref (ref is used for immediate access in handleNext)
    const updated = new Map(responsesRef.current);
    updated.set(currentExercise.id, result);
    responsesRef.current = updated;
    setResponses(updated);
    
    // Record individual exercise completion with XP
    if (user?.id && currentExercise.gym_area) {
      try {
        const xpEarned = getExerciseXP((currentExercise.difficulty as "easy" | "medium" | "hard") || "medium");
        await recordExerciseCompletion.mutateAsync({
          exerciseId: currentExercise.id,
          gymArea: currentExercise.gym_area,
          thinkingMode: currentExercise.thinking_mode || null,
          difficulty: (currentExercise.difficulty as "easy" | "medium" | "hard") || "medium",
          score: result.score,
        });
        // Show XP earned toast immediately
        toast.success(`+${xpEarned} XP earned!`, { 
          id: `xp-${currentExercise.id}`,
          duration: 2000,
          icon: "⭐"
        });
      } catch (error) {
        console.error("Failed to record exercise XP:", error);
      }
    }
    
    // Auto advance after brief delay
    setTimeout(() => {
      handleNext();
    }, 1000);
  }, [currentExercise, user?.id, recordExerciseCompletion]);

  const handleNext = async () => {
    // Prevent multiple calls
    if (hasCompletedRef.current || isSaving) return;
    
    if (currentIndex < sessionExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Prevent duplicate completion
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      setIsSaving(true);
      
      // Complete session - use ref for most up-to-date values
      let totalScore = 0;
      let totalCorrect = 0;
      
      responsesRef.current.forEach(response => {
        totalScore += response.score;
        totalCorrect += response.correct;
      });
      
      const averageScore = sessionExercises.length > 0 
        ? Math.round(totalScore / sessionExercises.length) 
        : 0;
      
      setSessionScore({ 
        score: averageScore, 
        correctAnswers: totalCorrect, 
        totalQuestions: sessionExercises.length 
      });
      setIsComplete(true);
      
      // Save session
      if (user && userMetrics) {
        try {
          await saveSession.mutateAsync({
            user_id: user.id,
            area: area,
            duration_option: duration || "2min",
            exercises_used: sessionExercises.map(e => e.id),
            score: averageScore,
            correct_answers: totalCorrect,
            total_questions: sessionExercises.length,
            completed_at: new Date().toISOString(),
            is_daily_training: isDailyTraining,
          });
          
          // Record this game in weekly progress if we have a session type
          if (currentSessionType) {
            await recordSession.mutateAsync({
              sessionType: currentSessionType,
              gamesCount: 1,
            });
          }
          
          // Invalidate daily training queries if this was a daily session
          if (isDailyTraining) {
            invalidateDailyTraining();
          }
          
          const metricUpdates = getMetricUpdates(sessionExercises, responsesRef.current);
          await updateMetrics.mutateAsync({ userId: user.id, metricUpdates });
          
          // Calculate and add XP
          const isPerfect = averageScore >= 90;
          const xpToAdd = XP_REWARDS.sessionComplete + (isPerfect ? XP_REWARDS.perfectSession : 0);
          setEarnedXP(xpToAdd);
          
          await updateXP.mutateAsync({
            userId: user.id,
            xpToAdd,
            currentXP: userMetrics.experience_points || 0,
          });
          
          // Check for new badges
          const badgeMetrics: BadgeMetrics = {
            totalSessions: (userMetrics.total_sessions || 0) + 1,
            fastThinking: userMetrics.fast_thinking || 50,
            slowThinking: userMetrics.slow_thinking || 50,
            focus: userMetrics.focus_stability || 50,
            reasoning: userMetrics.reasoning_accuracy || 50,
            creativity: userMetrics.creativity || 50,
            baselineFastThinking: userMetrics.baseline_fast_thinking ?? undefined,
            baselineSlowThinking: userMetrics.baseline_slow_thinking ?? undefined,
            baselineFocus: userMetrics.baseline_focus ?? undefined,
            baselineReasoning: userMetrics.baseline_reasoning ?? undefined,
            baselineCreativity: userMetrics.baseline_creativity ?? undefined,
            cognitiveLevel: userMetrics.cognitive_level || 1,
            experiencePoints: (userMetrics.experience_points || 0) + xpToAdd,
          };
          
          const existingBadgeIds = userBadges?.map(b => b.badge_id) || [];
          const awarded = await checkBadges.mutateAsync({
            userId: user.id,
            metrics: badgeMetrics,
            existingBadgeIds,
          });

          if (awarded.length > 0) {
            setNewBadges(awarded);
          }

          // De-dupe toasts to avoid flicker if something triggers completion twice
          toast.success("Session completed!", { id: "neuro-session-complete" });
        } catch (error) {
          console.error("Error saving session:", error);
          toast.error("Failed to save session", { id: "neuro-session-save-failed" });
        } finally {
          setIsSaving(false);
        }
      } else {
        setIsSaving(false);
      }
    }
  };

  if (!area) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Invalid session parameters</p>
          <Button variant="ghost" onClick={() => navigate("/neuro-lab")} className="mt-4">
            Back to Neuro Lab
          </Button>
        </div>
      </div>
    );
  }

  if (exercisesLoading || completedLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading exercises...</p>
        </div>
      </div>
    );
  }

  if (!exercisesLoading && sessionExercises.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No Exercises Available</h2>
          <p className="text-muted-foreground text-sm mb-6">
            This training area doesn't have exercises yet. Check back soon!
          </p>
          <Button onClick={() => navigate("/neuro-lab")} className="w-full">
            Back to Neuro Lab
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-scale-in">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Session Complete!</h1>
        
        {/* Daily Training Badge */}
        {isDailyTraining && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Daily Training Complete</span>
          </div>
        )}
        
        <p className="text-muted-foreground text-center mb-4">
          {area === "neuro-activation" 
            ? "Your brain is primed for deep work."
            : `Great work training your ${areaConfig?.title}!`
          }
        </p>
        
        {/* XP Earned */}
        <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">+{earnedXP} XP</span>
        </div>

        {/* New Badges - Redesigned */}
        {newBadges.length > 0 && (
          <div className="mb-6 w-full max-w-sm space-y-3">
            {newBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <div 
                  key={badge.id} 
                  className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${badge.bgColor} ring-2 ring-primary/30`}>
                      <Icon className={`w-7 h-7 ${badge.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-widest text-primary mb-1">New Badge</p>
                      <p className="font-semibold text-foreground">{badge.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="p-6 rounded-xl bg-card/50 border border-border/50 mb-6 w-full max-w-sm">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{sessionScore.score}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Average Score
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {sessionScore.correctAnswers} target{sessionScore.correctAnswers !== 1 ? "s" : ""} hit across {sessionScore.totalQuestions} exercise{sessionScore.totalQuestions !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* Primary action: continue session if there's a session type */}
          {currentSessionType && (
            <Button 
              onClick={() => navigate(`/neuro-lab?continueSession=true`)} 
              className="w-full gap-2"
            >
              Continue Session
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant={currentSessionType ? "outline" : "default"}
            onClick={() => navigate("/app/dashboard")} 
            className="w-full"
          >
            View Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate("/neuro-lab")} className="w-full">
            Back to Neuro Lab
          </Button>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No exercise found</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate("/neuro-lab")} className="text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {areaConfig?.title}
              </span>
              {/* Thinking Mode Badge */}
              {currentExercise?.thinking_mode && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  currentExercise.thinking_mode === "fast" 
                    ? "bg-amber-500/20 text-amber-400" 
                    : "bg-blue-500/20 text-blue-400"
                }`}>
                  {currentExercise.thinking_mode === "fast" ? "Fast" : "Slow"}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1}/{sessionExercises.length}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1 bg-border/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Exercise Content */}
        <div className="flex-1 flex flex-col">
          <DrillRenderer 
            key={currentExercise.id}
            exercise={currentExercise} 
            onComplete={handleExerciseComplete} 
          />
        </div>
      </div>

      <PremiumPaywall 
        open={showPaywall} 
        onOpenChange={(open) => {
          setShowPaywall(open);
          if (!open) navigate("/neuro-lab");
        }}
        feature="session-limit"
      />
    </>
  );
}
