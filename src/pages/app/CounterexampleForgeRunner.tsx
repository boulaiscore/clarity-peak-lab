/**
 * COUNTEREXAMPLE FORGE — Runner Page
 * 
 * S2-IN (Insight) training game.
 * Orchestrates intro → playing → results flow.
 */

import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeft, Hammer, Clock, Star, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  CounterexampleForgeDrill,
  CounterexampleForgeResults,
  RoundResult,
  SessionMetrics,
  Difficulty,
  XP_BASE,
  CLEAN_BREAK_BONUS,
  SESSION_CONFIG,
} from "@/components/games/counterexample-forge";
import { useRecordGameSession } from "@/hooks/useGamesGating";

type Phase = "intro" | "playing" | "results";

export default function CounterexampleForgeRunner() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const recordGameSession = useRecordGameSession();
  
  const [phase, setPhase] = useState<Phase>("intro");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [hasCleanBreak, setHasCleanBreak] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const startedAtRef = useRef<Date | null>(null);
  const hasRecordedRef = useRef(false);
  
  // Start game
  const handleStart = useCallback(() => {
    startedAtRef.current = new Date();
    hasRecordedRef.current = false;
    setPhase("playing");
  }, []);
  
  // Game complete handler
  const handleComplete = useCallback(async (
    gameResults: RoundResult[],
    gameMetrics: SessionMetrics,
    duration: number
  ) => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;
    
    setResults(gameResults);
    setMetrics(gameMetrics);
    setDurationSeconds(duration);
    
    // Calculate XP
    const baseXP = XP_BASE[difficulty];
    
    // Check for clean break bonus
    const cleanBreak = gameMetrics.counterexampleFoundActI && 
                       !gameMetrics.assistedBreak && 
                       gameMetrics.attemptsUsedActI === 1;
    
    setHasCleanBreak(cleanBreak);
    
    const xp = cleanBreak ? baseXP + CLEAN_BREAK_BONUS : baseXP;
    setXpAwarded(xp);
    
    // Record session
    const userId = user?.id || session?.user?.id;
    if (userId) {
      setIsSaving(true);
      try {
        await recordGameSession({
          gameType: "S2-IN",
          gymArea: "creativity",
          thinkingMode: "slow",
          xpAwarded: xp,
          score: gameMetrics.sessionScore,
          gameName: "counterexample_forge",
          startedAt: startedAtRef.current?.toISOString() ?? null,
          durationSeconds: duration,
          status: 'completed',
          difficulty,
        });
        
        toast.success(`+${xp} XP → Insight!`, { icon: "🔬" });
        
        queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
        queryClient.invalidateQueries({ queryKey: ["user-metrics", userId] });
      } catch (error) {
        console.error("[CounterexampleForge] Failed to record session:", error);
        toast.error("Failed to save session");
      } finally {
        setIsSaving(false);
      }
    }
    
    setPhase("results");
  }, [user?.id, session?.user?.id, recordGameSession, queryClient, difficulty]);
  
  // Play again
  const handlePlayAgain = useCallback(() => {
    setResults([]);
    setMetrics(null);
    setXpAwarded(0);
    setHasCleanBreak(false);
    setDurationSeconds(0);
    hasRecordedRef.current = false;
    setPhase("intro");
  }, []);
  
  // Back to lab
  const handleBackToLab = useCallback(() => {
    navigate("/neuro-lab?tab=games");
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {/* INTRO SCREEN */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col"
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
                <Hammer className="h-5 w-5 text-violet-400" />
                <span className="font-semibold">Counterexample Forge</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-sm text-center space-y-6">
                {/* Title */}
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    Counterexample Forge
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Break the rule. Patch it. Stress-test.
                  </p>
                </div>
                
                {/* Info cards */}
                <div className="grid grid-cols-3 gap-3 py-4">
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold text-foreground">{SESSION_CONFIG.totalRounds}</div>
                    <div className="text-[10px] text-muted-foreground">rounds</div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">4–6 min</div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400/50" />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">~{XP_BASE[difficulty]} XP</div>
                  </div>
                </div>
                
                {/* Difficulty selector */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    Difficulty
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "p-2.5 rounded-xl border transition-all text-sm font-medium",
                          difficulty === d
                            ? "bg-violet-500/10 border-violet-500/40 text-violet-300"
                            : "bg-card border-border/40 text-muted-foreground hover:border-violet-500/30"
                        )}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                        {d === "medium" && (
                          <span className="block text-[9px] text-violet-400/70 mt-0.5">
                            Suggested
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* CTAs */}
                <div className="space-y-3 pt-4">
                  <Button onClick={handleStart} className="w-full h-12 text-base">
                    Start Session
                  </Button>
                  <button
                    onClick={() => setShowHowItWorks(true)}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    How it works
                  </button>
                </div>
              </div>
            </div>
            
            {/* How It Works Modal */}
            <AnimatePresence>
              {showHowItWorks && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                  onClick={() => setShowHowItWorks(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-sm w-full bg-card border border-border/40 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">How It Works</h3>
                      <button onClick={() => setShowHowItWorks(false)}>
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                    
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-violet-400">1</span>
                        </div>
                        <p>
                          <strong className="text-foreground">Break</strong> — Find a test case that disproves the proposed rule.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-violet-400">2</span>
                        </div>
                        <p>
                          <strong className="text-foreground">Patch</strong> — Choose which fix makes the rule more robust.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-violet-400">3</span>
                        </div>
                        <p>
                          <strong className="text-foreground">Stress-Test</strong> — Pick informative tests to challenge the patched rule.
                        </p>
                      </div>
                    </div>
                    
                    <Button onClick={() => setShowHowItWorks(false)} className="w-full mt-4">
                      Got it
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        
        {/* PLAYING SCREEN */}
        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CounterexampleForgeDrill
              difficulty={difficulty}
              onComplete={handleComplete}
            />
          </motion.div>
        )}
        
        {/* RESULTS SCREEN */}
        {phase === "results" && metrics && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CounterexampleForgeResults
              results={results}
              metrics={metrics}
              difficulty={difficulty}
              durationSeconds={durationSeconds}
              xpAwarded={xpAwarded}
              hasCleanBreak={hasCleanBreak}
              onPlayAgain={handlePlayAgain}
              onBackToLab={handleBackToLab}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
