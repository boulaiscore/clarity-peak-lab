/**
 * ORBIT LOCK — Runner Page
 * v1.1: Added auth validation and save confirmation
 */

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { toast } from "sonner";
import { OrbitLockDrill, OrbitLockFinalResults } from "@/components/games/orbit-lock";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrbitLockRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const recordGameSession = useRecordGameSession();
  
  const difficulty = (searchParams.get("difficulty") as "easy" | "medium" | "hard") || "medium";
  const [isComplete, setIsComplete] = useState(false);

  // v1.1: Validate auth before starting game
  useEffect(() => {
    if (!user?.id && !session?.user?.id) {
      toast.error("Please log in to play");
      navigate("/auth");
    }
  }, [user?.id, session?.user?.id, navigate]);

  const handleComplete = useCallback(async (results: OrbitLockFinalResults) => {
    setIsComplete(true);
    
    const userId = user?.id || session?.user?.id;
    if (userId) {
      try {
        console.log("[OrbitLock] Saving session for user:", userId);
        
        await recordGameSession({
          gameType: "S1-AE",
          gymArea: "focus",
          thinkingMode: "fast",
          xpAwarded: results.xpAwarded,
          score: results.score,
          gameName: "orbit_lock",
          timeInBandPct: results.totalTimeInBandPct,
          degradationSlope: results.degradationSlope,
          falseAlarmRate: null,
          hitRate: null,
          rtVariability: null,
        });
        
        console.log("[OrbitLock] ✅ Session saved successfully");
        toast.success(`+${results.xpAwarded} XP earned!`, { icon: "⭐" });
        
        if (results.isPerfect) {
          toast.success("Perfect Session! 🌟", { duration: 3000 });
        }
      } catch (error) {
        console.error("[OrbitLock] ❌ Failed to record session:", error);
        toast.error("Failed to save session");
      }
    } else {
      console.warn("[OrbitLock] No user ID, session not saved");
      toast.warning("Session not saved - please log in");
    }
    
    setTimeout(() => {
      navigate("/neuro-lab");
    }, 500);
  }, [user?.id, session?.user?.id, recordGameSession, navigate]);

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
            <h1 className="text-sm font-semibold">Orbit Lock</h1>
            <p className="text-[10px] text-muted-foreground capitalize">{difficulty} Mode</p>
          </div>
          
          <div className="w-16" />
        </div>
      </div>
      
      <div className="pt-16 pb-8 px-4">
        <OrbitLockDrill
          difficulty={difficulty}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
