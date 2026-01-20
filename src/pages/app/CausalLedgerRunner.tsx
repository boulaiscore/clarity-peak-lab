/**
 * CAUSAL LEDGER — Runner Page
 * S2-CT Critical Thinking training game
 * v1.2: Added duration tracking + Manual-compliant session recording
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { 
  CausalLedgerDrill, 
  CausalLedgerResults,
  RoundResult,
  CAUSAL_LEDGER_CONFIG,
} from "@/components/games/causal-ledger";
import { ArrowLeft, Brain, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type GamePhase = "intro" | "playing" | "results";

export default function CausalLedgerRunner() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const recordGameSession = useRecordGameSession();
  
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // v1.2: Track session start time for duration calculation
  const startedAtRef = useRef<Date | null>(null);
  
  // Validate auth
  useEffect(() => {
    if (!user?.id && !session?.user?.id) {
      toast.error("Please log in to play");
      navigate("/auth");
    }
  }, [user?.id, session?.user?.id, navigate]);
  
  const handleStartGame = useCallback(() => {
    // v1.2: Start timing when game begins
    startedAtRef.current = new Date();
    setPhase("playing");
  }, []);
  
  const handleGameComplete = useCallback(async (
    gameResults: RoundResult[],
    duration: number
  ) => {
    setResults(gameResults);
    setDurationSeconds(duration);
    
    // Calculate metrics
    const correctCount = gameResults.filter(r => r.isCorrect).length;
    const accuracy = gameResults.length > 0 ? correctCount / gameResults.length : 0;
    const score = Math.round(accuracy * 100);
    
    // XP calculation for S2 game
    const baseXP = 25;
    const xp = Math.round(baseXP * (0.5 + accuracy * 0.5));
    setXpAwarded(xp);
    
    // v1.2: Calculate duration from startedAtRef
    const endedAt = new Date();
    const calculatedDuration = startedAtRef.current
      ? Math.floor((endedAt.getTime() - startedAtRef.current.getTime()) / 1000)
      : duration;
    
    // Save session
    const userId = user?.id || session?.user?.id;
    if (userId) {
      setIsSaving(true);
      try {
        console.log("[CausalLedger] Saving session for user:", userId, "Duration:", calculatedDuration);
        
        await recordGameSession({
          gameType: "S2-CT",
          gymArea: "reasoning",
          thinkingMode: "slow",
          xpAwarded: xp,
          score,
          gameName: "causal_ledger",
          // v1.2: New duration tracking params
          startedAt: startedAtRef.current?.toISOString() ?? null,
          durationSeconds: calculatedDuration,
          status: 'completed',
          difficulty: 'medium', // S2 games have fixed difficulty
        });
        
        console.log("[CausalLedger] ✅ Session saved successfully");
        toast.success(`+${xp} XP → Critical Thinking!`, { icon: "🧠" });
        
        queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
        queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
      } catch (error) {
        console.error("[CausalLedger] ❌ Failed to record session:", error);
        toast.error("Failed to save session");
      } finally {
        setIsSaving(false);
      }
    } else {
      console.warn("[CausalLedger] No user ID, session not saved");
      toast.warning("Session not saved - please log in");
    }
    
    setPhase("results");
  }, [user?.id, session?.user?.id, recordGameSession, queryClient]);
  
  const handlePlayAgain = useCallback(() => {
    setResults([]);
    setDurationSeconds(0);
    setXpAwarded(0);
    // v1.2: Reset start time for new game
    startedAtRef.current = new Date();
    setPhase("playing");
  }, []);
  
  const handleBackToLab = useCallback(() => {
    navigate("/neuro-lab?tab=games");
  }, [navigate]);
  
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
                <Scale className="h-5 w-5 text-violet-400" />
                <span className="font-semibold">Causal Ledger</span>
              </div>
            </div>
            
            {/* Intro Content */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-sm text-center space-y-6">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                  <Scale className="w-8 h-8 text-violet-400" />
                </div>
                
                {/* Title */}
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    Causal Ledger
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Evaluate the validity of causal claims under uncertainty. 
                    Judge reasoning quality, not answers.
                  </p>
                </div>
                
                {/* Info cards */}
                <div className="grid grid-cols-3 gap-3 py-4">
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold text-foreground">12</div>
                    <div className="text-[10px] text-muted-foreground">Rounds</div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold text-foreground">3</div>
                    <div className="text-[10px] text-muted-foreground">Acts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold text-violet-400">CT</div>
                    <div className="text-[10px] text-muted-foreground">Skill</div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="text-xs text-muted-foreground/80 space-y-1">
                  <p>• Read each scenario and claim carefully</p>
                  <p>• Evaluate if the causal reasoning is sound</p>
                  <p>• No time pressure — deliberate thinking encouraged</p>
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
                    Begin
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
            <CausalLedgerDrill onComplete={handleGameComplete} />
          </motion.div>
        )}
        
        {phase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full overflow-auto"
          >
            <CausalLedgerResults
              results={results}
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
