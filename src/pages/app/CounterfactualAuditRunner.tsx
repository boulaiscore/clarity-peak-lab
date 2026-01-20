/**
 * COUNTERFACTUAL AUDIT — Runner Page
 * S2-CT Critical Thinking training game
 * 
 * Manages game phases (intro, playing, results) and session recording.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { 
  CounterfactualAuditDrill, 
  CounterfactualAuditResults,
  RoundResult,
  SessionMetrics,
  DIFFICULTY_CONFIG,
  XP_BASE,
  Difficulty,
} from "@/components/games/counterfactual-audit";
import { ArrowLeft, Brain, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type GamePhase = "intro" | "playing" | "results";

export default function CounterfactualAuditRunner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const recordGameSession = useRecordGameSession();
  
  // Get difficulty from URL params or default to standard
  const difficultyParam = searchParams.get("difficulty") as Difficulty | null;
  const [difficulty] = useState<Difficulty>(
    difficultyParam && ["easy", "standard", "hard"].includes(difficultyParam) 
      ? difficultyParam 
      : "standard"
  );
  
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track session start time
  const startedAtRef = useRef<Date | null>(null);
  
  // Validate auth
  useEffect(() => {
    if (!user?.id && !session?.user?.id) {
      toast.error("Please log in to play");
      navigate("/auth");
    }
  }, [user?.id, session?.user?.id, navigate]);
  
  const handleStartGame = useCallback(() => {
    startedAtRef.current = new Date();
    setPhase("playing");
  }, []);
  
  const handleGameComplete = useCallback(async (
    gameResults: RoundResult[],
    gameMetrics: SessionMetrics,
    duration: number
  ) => {
    setResults(gameResults);
    setMetrics(gameMetrics);
    setDurationSeconds(duration);
    
    // XP calculation
    const baseXP = XP_BASE[difficulty];
    const xp = Math.round(baseXP * (gameMetrics.sessionScore / 100));
    const finalXP = Math.max(6, xp); // Minimum 6 XP for completion
    setXpAwarded(finalXP);
    
    // Calculate duration from startedAtRef
    const endedAt = new Date();
    const calculatedDuration = startedAtRef.current
      ? Math.floor((endedAt.getTime() - startedAtRef.current.getTime()) / 1000)
      : duration;
    
    // Save session
    const userId = user?.id || session?.user?.id;
    if (userId) {
      setIsSaving(true);
      try {
        console.log("[CounterfactualAudit] Saving session for user:", userId, "Duration:", calculatedDuration);
        
        await recordGameSession({
          gameType: "S2-CT",
          gymArea: "reasoning",
          thinkingMode: "slow",
          xpAwarded: finalXP,
          score: gameMetrics.sessionScore,
          gameName: "causal_ledger", // Using existing game name for now
          startedAt: startedAtRef.current?.toISOString() ?? null,
          durationSeconds: calculatedDuration,
          status: 'completed',
          difficulty: difficulty === "standard" ? "medium" : difficulty,
        });
        
        console.log("[CounterfactualAudit] ✅ Session saved successfully");
        toast.success(`+${finalXP} XP → Critical Thinking!`, { icon: "🧠" });
        
        queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
        queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
      } catch (error) {
        console.error("[CounterfactualAudit] ❌ Failed to record session:", error);
        toast.error("Failed to save session");
      } finally {
        setIsSaving(false);
      }
    } else {
      console.warn("[CounterfactualAudit] No user ID, session not saved");
      toast.warning("Session not saved - please log in");
    }
    
    setPhase("results");
  }, [user?.id, session?.user?.id, recordGameSession, queryClient, difficulty]);
  
  const handlePlayAgain = useCallback(() => {
    setResults([]);
    setMetrics(null);
    setDurationSeconds(0);
    setXpAwarded(0);
    startedAtRef.current = new Date();
    setPhase("playing");
  }, []);
  
  const handleBackToLab = useCallback(() => {
    navigate("/neuro-lab?tab=games");
  }, [navigate]);
  
  const config = DIFFICULTY_CONFIG[difficulty];
  
  return (
    <div className="fixed inset-0 bg-background">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/neuro-lab?tab=games")}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-violet-400" />
                <span className="font-semibold">Counterfactual Audit</span>
              </div>
            </div>
            
            {/* Intro Content */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-sm text-center space-y-6">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-violet-400" />
                </div>
                
                {/* Title */}
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    Counterfactual Audit
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pick the single missing fact that would change the decision.
                    <br />Then rate your confidence.
                  </p>
                </div>
                
                {/* Info cards */}
                <div className="grid grid-cols-3 gap-3 py-4">
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold text-foreground">{config.rounds}</div>
                    <div className="text-[10px] text-muted-foreground">Rounds</div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold text-foreground">{config.timePerRound}s</div>
                    <div className="text-[10px] text-muted-foreground">Per Round</div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold text-violet-400">CT</div>
                    <div className="text-[10px] text-muted-foreground">Skill</div>
                  </div>
                </div>
                
                {/* Difficulty indicator */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-muted-foreground">Difficulty:</span>
                  <span className="text-xs font-medium text-foreground capitalize">{difficulty}</span>
                </div>
                
                {/* CTA */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/neuro-lab?tab=games")}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    onClick={handleStartGame}
                  >
                    Start
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <CounterfactualAuditDrill 
              difficulty={difficulty}
              onComplete={handleGameComplete} 
            />
          </motion.div>
        )}
        
        {phase === "results" && metrics && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full overflow-auto"
          >
            <CounterfactualAuditResults
              results={results}
              metrics={metrics}
              difficulty={difficulty}
              durationSeconds={durationSeconds}
              xpAwarded={xpAwarded}
              onPlayAgain={handlePlayAgain}
              onBackToLab={handleBackToLab}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
