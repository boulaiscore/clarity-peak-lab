import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
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

// Areas available per thinking system (2x2 matrix)
const SYSTEM_1_AREAS: { areaId: NeuroLabArea; name: string; code: string; gameType: GameType }[] = [
  { areaId: "focus", name: "Attentional Efficiency", code: "AE", gameType: "S1-AE" },
  { areaId: "creativity", name: "Rapid Association", code: "RA", gameType: "S1-RA" },
];

const SYSTEM_2_AREAS: { areaId: NeuroLabArea; name: string; code: string; gameType: GameType }[] = [
  { areaId: "reasoning", name: "Critical Thinking", code: "CT", gameType: "S2-CT" },
  { areaId: "creativity", name: "Insight", code: "IN", gameType: "S2-IN" },
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
      {/* XP Info - Minimal */}
      <div className="px-4 py-2.5 rounded-xl bg-muted/15 border border-border/15">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 leading-relaxed">
          Training awards <span className="text-foreground/80 font-medium">15–42 XP</span> per session
        </p>
      </div>

      {/* S1 & S2 System Sections */}
      {(["fast", "slow"] as ThinkingSystem[]).map((system) => {
        const systemLabel = system === "fast" ? "S1" : "S2";
        const systemDesc = system === "fast" ? "Fast · Intuitive" : "Slow · Deliberate";
        const areas = system === "fast" ? SYSTEM_1_AREAS : SYSTEM_2_AREAS;

        return (
          <div key={system} className="space-y-2">
            {/* System Label */}
            <div className="flex items-baseline gap-2 px-1">
              <span className="text-[13px] font-bold tracking-wide text-foreground/90">{systemLabel}</span>
              <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50">{systemDesc}</span>
            </div>

            {/* 2 separate cards per system */}
            <div className="grid grid-cols-2 gap-2.5">
              {areas.map((area) => (
                <button
                  key={`${area.areaId}-${system}`}
                  onClick={() => handleGameTypeClick(area.areaId, system, area.gameType)}
                  className={cn(
                    "group relative w-full p-3.5 rounded-none border border-white/[0.06] bg-[hsl(218,20%,16%)] transition-all text-left",
                    "hover:brightness-110 hover:border-white/10",
                    "active:scale-[0.98]"
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-md bg-foreground/[0.06] flex items-center justify-center">
                        <span className="text-[10px] font-bold tracking-wider text-foreground/60">{area.code}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/25 group-hover:text-foreground/50 transition-colors" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground/85 leading-snug">
                      {area.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

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
