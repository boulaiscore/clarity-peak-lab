import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Zap, Timer,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { CognitiveExercise } from "@/lib/exercises";
import { GAME_COGNITIVE_BENEFITS } from "@/lib/cognitiveFeedback";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";

interface GamesLibraryProps {
  onStartGame: (areaId: NeuroLabArea) => void;
}

const AREA_ICONS: Record<string, React.ElementType> = {
  focus: Target,
  reasoning: Brain,
  creativity: Lightbulb,
};

const AREA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  focus: { bg: "bg-[hsl(var(--area-focus))]/10", text: "text-[hsl(var(--area-focus))]", border: "border-[hsl(var(--area-focus))]/30" },
  reasoning: { bg: "bg-[hsl(var(--area-reasoning))]/10", text: "text-[hsl(var(--area-reasoning))]", border: "border-[hsl(var(--area-reasoning))]/30" },
  creativity: { bg: "bg-[hsl(var(--area-creativity))]/10", text: "text-[hsl(var(--area-creativity))]", border: "border-[hsl(var(--area-creativity))]/30" },
};

// Unified game structure by area
const GAME_AREAS: { areaId: NeuroLabArea; name: string }[] = [
  { areaId: "focus", name: "Focus" },
  { areaId: "reasoning", name: "Reasoning" },
  { areaId: "creativity", name: "Creativity" },
];

export function GamesLibrary({ onStartGame }: GamesLibraryProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerArea, setPickerArea] = useState<NeuroLabArea>("focus");
  const [pickerMode, setPickerMode] = useState<"fast" | "slow">("fast");
  
  const [pendingGame, setPendingGame] = useState<{ areaId: NeuroLabArea; mode: "fast" | "slow" } | null>(null);
  const [showTargetExceededDialog, setShowTargetExceededDialog] = useState(false);
  
  const { gamesComplete } = useCappedWeeklyProgress();

  const handleGameTypeClick = (areaId: NeuroLabArea, mode: "fast" | "slow") => {
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

  const getBenefitKey = (areaId: NeuroLabArea, mode: "fast" | "slow") => {
    return `${areaId}-${mode}` as keyof typeof GAME_COGNITIVE_BENEFITS;
  };

  const renderGameCard = (areaId: NeuroLabArea, mode: "fast" | "slow", index: number) => {
    const Icon = AREA_ICONS[areaId] || Brain;
    const colors = AREA_COLORS[areaId];
    const benefitKey = getBenefitKey(areaId, mode);
    const benefit = GAME_COGNITIVE_BENEFITS[benefitKey];
    const areaName = areaId.charAt(0).toUpperCase() + areaId.slice(1);
    
    return (
      <motion.button
        key={`${areaId}-${mode}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        onClick={() => handleGameTypeClick(areaId, mode)}
        className={cn(
          "w-full p-3 rounded-xl border transition-all duration-200 text-left",
          "bg-card/60 hover:bg-card/90",
          colors.border,
          "hover:border-opacity-60",
          "active:scale-[0.98]"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
            <Icon className={cn("w-4 h-4", colors.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-medium leading-tight">{areaName}</h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
              {benefit?.shortBenefit || "Cognitive training"}
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Two-column layout: System 1 | System 2 */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* System 1 - Fast Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-md bg-[hsl(var(--area-fast))]/12 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[hsl(var(--area-fast))]" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold leading-tight">System 1</h3>
              <p className="text-[9px] text-muted-foreground">Intuition</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {GAME_AREAS.map((area, index) => renderGameCard(area.areaId, "fast", index))}
          </div>
        </div>

        {/* System 2 - Slow Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-md bg-[hsl(var(--area-slow))]/12 flex items-center justify-center">
              <Timer className="w-3.5 h-3.5 text-[hsl(var(--area-slow))]" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold leading-tight">System 2</h3>
              <p className="text-[9px] text-muted-foreground">Reasoning</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {GAME_AREAS.map((area, index) => renderGameCard(area.areaId, "slow", index + 3))}
          </div>
        </div>
      </div>

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
        categoryName="Games"
      />
    </div>
  );
}
