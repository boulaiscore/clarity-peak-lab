import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Lock, Star } from "lucide-react";
import { SystemOneMark, SystemTwoMark } from "@/components/icons/ThinkingSystemIcons";
import {
  AttentionalEfficiencyMark,
  RapidAssociationMark,
  CriticalThinkingMark,
  InsightMark,
} from "@/components/icons/SubSkillIcons";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import gameAeBg from "@/assets/game-ae-bg.jpg";
import gameRaBg from "@/assets/game-ra-bg.jpg";
import gameCtBg from "@/assets/game-ct-bg.jpg";
import gameInBg from "@/assets/game-in-bg.jpg";
import s1Bg from "@/assets/s1-bg.jpg";
import s2Bg from "@/assets/s2-bg.jpg";

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
      { areaId: "focus" as NeuroLabArea, name: "Attentional Efficiency", code: "AE", gameType: "S1-AE" as GameType, bgImage: gameAeBg, Icon: AttentionalEfficiencyMark, subLabel: "Sustained attention · inhibitory control" },
      { areaId: "creativity" as NeuroLabArea, name: "Rapid Association", code: "RA", gameType: "S1-RA" as GameType, bgImage: gameRaBg, Icon: RapidAssociationMark, subLabel: "Semantic retrieval · associative fluency" },
    ],
  },
  {
    id: "slow" as ThinkingSystem,
    label: "System 2",
    sublabel: "Controlled processing · executive load",
    description: "Logic, analysis, structured reasoning",
    accentColor: "hsl(var(--area-slow))",
    areas: [
      { areaId: "reasoning" as NeuroLabArea, name: "Critical Thinking", code: "CT", gameType: "S2-CT" as GameType, bgImage: gameCtBg, Icon: CriticalThinkingMark, subLabel: "Causal inference · evidence calibration" },
      { areaId: "creativity" as NeuroLabArea, name: "Insight", code: "IN", gameType: "S2-IN" as GameType, bgImage: gameInBg, Icon: InsightMark, subLabel: "Hypothesis testing · pattern abstraction" },
    ],
  },
];

export function GamesLibrary({ onStartGame, recoveryEffective = 100 }: GamesLibraryProps) {
  const navigate = useNavigate();
  const [openSystem, setOpenSystem] = useState<ThinkingSystem | null>(null);
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
    <div className="space-y-5">
      {/* XP Explanation */}
      <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/30">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">System 1</span> trains fast intuitive thinking — pattern recognition and reaction speed.{" "}
          <span className="font-medium text-foreground">System 2</span> trains slow analytical thinking — reasoning and structured analysis.
          Both award <span className="font-medium text-foreground">Cognitive XP</span> that fuels Sharpness, Readiness and Reasoning Quality.
        </p>
      </div>

      {/* System selector — two horizontal AI-art cards (matches Quality Time / Recover) */}
      <div className="grid grid-cols-2 gap-3">
        {SYSTEMS.map((system) => {
          const Icon = system.id === "fast" ? SystemOneMark : SystemTwoMark;
          const isOpen = openSystem === system.id;
          const bg = system.id === "fast" ? s1Bg : s2Bg;
          return (
            <button
              key={system.id}
              onClick={() => handleSystemToggle(system.id)}
              className={cn(
                "group relative w-full flex flex-col items-center justify-end gap-2 p-4 pt-20 rounded-2xl border transition-all overflow-hidden text-center",
                isOpen
                  ? "border-foreground/30"
                  : "border-border/30 hover:border-border/60"
              )}
            >
              <img
                src={bg}
                alt={system.label}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

              <div className="absolute top-3 left-3 z-10">
                <Icon className="w-4 h-4" color="rgba(255,255,255,0.9)" strokeWidth={1.4} />
              </div>

              <div className="relative z-10">
                <p className="font-semibold text-sm text-white tracking-tight">{system.label}</p>
                <p className="text-[10px] text-white/70 mt-0.5">
                  {system.id === "fast" ? "Fast · intuitive" : "Slow · analytical"}
                </p>
              </div>
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
                  const gating = games[area.gameType];
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
                        "group relative w-full flex items-center gap-3.5 p-2.5 pr-4 rounded-2xl border text-left transition-all overflow-hidden",
                        "bg-card/40 backdrop-blur-sm",
                        isLocked
                          ? "border-border/20 cursor-not-allowed"
                          : "border-border/40 hover:border-border/70 active:scale-[0.99]",
                        isPicked && !isLocked && "border-transparent"
                      )}
                      style={isPicked && !isLocked ? { boxShadow: `inset 0 0 0 1px ${system.accentColor}` } : undefined}
                    >
                      <div className="relative w-[68px] h-[68px] flex-shrink-0 rounded-xl overflow-hidden">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                          style={{ backgroundImage: `url(${area.bgImage})` }}
                        />
                        <div className={cn(
                          "absolute inset-0",
                          isLocked ? "bg-black/65" : "bg-gradient-to-br from-black/30 via-black/15 to-black/45"
                        )} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="text-[15px] font-bold tracking-[0.12em] text-white drop-shadow"
                            style={{ textShadow: `0 0 12px ${system.accentColor}90` }}
                          >
                            {area.code}
                          </span>
                        </div>
                      </div>

                      <div className={cn("flex-1 min-w-0", isLocked && "opacity-55")}>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[14px] font-semibold text-foreground tracking-tight truncate">
                            {area.name}
                          </p>
                          {isPicked && !isLocked && (
                            <Star className="w-3 h-3 flex-shrink-0" style={{ color: system.accentColor }} fill="currentColor" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug truncate">
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
