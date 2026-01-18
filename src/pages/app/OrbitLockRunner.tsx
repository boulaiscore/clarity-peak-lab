import { useState, useCallback } from "react";
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
  const { user } = useAuth();
  const recordGameSession = useRecordGameSession();
  
  const difficulty = (searchParams.get("difficulty") as "easy" | "medium" | "hard") || "medium";
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = useCallback(async (results: OrbitLockFinalResults) => {
    setIsComplete(true);
    
    // Record game session for caps, XP routing, and AE Guidance metrics
    if (user?.id) {
      try {
        await recordGameSession({
          gameType: "S1-AE",
          gymArea: "focus",
          thinkingMode: "fast",
          xpAwarded: results.xpAwarded,
          score: results.score,
          // AE Guidance metrics
          gameName: "orbit_lock",
          timeInBandPct: results.totalTimeInBandPct, // Already 0-100
          degradationSlope: results.degradationSlope,
          // Orbit Lock doesn't have these Triage Sprint metrics
          falseAlarmRate: null,
          hitRate: null,
          rtVariability: null,
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
            <h1 className="text-sm font-semibold">Orbit Lock</h1>
            <p className="text-[10px] text-muted-foreground capitalize">{difficulty} Mode</p>
          </div>
          
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>
      
      {/* Game Content */}
      <div className="pt-16 pb-8 px-4">
        <OrbitLockDrill
          difficulty={difficulty}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
