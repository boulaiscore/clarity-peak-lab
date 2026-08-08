/**
 * SEMANTIC DRIFT — Runner Page
 * v1.2: Added duration tracking + Manual-compliant session recording
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { useS1Difficulty } from "@/hooks/useS1Difficulty";
import { Difficulty } from "@/lib/s1DifficultyEngine";
import { S1DifficultySelector } from "@/components/app/S1DifficultySelector";
import { 
  SemanticDriftDrill, 
  SemanticDriftResults,
  RoundResult,
  DIFFICULTY_CONFIG,
} from "@/components/games/semantic-drift";
import { ArrowLeft, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useExitConfirmation } from "@/components/games/useExitConfirmation";
import { calculateScoredDrillXP } from "@/lib/trainingPlans";
import { calculateQualityBonus } from "@/lib/gameQualityBonus";
import type { DrillGenerationMeta } from "@/lib/drillSession";

type GamePhase = "difficulty" | "playing" | "results";

export default function SemanticDriftRunner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const recordGameSession = useRecordGameSession();
  
  const urlDifficulty = searchParams.get("difficulty") as Difficulty | null;
  const { recommended } = useS1Difficulty();
  
  const [phase, setPhase] = useState<GamePhase>(urlDifficulty ? "playing" : "difficulty");
  const [difficulty, setDifficulty] = useState<Difficulty>(urlDifficulty || recommended);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [qualityLine, setQualityLine] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  
  // v1.2: Track session start time for duration calculation
  const startedAtRef = useRef<Date | null>(null);
  
  // v1.1: Validate auth before starting game
  useEffect(() => {
    if (!user?.id && !session?.user?.id) {
      toast.error("Please log in to start a drill");
      navigate("/auth");
    }
  }, [user?.id, session?.user?.id, navigate]);
  
  const handleDifficultySelect = useCallback((selected: Difficulty) => {
    setDifficulty(selected);
    // v1.2: Start timing when game begins
    startedAtRef.current = new Date();
    setPhase("playing");
  }, []);
  
  const handleGameComplete = useCallback(async (
    gameResults: RoundResult[],
    duration: number,
    generation: DrillGenerationMeta
  ) => {
    setResults(gameResults);
    setDurationSeconds(duration);
    
    const correctCount = gameResults.filter(r => r.chosenTag === "directional").length;
    const accuracy = gameResults.length > 0 ? correctCount / gameResults.length : 0;
    const score = Math.round(accuracy * 100);
    
    const reactionTimes = gameResults
      .map(result => result.reactionTimeMs)
      .filter((value): value is number => value !== null);
    const sortedRT = [...reactionTimes].sort((a, b) => a - b);
    const medianRT = sortedRT.length > 0 ? sortedRT[Math.floor(sortedRT.length / 2)] : DIFFICULTY_CONFIG[difficulty].timePerRound;
    const meanRT = reactionTimes.length > 0 ? reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length : medianRT;
    const rtStdDev = reactionTimes.length > 0
      ? Math.sqrt(reactionTimes.reduce((sum, value) => sum + Math.pow(value - meanRT, 2), 0) / reactionTimes.length)
      : 0;
    const baseXP = calculateScoredDrillXP(difficulty, score, score >= 90);
    const quality = calculateQualityBonus("S1-RA", baseXP, {
      hitRate: accuracy,
      medianReactionTime: medianRT,
      remoteAssociationRate: accuracy,
      rtStdDev,
    }, difficulty);
    const xp = quality.totalXP;
    setXpAwarded(xp);
    setQualityLine(quality.qualityLine);
    
    // v1.2: Calculate duration from startedAtRef
    const endedAt = new Date();
    const calculatedDuration = startedAtRef.current
      ? Math.floor((endedAt.getTime() - startedAtRef.current.getTime()) / 1000)
      : duration;
    
    // v1.1: Enhanced save with validation and feedback
    const userId = user?.id || session?.user?.id;
    if (userId) {
      setIsSaving(true);
      try {
        console.log("[SemanticDrift] Saving session for user:", userId, "Duration:", calculatedDuration);
        
        const savedSession = await recordGameSession({
          gameType: "S1-RA",
          gymArea: "creativity",
          thinkingMode: "fast",
          xpAwarded: xp,
          score,
          gameName: "semantic_drift",
          // v1.2: New duration tracking params
          startedAt: startedAtRef.current?.toISOString() ?? null,
          durationSeconds: calculatedDuration,
          status: 'completed',
          difficulty,
          qualityScore: quality.qualityScore,
          bonusApplied: quality.bonus > 0,
          comboHash: generation.comboHash,
          antiRepetitionTriggered: generation.duplicatesRejected > 0,
          duplicatesRejected: generation.duplicatesRejected,
          fallbackUsed: generation.fallbackUsed,
        });
        const savedXP = savedSession?.xp_awarded ?? 0;
        setXpAwarded(savedXP);
        
        console.log("[SemanticDrift] ✅ Session saved successfully");
        if (savedXP > 0) toast.success(`+${savedXP} XP earned`);
        else toast.info("Daily XP limit reached. Continue for practice.");
        
        queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
        queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
      } catch (error) {
        setXpAwarded(0);
        setQualityLine(undefined);
        console.error("[SemanticDrift] ❌ Failed to record session:", error);
        toast.error("Failed to save session");
      } finally {
        setIsSaving(false);
      }
    } else {
      setXpAwarded(0);
      setQualityLine(undefined);
      console.warn("[SemanticDrift] No user ID, session not saved");
      toast.warning("Session not saved - please log in");
    }
    
    setPhase("results");
  }, [difficulty, user?.id, session?.user?.id, recordGameSession, queryClient]);
  
  const handlePlayAgain = useCallback(() => {
    setResults([]);
    setDurationSeconds(0);
    setXpAwarded(0);
    setQualityLine(undefined);
    // v1.2: Reset start time for new game
    startedAtRef.current = new Date();
    setPhase("playing");
  }, []);
  
  const handleBackToGym = useCallback(() => {
    navigate("/neuro-lab?tab=games&system=fast");
  }, [navigate]);

  const { requestExit, ConfirmDialog } = useExitConfirmation(handleBackToGym);
  
  return (
    <div className="fixed inset-0 bg-background">
      <AnimatePresence mode="wait">
        {phase === "difficulty" && (
          <motion.div
            key="difficulty"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <div className="flex items-center gap-3 p-4 border-b border-border/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/neuro-lab?tab=games&system=fast")}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Semantic Drift</span>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Navigate fast semantic drifts under time pressure
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  How it works
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  A <span className="font-medium">seed word</span> appears at the center. Four options surround it.
                  Tap the one that <span className="font-medium">best continues the chain</span> — the closest
                  forward association, not the most literal synonym or an unrelated word.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have only a few seconds per round. Trust your first instinct: this trains fast intuitive linking (System 1).
                </p>
              </div>
              
              <S1DifficultySelector
                options={[
                  { difficulty: "easy", status: "enabled" },
                  { difficulty: "medium", status: "recommended" },
                  { difficulty: "hard", status: "enabled" },
                ]}
                recommended="medium"
                selected={difficulty}
                onSelect={(d, _isOverride) => handleDifficultySelect(d)}
                accentColor="violet"
              />
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/neuro-lab?tab=games&system=fast")}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    startedAtRef.current = new Date();
                    setPhase("playing");
                  }}
                >
                  Start Drill
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <SemanticDriftDrill
              difficulty={difficulty}
              onComplete={handleGameComplete}
              onExit={handleBackToGym}
            />
          </motion.div>
        )}
        
        {phase === "results" && (
          <motion.div
            key="results"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full overflow-auto"
          >
            <SemanticDriftResults
              results={results}
              difficulty={difficulty}
              durationSeconds={durationSeconds}
              xpAwarded={xpAwarded}
              qualityLine={qualityLine}
              onPlayAgain={handlePlayAgain}
              onBackToGym={handleBackToGym}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {ConfirmDialog}
    </div>
  );
}
