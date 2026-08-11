import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Lock, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useGamesGating, type GameGatingResult, type WithholdReasonCode } from "@/hooks/useGamesGating";
import { GameType } from "@/lib/gamesGating";

// Map engine reason codes to short, premium unlock labels
function unlockLabelFor(g: GameGatingResult): string {
  const code = g.reasonCode as WithholdReasonCode | null;
  const req = g.details?.requiredValue;
  switch (code) {
    case "RECOVERY_TOO_LOW":   return req != null ? `Unlock with recovery ${req}%` : "Unlock with recovery";
    case "SHARPNESS_TOO_LOW":  return req != null ? `Needs sharpness ${req}%`      : "Needs higher sharpness";
    case "SHARPNESS_TOO_HIGH": return "Reserved for lower sharpness";
    case "READINESS_TOO_LOW":  return req != null ? `Needs readiness ${req}%`      : "Needs higher readiness";
    case "READINESS_OUT_OF_RANGE": return "Outside readiness range";
    case "CAP_REACHED_DAILY_S1":   return "Daily Fast cap reached";
    case "CAP_REACHED_DAILY_S2":   return "Daily Slow cap reached";
    case "CAP_REACHED_WEEKLY_S2":  return "Weekly Slow cap reached";
    case "CAP_REACHED_WEEKLY_IN":  return "Weekly Insight cap reached";
    case "SUPERHUMAN_REC_REQUIRED": return "Recovery required (Superhuman)";
    default: return "Temporarily unavailable";
  }
}

type ThinkingSystem = "fast" | "slow";

interface GamesLibraryProps {
  onStartGame: (areaId: NeuroLabArea) => void;
  recoveryEffective?: number;
}

const SYSTEMS = [
  {
    id: "fast" as ThinkingSystem,
    label: "System 1",
    sublabel: "Automatic processing · pre-attentive speed",
    description: "Speed, pattern recognition, automaticity",
    accentColor: "hsl(var(--area-fast))",
    areas: [
      { areaId: "focus" as NeuroLabArea, name: "Attentional Efficiency", code: "AE", gameType: "S1-AE" as GameType, subLabel: "Sustained attention · inhibitory control" },
      { areaId: "creativity" as NeuroLabArea, name: "Rapid Association", code: "RA", gameType: "S1-RA" as GameType, subLabel: "Semantic retrieval · associative fluency" },
    ],
  },
  {
    id: "slow" as ThinkingSystem,
    label: "System 2",
    sublabel: "Controlled processing · executive load",
    description: "Logic, analysis, structured reasoning",
    accentColor: "hsl(var(--area-slow))",
    areas: [
      { areaId: "reasoning" as NeuroLabArea, name: "Critical Thinking", code: "CT", gameType: "S2-CT" as GameType, subLabel: "Causal inference · evidence calibration" },
      { areaId: "creativity" as NeuroLabArea, name: "Insight", code: "IN", gameType: "S2-IN" as GameType, subLabel: "Hypothesis testing · pattern abstraction" },
    ],
  },
];

export function GamesLibrary({ onStartGame }: GamesLibraryProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const systemFromUrl = searchParams.get("system");
  const [openSystem, setOpenSystem] = useState<ThinkingSystem | null>(
    systemFromUrl === "fast" || systemFromUrl === "slow" ? systemFromUrl : null
  );
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
  const { games } = useGamesGating();

  // Pick-for-today: prefer S2-CT if engine-enabled, then S1-AE, otherwise none
  const pickedGameType: GameType | null =
    games["S2-CT"]?.status === "ENABLED" ? "S2-CT"
    : games["S1-AE"]?.status === "ENABLED" ? "S1-AE"
    : null;

  const handleSystemToggle = (systemId: ThinkingSystem) => {
    setOpenSystem(prev => prev === systemId ? null : systemId);
  };

  const handleGameTypeClick = (areaId: NeuroLabArea, mode: ThinkingSystem, gameType: GameType) => {
    if (gameType === "S1-AE") { setShowS1AESelector(true); return; }
    if (gameType === "S1-RA") { setShowS1RASelector(true); return; }
    if (gameType === "S2-CT") { setShowS2CTSelector(true); return; }
    if (gameType === "S2-IN") { setShowS2INSelector(true); return; }

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
      {/* XP Explanation — collapsed, expands on info tap */}
      <div className="flex items-center gap-2 border-b border-white/[0.055] px-0.5 pb-3">
        <p className="flex-1 text-[10px] leading-snug text-muted-foreground/70">
          Choose a system. Training adds Cognitive XP to this week's load.
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="How training XP works"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/55 transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-72 text-[11px] leading-relaxed text-muted-foreground"
          >
            <p className="font-medium text-foreground mb-1.5">How training XP works</p>
            <p>
              <span className="font-medium text-foreground">System 1</span> drills train fast intuitive thinking — pattern recognition and reaction speed.{" "}
              <span className="font-medium text-foreground">System 2</span> drills train slow analytical thinking — reasoning and structured analysis.
              Both award <span className="font-medium text-foreground">Cognitive XP</span> that fuels Sharpness, Readiness and Reasoning Quality.
            </p>

          </PopoverContent>
        </Popover>
      </div>


      {/* System selector */}
      <div className="grid grid-cols-2 gap-3">
        {SYSTEMS.map((system) => {
          const isOpen = openSystem === system.id;
          return (
            <button
              key={system.id}
              onClick={() => handleSystemToggle(system.id)}
              className={cn(
                "group relative min-h-[94px] w-full overflow-hidden rounded-[14px] border p-4 text-left transition-colors",
                isOpen
                  ? "border-white/[0.12] bg-white/[0.06]"
                  : "border-white/[0.055] bg-white/[0.022] hover:bg-white/[0.04]"
              )}
            >
              <span className="absolute inset-x-4 top-0 h-px" style={{ backgroundColor: system.accentColor }} />
              <div className="flex items-start justify-between">
                <span className="text-[24px] font-semibold tabular-nums tracking-[-0.04em] text-foreground/95">
                  {system.id === "fast" ? "S1" : "S2"}
                </span>
                <ChevronDown className={cn("mt-1 h-3.5 w-3.5 text-muted-foreground/45 transition-transform", isOpen && "rotate-180")} />
              </div>
              <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                {system.id === "fast" ? "Fast · intuitive" : "Slow · analytical"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Module rows — expands below the selected system (no height animation to avoid flicker) */}
      {openSystem && (() => {
        const system = SYSTEMS.find(s => s.id === openSystem)!;
        return (
          <div key={openSystem} className="animate-fade-in">

              <div className="space-y-2 pt-1">
                {system.areas.map((area) => {
                  const isLocked = false;
                  const lockLabel = "";
                  const isPicked = pickedGameType === area.gameType;
                  return (
                    <button
                      key={area.gameType}
                      onClick={() => {
                        if (isLocked) return;
                        handleGameTypeClick(area.areaId, system.id, area.gameType);
                      }}
                      disabled={isLocked}
                      className={cn(
                        "group relative flex w-full items-center gap-3 overflow-hidden rounded-[12px] border p-3 pr-3.5 text-left transition-colors",
                        "bg-white/[0.02]",
                        isLocked
                          ? "cursor-not-allowed border-white/[0.035]"
                          : "border-white/[0.055] hover:bg-white/[0.04]",
                        isPicked && !isLocked && "border-transparent"
                      )}
                      style={isPicked && !isLocked ? { boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${system.accentColor} 55%, transparent)` } : undefined}
                    >
                      <div
                        className={cn(
                          "my-1 w-[2px] flex-shrink-0 self-stretch rounded-full",
                          isLocked && "opacity-40"
                        )}
                        style={{
                          background: system.accentColor,
                        }}
                      />

                      <div className={cn("min-w-0 flex-1 py-0.5 pl-1", isLocked && "opacity-55")}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground/45">{area.code}</span>
                          <p className="truncate text-[13px] font-semibold tracking-tight text-foreground/95">
                            {area.name}
                          </p>
                          {isPicked && !isLocked && (
                            <span className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: system.accentColor }}>Today</span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-[10px] leading-snug text-muted-foreground/65">
                          {isLocked ? lockLabel : area.subLabel}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        ) : (
                          <ChevronDown className="w-4 h-4 -rotate-90 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
          </div>
        );
      })()}


      {/* Sheets & Dialogs */}
      <ExercisePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        area={pickerArea}
        thinkingMode={pickerMode}
        onStartExercise={handleStartExercise}
      />
      <S1AEGameSelector open={showS1AESelector} onOpenChange={setShowS1AESelector} />
      <S1RAGameSelector open={showS1RASelector} onOpenChange={setShowS1RASelector} />
      <S2CTGameSelector open={showS2CTSelector} onOpenChange={setShowS2CTSelector} />
      <S2INGameSelector open={showS2INSelector} onOpenChange={setShowS2INSelector} />
      <TargetExceededDialog
        open={showTargetExceededDialog}
        onOpenChange={setShowTargetExceededDialog}
        onConfirm={handleConfirmExcessGame}
        categoryName="Training"
      />
    </div>
  );
}
