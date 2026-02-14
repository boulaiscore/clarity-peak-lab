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

  const allAreas = [
    { ...SYSTEM_1_AREAS[0], system: "fast" as ThinkingSystem, systemLabel: "S1", accentColor: "hsl(var(--area-fast))" },
    { ...SYSTEM_1_AREAS[1], system: "fast" as ThinkingSystem, systemLabel: "S1", accentColor: "hsl(var(--area-fast))" },
    { ...SYSTEM_2_AREAS[0], system: "slow" as ThinkingSystem, systemLabel: "S2", accentColor: "hsl(var(--area-slow))" },
    { ...SYSTEM_2_AREAS[1], system: "slow" as ThinkingSystem, systemLabel: "S2", accentColor: "hsl(var(--area-slow))" },
  ];

  return (
    <div className="space-y-3">
      {/* XP Info - Minimal */}
      <div className="px-4 py-2.5 rounded-xl bg-muted/15 border border-border/15">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 leading-relaxed">
          Training awards <span className="text-foreground/80 font-medium">15–42 XP</span> per session
        </p>
      </div>

      {/* 2x2 Grid of distinct game tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        {allAreas.map((area) => (
          <button
            key={`${area.gameType}`}
            onClick={() => handleGameTypeClick(area.areaId, area.system, area.gameType)}
            className={cn(
              "group relative w-full rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all text-left overflow-hidden",
              "hover:border-border/50 hover:bg-card",
              "active:scale-[0.97]"
            )}
          >
            {/* Card content */}
            <div className="p-4 flex flex-col gap-3 min-h-[120px]">
              {/* System badge + chevron */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${area.accentColor} 15%, transparent)`,
                    color: area.accentColor,
                  }}
                >
                  {area.systemLabel} · {area.system === "fast" ? "Fast" : "Slow"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
              </div>

              {/* Code monogram */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${area.accentColor} 12%, transparent)`,
                }}
              >
                <span
                  className="text-[13px] font-bold tracking-wider"
                  style={{ color: area.accentColor }}
                >
                  {area.code}
                </span>
              </div>

              {/* Name */}
              <span className="text-[12px] font-medium text-foreground/85 leading-snug mt-auto">
                {area.name}
              </span>
            </div>

            {/* Subtle bottom accent line */}
            <div
              className="h-[2px] w-full opacity-40"
              style={{ backgroundColor: area.accentColor }}
            />
          </button>
        ))}
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
