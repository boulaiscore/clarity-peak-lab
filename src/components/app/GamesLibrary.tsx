import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Zap, Timer,
  ChevronRight, Lock, Crown, Swords
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { CognitiveExercise } from "@/lib/exercises";
import { GAME_COGNITIVE_BENEFITS } from "@/lib/cognitiveFeedback";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { PremiumPaywall } from "./PremiumPaywall";
import { Button } from "@/components/ui/button";

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

type ThinkingSystem = "fast" | "slow";

const SYSTEM_TABS: { id: ThinkingSystem; label: string; sublabel: string; icon: typeof Zap; color: string; bgColor: string }[] = [
  { id: "fast", label: "System 1", sublabel: "Intuition", icon: Zap, color: "text-[hsl(var(--area-fast))]", bgColor: "bg-[hsl(var(--area-fast))]/15" },
  { id: "slow", label: "System 2", sublabel: "Reasoning", icon: Timer, color: "text-[hsl(var(--area-slow))]", bgColor: "bg-[hsl(var(--area-slow))]/15" },
];

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
  const [showPaywall, setShowPaywall] = useState(false);
  
  const { gamesComplete } = useCappedWeeklyProgress();
  const { canAccessChallenges } = usePremiumGating();

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

  const getBenefitKey = (areaId: NeuroLabArea, mode: ThinkingSystem) => {
    return `${areaId}-${mode}` as keyof typeof GAME_COGNITIVE_BENEFITS;
  };

  const renderGameCard = (areaId: NeuroLabArea, mode: ThinkingSystem, index: number) => {
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
        transition={{ delay: index * 0.05 }}
        onClick={() => handleGameTypeClick(areaId, mode)}
        className={cn(
          "w-full p-3.5 rounded-xl border transition-all duration-200 text-left",
          "bg-card/60 hover:bg-card/90",
          colors.border,
          "hover:border-opacity-60",
          "active:scale-[0.98]"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
            <Icon className={cn("w-5 h-5", colors.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium leading-tight">{areaName}</h4>
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              {benefit?.shortBenefit || "Cognitive training"}
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        </div>
      </motion.button>
    );
  };

  // Locked state for non-Pro users
  if (!canAccessChallenges()) {
    return (
      <div className="space-y-4">
        {/* Locked State Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-border text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          
          <h3 className="text-base font-semibold text-foreground mb-2">
            Advanced Simulations
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Advanced cognitive simulations. Designed for deep training and assessment.
          </p>

          <Button 
            onClick={() => setShowPaywall(true)}
            variant="hero"
            className="w-full gap-2"
          >
            <Crown className="w-4 h-4" />
            Unlock Advanced Simulations
          </Button>
        </motion.div>

        {/* Preview of what's locked */}
        <div className="space-y-2 opacity-50 pointer-events-none">
          {SYSTEM_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/50"
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", tab.bgColor)}>
                  <Icon className={cn("w-5 h-5", tab.color)} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium">{tab.label}: {tab.sublabel}</span>
                  <p className="text-[11px] text-muted-foreground">3 cognitive areas</p>
                </div>
                <Lock className="w-4 h-4 text-muted-foreground/40" />
              </div>
            );
          })}
        </div>

        <PremiumPaywall 
          open={showPaywall} 
          onOpenChange={setShowPaywall}
          feature="challenges"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* System Tab Icons */}
      <div className="flex items-center justify-center gap-3">
        {SYSTEM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSystem === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSystem(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                isActive 
                  ? `${tab.bgColor} ring-1 ring-current ${tab.color}` 
                  : "bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isActive ? tab.bgColor : "bg-muted/30"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? tab.color : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <span className={cn(
                  "text-[11px] font-medium block",
                  isActive ? tab.color : "text-muted-foreground"
                )}>
                  {tab.label}
                </span>
                <span className="text-[9px] text-muted-foreground/70">
                  {tab.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Game Cards for Selected System */}
      <div className="space-y-2">
        {GAME_AREAS.map((area, index) => renderGameCard(area.areaId, activeSystem, index))}
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
        categoryName="Challenges"
      />
    </div>
  );
}
