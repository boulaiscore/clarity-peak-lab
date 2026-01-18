/**
 * S1-AE Game Selector v1.3
 * 
 * Uses AE Guidance Engine to:
 * - Show suggested game with badge (soft guidance, never blocks)
 * - Force difficulty based on Plan/TC/Recovery/Performance (not user-selectable)
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, Crosshair, Zap, Star, ChevronLeft, ChevronRight, Sparkles, Lock, Info, RefreshCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAEGuidance } from "@/hooks/useAEGuidance";
import { AEGameName, Difficulty } from "@/lib/aeGuidanceEngine";
import { Skeleton } from "@/components/ui/skeleton";

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
  accentColor: string;
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

const DIFFICULTY_INFO: Record<Difficulty, { label: string; description: string }> = {
  easy: { label: "Easy", description: "Wider margins, gentler pace" },
  medium: { label: "Medium", description: "Balanced challenge" },
  hard: { label: "Hard", description: "Tight margins, higher pressure" },
};

export function S1AEGameSelector({ open, onOpenChange }: S1AEGameSelectorProps) {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null);
  
  // Get guidance from AE engine
  const {
    suggestedGame,
    suggestedReason,
    forcedDifficulty,
    difficultyReasons,
    isLoading,
    _debug,
  } = useAEGuidance();
  
  // Sort games to show suggested first
  const sortedGames = useMemo(() => {
    return [...GAMES].sort((a, b) => {
      if (a.id === suggestedGame) return -1;
      if (b.id === suggestedGame) return 1;
      return 0;
    });
  }, [suggestedGame]);

  const handleSelectGame = (game: GameOption) => {
    setSelectedGame(game);
  };

  const handleConfirmPlay = () => {
    if (!selectedGame) return;
    onOpenChange(false);
    // Small delay to let sheet close animation complete
    setTimeout(() => {
      navigate(`${selectedGame.route}?difficulty=${forcedDifficulty}`);
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
  
  // Get XP for the forced difficulty
  const getXPForGame = (game: GameOption) => game.xpByDifficulty[forcedDifficulty];
  
  // Get difficulty badge color
  const getDifficultyColor = (d: Difficulty) => {
    switch (d) {
      case "easy": return "text-emerald-400 bg-emerald-500/10";
      case "medium": return "text-amber-400 bg-amber-500/10";
      case "hard": return "text-rose-400 bg-rose-500/10";
    }
  };
  
  // Format difficulty reasons for display
  const formatReasons = (reasons: string[]) => {
    return reasons.join(" + ");
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
                {/* Difficulty indicator */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Today's difficulty
                  </span>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        getDifficultyColor(forcedDifficulty)
                      )}>
                        {DIFFICULTY_INFO[forcedDifficulty].label}
                      </span>
                      <span className="text-muted-foreground/60">
                        ({formatReasons(difficultyReasons)})
                      </span>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  // Loading skeleton
                  <>
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </>
                ) : (
                  sortedGames.map((game, index) => {
                    const Icon = game.icon;
                    const isSuggested = game.id === suggestedGame;
                    const xp = getXPForGame(game);
                    
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
                        className={cn(
                          "w-full p-4 rounded-xl border text-left transition-all",
                          "bg-background/50 hover:bg-background",
                          "hover:border-primary/30 active:scale-[0.98]",
                          "group relative",
                          isSuggested 
                            ? "border-primary/40 ring-1 ring-primary/20" 
                            : "border-border/50"
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
                        
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            accentBg
                          )}>
                            <Icon className={cn("w-5 h-5", accentText)} />
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
            // Confirmation View (no difficulty selection - it's forced)
            <motion.div
              key="confirmation"
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
                {/* Forced difficulty info */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Today's Difficulty</span>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-semibold",
                      getDifficultyColor(forcedDifficulty)
                    )}>
                      {DIFFICULTY_INFO[forcedDifficulty].label}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {DIFFICULTY_INFO[forcedDifficulty].description}
                  </p>
                  
                  {/* Difficulty reasons */}
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                    <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Difficulty set by: <span className="text-foreground font-medium">{formatReasons(difficultyReasons)}</span>
                      {_debug && (
                        <span className="block mt-0.5 opacity-60">
                          TC load: {Math.round((_debug.tcLoadRatio) * 100)}%
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* XP and duration */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400/50" />
                    <span className="text-sm font-semibold">
                      {selectedGame.xpByDifficulty[forcedDifficulty]} XP
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">~90 seconds</span>
                </div>
                
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
