import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Brain, Target, Lightbulb, Zap, Timer, Play, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { S1AEGameSelector } from "./S1AEGameSelector";
import { S1RAGameSelector } from "./S1RAGameSelector";
import { CognitiveExercise } from "@/lib/exercises";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";
import { useGamesGating } from "@/hooks/useGamesGating";
import { GameType } from "@/lib/gamesGating";
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


export function GamesLibrary({ onStartGame }: GamesLibraryProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerArea, setPickerArea] = useState<NeuroLabArea>("focus");
  const [pickerMode, setPickerMode] = useState<ThinkingSystem>("fast");
  
  
  const [pendingGame, setPendingGame] = useState<{ areaId: NeuroLabArea; mode: ThinkingSystem } | null>(null);
  const [showTargetExceededDialog, setShowTargetExceededDialog] = useState(false);
  const [showS1AESelector, setShowS1AESelector] = useState(false);
  const [showS1RASelector, setShowS1RASelector] = useState(false);
  
  const { gamesComplete } = useCappedWeeklyProgress();
  const { games, caps, safetyRuleActive, isLoading: gatingLoading } = useGamesGating();

  const handleGameTypeClick = (areaId: NeuroLabArea, mode: ThinkingSystem, gameType: GameType) => {
    // Always allow opening game selectors to see the games list
    // Individual games will be locked within the selector if needed
    const gatingResult = games[gameType];
    const isLocked = gatingResult && gatingResult.status !== "ENABLED";
    
    // S1-AE has its own game selector with Triage Sprint, Orbit Lock, Focus Switch
    if (gameType === "S1-AE") {
      setShowS1AESelector(true);
      return;
    }
    
    // S1-RA has its own game selector with Flash Connect, Constellation Snap
    if (gameType === "S1-RA") {
      setShowS1RASelector(true);
      return;
    }
    
    // For S2 games (CT/IN), if locked, don't open the picker
    // (since ExercisePickerSheet doesn't have built-in gating UI yet)
    if (isLocked) {
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
      {/* Safe Mode Banner - shown when no-deadlock rule is active */}
      {safetyRuleActive && (
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary/60" />
          <AlertDescription className="text-xs text-muted-foreground">
            <span className="font-medium text-primary/80">Safe mode training available</span> while recovery data is building.
          </AlertDescription>
        </Alert>
      )}
      
      {/* System Cards - Side by Side Layout */}
      <div className="grid grid-cols-2 gap-3">
        {(["fast", "slow"] as ThinkingSystem[]).map((system) => {
          const SystemIcon = system === "fast" ? Zap : Timer;
          const systemLabel = system === "fast" ? "S1" : "S2";
          const systemDesc = system === "fast" ? "Intuitive" : "Deliberate";
          const areas = system === "fast" ? SYSTEM_1_AREAS : SYSTEM_2_AREAS;
          // Muted colored styling per system - premium tones
          const accentClass = system === "fast" 
            ? "border-area-fast/30 bg-area-fast/5" 
            : "border-area-slow/30 bg-area-slow/5";
          const iconColor = system === "fast" ? "text-area-fast" : "text-area-slow";
          
          return (
            <div
              key={system}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                accentClass
              )}
            >
              {/* System Header */}
              <div className="p-2.5 flex items-center gap-2 border-b border-border/30">
                <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    system === "fast" ? "bg-area-fast/15" : "bg-area-slow/15"
                  )}>
                  <SystemIcon className={cn("w-3.5 h-3.5", iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[11px] font-semibold", iconColor)}>{systemLabel}</span>
                    <span className={cn("text-[9px]", system === "fast" ? "text-area-fast/80" : "text-area-slow/80")}>• {systemDesc}</span>
                  </div>
                </div>
              </div>

              {/* Area Cards - Stacked within each system - Always clickable */}
              <div className="p-2 space-y-1.5">
                {areas.map((area) => {
                  const Icon = AREA_ICONS[area.areaId] || Brain;
                  
                  return (
                    <button
                      key={`${area.areaId}-${system}`}
                      onClick={() => handleGameTypeClick(area.areaId, system, area.gameType)}
                      className={cn(
                        "group relative w-full p-2 rounded-lg border transition-all text-left",
                        "bg-background/50 hover:bg-background border-border/50 hover:border-primary/30 active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                            system === "fast" ? "bg-area-fast/15" : "bg-area-slow/15"
                          )}>
                          <Icon className={cn("w-3 h-3", iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-medium leading-tight text-foreground">
                            {area.name}
                          </h4>
                          <p className="text-[9px] text-muted-foreground/80 leading-tight">
                            {area.tagline}
                          </p>
                        </div>
                        
                        {/* Play indicator */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className={cn("w-3 h-3", iconColor)} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gating Explanation */}
      <p className="text-[10px] text-muted-foreground/70 text-center px-4">
        Games unlock based on your cognitive metrics.
      </p>

      {/* Exercise Picker Sheet (for non-S1-AE games) */}
      <ExercisePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        area={pickerArea}
        thinkingMode={pickerMode}
        onStartExercise={handleStartExercise}
      />

      {/* S1-AE Game Selector (Triage Sprint / Orbit Lock / Focus Switch) */}
      <S1AEGameSelector
        open={showS1AESelector}
        onOpenChange={setShowS1AESelector}
      />

      {/* S1-RA Game Selector (Flash Connect) */}
      <S1RAGameSelector
        open={showS1RASelector}
        onOpenChange={setShowS1RASelector}
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
