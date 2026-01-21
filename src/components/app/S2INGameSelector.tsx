/**
 * ============================================
 * S2-IN GAME SELECTOR
 * ============================================
 * 
 * Selector sheet for S2 Insight games.
 * Matches S2CTGameSelector styling.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Lock, ChevronRight, ShieldAlert, Star, Timer, Clock, FlaskConical } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamesGating } from "@/hooks/useGamesGating";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format } from "date-fns";

interface S2INGameSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GameOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  route: string;
  estimatedXP: number;
  estimatedDuration: string;
}

const GAMES: GameOption[] = [
  {
    id: "signal_vs_noise",
    name: "Signal vs Noise",
    tagline: "Pattern Recognition",
    description: "Find the real driver behind messy outcomes. Detect the one causal signal hidden in ambiguous data.",
    icon: Sparkles,
    route: "/neuro-lab/signal-vs-noise",
    estimatedXP: 22,
    estimatedDuration: "~5 min",
  },
  {
    id: "hidden_rule_lab",
    name: "Hidden Rule Lab",
    tagline: "Hypothesis Testing",
    description: "Infer hidden mechanisms by observing patterns and choosing informative tests to confirm your hypothesis.",
    icon: FlaskConical,
    route: "/neuro-lab/hidden-rule-lab",
    estimatedXP: 25,
    estimatedDuration: "~5 min",
  },
  {
    id: "counterexample_forge",
    name: "Counterexample Forge",
    tagline: "Rule Breaking",
    description: "Disprove proposed rules, choose the best patch, then stress-test your improved hypothesis.",
    icon: FlaskConical,
    route: "/neuro-lab/counterexample-forge",
    estimatedXP: 25,
    estimatedDuration: "~5 min",
  },
];

// Helper to get human-readable reason
function getWithholdReason(reasonCode?: string | null): string {
  if (!reasonCode) return "Unavailable";
  
  switch (reasonCode) {
    case "RECOVERY_TOO_LOW":
      return "Recovery is low — build recovery through Detox or Walk";
    case "SHARPNESS_TOO_LOW":
      return "Sharpness below threshold";
    case "CAP_REACHED_DAILY_S2":
      return "Daily reasoning limit reached";
    case "CAP_REACHED_WEEKLY_IN":
      return "Weekly insight limit reached";
    default:
      return "Temporarily unavailable";
  }
}

export function S2INGameSelector({ open, onOpenChange }: S2INGameSelectorProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get gating status for S2-IN
  const { games: gatingResults, isLoading: gatingLoading } = useGamesGating();
  const s2inGating = gatingResults["S2-IN"];
  const isLocked = s2inGating && s2inGating.status !== "ENABLED";
  const isProtection = s2inGating?.status === "PROTECTION";
  
  // Fetch recently played games (last 7 days)
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss");
  const { data: recentlyPlayedGames } = useQuery({
    queryKey: ["recently-played-in-games", user?.id, sevenDaysAgo],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("game_name, game_type")
        .eq("user_id", user.id)
        .eq("game_type", "S2-IN")
        .gte("completed_at", sevenDaysAgo);
      
      if (error) throw error;
      
      // Return unique game names
      const gameNames = (data || []).map(d => d.game_name).filter(Boolean);
      return [...new Set(gameNames)];
    },
    enabled: !!user?.id && open,
    staleTime: 60_000,
  });

  const handleSelectGame = (game: GameOption) => {
    if (isLocked) return;
    
    onOpenChange(false);
    setTimeout(() => {
      navigate(game.route);
    }, 150);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DrawerHeader className="pb-4">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-area-slow/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-area-slow" />
              </div>
              <div>
                <span className="text-foreground">Insight</span>
                <span className="text-xs text-muted-foreground ml-2">S2-IN</span>
              </div>
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-3 pb-6">
            {/* Show lock banner if games are locked */}
            {isLocked && (
              <Alert className={cn(
                "border",
                isProtection 
                  ? "border-protection/30 bg-protection/5" 
                  : "border-muted-foreground/20 bg-muted/30"
              )}>
                {isProtection ? (
                  <ShieldAlert className="h-4 w-4 text-protection" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <AlertDescription className="text-xs text-muted-foreground">
                  {getWithholdReason(s2inGating?.reasonCode)}
                </AlertDescription>
              </Alert>
            )}
            
            {gatingLoading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : (
              GAMES.map((game, index) => {
                const Icon = game.icon;
                const isRecentlyPlayed = recentlyPlayedGames?.includes(game.id) ?? false;
                
                return (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSelectGame(game)}
                    disabled={isLocked}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      "group relative",
                      isLocked
                        ? "bg-muted/20 border-border/30 opacity-60 cursor-not-allowed"
                        : cn(
                            "bg-background/50 hover:bg-background",
                            "hover:border-violet-500/30 active:scale-[0.98]",
                            "border-border/50"
                          )
                    )}
                  >
                    {/* Recently Played badge */}
                    {isRecentlyPlayed && !isLocked && (
                      <div className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] font-medium text-muted-foreground">
                          Recent
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        isLocked ? "bg-muted/30" : "bg-violet-500/15"
                      )}>
                        {isLocked ? (
                          isProtection ? (
                            <ShieldAlert className="w-5 h-5 text-protection" />
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          )
                        ) : (
                          <Icon className="w-5 h-5 text-violet-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            {game.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
                            {game.tagline}
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                          {game.description}
                        </p>
                        
                        <div className="flex items-center gap-3 text-[10px]">
                          <div className="flex items-center gap-1 text-amber-400/80">
                            <Star className="w-3 h-3 fill-amber-400/50" />
                            <span>~{game.estimatedXP} XP</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Timer className="w-3 h-3" />
                            <span>{game.estimatedDuration}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center h-10">
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
            
            {/* System 2 info */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-muted-foreground/60">
                Insight games train pattern recognition under uncertainty
              </p>
            </div>
          </div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
