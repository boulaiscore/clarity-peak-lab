/**
 * ============================================
 * FLASH CONNECT RUNNER – S1-RA Game
 * ============================================
 * 
 * Runner page for the Flash Connect game.
 * Routes XP to RA (fast_thinking) only.
 */

import { useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { toast } from "sonner";
import { FlashConnectDrill, FlashConnectFinalResults } from "@/components/games/flash-connect";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FlashConnectRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const recordGameSession = useRecordGameSession();
  
  const difficulty = (searchParams.get("difficulty") as "easy" | "medium" | "hard") || "medium";
  const isOverride = searchParams.get("override") === "true";
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = useCallback(async (results: FlashConnectFinalResults) => {
    setIsComplete(true);
    
    // Record game session for caps, XP routing
    // S1-RA routes XP to RA (fast_thinking)
    if (user?.id) {
      try {
        await recordGameSession({
          gameType: "S1-RA",
          gymArea: "creativity",
          thinkingMode: "fast",
          xpAwarded: results.xpAwarded,
          score: results.score,
          // Flash Connect specific metrics
          gameName: "flash_connect" as any,
          difficultyOverride: isOverride,
          // No AE guidance metrics for this game
          falseAlarmRate: null,
          hitRate: results.connectionRate,
          rtVariability: null,
          degradationSlope: null,
          timeInBandPct: null,
          switchLatencyAvg: null,
          perseverationRate: null,
          postSwitchErrorRate: null,
        });
        
        toast.success(`+${results.xpAwarded} XP earned!`, { icon: "⭐" });
        
        if (results.isPerfect) {
          toast.success("Perfect Session! 🌟", { duration: 3000 });
        }
      } catch (error) {
        console.error("Failed to record game session:", error);
      }
    }
    
    // Navigate back after showing results
    setTimeout(() => {
      navigate("/neuro-lab");
    }, 500);
  }, [user?.id, recordGameSession, navigate]);

  const handleBack = () => {
    navigate("/neuro-lab");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Exit</span>
          </Button>
          
          <div className="text-center">
            <h1 className="text-sm font-semibold">Flash Connect</h1>
            <p className="text-[10px] text-muted-foreground capitalize">{difficulty} Mode</p>
          </div>
          
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>
      
      {/* Game Content */}
      <div className="pt-16 pb-8 px-4">
        <FlashConnectDrill
          difficulty={difficulty}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
