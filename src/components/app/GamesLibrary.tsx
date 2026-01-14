import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Zap, Timer,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { CognitiveExercise } from "@/lib/exercises";
import { GAME_COGNITIVE_BENEFITS } from "@/lib/cognitiveFeedback";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";

const AREA_ICONS: Record<string, React.ElementType> = {
  focus: Target,
  reasoning: Brain,
  creativity: Lightbulb,
};

const AREA_GRADIENTS: Record<string, string> = {
  focus: "from-[hsl(var(--area-focus))]/20 via-[hsl(var(--area-focus))]/5 to-transparent",
  reasoning: "from-[hsl(var(--area-reasoning))]/20 via-[hsl(var(--area-reasoning))]/5 to-transparent",
  creativity: "from-[hsl(var(--area-creativity))]/20 via-[hsl(var(--area-creativity))]/5 to-transparent",
};

const AREA_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  focus: { 
    bg: "bg-[hsl(var(--area-focus))]/15", 
    text: "text-[hsl(var(--area-focus))]", 
    border: "border-[hsl(var(--area-focus))]/20",
    glow: "shadow-[0_0_20px_hsl(var(--area-focus)/0.15)]"
  },
  reasoning: { 
    bg: "bg-[hsl(var(--area-reasoning))]/15", 
    text: "text-[hsl(var(--area-reasoning))]", 
    border: "border-[hsl(var(--area-reasoning))]/20",
    glow: "shadow-[0_0_20px_hsl(var(--area-reasoning)/0.15)]"
  },
  creativity: { 
    bg: "bg-[hsl(var(--area-creativity))]/15", 
    text: "text-[hsl(var(--area-creativity))]", 
    border: "border-[hsl(var(--area-creativity))]/20",
    glow: "shadow-[0_0_20px_hsl(var(--area-creativity)/0.15)]"
  },
};

// Areas available per thinking system (2x2 matrix)
const SYSTEM_1_AREAS: { areaId: NeuroLabArea; name: string; tagline: string }[] = [
  { areaId: "focus", name: "Attentional Efficiency", tagline: "Speed & Precision" },
  { areaId: "creativity", name: "Rapid Association", tagline: "Intuitive Links" },
];

const SYSTEM_2_AREAS: { areaId: NeuroLabArea; name: string; tagline: string }[] = [
  { areaId: "reasoning", name: "Critical Thinking", tagline: "Deep Analysis" },
  { areaId: "creativity", name: "Structured Association", tagline: "Deliberate Innovation" },
];

type ThinkingSystem = "fast" | "slow";

const SYSTEM_INFO: Record<ThinkingSystem, { label: string; sublabel: string; description: string; icon: typeof Zap; color: string; bgColor: string; borderColor: string }> = {
  fast: { 
    label: "System 1", 
    sublabel: "Intuition", 
    description: "Quick decisions, pattern recognition",
    icon: Zap, 
    color: "text-[hsl(var(--area-fast))]", 
    bgColor: "bg-[hsl(var(--area-fast))]/12",
    borderColor: "border-[hsl(var(--area-fast))]/30"
  },
  slow: { 
    label: "System 2", 
    sublabel: "Reasoning", 
    description: "Deliberate thinking, logical analysis",
    icon: Timer, 
    color: "text-[hsl(var(--area-slow))]", 
    bgColor: "bg-[hsl(var(--area-slow))]/12",
    borderColor: "border-[hsl(var(--area-slow))]/30"
  },
};

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

  const currentAreas = activeSystem === "fast" ? SYSTEM_1_AREAS : SYSTEM_2_AREAS;
  const systemInfo = SYSTEM_INFO[activeSystem];

  return (
    <div className="space-y-5">
      {/* Elegant System Switcher */}
      <div className="relative">
        <div className="flex items-stretch rounded-2xl bg-card/40 backdrop-blur-sm border border-border/50 p-1 gap-1">
          {(["fast", "slow"] as ThinkingSystem[]).map((system) => {
            const info = SYSTEM_INFO[system];
            const Icon = info.icon;
            const isActive = activeSystem === system;
            
            return (
              <motion.button
                key={system}
                onClick={() => setActiveSystem(system)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
                )}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSystemBg"
                    className={cn(
                      "absolute inset-0 rounded-xl border",
                      info.bgColor,
                      info.borderColor
                    )}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isActive ? info.bgColor : "bg-muted/20"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive ? info.color : "text-muted-foreground")} />
                  </div>
                  <div className="text-left">
                    <div className={cn(
                      "text-xs font-semibold tracking-wide",
                      isActive ? info.color : ""
                    )}>
                      {info.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {info.sublabel}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* System Description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeSystem}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className="text-center text-xs text-muted-foreground px-4"
        >
          {systemInfo.description}
        </motion.p>
      </AnimatePresence>

      {/* Area Cards - Elegant 2x2 Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSystem}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 gap-3"
        >
          {currentAreas.map((area, index) => {
            const Icon = AREA_ICONS[area.areaId] || Brain;
            const colors = AREA_COLORS[area.areaId];
            const gradient = AREA_GRADIENTS[area.areaId];
            
            return (
              <motion.button
                key={`${area.areaId}-${activeSystem}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                onClick={() => handleGameTypeClick(area.areaId, activeSystem)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                  "bg-card/70 backdrop-blur-sm",
                  colors.border,
                  "hover:border-opacity-50 hover:scale-[1.02]",
                  "active:scale-[0.98]",
                  colors.glow
                )}
              >
                {/* Gradient Background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100",
                  gradient
                )} />
                
                {/* Content */}
                <div className="relative z-10 p-5 flex flex-col items-center text-center">
                  {/* Icon with glow effect */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                    colors.bg
                  )}>
                    <Icon className={cn("w-7 h-7", colors.text)} />
                  </div>
                  
                  {/* Area Name */}
                  <h3 className={cn("text-sm font-semibold mb-1", colors.text)}>
                    {area.name}
                  </h3>
                  
                  {/* Tagline */}
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {area.tagline}
                  </p>
                  
                  {/* Hover indicator */}
                  <div className={cn(
                    "mt-3 flex items-center gap-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity",
                    colors.text
                  )}>
                    <Sparkles className="w-3 h-3" />
                    <span>Start Challenge</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

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
        categoryName="Challenges"
      />
    </div>
  );
}
