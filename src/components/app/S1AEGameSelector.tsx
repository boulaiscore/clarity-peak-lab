/**
 * S1-AE Game Selector v1.6
 * 
 * Updated to show games list even when locked, with lock indicators.
 * v1.6: Added "Recently Played" badge for games played in last 7 days
 * Uses:
 * - AE Guidance Engine for game suggestion
 * - S1 Difficulty Engine for difficulty options
 * - Games Gating for lock status
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, Crosshair, Zap, Star, ChevronLeft, ChevronRight, Sparkles, RefreshCcw, Lock, ShieldAlert, Info, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAEGuidance } from "@/hooks/useAEGuidance";
import { useS1Difficulty } from "@/hooks/useS1Difficulty";
import { S1DifficultySelector } from "./S1DifficultySelector";
import { AEGameName } from "@/lib/aeGuidanceEngine";
import { Difficulty } from "@/lib/s1DifficultyEngine";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamesGating } from "@/hooks/useGamesGating";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format } from "date-fns";

interface S1AEGameSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GameOption {
  id: AEGameName;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  route: string;
  xpByDifficulty: Record<Difficulty, number>;
  accentColor: "cyan" | "violet" | "emerald";
}

const GAMES: GameOption[] = [
  {
    id: "triage_sprint",
    name: "Triage Sprint",
    tagline: "Rapid Decisions",
    description: "Approve or reject cards under time pressure. Tests quick pattern recognition and inhibitory control.",
    icon: Zap,
    route: "/neuro-lab/triage-sprint",
    xpByDifficulty: { easy: 9, medium: 15, hard: 24 },
    accentColor: "cyan",
  },
  {
    id: "orbit_lock",
    name: "Orbit Lock",
    tagline: "Sustained Stability",
    description: "Keep a signal locked in the target band using smooth dial control. Trains attentional stability and distraction resistance.",
    icon: Target,
    route: "/neuro-lab/orbit-lock",
    xpByDifficulty: { easy: 9, medium: 15, hard: 34 },
    accentColor: "violet",
  },
  {
    id: "focus_switch",
    name: "Focus Switch",
    tagline: "Rapid Re-orienting",
    description: "Track and respond only to the active lane as focus shifts unpredictably. Trains attentional flexibility and recovery speed.",
    icon: RefreshCcw,
    route: "/neuro-lab/focus-switch",
    xpByDifficulty: { easy: 9, medium: 15, hard: 24 },
    accentColor: "emerald",
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
    case "SHARPNESS_TOO_HIGH":
      return "Sharpness already optimal";
    case "READINESS_TOO_LOW":
      return "Readiness below threshold";
    case "CAP_REACHED_DAILY_S1":
      return "Daily focus limit reached (3/day)";
    default:
      return "Temporarily unavailable";
  }
}

export function S1AEGameSelector({ open, onOpenChange }: S1AEGameSelectorProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [isOverride, setIsOverride] = useState(false);
  
  // Get gating status for S1-AE
  const { games: gatingResults, isLoading: gatingLoading } = useGamesGating();
  const s1aeGating = gatingResults["S1-AE"];
  const isLocked = s1aeGating && s1aeGating.status !== "ENABLED";
  const isProtection = s1aeGating?.status === "PROTECTION";
  
  // Get game suggestion from AE engine
  const {
    suggestedGame,
    suggestedReason,
    isLoading: aeLoading,
  } = useAEGuidance();
  
  // Get difficulty options from unified S1 engine
  const {
    recommended,
    options,
    safetyModeActive,
    safetyLabel,
    isLoading: difficultyLoading,
    _debug,
  } = useS1Difficulty();
  
  // v1.6: Fetch recently played games (last 7 days)
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss");
  const { data: recentlyPlayedGames } = useQuery({
    queryKey: ["recently-played-ae-games", user?.id, sevenDaysAgo],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("game_sessions")
        .select("game_name")
        .eq("user_id", user.id)
        .eq("game_type", "S1-AE")
        .gte("completed_at", sevenDaysAgo);
      
      if (error) throw error;
      
      // Get unique game names
      const uniqueGames = [...new Set((data || []).map(s => s.game_name).filter(Boolean))];
      return uniqueGames as string[];
    },
    enabled: !!user?.id && open,
    staleTime: 60_000,
  });
  
  const isLoading = aeLoading || difficultyLoading || gatingLoading;
  
  // Sort games to show suggested first
  const sortedGames = useMemo(() => {
    return [...GAMES].sort((a, b) => {
      if (a.id === suggestedGame) return -1;
      if (b.id === suggestedGame) return 1;
      return 0;
    });
  }, [suggestedGame]);

  const handleSelectGame = (game: GameOption) => {
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
  
  // Get XP for selected difficulty
  const getXPForGame = (game: GameOption) => game.xpByDifficulty[selectedDifficulty];

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
                  <div className="w-8 h-8 rounded-lg bg-area-fast/15 flex items-center justify-center">
                    <Crosshair className="w-4 h-4 text-area-fast" />
                  </div>
                  <div>
                    <span className="text-foreground">Attentional Efficiency</span>
                    <span className="text-xs text-muted-foreground ml-2">S1-AE</span>
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
                      {getWithholdReason(s1aeGating?.reasonCode)}
                    </AlertDescription>
                  </Alert>
                )}
                {isLoading ? (
                  // Loading skeleton
                  <>
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </>
                ) : (
                    sortedGames.map((game, index) => {
                      const Icon = game.icon;
                      const isSuggested = game.id === suggestedGame && !isLocked;
                      const isRecentlyPlayed = recentlyPlayedGames?.includes(game.id) ?? false;
                      const xp = game.xpByDifficulty[recommended];
                      
                      // Get accent color classes
                      const accentBg = game.accentColor === "violet" 
                        ? "bg-violet-500/15" 
                        : game.accentColor === "emerald" 
                          ? "bg-emerald-500/15" 
                          : "bg-cyan-500/15";
                      const accentText = game.accentColor === "violet" 
                        ? "text-violet-400" 
                        : game.accentColor === "emerald" 
                          ? "text-emerald-400" 
                          : "text-cyan-400";
                      const accentBadgeBg = game.accentColor === "violet" 
                        ? "bg-violet-500/10 text-violet-400" 
                        : game.accentColor === "emerald" 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : "bg-cyan-500/10 text-cyan-400";
                      
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
                                  "hover:border-primary/30 active:scale-[0.98]",
                                  isSuggested 
                                    ? "border-primary/40 ring-1 ring-primary/20" 
                                    : "border-border/50"
                                )
                          )}
                        >
                          {/* Suggested badge */}
                          {isSuggested && (
                            <div className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30">
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span className="text-[9px] font-medium text-primary">
                                Suggested • {suggestedReason}
                              </span>
                            </div>
                          )}
                          
                          {/* Recently Played badge - only show if not suggested */}
                          {!isSuggested && isRecentlyPlayed && !isLocked && (
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
                            isLocked ? "bg-muted/30" : accentBg
                          )}>
                            {isLocked ? (
                              isProtection ? (
                                <ShieldAlert className="w-5 h-5 text-protection" />
                              ) : (
                                <Lock className="w-5 h-5 text-muted-foreground" />
                              )
                            ) : (
                              <Icon className={cn("w-5 h-5", accentText)} />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-foreground">
                                {game.name}
                              </h4>
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                accentBadgeBg
                              )}>
                                {game.tagline}
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                              {game.description}
                            </p>
                            
                            <div className="flex items-center gap-3 text-[10px]">
                              <div className="flex items-center gap-1 text-amber-400/80">
                                <Star className="w-3 h-3 fill-amber-400/50" />
                                <span>{xp} XP</span>
                              </div>
                              <span className="text-muted-foreground">~90 seconds</span>
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
              </div>
            </motion.div>
          ) : (
            // Difficulty Selection View (now with user selection!)
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
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    selectedGame.accentColor === "violet" 
                      ? "bg-violet-500/15" 
                      : selectedGame.accentColor === "emerald" 
                        ? "bg-emerald-500/15" 
                        : "bg-cyan-500/15"
                  )}>
                    <selectedGame.icon className={cn(
                      "w-4 h-4",
                      selectedGame.accentColor === "violet" 
                        ? "text-violet-400" 
                        : selectedGame.accentColor === "emerald" 
                          ? "text-emerald-400" 
                          : "text-cyan-400"
                    )} />
                  </div>
                  <span className="text-foreground">{selectedGame.name}</span>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4 pb-6">
                {/* Difficulty Selector (user can now choose!) */}
                <S1DifficultySelector
                  options={options}
                  recommended={recommended}
                  selected={selectedDifficulty}
                  onSelect={handleDifficultySelect}
                  isLoading={difficultyLoading}
                  safetyModeActive={safetyModeActive}
                  safetyLabel={safetyLabel}
                  accentColor={selectedGame.accentColor}
                />
                
                {/* XP and duration */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400/50" />
                    <span className="text-sm font-semibold">
                      {selectedGame.xpByDifficulty[selectedDifficulty]} XP
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">~90 seconds</span>
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
                  className={cn(
                    "w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all",
                    "bg-gradient-to-r text-black",
                    selectedGame.accentColor === "violet"
                      ? "from-violet-500 to-violet-400"
                      : selectedGame.accentColor === "emerald"
                        ? "from-emerald-500 to-emerald-400"
                        : "from-cyan-500 to-cyan-400"
                  )}
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
