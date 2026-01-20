/**
 * ============================================
 * CONSTELLATION SNAP RUNNER – S1-RA Game
 * ============================================
 * 
 * Runner page for the Constellation Snap game.
 * Routes XP to RA (fast_thinking) only.
 * v1.2: Added duration tracking + Manual-compliant session recording
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { toast } from "sonner";
import { ConstellationSnapDrill, ConstellationSnapFinalResults } from "@/components/games/constellation-snap";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConstellationSnapRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const recordGameSession = useRecordGameSession();
  
  const difficulty = (searchParams.get("difficulty") as "easy" | "medium" | "hard") || "medium";
  const isOverride = searchParams.get("override") === "true";
  const [isComplete, setIsComplete] = useState(false);
  
  // v1.2: Track session start time for duration calculation
  const startedAtRef = useRef<Date | null>(null);
  
  useEffect(() => {
    startedAtRef.current = new Date();
  }, []);

  // v1.1: Validate auth before starting game
  useEffect(() => {
    if (!user?.id && !session?.user?.id) {
      toast.error("Please log in to play");
      navigate("/auth");
    }
  }, [user?.id, session?.user?.id, navigate]);

  const handleComplete = useCallback(async (results: ConstellationSnapFinalResults) => {
    setIsComplete(true);
    
    // v1.2: Calculate duration
    const endedAt = new Date();
    const durationSeconds = startedAtRef.current
      ? Math.floor((endedAt.getTime() - startedAtRef.current.getTime()) / 1000)
      : 0;
    
    const userId = user?.id || session?.user?.id;
    if (userId) {
      try {
        console.log("[ConstellationSnap] Saving session for user:", userId, "Duration:", durationSeconds);
        
        await recordGameSession({
          gameType: "S1-RA",
          gymArea: "creativity",
          thinkingMode: "fast",
          xpAwarded: results.xpAwarded,
          score: results.sessionScore,
          gameName: "constellation_snap",
          difficultyOverride: isOverride,
          hitRate: results.accuracy,
          rtVariability: null,
          degradationSlope: null,
          timeInBandPct: null,
          falseAlarmRate: null,
          switchLatencyAvg: null,
          perseverationRate: null,
          postSwitchErrorRate: null,
          // v1.2: New duration tracking params
          startedAt: startedAtRef.current?.toISOString() ?? null,
          durationSeconds,
          status: 'completed',
          difficulty,
        });
        
        console.log("[ConstellationSnap] ✅ Session saved successfully");
        toast.success(`+${results.xpAwarded} XP earned!`, { icon: "⭐" });
        
        if (results.isPerfect) {
          toast.success("Perfect Session! 🌟", { duration: 3000 });
        }
      } catch (error) {
        console.error("[ConstellationSnap] ❌ Failed to record session:", error);
        toast.error("Failed to save session");
      }
    } else {
      console.warn("[ConstellationSnap] No user ID, session not saved");
      toast.warning("Session not saved - please log in");
    }
    
    setTimeout(() => {
      navigate("/neuro-lab");
    }, 500);
  }, [user?.id, session?.user?.id, recordGameSession, navigate, isOverride, difficulty]);

  const handleBack = () => {
    navigate("/neuro-lab");
  };

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-sm font-semibold">Constellation Snap</h1>
            <p className="text-[10px] text-muted-foreground capitalize">{difficulty} Mode</p>
          </div>
          
          <div className="w-16" />
        </div>
      </div>
      
      <div className="pt-16 pb-8 px-4">
        <ConstellationSnapDrill
          difficulty={difficulty}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
