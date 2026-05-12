/**
 * Replay Advisory Dialog
 *
 * Non-blocking advisory shown before launching a game when:
 *  - Same game replayed within optimal cooldown window
 *    (S1: 30 min, S2: 4 h) — cognitive signal not yet recovered
 *  - Same game saturated in 7-day rolling window
 *    (S1: ≥ 5 plays, S2: ≥ 3 plays) — additional reps degrade
 *    the metric signal-to-noise ratio
 *
 * Caps and metric gates remain enforced upstream (gamesGating.ts).
 * This dialog only surfaces when the user CAN play but it is not
 * the optimal moment for high-quality data.
 */

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock3, Activity } from "lucide-react";

type GameType = "S1-AE" | "S1-RA" | "S2-CT" | "S2-IN";

const COOLDOWN_MIN: Record<GameType, number> = {
  "S1-AE": 30,
  "S1-RA": 30,
  "S2-CT": 240,
  "S2-IN": 240,
};

const SATURATION_7D: Record<GameType, number> = {
  "S1-AE": 5,
  "S1-RA": 5,
  "S2-CT": 3,
  "S2-IN": 3,
};

interface AdvisoryState {
  open: boolean;
  reason: "cooldown" | "saturation" | null;
  cooldownMinutesLeft: number;
  recentCount: number;
  threshold: number;
  gameType: GameType | null;
  onProceed: (() => void) | null;
}

const initialState: AdvisoryState = {
  open: false,
  reason: null,
  cooldownMinutesLeft: 0,
  recentCount: 0,
  threshold: 0,
  gameType: null,
  onProceed: null,
};

export function useReplayAdvisory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [state, setState] = useState<AdvisoryState>(initialState);

  const checkAndPlay = useCallback(
    async (params: {
      gameType: GameType;
      gameName: string;
      onProceed: () => void;
    }) => {
      const userId = user?.id;
      if (!userId) {
        params.onProceed();
        return;
      }

      try {
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();

        const { data, error } = await qc.fetchQuery({
          queryKey: [
            "replay-advisory",
            userId,
            params.gameType,
            params.gameName,
          ],
          queryFn: async () => {
            const res = await supabase
              .from("game_sessions")
              .select("completed_at, game_name")
              .eq("user_id", userId)
              .eq("game_type", params.gameType)
              .eq("status", "completed")
              .gte("completed_at", sevenDaysAgo)
              .order("completed_at", { ascending: false })
              .limit(50);
            return res;
          },
          staleTime: 30_000,
        });

        if (error) {
          params.onProceed();
          return;
        }

        const sessions = data || [];
        const sameGame = sessions.filter(
          (s) => s.game_name === params.gameName,
        );

        // Cooldown check on most-recent same-game session
        const lastSame = sameGame[0];
        if (lastSame?.completed_at) {
          const minsSince =
            (Date.now() - new Date(lastSame.completed_at).getTime()) /
            60_000;
          const cooldown = COOLDOWN_MIN[params.gameType];
          if (minsSince < cooldown) {
            setState({
              open: true,
              reason: "cooldown",
              cooldownMinutesLeft: Math.max(1, Math.ceil(cooldown - minsSince)),
              recentCount: sameGame.length,
              threshold: SATURATION_7D[params.gameType],
              gameType: params.gameType,
              onProceed: params.onProceed,
            });
            return;
          }
        }

        // Saturation check (7-day rolling)
        const sat = SATURATION_7D[params.gameType];
        if (sameGame.length >= sat) {
          setState({
            open: true,
            reason: "saturation",
            cooldownMinutesLeft: 0,
            recentCount: sameGame.length,
            threshold: sat,
            gameType: params.gameType,
            onProceed: params.onProceed,
          });
          return;
        }

        params.onProceed();
      } catch {
        params.onProceed();
      }
    },
    [user?.id, qc],
  );

  const close = () => setState(initialState);

  const handleConfirm = () => {
    const proceed = state.onProceed;
    close();
    proceed?.();
  };

  const isS2 =
    state.gameType === "S2-CT" || state.gameType === "S2-IN";

  const AdvisoryDialog = (
    <AlertDialog
      open={state.open}
      onOpenChange={(o) => !o && close()}
    >
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {state.reason === "cooldown" ? (
              <Clock3 className="h-4 w-4 text-primary" />
            ) : (
              <Activity className="h-4 w-4 text-primary" />
            )}
            <AlertDialogTitle className="text-base font-semibold">
              {state.reason === "cooldown"
                ? "Signal still recovering"
                : "Skill saturated this week"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs leading-relaxed pt-1 space-y-2">
            {state.reason === "cooldown" ? (
              <>
                <span className="block">
                  You played this game recently. The optimal window
                  for a clean second reading is{" "}
                  <span className="font-medium text-foreground">
                    {isS2 ? "~4 hours" : "~30 minutes"}
                  </span>{" "}
                  — about{" "}
                  <span className="font-medium text-foreground">
                    {state.cooldownMinutesLeft} min
                  </span>{" "}
                  from now.
                </span>
                <span className="block text-muted-foreground/80">
                  Replaying earlier still works, but the score will
                  carry residual fatigue and contribute less to your
                  metrics.
                </span>
              </>
            ) : (
              <>
                <span className="block">
                  You've completed this drill{" "}
                  <span className="font-medium text-foreground">
                    {state.recentCount}× in the last 7 days
                  </span>
                  . Beyond {state.threshold} sessions per week the
                  signal degrades through learning effects.
                </span>
                <span className="block text-muted-foreground/80">
                  Consider rotating to a different{" "}
                  {isS2 ? "System 2" : "System 1"} drill for a richer
                  cognitive profile.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs">
            Choose another
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="text-xs"
          >
            Play anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { checkAndPlay, AdvisoryDialog };
}
