import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useState } from "react";
import gameAeBg from "@/assets/game-ae-bg.jpg";
import gameRaBg from "@/assets/game-ra-bg.jpg";
import gameCtBg from "@/assets/game-ct-bg.jpg";
import gameInBg from "@/assets/game-in-bg.jpg";

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

type ThinkingSystem = "fast" | "slow";

interface GamesLibraryProps {
  onStartGame: (areaId: NeuroLabArea) => void;
}

const SYSTEMS = [
  {
    id: "fast" as ThinkingSystem,
    label: "System 1",
    sublabel: "Fast · Intuitive",
    description: "Speed, pattern recognition, automaticity",
    accentColor: "hsl(var(--area-fast))",
    areas: [
      { areaId: "focus" as NeuroLabArea, name: "Attentional Efficiency", code: "AE", gameType: "S1-AE" as GameType, bgImage: gameAeBg, subLabel: "Focus & Precision" },
      { areaId: "creativity" as NeuroLabArea, name: "Rapid Association", code: "RA", gameType: "S1-RA" as GameType, bgImage: gameRaBg, subLabel: "Intuitive Links" },
    ],
  },
  {
    id: "slow" as ThinkingSystem,
    label: "System 2",
    sublabel: "Slow · Deliberate",
    description: "Logic, analysis, structured reasoning",
    accentColor: "hsl(var(--area-slow))",
    areas: [
      { areaId: "reasoning" as NeuroLabArea, name: "Critical Thinking", code: "CT", gameType: "S2-CT" as GameType, bgImage: gameCtBg, subLabel: "Logic & Analysis" },
      { areaId: "creativity" as NeuroLabArea, name: "Insight", code: "IN", gameType: "S2-IN" as GameType, bgImage: gameInBg, subLabel: "Clarity & Synthesis" },
    ],
  },
];

export function GamesLibrary({ onStartGame }: GamesLibraryProps) {
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
    <div className="space-y-2">
      {/* XP Info */}
      <div className="px-3 py-2 border-b border-border/30 mb-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Training awards <span className="text-foreground/90 font-medium">9–45 XP</span> per session
        </p>
      </div>

      {/* Two system blocks */}
      {SYSTEMS.map((system) => {
        const isOpen = openSystem === system.id;
        const Icon = system.id === "fast" ? Zap : Timer;

        return (
          <div key={system.id} className="overflow-hidden">
            {/* System header block */}
            <button
              onClick={() => handleSystemToggle(system.id)}
              className={cn(
                "group w-full flex items-center justify-between px-4 py-3.5 border transition-all duration-200 text-left",
                isOpen
                  ? "border-border/60 bg-white/[0.06]"
                  : "border-border/40 bg-white/[0.02] hover:bg-white/[0.04] hover:border-border/60"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Icon container */}
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-none border"
                  style={{
                    borderColor: `${system.accentColor}60`,
                    backgroundColor: `${system.accentColor}18`,
                  }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: system.accentColor }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-foreground tracking-tight">
                      {system.label}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.16em] px-1.5 py-0.5"
                      style={{ color: system.accentColor }}
                    >
                      {system.id === "fast" ? "Fast" : "Slow"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
                    {system.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                  2 modules
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground/80 transition-colors" />
                </motion.div>
              </div>
            </button>

            {/* Accent line under header when open */}
            {isOpen && (
              <div
                className="h-[1px] w-full opacity-30"
                style={{ backgroundColor: system.accentColor }}
              />
            )}

            {/* Subcategories - animated */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
                    {system.areas.map((area) => (
                      <button
                        key={area.gameType}
                        onClick={() => handleGameTypeClick(area.areaId, system.id, area.gameType)}
                        className="group relative text-left overflow-hidden active:scale-[0.98] transition-transform"
                      >
                        {/* Background image */}
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${area.bgImage})` }}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors" />

                        {/* Content */}
                        <div className="relative z-10 p-4 flex flex-col gap-2.5 min-h-[108px]">
                          {/* Monogram badge */}
                          <div
                            className="w-8 h-8 flex items-center justify-center border bg-white/[0.06] backdrop-blur-sm"
                            style={{ borderColor: `${system.accentColor}35` }}
                          >
                            <span
                              className="text-[12px] font-bold tracking-widest"
                              style={{ color: system.accentColor }}
                            >
                              {area.code}
                            </span>
                          </div>

                          {/* Name & sublabel */}
                          <div className="mt-auto">
                            <p className="text-[11px] font-semibold text-white/90 leading-tight">
                              {area.name}
                            </p>
                            <p className="text-[9px] text-white/40 uppercase tracking-[0.12em] mt-0.5">
                              {area.subLabel}
                            </p>
                          </div>
                        </div>

                        {/* Bottom accent */}
                        <div
                          className="relative z-10 h-[2px] w-full opacity-50"
                          style={{ backgroundColor: system.accentColor }}
                        />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

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
