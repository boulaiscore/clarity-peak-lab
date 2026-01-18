import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, Crosshair, Zap, Star } from "lucide-react";
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

interface GameOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  route: string;
  xpRange: string;
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
    xpRange: "9–24 XP",
    accentColor: "cyan",
  },
  {
    id: "orbit-lock",
    name: "Orbit Lock",
    tagline: "Sustained Stability",
    description: "Keep a signal locked in the target band using smooth dial control. Trains attentional stability and distraction resistance.",
    icon: Target,
    route: "/neuro-lab/orbit-lock",
    xpRange: "9–34 XP",
    accentColor: "violet",
  },
];

export function S1AEGameSelector({ open, onOpenChange }: S1AEGameSelectorProps) {
  const navigate = useNavigate();

  const handleSelectGame = (game: GameOption) => {
    onOpenChange(false);
    navigate(`${game.route}?difficulty=medium`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
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
                        <span>{game.xpRange}</span>
                      </div>
                      <span className="text-muted-foreground">~90 seconds</span>
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
