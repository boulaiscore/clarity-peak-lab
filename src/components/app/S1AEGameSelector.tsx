import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, Crosshair, Zap, Star, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface S1AEGameSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Difficulty = "easy" | "medium" | "hard";

interface GameOption {
  id: string;
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
    id: "triage-sprint",
    name: "Triage Sprint",
    tagline: "Rapid Decisions",
    description: "Approve or reject cards under time pressure. Tests quick pattern recognition and inhibitory control.",
    icon: Zap,
    route: "/neuro-lab/triage-sprint",
    xpByDifficulty: { easy: 9, medium: 15, hard: 24 },
    accentColor: "cyan",
  },
  {
    id: "orbit-lock",
    name: "Orbit Lock",
    tagline: "Sustained Stability",
    description: "Keep a signal locked in the target band using smooth dial control. Trains attentional stability and distraction resistance.",
    icon: Target,
    route: "/neuro-lab/orbit-lock",
    xpByDifficulty: { easy: 9, medium: 15, hard: 34 },
    accentColor: "violet",
  },
];

const DIFFICULTIES: { id: Difficulty; label: string; description: string }[] = [
  { id: "easy", label: "Easy", description: "Wider margins, gentler pace" },
  { id: "medium", label: "Medium", description: "Balanced challenge" },
  { id: "hard", label: "Hard", description: "Tight margins, higher pressure" },
];

export function S1AEGameSelector({ open, onOpenChange }: S1AEGameSelectorProps) {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null);

  const handleSelectGame = (game: GameOption) => {
    setSelectedGame(game);
  };

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    if (!selectedGame) return;
    onOpenChange(false);
    // Small delay to let sheet close animation complete
    setTimeout(() => {
      navigate(`${selectedGame.route}?difficulty=${difficulty}`);
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
                <p className="text-xs text-muted-foreground">
                  Choose a game to train your fast-focus abilities
                </p>

                {GAMES.map((game, index) => {
                  const Icon = game.icon;
                  const isViolet = game.accentColor === "violet";
                  
                  return (
                    <motion.button
                      key={game.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSelectGame(game)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all",
                        "bg-background/50 hover:bg-background border-border/50",
                        "hover:border-primary/30 active:scale-[0.98]",
                        "group"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          isViolet ? "bg-violet-500/15" : "bg-cyan-500/15"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            isViolet ? "text-violet-400" : "text-cyan-400"
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground">
                              {game.name}
                            </h4>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full",
                              isViolet 
                                ? "bg-violet-500/10 text-violet-400" 
                                : "bg-cyan-500/10 text-cyan-400"
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
                              <span>{game.xpByDifficulty.easy}–{game.xpByDifficulty.hard} XP</span>
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
                })}
              </div>
            </motion.div>
          ) : (
            // Difficulty Selection View
            <motion.div
              key="difficulty"
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
                    selectedGame.accentColor === "violet" ? "bg-violet-500/15" : "bg-cyan-500/15"
                  )}>
                    <selectedGame.icon className={cn(
                      "w-4 h-4",
                      selectedGame.accentColor === "violet" ? "text-violet-400" : "text-cyan-400"
                    )} />
                  </div>
                  <span className="text-foreground">{selectedGame.name}</span>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-3 pb-6">
                <p className="text-xs text-muted-foreground">
                  Select difficulty level
                </p>

                {DIFFICULTIES.map((diff, index) => {
                  const xp = selectedGame.xpByDifficulty[diff.id];
                  const isViolet = selectedGame.accentColor === "violet";
                  
                  return (
                    <motion.button
                      key={diff.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => handleSelectDifficulty(diff.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all",
                        "bg-background/50 hover:bg-background border-border/50",
                        "hover:border-primary/30 active:scale-[0.98]",
                        "group"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            diff.id === "easy" && "bg-emerald-500/10",
                            diff.id === "medium" && "bg-amber-500/10",
                            diff.id === "hard" && "bg-rose-500/10"
                          )}>
                            <span className={cn(
                              "text-sm font-bold",
                              diff.id === "easy" && "text-emerald-400",
                              diff.id === "medium" && "text-amber-400",
                              diff.id === "hard" && "text-rose-400"
                            )}>
                              {diff.id === "easy" && "E"}
                              {diff.id === "medium" && "M"}
                              {diff.id === "hard" && "H"}
                            </span>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">
                              {diff.label}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              {diff.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-amber-400/80">
                            <Star className="w-3.5 h-3.5 fill-amber-400/50" />
                            <span className="text-xs font-medium">{xp} XP</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
