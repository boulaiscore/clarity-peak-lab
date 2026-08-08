/**
 * ============================================
 * CONSTELLATION SNAP RUNNER – S1-RA Game
 * ============================================
 * 
 * Runner page for the Constellation Snap game.
 * Routes XP to RA (fast_thinking) only.
 * v1.2: Added duration tracking + Manual-compliant session recording
 */

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRecordGameSession } from "@/hooks/useGamesGating";
import { toast } from "sonner";
import { ConstellationSnapDrill, ConstellationSnapFinalResults } from "@/components/games/constellation-snap";

export default function ConstellationSnapRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const recordGameSession = useRecordGameSession();
  
  const difficulty = (searchParams.get("difficulty") as "easy" | "medium" | "hard") || "medium";
  const isOverride = searchParams.get("override") === "true";
  
  // v1.2: Track session start time for duration calculation
  const startedAtRef = useRef<Date | null>(null);
  
  // v1.1: Validate auth before starting game
  useEffect(() => {
    if (!user?.id && !session?.user?.id) {
      toast.error("Please log in to start a drill");
      navigate("/auth");
    }
  }, [user?.id, session?.user?.id, navigate]);

  const handleComplete = useCallback(async (results: ConstellationSnapFinalResults) => {
    // v1.2: Calculate duration
    const endedAt = new Date();
    const durationSeconds = startedAtRef.current
      ? Math.floor((endedAt.getTime() - startedAtRef.current.getTime()) / 1000)
      : 0;
    
    const userId = user?.id || session?.user?.id;
    if (userId) {
      try {
        console.log("[ConstellationSnap] Saving session for user:", userId, "Duration:", durationSeconds);
        
        const savedSession = await recordGameSession({
          gameType: "S1-RA",
          gymArea: "creativity",
          thinkingMode: "fast",
          xpAwarded: results.xpAwarded,
          score: results.sessionScore,
          gameName: "constellation_snap",
          difficultyOverride: isOverride,
          hitRate: results.accuracy / 100,
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
          qualityScore: results.qualityScore,
          bonusApplied: results.bonusApplied,
          comboHash: results.comboHash,
          antiRepetitionTriggered: results.duplicatesRejected > 0,
          duplicatesRejected: results.duplicatesRejected,
          fallbackUsed: results.fallbackUsed,
        });
        const savedXP = savedSession?.xp_awarded ?? 0;
        
        console.log("[ConstellationSnap] ✅ Session saved successfully");
        if (savedXP > 0) toast.success(`+${savedXP} XP earned`);
        else toast.info("Daily XP limit reached. Continue for practice.");
        
        if (results.isPerfect) {
          toast.success("Perfect session", { duration: 3000 });
        }
        return savedXP;
      } catch (error) {
        console.error("[ConstellationSnap] ❌ Failed to record session:", error);
        toast.error("Failed to save session");
        return 0;
      }
    } else {
      console.warn("[ConstellationSnap] No user ID, session not saved");
      toast.warning("Session not saved - please log in");
      return 0;
    }
  }, [user?.id, session?.user?.id, recordGameSession, isOverride, difficulty]);

  const handleBack = () => {
    navigate("/neuro-lab?tab=games&system=fast");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-8 px-4">
        <ConstellationSnapDrill
          difficulty={difficulty}
          onComplete={handleComplete}
          onExit={handleBack}
          onStart={() => { startedAtRef.current = new Date(); }}
        />
      </div>
    </div>
  );
}
