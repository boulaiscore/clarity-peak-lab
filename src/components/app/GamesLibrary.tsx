import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Zap, Timer,
  ChevronRight, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { CognitiveExercise } from "@/lib/exercises";

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

// System 1 (Fast) games
const SYSTEM_1_GAMES = [
  { id: "focus-fast", areaId: "focus" as NeuroLabArea, name: "Fast Attention", description: "Visual search & reaction speed", xpRange: "3-8" },
  { id: "reasoning-fast", areaId: "reasoning" as NeuroLabArea, name: "Quick Logic", description: "Rapid pattern recognition", xpRange: "3-8" },
  { id: "creativity-fast", areaId: "creativity" as NeuroLabArea, name: "Flash Association", description: "Rapid divergent thinking", xpRange: "3-8" },
];

// System 2 (Slow) games
const SYSTEM_2_GAMES = [
  { id: "focus-slow", areaId: "focus" as NeuroLabArea, name: "Deep Focus", description: "Sustained attention & pattern extraction", xpRange: "3-8" },
  { id: "reasoning-slow", areaId: "reasoning" as NeuroLabArea, name: "Critical Analysis", description: "Deep reasoning & bias detection", xpRange: "3-8" },
  { id: "creativity-slow", areaId: "creativity" as NeuroLabArea, name: "Concept Forge", description: "Novel concept generation", xpRange: "3-8" },
];

export function GamesLibrary({ onStartGame }: GamesLibraryProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerArea, setPickerArea] = useState<NeuroLabArea>("focus");
  const [pickerMode, setPickerMode] = useState<"fast" | "slow">("fast");

  const handleGameTypeClick = (areaId: NeuroLabArea, mode: "fast" | "slow") => {
    setPickerArea(areaId);
    setPickerMode(mode);
    setPickerOpen(true);
  };

  const handleStartExercise = (exercise: CognitiveExercise) => {
    setPickerOpen(false);
    navigate(`/neuro-lab/${pickerArea}/session?exerciseId=${exercise.id}&mode=${pickerMode}`);
  };

  const renderGameCard = (game: typeof SYSTEM_1_GAMES[0], mode: "fast" | "slow", index: number) => {
    const Icon = AREA_ICONS[game.areaId] || Brain;
    const colors = AREA_COLORS[game.areaId];
    
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
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {game.description}
            </p>
          </div>

          {/* XP & Action */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400">+{game.xpRange} XP</span>
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
            <p className="text-[10px] text-muted-foreground">Intuitive, automatic, rapid responses</p>
          </div>
        </div>
        
        <div className="grid gap-2">
          {SYSTEM_1_GAMES.map((game, index) => renderGameCard(game, "fast", index))}
        </div>
      </div>

      {/* System 2 - Slow Thinking */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Timer className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold">System 2 · Slow</h3>
            <p className="text-[10px] text-muted-foreground">Deliberate, analytical, deep processing</p>
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
    </div>
  );
}
