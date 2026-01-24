/**
 * ============================================
 * SIGNAL VS NOISE RUNNER
 * ============================================
 * 
 * Game runner for S2 Insight game.
 * Manages phases: intro → playing → results
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import {
  SignalVsNoiseDrill,
  SignalVsNoiseResults,
  CaseResult,
  SessionMetrics,
  Difficulty,
  XP_BASE,
} from "@/components/games/signal-vs-noise";

type Phase = "intro" | "playing" | "results";

export default function SignalVsNoiseRunner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const recordGameSession = useRecordGameSession();
  
  const [phase, setPhase] = useState<Phase>("intro");
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [results, setResults] = useState<CaseResult[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  
  const startedAtRef = useRef<Date | null>(null);
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (phase === "playing" && !startedAtRef.current) {
      startedAtRef.current = new Date();
    }
  }, [phase]);

  const handleStart = () => {
    startedAtRef.current = new Date();
    hasRecordedRef.current = false;
    setPhase("playing");
  };

  const handleComplete = async (gameResults: CaseResult[], gameMetrics: SessionMetrics) => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    const endTime = new Date();
    const duration = startedAtRef.current
      ? Math.round((endTime.getTime() - startedAtRef.current.getTime()) / 1000)
      : 300;
    
    setResults(gameResults);
    setMetrics(gameMetrics);
    setDurationSeconds(duration);

    // Calculate XP: base * (score/100), min 6
    const baseXP = XP_BASE[difficulty];
    const scaledXP = Math.max(6, Math.round(baseXP * (gameMetrics.sessionScore / 100)));
    setXpAwarded(scaledXP);

    // Record session
    if (user) {
      try {
        await recordGameSession({
          gameType: "S2-IN",
          gymArea: "reasoning",
          thinkingMode: "slow",
          score: gameMetrics.sessionScore,
          xpAwarded: scaledXP,
          durationSeconds: duration,
          difficulty: difficulty === "standard" ? "medium" : difficulty,
          gameName: "signal_vs_noise",
          startedAt: startedAtRef.current?.toISOString() ?? null,
          status: 'completed',
        });
      } catch (error) {
        console.error("Failed to record Signal vs Noise session:", error);
      }
    }

    setPhase("results");
  };

  const handlePlayAgain = () => {
    setResults([]);
    setMetrics(null);
    setXpAwarded(0);
    startedAtRef.current = null;
    hasRecordedRef.current = false;
    setPhase("intro");
  };

  const handleBackToLab = () => {
    navigate("/neuro-lab");
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-4 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToLab}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Back to Lab</span>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">

              <motion.h1
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xl font-semibold mb-2"
              >
                Signal vs Noise
              </motion.h1>

              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground max-w-xs mb-2"
              >
                Identify which factor truly drives the outcome.
              </motion.p>

              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-sm text-muted-foreground max-w-xs mb-8"
              >
                Then justify it in one sentence.
              </motion.p>

              {/* Difficulty selector */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex gap-2 mb-8"
              >
                {(["easy", "standard", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      difficulty === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </motion.div>

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Button onClick={handleStart} size="lg" className="px-8">
                  Start
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[10px] text-muted-foreground/60 mt-4"
              >
                ~5 min • S2 Insight
              </motion.p>
            </div>
          </motion.div>
        )}

        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SignalVsNoiseDrill
              difficulty={difficulty}
              onComplete={handleComplete}
            />
          </motion.div>
        )}

        {phase === "results" && metrics && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SignalVsNoiseResults
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
