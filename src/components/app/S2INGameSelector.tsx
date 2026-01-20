/**
 * ============================================
 * S2-IN GAME SELECTOR
 * ============================================
 * 
 * Selector sheet for S2 Insight games.
 * Currently includes: Signal vs Noise
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGamesGating } from "@/hooks/useGamesGating";

interface S2INGameSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GameOption {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: React.ElementType;
  duration: string;
}

const GAMES: GameOption[] = [
  {
    id: "signal-vs-noise",
    name: "Signal vs Noise",
    description: "Find the real driver behind messy outcomes.",
    route: "/neuro-lab/signal-vs-noise",
    icon: Sparkles,
    duration: "~5 min",
  },
];

export function S2INGameSelector({ open, onOpenChange }: S2INGameSelectorProps) {
  const navigate = useNavigate();
  const { games, isLoading } = useGamesGating();

  const gatingResult = games["S2-IN"];
  const isLocked = gatingResult && gatingResult.status !== "ENABLED";
  const lockReason = isLocked && gatingResult?.unlockActions?.length > 0 
    ? gatingResult.unlockActions[0] 
    : "";

  const handleGameSelect = (game: GameOption) => {
    if (isLocked) return;
    onOpenChange(false);
    navigate(game.route);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-area-slow" />
            S2 Insight Games
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          {GAMES.map((game, index) => {
            const Icon = game.icon;
            
            return (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleGameSelect(game)}
                disabled={isLocked}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all",
                  isLocked
                    ? "border-border/30 bg-muted/20 opacity-60"
                    : "border-border/50 bg-card hover:border-primary/40 active:scale-[0.99]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isLocked ? "bg-muted" : "bg-area-slow/15"
                  )}>
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Icon className="w-5 h-5 text-area-slow" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium">{game.name}</h3>
                      <span className="text-[10px] text-muted-foreground">
                        {game.duration}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {game.description}
                    </p>
                    
                    {isLocked && lockReason && (
                      <p className="text-[10px] text-amber-400/80 mt-2">
                        {lockReason}
                      </p>
                    )}
                  </div>

                  {!isLocked && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                      <Play className="w-4 h-4 text-area-slow" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Info note */}
        <p className="text-[10px] text-muted-foreground/60 text-center mt-4">
          Insight games train pattern recognition under uncertainty.
        </p>
      </SheetContent>
    </Sheet>
  );
}
