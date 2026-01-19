/**
 * SEMANTIC DRIFT — Runner Page
 */

import { useState, useCallback } from "react";
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

type GamePhase = "difficulty" | "playing" | "results";

export default function SemanticDriftRunner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const recordGameSession = useRecordGameSession();
  
  const urlDifficulty = searchParams.get("difficulty") as Difficulty | null;
  const { recommended } = useS1Difficulty();
  
  const [phase, setPhase] = useState<GamePhase>(urlDifficulty ? "playing" : "difficulty");
  const [difficulty, setDifficulty] = useState<Difficulty>(urlDifficulty || recommended);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);
  
  const handleDifficultySelect = useCallback((selected: Difficulty) => {
    setDifficulty(selected);
    setPhase("playing");
  }, []);
  
  const handleGameComplete = useCallback(async (
    gameResults: RoundResult[],
    duration: number
  ) => {
    setResults(gameResults);
    setDurationSeconds(duration);
    
    const correctCount = gameResults.filter(r => r.chosenTag === "directional").length;
    const accuracy = gameResults.length > 0 ? correctCount / gameResults.length : 0;
    const score = Math.round(accuracy * 100);
    
    const baseXP = { easy: 15, medium: 20, hard: 25 }[difficulty];
    const xp = Math.round(baseXP * (0.5 + accuracy * 0.5));
    setXpAwarded(xp);
    
    if (user?.id) {
      try {
        await recordGameSession({
          gameType: "S1-RA",
          gymArea: "creativity",
          thinkingMode: "fast",
          xpAwarded: xp,
          score,
        });
        
        queryClient.invalidateQueries({ queryKey: ["weekly-progress"] });
        queryClient.invalidateQueries({ queryKey: ["user-metrics", user.id] });
      } catch (error) {
        console.error("[SemanticDrift] Failed to record session:", error);
      }
    }
    
    setPhase("results");
  }, [difficulty, user?.id, recordGameSession, queryClient]);
  
  const handlePlayAgain = useCallback(() => {
    setResults([]);
    setDurationSeconds(0);
    setXpAwarded(0);
    setPhase("playing");
  }, []);
  
  const handleBackToGym = useCallback(() => {
    navigate("/neuro-lab?tab=games");
  }, [navigate]);
  
  return (
    <div className="fixed inset-0 bg-background">
      <AnimatePresence mode="wait">
        {phase === "difficulty" && (
          <motion.div
            key="difficulty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
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
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-semibold">Semantic Drift</span>
              </div>
            </div>
            
            <div className="p-6">
              <S1DifficultySelector
                onSelect={handleDifficultySelect}
                onCancel={() => navigate("/neuro-lab?tab=games")}
              />
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
            <SemanticDriftDrill
              difficulty={difficulty}
              onComplete={handleGameComplete}
            />
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
            <SemanticDriftResults
              results={results}
              difficulty={difficulty}
              durationSeconds={durationSeconds}
              xpAwarded={xpAwarded}
              onPlayAgain={handlePlayAgain}
              onBackToGym={handleBackToGym}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
