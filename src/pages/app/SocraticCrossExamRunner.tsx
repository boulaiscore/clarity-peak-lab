/**
 * SOCRATIC CROSS-EXAM — Runner Page
 * v1.8: Added daily XP cap enforcement
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { useDailyGamesXPCap } from "@/hooks/useDailyGamesXPCap";
import { 
  SocraticCrossExamDrill,
  SocraticCrossExamResults,
  SocraticRoundResult,
  SOCRATIC_CONFIG,
} from "@/components/games/socratic-cross-exam";
import { ArrowLeft, Brain, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type GamePhase = "intro" | "playing" | "results";

export default function SocraticCrossExamRunner() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const recordGameSession = useRecordGameSession();
  const { gamesWithXPToday, dailyMax, isCapReached } = useDailyGamesXPCap();
  
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [results, setResults] = useState<SocraticRoundResult[]>([]);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  
  const startedAtRef = useRef<Date | null>(null);
  
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
    gameResults: SocraticRoundResult[],
    duration: number
  ) => {
    setResults(gameResults);
    setDurationSeconds(duration);
    
    const avgScore = gameResults.reduce((sum, r) => sum + r.roundScore, 0) / gameResults.length;
    const score = Math.round(avgScore);
    
    // XP: base 18, min 6, scaled by score
    const rawXP = Math.max(SOCRATIC_CONFIG.minXP, Math.round(SOCRATIC_CONFIG.baseXP * (score / 100)));
    
    // v1.8: Apply daily XP cap
    const actualXP = isCapReached ? 0 : rawXP;
    setXpAwarded(actualXP);
    
    const userId = user?.id || session?.user?.id;
    if (userId) {
      try {
        await recordGameSession({
          gameType: "S2-CT",
          gymArea: "reasoning",
          thinkingMode: "slow",
          xpAwarded: actualXP,
          score,
          gameName: "socratic_cross_exam" as any,
          startedAt: startedAtRef.current?.toISOString() ?? null,
          durationSeconds: duration,
          status: 'completed',
          difficulty: 'medium',
        });
        
        // v1.8: Show appropriate toast based on cap status
        if (actualXP > 0) {
          toast.success(`+${actualXP} XP → Critical Thinking!`, { icon: "🧠" });
        } else {
          toast.info("Daily XP limit reached. Play for practice!", { icon: "🎯" });
        }
        queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
      } catch (error) {
        console.error("[SocraticCrossExam] Failed to record:", error);
        toast.error("Failed to save session");
      }
    }
    
    setPhase("results");
  }, [user?.id, session?.user?.id, recordGameSession, queryClient, isCapReached]);
  
  const handlePlayAgain = useCallback(() => {
    setResults([]);
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
                <Brain className="h-5 w-5 text-violet-400" />
                <span className="font-semibold">Socratic Cross-Exam</span>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-sm text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                  <Brain className="w-8 h-8 text-violet-400" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    Socratic Cross-Exam
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Surface hidden assumptions, test consistency, and find minimal contradictions through Socratic questioning.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3 py-4">
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold">5</div>
                    <div className="text-[10px] text-muted-foreground">Rounds</div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold">4-6</div>
                    <div className="text-[10px] text-muted-foreground">Minutes</div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/40 text-center">
                    <div className="text-lg font-semibold text-violet-400">CT</div>
                    <div className="text-[10px] text-muted-foreground">Skill</div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground/80 space-y-1">
                  <p>• Identify 2 load-bearing assumptions</p>
                  <p>• Answer a Socratic cross-exam question</p>
                  <p>• Find the minimal contradiction pair</p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/neuro-lab?tab=games")}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleStartGame}>
                    Begin
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {phase === "playing" && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <SocraticCrossExamDrill onComplete={handleGameComplete} />
          </motion.div>
        )}
        
        {phase === "results" && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-auto">
            <SocraticCrossExamResults
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
