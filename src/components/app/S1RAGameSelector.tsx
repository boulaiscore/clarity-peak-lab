/**
 * ============================================
 * S1-RA GAME SELECTOR v1.2
 * ============================================
 * 
 * Bottom sheet selector for Rapid Association (RA) games.
 * Now shows games list even when locked, with lock indicators.
 * v1.2: Added "Recently Played" badge for games played in last 7 days
 * 
 * Uses S1DifficultySelector for user-selectable difficulty.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Star, ChevronRight, Sparkles, Lock, ShieldAlert, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useS1Difficulty } from "@/hooks/useS1Difficulty";
import { S1DifficultySelector } from "./S1DifficultySelector";
import { Difficulty } from "@/lib/s1DifficultyEngine";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamesGating } from "@/hooks/useGamesGating";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format } from "date-fns";

interface S1RAGameSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RAGameOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  route: string;
  xpByDifficulty: Record<Difficulty, number>;
}

const RA_GAMES: RAGameOption[] = [
  {
    id: "flash_connect",
    name: "Flash Connect",
    tagline: "Intuitive Links",
    description: "Find the associative link between concepts. Trains rapid, non-deliberate creative connections.",
    route: "/neuro-lab/flash-connect",
    xpByDifficulty: { easy: 25, medium: 25, hard: 35 },
  },
  {
    id: "constellation_snap",
    name: "Constellation Snap",
    tagline: "Pattern Closure",
    description: "Complete visual constellations with the missing link. Fast intuitive associations under time pressure.",
    route: "/neuro-lab/constellation-snap",
    xpByDifficulty: { easy: 25, medium: 35, hard: 45 },
  },
  {
    id: "semantic_drift",
    name: "Semantic Drift",
    tagline: "Directional Flow",
    description: "Navigate fast semantic drifts under time pressure. Trains flexible, directional associations.",
    route: "/neuro-lab/semantic-drift",
    xpByDifficulty: { easy: 15, medium: 20, hard: 25 },
  },
];

// Helper to get human-readable reason
function getWithholdReason(reasonCode?: string): string {
  if (!reasonCode) return "Unavailable";
  
  switch (reasonCode) {
    case "RECOVERY_TOO_LOW":
      return "Recovery is low — build recovery through Detox or Walk";
    case "SHARPNESS_TOO_LOW":
      return "Sharpness below threshold";
    case "READINESS_TOO_LOW":
      return "Readiness below threshold";
    case "CAP_REACHED_DAILY_S1":
      return "Daily focus limit reached (3/day)";
    default:
      return "Temporarily unavailable";
  }
}

export function S1RAGameSelector({ open, onOpenChange }: S1RAGameSelectorProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<RAGameOption | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [isOverride, setIsOverride] = useState(false);
  
  // Get gating status for S1-RA
  const { games: gatingResults, isLoading: gatingLoading } = useGamesGating();
  const s1raGating = gatingResults["S1-RA"];
  const isLocked = s1raGating && s1raGating.status !== "ENABLED";
  const isProtection = s1raGating?.status === "PROTECTION";
  
  // Get difficulty options from unified S1 engine
  const {
    recommended,
    options,
    safetyModeActive,
    safetyLabel,
    isLoading: difficultyLoading,
    _debug,
  } = useS1Difficulty();
  
  // v1.2: Fetch recently played games (last 7 days)
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss");
  const { data: recentlyPlayedGames } = useQuery({
    queryKey: ["recently-played-ra-games", user?.id, sevenDaysAgo],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("game_name")
        .eq("user_id", user.id)
        .eq("game_type", "S1-RA")
        .gte("completed_at", sevenDaysAgo);
      
      if (error) throw error;
      
      // Get unique game names - also check exercise_completions for games without game_name
      const uniqueGames = [...new Set((data || []).map(s => s.game_name).filter(Boolean))];
      return uniqueGames as string[];
    },
    enabled: !!user?.id && open,
    staleTime: 60_000,
  });
  
  const isLoading = difficultyLoading || gatingLoading;
  
  // Set initial difficulty to recommended when data loads
  const handleGameSelect = (game: RAGameOption) => {
    // Don't allow selection if locked
    if (isLocked) return;
    
    setSelectedGame(game);
    setSelectedDifficulty(recommended);
    setIsOverride(false);
  };
  
  const handleDifficultySelect = (difficulty: Difficulty, override: boolean) => {
    setSelectedDifficulty(difficulty);
    setIsOverride(override);
  };
  
  const handleConfirmPlay = () => {
    if (!selectedGame) return;
    onOpenChange(false);
    
    // Small delay to let sheet close animation complete
    setTimeout(() => {
      const overrideParam = isOverride ? "&override=true" : "";
      navigate(`${selectedGame.route}?difficulty=${selectedDifficulty}${overrideParam}`);
      setSelectedGame(null);
    }, 150);
  };
  
  const handleBack = () => {
    setSelectedGame(null);
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedGame(null);
    }
    onOpenChange(newOpen);
  };
  
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <AnimatePresence mode="wait">
          {!selectedGame ? (
            // Game Selection View
            <motion.div
              key="game-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-foreground">Rapid Association</span>
                    <span className="text-xs text-muted-foreground ml-2">S1-RA</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              
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
                      {getWithholdReason(s1raGating?.reasonCode)}
                    </AlertDescription>
                  </Alert>
                )}
                
                {isLoading ? (
                  <Skeleton className="h-28 w-full rounded-xl" />
                ) : (
                  RA_GAMES.map((game, index) => {
                    const xp = game.xpByDifficulty[recommended];
                    const isRecentlyPlayed = recentlyPlayedGames?.includes(game.id) ?? false;
                    
                    return (
                      <motion.button
                        key={game.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleGameSelect(game)}
                        disabled={isLocked}
                        className={cn(
                          "w-full p-4 rounded-xl border text-left transition-all",
                          "group relative",
                          isLocked
                            ? "bg-muted/20 border-border/30 opacity-60 cursor-not-allowed"
                            : cn(
                                "bg-background/50 hover:bg-background",
                                "border-primary/40 ring-1 ring-primary/20",
                                "hover:border-primary/30 active:scale-[0.98]"
                              )
                        )}
                      >
                        {/* Recently Played badge */}
                        {isRecentlyPlayed && !isLocked ? (
                          <div className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-medium text-muted-foreground">
                              Recent
                            </span>
                          </div>
                        ) : !isLocked && (
                          <div className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[9px] font-medium text-primary">
                              Available
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            isLocked ? "bg-muted/30" : "bg-amber-500/15"
                          )}>
                            {isLocked ? (
                              isProtection ? (
                                <ShieldAlert className="w-5 h-5 text-protection" />
                              ) : (
                                <Lock className="w-5 h-5 text-muted-foreground" />
                              )
                            ) : (
                              <Lightbulb className="w-5 h-5 text-amber-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm font-semibold",
                                isLocked ? "text-muted-foreground" : "text-foreground"
                              )}>
                                {game.name}
                              </h4>
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                isLocked ? "bg-muted/30 text-muted-foreground" : "bg-amber-500/10 text-amber-400"
                              )}>
                                {game.tagline}
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                              {game.description}
                            </p>
                            
                            <div className="flex items-center gap-3 text-[10px]">
                              <div className={cn(
                                "flex items-center gap-1",
                                isLocked ? "text-muted-foreground/50" : "text-amber-400/80"
                              )}>
                                <Star className={cn("w-3 h-3", isLocked ? "" : "fill-amber-400/50")} />
                                <span>{xp} XP</span>
                              </div>
                              <span className="text-muted-foreground">~60 seconds</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center h-10">
                            <ChevronRight className={cn(
                              "w-4 h-4 text-muted-foreground transition-opacity",
                              isLocked ? "opacity-30" : "opacity-50 group-hover:opacity-100"
                            )} />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : (
            // Difficulty Selection View
            <motion.div
              key="difficulty-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <button
                    onClick={handleBack}
                    className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-foreground">{selectedGame.name}</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-4 pb-6">
                {/* Difficulty Selector */}
                <S1DifficultySelector
                  options={options}
                  recommended={recommended}
                  selected={selectedDifficulty}
                  onSelect={handleDifficultySelect}
                  isLoading={isLoading}
                  safetyModeActive={safetyModeActive}
                  safetyLabel={safetyLabel}
                  accentColor="amber"
                />
                
                {/* XP and duration */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400/50" />
                    <span className="text-sm font-semibold">
                      {selectedGame.xpByDifficulty[selectedDifficulty]} XP
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">~60 seconds</span>
                </div>
                
                {/* Debug info (hidden in production) */}
                {_debug && process.env.NODE_ENV === "development" && (
                  <div className="p-2 rounded-lg bg-muted/10 text-[9px] text-muted-foreground/60 font-mono">
                    REC={Math.round(_debug.recovery)} | SHP={Math.round(_debug.sharpness)} | RDY={Math.round(_debug.readiness)}
                    <br />
                    XP={_debug.weeklyXP} | TC={_debug.tc} | opt=[{_debug.optMin}-{_debug.optMax}]
                  </div>
                )}
                
                {/* Start button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmPlay}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-amber-500 to-amber-400 text-black"
                >
                  Start Session
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
