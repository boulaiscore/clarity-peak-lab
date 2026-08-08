/**
 * FOCUS SWITCH — Runner Page
 * v1.2: Added duration tracking + Manual-compliant session recording
 * v1.8: Added daily XP cap enforcement
 * v1.9: Added intraday event recording after session completion
 */

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { toast } from "sonner";
import { FocusSwitchDrill, FocusSwitchFinalResults } from "@/components/games/focus-switch";

export default function FocusSwitchRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const recordGameSession = useRecordGameSession();
  
  const difficulty = (searchParams.get("difficulty") as "easy" | "medium" | "hard") || "medium";
  
  // v1.2: Track session start time for duration calculation
  const startedAtRef = useRef<Date | null>(null);
  
  // v1.1: Validate auth before starting game
  useEffect(() => {
    if (!user?.id && !session?.user?.id) {
      toast.error("Please log in to start a drill");
      navigate("/auth");
    }
  }, [user?.id, session?.user?.id, navigate]);

  const handleComplete = useCallback(async (results: FocusSwitchFinalResults) => {
    // v1.2: Calculate duration
    const endedAt = new Date();
    const durationSeconds = startedAtRef.current
      ? Math.floor((endedAt.getTime() - startedAtRef.current.getTime()) / 1000)
      : 0;
    
    const userId = user?.id || session?.user?.id;
    if (userId) {
      try {
        console.log("[FocusSwitch] Saving session for user:", userId, "Duration:", durationSeconds, "XP:", results.xpAwarded);
        
        const savedSession = await recordGameSession({
          gameType: "S1-AE",
          gymArea: "focus",
          thinkingMode: "fast",
          xpAwarded: results.xpAwarded,
          score: results.score,
          gameName: "focus_switch",
          switchLatencyAvg: results.switchLatencyAvg,
          perseverationRate: results.perseverationRate,
          postSwitchErrorRate: results.postSwitchErrorRate,
          degradationSlope: results.degradationSlope,
          falseAlarmRate: results.falseAlarmRate,
          hitRate: results.hitRate,
          rtVariability: results.rtVariability,
          timeInBandPct: null,
          // v1.2: New duration tracking params
          startedAt: startedAtRef.current?.toISOString() ?? null,
          durationSeconds,
          status: 'completed',
          difficulty,
          qualityScore: results.qualityScore,
          bonusApplied: results.bonusApplied,
        });
        const savedXP = savedSession?.xp_awarded ?? 0;
        
        console.log("[FocusSwitch] ✅ Session saved successfully");
        
        if (savedXP > 0) {
          toast.success(`+${savedXP} XP earned`);
          if (results.isPerfect) {
            toast.success("Perfect session", { duration: 3000 });
          }
        } else {
          toast.info("Daily XP limit reached. Continue for practice.");
        }
        return savedXP;
      } catch (error) {
        console.error("[FocusSwitch] ❌ Failed to record session:", error);
        toast.error("Failed to save session");
        return 0;
      }
    } else {
      console.warn("[FocusSwitch] No user ID, session not saved");
      toast.warning("Session not saved - please log in");
      return 0;
    }
  }, [user?.id, session?.user?.id, recordGameSession, difficulty]);

  const handleBack = () => {
    navigate("/neuro-lab?tab=games&system=fast");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-8 px-4">
        <FocusSwitchDrill
          difficulty={difficulty}
          onComplete={handleComplete}
          onExit={handleBack}
          onStart={() => { startedAtRef.current = new Date(); }}
        />
      </div>
    </div>
  );
}
