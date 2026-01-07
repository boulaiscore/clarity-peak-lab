import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Zap, Timer,
  ChevronRight, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
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
  focus: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  reasoning: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  creativity: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
};

// System 1 (Fast) games - with cognitive benefits
const SYSTEM_1_GAMES = [
  { id: "focus-fast" as const, areaId: "focus" as NeuroLabArea, name: "Fast Attention" },
  { id: "reasoning-fast" as const, areaId: "reasoning" as NeuroLabArea, name: "Quick Logic" },
  { id: "creativity-fast" as const, areaId: "creativity" as NeuroLabArea, name: "Flash Association" },
];

// System 2 (Slow) games - with cognitive benefits
const SYSTEM_2_GAMES = [
  { id: "focus-slow" as const, areaId: "focus" as NeuroLabArea, name: "Deep Focus" },
  { id: "reasoning-slow" as const, areaId: "reasoning" as NeuroLabArea, name: "Critical Analysis" },
  { id: "creativity-slow" as const, areaId: "creativity" as NeuroLabArea, name: "Concept Forge" },
];

export function GamesLibrary({ onStartGame }: GamesLibraryProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerArea, setPickerArea] = useState<NeuroLabArea>("focus");
  const [pickerMode, setPickerMode] = useState<"fast" | "slow">("fast");
  
  // Track pending game when target exceeded dialog is shown
  const [pendingGame, setPendingGame] = useState<{ areaId: NeuroLabArea; mode: "fast" | "slow" } | null>(null);
  const [showTargetExceededDialog, setShowTargetExceededDialog] = useState(false);
  
  const { gamesComplete } = useCappedWeeklyProgress();

  const handleGameTypeClick = (areaId: NeuroLabArea, mode: "fast" | "slow") => {
    // Check if games target is already reached
    if (gamesComplete) {
      setPendingGame({ areaId, mode });
      setShowTargetExceededDialog(true);
      return;
    }
    
    // Otherwise proceed normally
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

  const renderGameCard = (game: { id: string; areaId: NeuroLabArea; name: string }, mode: "fast" | "slow", index: number) => {
    const Icon = AREA_ICONS[game.areaId] || Brain;
    const colors = AREA_COLORS[game.areaId];
    const benefitKey = game.id as keyof typeof GAME_COGNITIVE_BENEFITS;
    const benefit = GAME_COGNITIVE_BENEFITS[benefitKey];
    
    return (
      <motion.button
        key={game.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => handleGameTypeClick(game.areaId, mode)}
        className={cn(
          "w-full p-3 rounded-xl border transition-all duration-200 text-left",
          "bg-card/50 hover:bg-card/80",
          colors.border,
          "hover:border-opacity-60",
          "active:scale-[0.98]"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Area icon */}
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg)}>
            <Icon className={cn("w-5 h-5", colors.text)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[13px] font-medium">{game.name}</h4>
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-medium",
                colors.bg, colors.text
              )}>
                {game.areaId.charAt(0).toUpperCase() + game.areaId.slice(1)}
              </span>
            </div>
            {/* Cognitive benefit instead of generic description */}
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {benefit?.shortBenefit || "Cognitive training"}
            </p>
          </div>

          {/* Cognitive protection indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-medium text-primary">Train</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* System 1 - Fast Thinking */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold">System 1 · Fast</h3>
            <p className="text-[10px] text-muted-foreground">Reduces hesitation under pressure</p>
          </div>
        </div>
        
        <div className="grid gap-2">
          {SYSTEM_1_GAMES.map((game, index) => renderGameCard(game, "fast", index))}
        </div>
      </div>

      {/* System 2 - Slow Thinking */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Timer className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold">System 2 · Slow</h3>
            <p className="text-[10px] text-muted-foreground">Prevents impulsive errors in analysis</p>
          </div>
        </div>
        
        <div className="grid gap-2">
          {SYSTEM_2_GAMES.map((game, index) => renderGameCard(game, "slow", index))}
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
