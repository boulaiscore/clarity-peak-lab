import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  AttentionalEfficiencyIcon,
  RapidAssociationIcon,
  CriticalThinkingIcon,
  InsightIcon,
  System1Icon,
  System2Icon,
} from "@/components/icons/GameIcons";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import { ExercisePickerSheet } from "./ExercisePickerSheet";
import { S1AEGameSelector } from "./S1AEGameSelector";
import { S1RAGameSelector } from "./S1RAGameSelector";
import { S2CTGameSelector } from "./S2CTGameSelector";
import { S2INGameSelector } from "./S2INGameSelector";
import { CognitiveExercise } from "@/lib/exercises";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";
import { useGamesGating } from "@/hooks/useGamesGating";
import { GameType } from "@/lib/gamesGating";
import { Alert, AlertDescription } from "@/components/ui/alert";


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
  const [showS2CTSelector, setShowS2CTSelector] = useState(false);
  const [showS2INSelector, setShowS2INSelector] = useState(false);
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
    
    // S2-CT has its own game selector with Causal Ledger, Counterfactual Audit, Socratic Cross-Exam
    if (gameType === "S2-CT") {
      setShowS2CTSelector(true);
      return;
    }
    
    // S2-IN has its own game selector with Signal vs Noise
    if (gameType === "S2-IN") {
      setShowS2INSelector(true);
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
    <div className="space-y-3">
      {/* System Cards - Side by Side Layout */}
      <div className="grid grid-cols-2 gap-3">
        {(["fast", "slow"] as ThinkingSystem[]).map((system) => {
          const systemLabel = system === "fast" ? "S1" : "S2";
          const systemDesc = system === "fast" ? "Intuitive" : "Deliberate";
          const areas = system === "fast" ? SYSTEM_1_AREAS : SYSTEM_2_AREAS;
          // Muted colored styling per system - premium tones
          const accentClass = system === "fast" 
            ? "border-area-fast/30 bg-area-fast/5" 
            : "border-area-slow/30 bg-area-slow/5";
          const iconColor = system === "fast" ? "text-area-fast" : "text-area-slow";
          const SystemIcon = system === "fast" ? System1Icon : System2Icon;
          
          return (
            <div
              key={system}
              className={cn(
                "rounded-xl border transition-all overflow-hidden",
                accentClass
              )}
            >
              {/* System Header with custom icon */}
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

              {/* Area Cards with custom icons */}
              <div className="p-2.5 space-y-2">
                {areas.map((area) => {
                  // Select appropriate custom icon based on game type
                  const getAreaIcon = () => {
                    switch (area.gameType) {
                      case "S1-AE": return AttentionalEfficiencyIcon;
                      case "S1-RA": return RapidAssociationIcon;
                      case "S2-CT": return CriticalThinkingIcon;
                      case "S2-IN": return InsightIcon;
                      default: return AttentionalEfficiencyIcon;
                    }
                  };
                  const AreaIcon = getAreaIcon();
                  
                  return (
                    <button
                      key={`${area.areaId}-${system}`}
                      onClick={() => handleGameTypeClick(area.areaId, system, area.gameType)}
                      className={cn(
                        "group relative w-full p-3 rounded-xl border transition-all text-left",
                        "bg-background/60 hover:bg-background border-border/40 hover:border-primary/30 active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          system === "fast" ? "bg-area-fast/15" : "bg-area-slow/15"
                        )}>
                          <AreaIcon className={cn("w-4 h-4", iconColor)} />
                        </div>
                        <h4 className="flex-1 text-xs font-medium text-foreground">
                          {area.name}
                        </h4>
                        <ChevronRight className={cn("w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity", iconColor)} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

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

      {/* S2-CT Game Selector (Causal Ledger, Counterfactual Audit, Socratic Cross-Exam) */}
      <S2CTGameSelector
        open={showS2CTSelector}
        onOpenChange={setShowS2CTSelector}
      />

      {/* S2-IN Game Selector (Signal vs Noise) */}
      <S2INGameSelector
        open={showS2INSelector}
        onOpenChange={setShowS2INSelector}
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
