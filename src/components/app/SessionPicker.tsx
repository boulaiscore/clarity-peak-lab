import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Gamepad2, Headphones, BookOpen, ChevronRight, Clock, 
  Brain, Target, Lightbulb, Play, CheckCircle2, Sparkles, Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_LIBRARY, ContentDifficulty } from "@/lib/contentLibrary";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { SessionType } from "@/lib/trainingPlans";

interface SessionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  sessionDescription: string;
  sessionType: SessionType | null;
  recommendedAreas: NeuroLabArea[];
  contentDifficulty: ContentDifficulty;
}

const AREA_ICONS: Record<string, React.ElementType> = {
  focus: Target,
  reasoning: Brain,
  creativity: Lightbulb,
};

const DIFFICULTY_LABELS: Record<ContentDifficulty, { label: string; gameCount: number; contentCount: number }> = {
  light: { label: "Light", gameCount: 1, contentCount: 1 },
  medium: { label: "Medium", gameCount: 2, contentCount: 1 },
  dense: { label: "Deep", gameCount: 2, contentCount: 2 },
};

interface SessionStep {
  id: string;
  type: "game" | "content";
  title: string;
  subtitle: string;
  duration: string;
  icon: React.ElementType;
  areaId?: NeuroLabArea;
  contentId?: string;
  completed: boolean;
}

export function SessionPicker({
  open,
  onOpenChange,
  sessionName,
  sessionDescription,
  sessionType,
  recommendedAreas,
  contentDifficulty,
}: SessionPickerProps) {
  const navigate = useNavigate();
  
  const difficultyConfig = DIFFICULTY_LABELS[contentDifficulty];

  // Build the session steps
  const buildSessionSteps = (): SessionStep[] => {
    const steps: SessionStep[] = [];
    
    // Add game steps
    for (let i = 0; i < difficultyConfig.gameCount && i < recommendedAreas.length; i++) {
      const areaId = recommendedAreas[i % recommendedAreas.length];
      const area = NEURO_LAB_AREAS.find((a) => a.id === areaId);
      steps.push({
        id: `game-${i}`,
        type: "game",
        title: area?.title || areaId,
        subtitle: "Complete 5 exercises",
        duration: "5-10 min",
        icon: AREA_ICONS[areaId] || Brain,
        areaId,
        completed: false,
      });
    }

    // Add content steps
    const contentTypes: ("podcast" | "reading" | "book")[] = ["podcast", "reading", "book"];
    let contentAdded = 0;
    
    for (const format of contentTypes) {
      if (contentAdded >= difficultyConfig.contentCount) break;
      
      const content = CONTENT_LIBRARY.find(
        (c) => c.format === format && c.difficulty === contentDifficulty
      );
      
      if (content) {
        const iconMap = {
          podcast: Headphones,
          reading: BookOpen,
          book: BookOpen,
        };
        
        steps.push({
          id: content.id,
          type: "content",
          title: content.title,
          subtitle: content.author || "",
          duration: `${content.durationMinutes} min`,
          icon: iconMap[format],
          contentId: content.id,
          completed: false,
        });
        contentAdded++;
      }
    }

    return steps;
  };

  const sessionSteps = buildSessionSteps();
  const totalDuration = sessionSteps.reduce((acc, step) => {
    const match = step.duration.match(/(\d+)/);
    return acc + (match ? parseInt(match[1]) : 0);
  }, 0);

  const handleStartGame = (areaId: NeuroLabArea) => {
    onOpenChange(false);
    const sessionParam = sessionType ? `&sessionType=${sessionType}` : "";
    navigate(`/neuro-lab/${areaId}?daily=true${sessionParam}`);
  };

  const handleStartContent = (contentId: string) => {
    // For now just close - content player can be added later
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto p-0 gap-0 bg-background border-border/50 overflow-hidden max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 p-4">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-primary font-medium uppercase tracking-wide">
                Today's Session
              </span>
            </div>
            <DialogTitle className="text-[16px] font-semibold">
              {sessionName}
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {sessionDescription}
            </p>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Session Overview Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <h3 className="text-[13px] font-semibold mb-2">Your Session Plan</h3>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                <span>{difficultyConfig.gameCount} game{difficultyConfig.gameCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>{difficultyConfig.contentCount} content</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">~{totalDuration} min total</span>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">How it works:</span> Start with a game to activate your brain, then reinforce with curated content. Complete all steps to finish your session.
            </p>
          </div>

          {/* Session Steps */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Complete in order
            </h4>
            
            {sessionSteps.map((step, index) => {
              const isGame = step.type === "game";
              const stepNumber = index + 1;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative p-3 rounded-xl border transition-all duration-200",
                    "bg-card/50 border-border/30",
                    isGame && "hover:border-primary/40"
                  )}
                >
                  {/* Step connector line */}
                  {index < sessionSteps.length - 1 && (
                    <div className="absolute left-[22px] top-[52px] w-px h-4 bg-border/50" />
                  )}
                  
                  <div className="flex items-center gap-3">
                    {/* Step number & icon */}
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isGame ? "bg-primary/15" : "bg-emerald-500/10"
                      )}>
                        <step.icon className={cn(
                          "w-5 h-5",
                          isGame ? "text-primary" : "text-emerald-400"
                        )} />
                      </div>
                      <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
                        <span className="text-[9px] font-bold">{stepNumber}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-medium line-clamp-1">
                          {step.title}
                        </h4>
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded font-medium uppercase",
                          isGame 
                            ? "bg-primary/15 text-primary" 
                            : "bg-emerald-500/10 text-emerald-400"
                        )}>
                          {isGame ? "Game" : "Content"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {step.subtitle}
                      </p>
                    </div>

                    {/* Duration & Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {step.duration}
                      </span>
                      {isGame && step.areaId && (
                        <button
                          onClick={() => handleStartGame(step.areaId!)}
                          className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
                        >
                          <Play className="w-4 h-4 text-primary-foreground fill-current" />
                        </button>
                      )}
                      {!isGame && (
                        <button
                          onClick={() => step.contentId && handleStartContent(step.contentId)}
                          className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/30 active:scale-95 transition-all"
                        >
                          <ChevronRight className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Tip */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-[10px] text-amber-200/80">
              <span className="font-medium text-amber-300">💡 Tip:</span> Each game has 5 exercises. Try to complete them without breaks to maximize cognitive training effect.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
