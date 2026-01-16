import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Zap, Timer,
  Play, Lock, ShieldAlert, AlertCircle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { CognitiveExercise } from "@/lib/exercises";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";
import { useGamesGating, GameGatingResult, GatingStatus } from "@/hooks/useGamesGating";
import { GameType, getGameTypeFromArea } from "@/lib/gamesGating";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AREA_ICONS: Record<string, React.ElementType> = {
  focus: Target,
  reasoning: Brain,
  creativity: Lightbulb,
};

// Areas available per thinking system (2x2 matrix)
const SYSTEM_1_AREAS: { areaId: NeuroLabArea; name: string; tagline: string; gameType: GameType }[] = [
  { areaId: "focus", name: "Attentional Efficiency", tagline: "Speed & Precision", gameType: "S1-AE" },
  { areaId: "creativity", name: "Rapid Association", tagline: "Intuitive Links", gameType: "S1-RA" },
];

const SYSTEM_2_AREAS: { areaId: NeuroLabArea; name: string; tagline: string; gameType: GameType }[] = [
  { areaId: "reasoning", name: "Critical Thinking", tagline: "Deep Analysis", gameType: "S2-CT" },
  { areaId: "creativity", name: "Insight", tagline: "Mindful Connections", gameType: "S2-IN" },
];

type ThinkingSystem = "fast" | "slow";

interface GamesLibraryProps {
  onStartGame: (areaId: NeuroLabArea) => void;
}

// Helper to get human-readable reason (user-facing language)
function getWithholdReason(result: GameGatingResult): string {
  if (!result.reasonCode) return "Unavailable";
  
  switch (result.reasonCode) {
    case "RECOVERY_TOO_LOW":
      return "Recovery is low — build recovery through Detox or Walk";
    case "SHARPNESS_TOO_LOW":
      return `Sharpness below threshold (${result.details?.currentValue ?? 0}%)`;
    case "SHARPNESS_TOO_HIGH":
      return "Sharpness already optimal — focus training not needed";
    case "READINESS_TOO_LOW":
      return `Readiness below threshold (${result.details?.currentValue ?? 0}%)`;
    case "READINESS_OUT_OF_RANGE":
      return "Readiness outside optimal range for this session";
    case "CAP_REACHED_DAILY_S1":
      return "Daily fast focus limit reached (3/day)";
    case "CAP_REACHED_DAILY_S2":
      return "Daily deep work limit reached (1/day)";
    case "CAP_REACHED_WEEKLY_S2":
      return "Weekly deep work limit reached";
    case "CAP_REACHED_WEEKLY_IN":
      return "Weekly insight limit reached";
    case "SUPERHUMAN_REC_REQUIRED":
      return "Recovery ≥55% required for advanced deep work";
    default:
      return "Temporarily unavailable";
  }
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
  const { games, caps, safetyRuleActive, isLoading: gatingLoading } = useGamesGating();

  const handleGameTypeClick = (areaId: NeuroLabArea, mode: ThinkingSystem, gameType: GameType) => {
    // Check gating status first
    const gatingResult = games[gameType];
    
    if (gatingResult && gatingResult.status !== "ENABLED") {
      // Game is gated - don't allow starting
      return;
    }
    
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
      {/* Recovery Low Banner - muted neutral */}
      {safetyRuleActive && (
        <Alert className="border-muted-foreground/15 bg-muted/20">
          <Info className="h-4 w-4 text-muted-foreground/60" />
          <AlertDescription className="text-xs text-muted-foreground/70">
            <span className="font-medium">Light focus available.</span> Build recovery through Detox or Walk to unlock more options.
          </AlertDescription>
        </Alert>
      )}
      
      {/* System Cards - Stacked Layout */}
      {(["fast", "slow"] as ThinkingSystem[]).map((system) => {
        const isActive = activeSystem === system;
        const SystemIcon = system === "fast" ? Zap : Timer;
        const systemLabel = system === "fast" ? "System 1" : "System 2";
        const systemDesc = system === "fast" ? "Intuitive" : "Deliberate";
        const areas = system === "fast" ? SYSTEM_1_AREAS : SYSTEM_2_AREAS;
        // Muted neutral styling - no bright colors
        const accentClass = system === "fast" 
          ? "border-muted-foreground/15 bg-muted/20" 
          : "border-muted-foreground/15 bg-muted/20";
        const iconColor = "text-muted-foreground/60";
        
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
                system === "fast" ? "bg-amber-500/10" : "bg-violet-500/10"
              )}>
                <SystemIcon className={cn("w-4 h-4", iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-semibold", iconColor)}>{systemLabel}</span>
                  <span className="text-[10px] text-muted-foreground">• {systemDesc}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {system === "fast" ? "Rapid pattern recognition & intuitive processing" : "Structured analysis & deliberate reasoning"}
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
                    const gatingResult = games[area.gameType];
                    const isEnabled = !gatingResult || gatingResult.status === "ENABLED";
                    const isProtection = gatingResult?.status === "PROTECTION";
                    const isWithheld = gatingResult?.status === "WITHHELD";
                    
                    return (
                      <TooltipProvider key={`${area.areaId}-${system}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleGameTypeClick(area.areaId, system, area.gameType)}
                              disabled={!isEnabled}
                              className={cn(
                                "group relative p-3 rounded-lg border transition-all text-left",
                                isEnabled 
                                  ? "bg-background/50 hover:bg-background border-border/50 hover:border-primary/30 active:scale-[0.98]"
                                  : isProtection
                                    ? "bg-muted/30 border-amber-500/30 opacity-70 cursor-not-allowed"
                                    : "bg-muted/20 border-border/30 opacity-60 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-start gap-2.5">
                              <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  isEnabled
                                    ? system === "fast" ? "bg-amber-500/8" : "bg-violet-500/8"
                                    : "bg-muted/30"
                                )}>
                                  {isProtection ? (
                                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                                  ) : isWithheld ? (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <Icon className={cn("w-4 h-4", iconColor)} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn(
                                    "text-[11px] font-medium leading-tight mb-0.5",
                                    isEnabled ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {area.name}
                                  </h4>
                                  <p className="text-[9px] text-muted-foreground">
                                    {isEnabled ? area.tagline : (
                                      <span className={isProtection ? "text-amber-500/70" : ""}>
                                        {isProtection ? "Prioritizing Recovery" : "Requires Recovery"}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Play indicator - only for enabled games */}
                              {isEnabled && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className={cn("w-3.5 h-3.5", iconColor)} />
                                </div>
                              )}
                            </button>
                          </TooltipTrigger>
                          {!isEnabled && gatingResult && (
                            <TooltipContent side="bottom" className="max-w-[200px]">
                              <p className="text-xs">{getWithholdReason(gatingResult)}</p>
                              {gatingResult.unlockActions.length > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Try: {gatingResult.unlockActions[0]}
                                </p>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
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
