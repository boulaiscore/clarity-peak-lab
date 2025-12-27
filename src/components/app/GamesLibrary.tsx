import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Star, Play, Clock, Zap,
  ChevronRight, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { XP_VALUES, getExerciseXP } from "@/lib/trainingPlans";
import { useState, useEffect, useRef } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { CognitiveExercise } from "@/lib/exercises";
import { XPCelebration } from "./XPCelebration";

interface GamesLibraryProps {
  weeklyXPEarned: number;
  weeklyGamesXP?: number;
  weeklyContentXP?: number;
  weeklyXPTarget: number;
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

// Define game types within each area
// Define game types within each area
// XP per exercise: easy=3, medium=5, hard=8
const GAME_TYPES = {
  focus: [
    { id: "focus-fast", name: "Fast Attention", mode: "fast" as const, description: "Visual search & reaction speed", xpRange: "3-8" },
    { id: "focus-slow", name: "Deep Focus", mode: "slow" as const, description: "Sustained attention & pattern extraction", xpRange: "3-8" },
  ],
  reasoning: [
    { id: "reasoning-fast", name: "Quick Logic", mode: "fast" as const, description: "Rapid pattern recognition", xpRange: "3-8" },
    { id: "reasoning-slow", name: "Critical Analysis", mode: "slow" as const, description: "Deep reasoning & bias detection", xpRange: "3-8" },
  ],
  creativity: [
    { id: "creativity-fast", name: "Flash Association", mode: "fast" as const, description: "Rapid divergent thinking", xpRange: "3-8" },
    { id: "creativity-slow", name: "Concept Forge", mode: "slow" as const, description: "Novel concept generation", xpRange: "3-8" },
  ],
} as const;

export function GamesLibrary({ weeklyXPEarned, weeklyGamesXP = 0, weeklyContentXP = 0, weeklyXPTarget, onStartGame }: GamesLibraryProps) {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<NeuroLabArea | "all">("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerArea, setPickerArea] = useState<NeuroLabArea>("focus");
  const [pickerMode, setPickerMode] = useState<"fast" | "slow">("fast");
  const [showCelebration, setShowCelebration] = useState(false);
  const previousXPRef = useRef(weeklyXPEarned);
  
  const xpProgress = Math.min(100, (weeklyXPEarned / weeklyXPTarget) * 100);
  const xpRemaining = Math.max(0, weeklyXPTarget - weeklyXPEarned);
  // Estimate exercises needed based on average XP (medium = 5)
  const avgXPPerExercise = XP_VALUES.exerciseMedium;
  const exercisesNeeded = Math.ceil(xpRemaining / avgXPPerExercise);
  const goalReached = weeklyXPEarned >= weeklyXPTarget;

  // Trigger celebration when goal is reached
  useEffect(() => {
    const wasBelow = previousXPRef.current < weeklyXPTarget;
    const isNowReached = weeklyXPEarned >= weeklyXPTarget;
    
    if (wasBelow && isNowReached) {
      setShowCelebration(true);
    }
    
    previousXPRef.current = weeklyXPEarned;
  }, [weeklyXPEarned, weeklyXPTarget]);

  const filteredAreas = selectedArea === "all" 
    ? NEURO_LAB_AREAS 
    : NEURO_LAB_AREAS.filter(a => a.id === selectedArea);

  const handleGameTypeClick = (areaId: NeuroLabArea, mode: "fast" | "slow") => {
    setPickerArea(areaId);
    setPickerMode(mode);
    setPickerOpen(true);
  };

  const handleStartExercise = (exercise: CognitiveExercise) => {
    setPickerOpen(false);
    // Navigate to session runner with specific exercise
    navigate(`/neuro-lab/${pickerArea}/session?exerciseId=${exercise.id}&mode=${pickerMode}`);
  };

  return (
    <div className="space-y-5">
      {/* XP Celebration Modal */}
      <XPCelebration 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      {/* Weekly XP Progress Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-[12px] font-semibold">Weekly Goal</span>
          </div>
          <span className="text-[12px] font-bold text-amber-400">
            {weeklyXPEarned} / {weeklyXPTarget} XP
          </span>
        </div>
        <div className="h-2 bg-amber-500/10 rounded-full overflow-hidden mb-2">
          <motion.div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        {/* XP Breakdown */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[10px] text-muted-foreground">
              Games: <span className="text-blue-400 font-medium">{weeklyGamesXP}</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-[10px] text-muted-foreground">
              Content: <span className="text-purple-400 font-medium">{weeklyContentXP}</span>
            </span>
          </div>
        </div>
        
        {xpRemaining > 0 ? (
          <p className="text-[10px] text-muted-foreground">
            ~<span className="text-amber-400 font-medium">{exercisesNeeded} exercise{exercisesNeeded > 1 ? 's' : ''}</span> to reach weekly target
          </p>
        ) : (
          <p className="text-[10px] text-emerald-400 font-medium">
            🎉 Weekly goal achieved! Keep training to level up faster.
          </p>
        )}
      </div>

      {/* Area Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedArea("all")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0",
            selectedArea === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <Filter className="w-3 h-3" />
          All
        </button>
        {NEURO_LAB_AREAS.map((area) => {
          const Icon = AREA_ICONS[area.id] || Brain;
          const colors = AREA_COLORS[area.id];
          return (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0",
                selectedArea === area.id
                  ? `${colors.bg} ${colors.text} ${colors.border} border`
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-3 h-3" />
              {area.title.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div className="space-y-4">
        {filteredAreas.map((area) => {
          const Icon = AREA_ICONS[area.id] || Brain;
          const colors = AREA_COLORS[area.id];
          const games = GAME_TYPES[area.id as keyof typeof GAME_TYPES] || [];

          return (
            <div key={area.id} className="space-y-2">
              {/* Area Header */}
              <div className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", colors.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", colors.text)} />
                </div>
                <h3 className="text-[13px] font-semibold">{area.title}</h3>
              </div>

              {/* Games in this area */}
              <div className="grid gap-2">
                {games.map((game, index) => (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleGameTypeClick(area.id, game.mode)}
                    className={cn(
                      "w-full p-3 rounded-xl border transition-all duration-200 text-left",
                      "bg-card/50 hover:bg-card/80",
                      colors.border, "hover:border-primary/30",
                      "active:scale-[0.98]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Mode indicator */}
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        game.mode === "fast" ? "bg-amber-500/10" : "bg-blue-500/10"
                      )}>
                        <Zap className={cn(
                          "w-5 h-5",
                          game.mode === "fast" ? "text-amber-400" : "text-blue-400"
                        )} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13px] font-medium">{game.name}</h4>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded font-medium uppercase",
                            game.mode === "fast" 
                              ? "bg-amber-500/10 text-amber-400" 
                              : "bg-blue-500/10 text-blue-400"
                          )}>
                            {game.mode === "fast" ? "S1" : "S2"}
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
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
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