import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Star, Play, Zap, X,
  Clock, Sparkles, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { XP_VALUES } from "@/lib/trainingPlans";
import { CognitiveExercise } from "@/lib/exercises";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useExercises } from "@/hooks/useExercises";
import { Badge } from "@/components/ui/badge";

interface ExercisePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: NeuroLabArea;
  thinkingMode: "fast" | "slow";
  onStartExercise: (exercise: CognitiveExercise) => void;
}

const AREA_LABELS: Record<string, string> = {
  focus: "Focus Arena",
  reasoning: "Critical Reasoning",
  creativity: "Creativity Hub",
};

const MODE_LABELS = {
  fast: { label: "S1 - Fast", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  slow: { label: "S2 - Deep", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10" },
  hard: { label: "Hard", color: "text-rose-400", bg: "bg-rose-500/10" },
};

const AREA_ICONS: Record<string, React.ElementType> = {
  focus: Target,
  reasoning: Brain,
  creativity: Lightbulb,
};

export function ExercisePickerSheet({
  open,
  onOpenChange,
  area,
  thinkingMode,
  onStartExercise,
}: ExercisePickerSheetProps) {
  const { data: exercises = [], isLoading } = useExercises();
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");

  // Filter exercises by area and thinking mode
  const filteredExercises = exercises.filter(
    (e) => e.gym_area === area && e.thinking_mode === thinkingMode
  );

  // Further filter by difficulty
  const displayedExercises = selectedDifficulty === "all" 
    ? filteredExercises 
    : filteredExercises.filter(e => e.difficulty === selectedDifficulty);

  const modeConfig = MODE_LABELS[thinkingMode];
  const AreaIcon = AREA_ICONS[area] || Brain;

  // Group by difficulty for display
  const easyCount = filteredExercises.filter(e => e.difficulty === "easy").length;
  const mediumCount = filteredExercises.filter(e => e.difficulty === "medium").length;
  const hardCount = filteredExercises.filter(e => e.difficulty === "hard").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
        <SheetHeader className="px-5 pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", modeConfig.bg)}>
                <AreaIcon className={cn("w-5 h-5", modeConfig.color)} />
              </div>
              <div>
                <SheetTitle className="text-left text-[15px]">
                  {thinkingMode === "fast" ? "Fast" : "Deep"} {AREA_LABELS[area]?.split(" ")[0]}
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground">
                  {filteredExercises.length} exercises • {modeConfig.label} Training
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
              <Star className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-semibold text-primary">+{XP_VALUES.gameComplete} XP</span>
            </div>
          </div>
        </SheetHeader>

        <div className="px-5 py-4 space-y-4 overflow-y-auto h-[calc(100%-80px)]">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedDifficulty("all")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0",
                selectedDifficulty === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              All ({filteredExercises.length})
            </button>
            <button
              onClick={() => setSelectedDifficulty("easy")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0",
                selectedDifficulty === "easy"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              Easy ({easyCount})
            </button>
            <button
              onClick={() => setSelectedDifficulty("medium")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0",
                selectedDifficulty === "medium"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              Medium ({mediumCount})
            </button>
            <button
              onClick={() => setSelectedDifficulty("hard")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0",
                selectedDifficulty === "hard"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              Hard ({hardCount})
            </button>
          </div>

          {/* Exercises List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : displayedExercises.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground">No exercises found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedExercises.map((exercise, index) => {
                const diffConfig = DIFFICULTY_CONFIG[exercise.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;
                
                return (
                  <motion.button
                    key={exercise.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => onStartExercise(exercise)}
                    className={cn(
                      "w-full p-4 rounded-xl border transition-all duration-200 text-left",
                      "bg-card/50 hover:bg-card/80 border-border/30 hover:border-primary/30",
                      "active:scale-[0.98]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", modeConfig.bg)}>
                        {thinkingMode === "fast" ? (
                          <Zap className={cn("w-5 h-5", modeConfig.color)} />
                        ) : (
                          <Brain className={cn("w-5 h-5", modeConfig.color)} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[13px] font-medium">{exercise.title}</h4>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded font-medium uppercase",
                            diffConfig.bg, diffConfig.color
                          )}>
                            {diffConfig.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {exercise.prompt?.slice(0, 60)}...
                        </p>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          30s
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Play className="w-4 h-4 text-primary fill-current" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}