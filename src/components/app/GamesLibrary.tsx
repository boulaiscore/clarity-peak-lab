import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Lock, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SystemOneMark, SystemTwoMark } from "@/components/icons/ThinkingSystemIcons";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useId, useState } from "react";
import s1Bg from "@/assets/s1-bg.webp";
import s2Bg from "@/assets/s2-bg.webp";

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

const COMPACT_BRAIN_NODES = [
  { x: 22, y: 34, r: 1.15 }, { x: 27, y: 22, r: 0.85 }, { x: 38, y: 15, r: 1.2 },
  { x: 51, y: 13, r: 0.8 }, { x: 64, y: 15, r: 1.1 }, { x: 77, y: 14, r: 0.8 },
  { x: 90, y: 20, r: 1.15 }, { x: 98, y: 30, r: 0.85 }, { x: 96, y: 40, r: 1.1 },
  { x: 84, y: 47, r: 0.8 }, { x: 71, y: 50, r: 1.15 }, { x: 58, y: 46, r: 0.8 },
  { x: 44, y: 49, r: 1.1 }, { x: 31, y: 44, r: 0.85 }, { x: 37, y: 29, r: 1.25 },
  { x: 51, y: 24, r: 0.85 }, { x: 65, y: 27, r: 1.15 }, { x: 81, y: 27, r: 0.85 },
  { x: 48, y: 38, r: 1.05 }, { x: 63, y: 39, r: 0.8 }, { x: 78, y: 40, r: 1.2 },
];

const COMPACT_BRAIN_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 13], [0, 14], [1, 2], [1, 14], [2, 3], [2, 14], [2, 15],
  [3, 4], [3, 15], [4, 5], [4, 15], [4, 16], [5, 6], [5, 16], [6, 7],
  [6, 17], [7, 8], [7, 17], [8, 9], [8, 20], [9, 10], [9, 20], [10, 11],
  [10, 19], [11, 12], [11, 18], [11, 19], [12, 13], [12, 18], [13, 18],
  [14, 15], [14, 18], [15, 16], [15, 18], [16, 17], [16, 19], [17, 20],
  [18, 19], [19, 20], [14, 19], [16, 20],
];

function SystemBrainVisual({ system }: { system: ThinkingSystem }) {
  const reduceMotion = useReducedMotion();
  const isFast = system === "fast";
  const id = useId().replace(/:/g, "");
  const gradientId = `${id}-${isFast ? "fast" : "slow"}`;
  const glowId = `${id}-glow`;
  const pulseDuration = isFast ? 1.8 : 4.8;
  const signalStride = isFast ? 5 : 8;

  return (
    <div className="pointer-events-none relative h-[64px] w-[116px] shrink-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className={cn(
          "absolute inset-x-3 inset-y-2 rounded-[48%] blur-[9px]",
          isFast
            ? "bg-[radial-gradient(ellipse_at_center,hsl(var(--area-fast)/0.42),hsl(var(--area-fast)/0.09)_58%,transparent_76%)]"
            : "bg-[radial-gradient(ellipse_at_center,hsl(var(--area-slow)/0.42),hsl(var(--area-slow)/0.09)_58%,transparent_76%)]",
        )}
        animate={reduceMotion ? undefined : { opacity: [0.28, 0.72, 0.28], scale: [0.9, 1.12, 0.9] }}
        transition={reduceMotion ? undefined : { duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img
        src={isFast ? s1Bg : s2Bg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.2] mix-blend-screen contrast-125 saturate-75"
        style={{
          WebkitMaskImage: "radial-gradient(ellipse at center, black 34%, transparent 76%)",
          maskImage: "radial-gradient(ellipse at center, black 34%, transparent 76%)",
        }}
        animate={reduceMotion ? undefined : { opacity: [0.14, 0.28, 0.14], scale: [0.98, 1.02, 0.98] }}
        transition={reduceMotion ? undefined : { duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,#0b0d10_90%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 116 64" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isFast ? "hsl(var(--area-fast))" : "hsl(var(--area-slow))"} stopOpacity="0.68" />
            <stop offset="100%" stopColor={isFast ? "hsl(var(--area-fast))" : "hsl(var(--area-slow))"} />
          </linearGradient>
          <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="1.15" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <path
          d="M17 35 C17 21 29 12 45 11 C53 8 63 9 70 13 C86 11 100 20 101 33 C102 43 93 49 81 50 C72 54 63 53 57 48 C46 52 33 49 27 43 C20 42 17 39 17 35 Z"
          stroke={isFast ? "hsl(var(--area-fast))" : "hsl(var(--area-slow))"}
          strokeWidth="0.65"
          opacity="0.18"
        />

        <g filter={`url(#${glowId})`}>
          {COMPACT_BRAIN_CONNECTIONS.map(([from, to], index) => {
            const start = COMPACT_BRAIN_NODES[from];
            const end = COMPACT_BRAIN_NODES[to];
            const baseOpacity = 0.12 + (index % 4) * 0.045;
            return (
              <line
                key={`${from}-${to}-${index}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={`url(#${gradientId})`}
                strokeWidth={index % 6 === 0 ? 0.65 : 0.45}
                opacity={baseOpacity}
              >
                {!reduceMotion && index % (isFast ? 4 : 6) === 0 && (
                  <animate
                    attributeName="opacity"
                    values={`${(baseOpacity * 0.45).toFixed(2)};${Math.min(0.72, baseOpacity * 2.7).toFixed(2)};${(baseOpacity * 0.45).toFixed(2)}`}
                    dur={`${(pulseDuration + (index % 3) * 0.32).toFixed(2)}s`}
                    begin={`${((index % 5) * 0.2).toFixed(2)}s`}
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}

          {!reduceMotion && COMPACT_BRAIN_CONNECTIONS.map(([from, to], index) => {
            if (index % signalStride !== 0) return null;
            const start = COMPACT_BRAIN_NODES[from];
            const end = COMPACT_BRAIN_NODES[to];
            const duration = pulseDuration * 0.86 + (index % 3) * 0.25;
            return (
              <circle key={`signal-${from}-${to}-${index}`} r={isFast ? 0.9 : 0.75} fill={`url(#${gradientId})`}>
                <animateMotion
                  path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                  dur={`${duration.toFixed(2)}s`}
                  begin={`${((index % 6) * 0.22).toFixed(2)}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.95;0"
                  dur={`${duration.toFixed(2)}s`}
                  begin={`${((index % 6) * 0.22).toFixed(2)}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}

          {COMPACT_BRAIN_NODES.map((node, index) => (
            <g key={`${node.x}-${node.y}`}>
              {index % (isFast ? 5 : 7) === 0 && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r * 2.4}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="0.45"
                  opacity="0.2"
                >
                  {!reduceMotion && (
                    <>
                      <animate
                        attributeName="r"
                        values={`${(node.r * 1.6).toFixed(2)};${(node.r * 3.4).toFixed(2)};${(node.r * 1.6).toFixed(2)}`}
                        dur={`${(pulseDuration + (index % 4) * 0.28).toFixed(2)}s`}
                        begin={`${((index % 5) * 0.2).toFixed(2)}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.06;0.48;0.06"
                        dur={`${(pulseDuration + (index % 4) * 0.28).toFixed(2)}s`}
                        begin={`${((index % 5) * 0.2).toFixed(2)}s`}
                        repeatCount="indefinite"
                      />
                    </>
                  )}
                </circle>
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={`url(#${gradientId})`}
                opacity={0.62 + (index % 3) * 0.1}
              >
                {!reduceMotion && index % (isFast ? 2 : 3) === 0 && (
                  <>
                    <animate
                      attributeName="r"
                      values={`${(node.r * 0.85).toFixed(2)};${(node.r * 1.42).toFixed(2)};${(node.r * 0.85).toFixed(2)}`}
                      dur={`${(pulseDuration + (index % 4) * 0.21).toFixed(2)}s`}
                      begin={`${((index % 6) * 0.16).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.42;0.95;0.42"
                      dur={`${(pulseDuration + (index % 4) * 0.21).toFixed(2)}s`}
                      begin={`${((index % 6) * 0.16).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

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


      {/* System selector — distinct motion languages for fast and deliberate processing */}
      <div className="grid grid-cols-2 gap-3">
        {SYSTEMS.map((system) => {
          const Icon = system.id === "fast" ? SystemOneMark : SystemTwoMark;
          const isOpen = openSystem === system.id;
          const isFast = system.id === "fast";
          return (
            <button
              key={system.id}
              onClick={() => handleSystemToggle(system.id)}
              aria-expanded={isOpen}
              className={cn(
                "group relative h-[168px] w-full overflow-hidden rounded-[18px] border bg-[#0b0d10] p-4 text-left transition-all duration-200",
                isOpen
                  ? "border-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
                  : "border-white/[0.09] hover:border-white/[0.2]"
              )}
            >
              <div className="relative flex h-full flex-col">
                <div className="flex h-4 shrink-0 items-start justify-between">
                  <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.18em] text-white/60">
                    {system.label}
                  </span>
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    color={isFast ? "rgba(255,211,94,0.9)" : "rgba(216,201,255,0.88)"}
                    strokeWidth={1.35}
                  />
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <SystemBrainVisual system={system.id} />
                </div>

                <div className="h-[52px] shrink-0 border-t border-white/[0.055] pt-2.5">
                  <p className="truncate whitespace-nowrap text-[12px] font-semibold leading-none tracking-tight text-white">
                    {isFast ? "Fast · intuitive" : "Slow · analytical"}
                  </p>
                  <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                    <p className={cn(
                      "min-w-0 truncate whitespace-nowrap text-[9px] font-medium leading-none",
                      isFast ? "text-amber-300/75" : "text-violet-200/70",
                    )}>
                      {isFast ? "Pattern · react" : "Analyze · reason"}
                    </p>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-white/45 transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </div>
                </div>
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
