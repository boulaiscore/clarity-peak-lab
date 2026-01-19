/**
 * TRIAGE SPRINT — Runner Page
 * v1.1: Added auth validation and save confirmation
 */

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { toast } from "sonner";
import { TriageSprintDrill } from "@/components/drills/focus-fast/TriageSprintDrill";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TriageSprintRunner() {
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

  const handleComplete = useCallback(async (results: {
    score: number;
    hits: number;
    xpAwarded: number;
    hitRate: number;
    falseAlarmRate: number;
    lureErrorRate: number;
    rtMean: number;
    rtP50: number;
    rtP90: number;
    degradationSlope: number;
    isPerfect: boolean;
  }) => {
    setIsComplete(true);
    
    const rtVariability = results.rtP90 - results.rtP50;
    
    const userId = user?.id || session?.user?.id;
    if (userId) {
      try {
        console.log("[TriageSprint] Saving session for user:", userId);
        
        await recordGameSession({
          gameType: "S1-AE",
          gymArea: "focus",
          thinkingMode: "fast",
          xpAwarded: results.xpAwarded,
          score: results.score,
          gameName: "triage_sprint",
          falseAlarmRate: results.falseAlarmRate,
          hitRate: results.hitRate,
          rtVariability: rtVariability,
          degradationSlope: results.degradationSlope,
          timeInBandPct: null,
        });
        
        console.log("[TriageSprint] ✅ Session saved successfully");
        toast.success(`+${results.xpAwarded} XP earned!`, { icon: "⭐" });
        
        if (results.isPerfect) {
          toast.success("Perfect Session! 🌟", { duration: 3000 });
        }
      } catch (error) {
        console.error("[TriageSprint] ❌ Failed to record session:", error);
        toast.error("Failed to save session");
      }
    } else {
      console.warn("[TriageSprint] No user ID, session not saved");
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
            <h1 className="text-sm font-semibold">Triage Sprint</h1>
            <p className="text-[10px] text-muted-foreground capitalize">{difficulty} Mode</p>
          </div>
          
          <div className="w-16" />
        </div>
      </div>
      
      <div className="pt-16 pb-8 px-4">
        <TriageSprintDrill
          difficulty={difficulty}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
