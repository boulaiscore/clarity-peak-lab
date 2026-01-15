import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Zap, Timer,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { CognitiveExercise } from "@/lib/exercises";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";

const AREA_ICONS: Record<string, React.ElementType> = {
  focus: Target,
  reasoning: Brain,
  creativity: Lightbulb,
};

// Areas available per thinking system (2x2 matrix)
const SYSTEM_1_AREAS: { areaId: NeuroLabArea; name: string; tagline: string }[] = [
  { areaId: "focus", name: "Attentional Efficiency", tagline: "Speed & Precision" },
  { areaId: "creativity", name: "Rapid Association", tagline: "Intuitive Links" },
];

const SYSTEM_2_AREAS: { areaId: NeuroLabArea; name: string; tagline: string }[] = [
  { areaId: "reasoning", name: "Critical Thinking", tagline: "Deep Analysis" },
  { areaId: "creativity", name: "Deliberate Association", tagline: "Mindful Connections" },
];

type ThinkingSystem = "fast" | "slow";

interface GamesLibraryProps {
  onStartGame: (areaId: NeuroLabArea) => void;
}

export function GamesLibrary({ onStartGame }: GamesLibraryProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerArea, setPickerArea] = useState<NeuroLabArea>("focus");
  const [pickerMode, setPickerMode] = useState<ThinkingSystem>("fast");
  const [activeSystem, setActiveSystem] = useState<ThinkingSystem>("fast");
  
  const [pendingGame, setPendingGame] = useState<{ areaId: NeuroLabArea; mode: ThinkingSystem } | null>(null);
  const [showTargetExceededDialog, setShowTargetExceededDialog] = useState(false);
  
  const { gamesComplete } = useCappedWeeklyProgress();

  const handleGameTypeClick = (areaId: NeuroLabArea, mode: ThinkingSystem) => {
    if (gamesComplete) {
      setPendingGame({ areaId, mode });
      setShowTargetExceededDialog(true);
      return;
    }
    
    setPickerArea(areaId);
    setPickerMode(mode);
    setPickerOpen(true);
  };

  const handleConfirmExcessGame = () => {
    if (pendingGame) {
      setPickerArea(pendingGame.areaId);
      setPickerMode(pendingGame.mode);
      setPickerOpen(true);
      setPendingGame(null);
    }
    setShowTargetExceededDialog(false);
  };

  const handleStartExercise = (exercise: CognitiveExercise) => {
    setPickerOpen(false);
    navigate(`/neuro-lab/${pickerArea}/session?exerciseId=${exercise.id}&mode=${pickerMode}`);
  };

  return (
    <div className="space-y-4">
      {/* System Cards - Stacked Layout */}
      {(["fast", "slow"] as ThinkingSystem[]).map((system) => {
        const isActive = activeSystem === system;
        const SystemIcon = system === "fast" ? Zap : Timer;
        const systemLabel = system === "fast" ? "System 1" : "System 2";
        const systemDesc = system === "fast" ? "Intuition" : "Reasoning";
        const areas = system === "fast" ? SYSTEM_1_AREAS : SYSTEM_2_AREAS;
        const accentClass = system === "fast" 
          ? "border-amber-500/30 bg-amber-500/5" 
          : "border-violet-500/30 bg-violet-500/5";
        const iconColor = system === "fast" ? "text-amber-400" : "text-violet-400";
        
        return (
          <div
            key={system}
            className={cn(
              "rounded-xl border transition-all overflow-hidden",
              isActive ? accentClass : "border-border/50 bg-card/30"
            )}
          >
            {/* System Header - Clickable to expand/collapse */}
            <button
              onClick={() => setActiveSystem(system)}
              className="w-full p-3 flex items-center gap-3 text-left"
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                system === "fast" ? "bg-amber-500/15" : "bg-violet-500/15"
              )}>
                <SystemIcon className={cn("w-4 h-4", iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-semibold", iconColor)}>{systemLabel}</span>
                  <span className="text-[10px] text-muted-foreground">• {systemDesc}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {system === "fast" ? "Quick pattern recognition & reactions" : "Deliberate analysis & logic"}
                </p>
              </div>
              <motion.div
                animate={{ rotate: isActive ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                className="text-muted-foreground/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </button>

            {/* Expanded Area Cards */}
            {isActive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-3 pb-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  {areas.map((area) => {
                    const Icon = AREA_ICONS[area.areaId] || Brain;
                    
                    return (
                      <button
                        key={`${area.areaId}-${system}`}
                        onClick={() => handleGameTypeClick(area.areaId, system)}
                        className={cn(
                          "group relative p-3 rounded-lg border transition-all text-left",
                          "bg-background/50 hover:bg-background border-border/50",
                          "hover:border-primary/30 active:scale-[0.98]"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            system === "fast" ? "bg-amber-500/10" : "bg-violet-500/10"
                          )}>
                            <Icon className={cn("w-4 h-4", iconColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-medium text-foreground leading-tight mb-0.5">
                              {area.name}
                            </h4>
                            <p className="text-[9px] text-muted-foreground">
                              {area.tagline}
                            </p>
                          </div>
                        </div>
                        
                        {/* Play indicator */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className={cn("w-3.5 h-3.5", iconColor)} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        );
      })}

      {/* Exercise Picker Sheet */}
      <ExercisePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        area={pickerArea}
        thinkingMode={pickerMode}
        onStartExercise={handleStartExercise}
      />

      {/* Target Exceeded Warning Dialog */}
      <TargetExceededDialog
        open={showTargetExceededDialog}
        onOpenChange={setShowTargetExceededDialog}
        onConfirm={handleConfirmExcessGame}
        categoryName="Training"
      />
    </div>
  );
}
