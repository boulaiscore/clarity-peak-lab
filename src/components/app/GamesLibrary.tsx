import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuroLabArea } from "@/lib/neuroLab";
import { useId, useState } from "react";
import { LAB_MODE_CARD_AMBIENCE_CLASS, LAB_MODE_CARD_CLASS } from "@/components/lab/labModeCardStyles";

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

interface ProcessNode {
  x: number;
  y: number;
  r: number;
}

const FAST_NODES: ProcessNode[] = [
  { x: 12, y: 31, r: 1.2 }, { x: 19, y: 14, r: 0.8 }, { x: 22, y: 49, r: 1.0 },
  { x: 33, y: 25, r: 1.35 }, { x: 40, y: 8, r: 0.85 }, { x: 43, y: 48, r: 1.1 },
  { x: 55, y: 17, r: 1.15 }, { x: 58, y: 35, r: 0.85 }, { x: 61, y: 55, r: 1.0 },
  { x: 73, y: 8, r: 1.05 }, { x: 76, y: 27, r: 1.3 }, { x: 78, y: 48, r: 0.85 },
  { x: 89, y: 17, r: 0.9 }, { x: 93, y: 38, r: 1.2 }, { x: 99, y: 9, r: 0.8 },
  { x: 101, y: 51, r: 1.05 }, { x: 31, y: 57, r: 0.75 }, { x: 102, y: 29, r: 0.85 },
];

const FAST_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [2, 3], [2, 5], [3, 4], [3, 5],
  [3, 6], [3, 7], [4, 6], [5, 7], [5, 8], [5, 16], [6, 7], [6, 9], [6, 10],
  [7, 8], [7, 10], [7, 11], [8, 11], [9, 10], [9, 12], [9, 14], [10, 11],
  [10, 12], [10, 13], [11, 13], [11, 15], [12, 13], [12, 14], [13, 15], [13, 17],
  [14, 17], [15, 17],
];

const SLOW_NODES: ProcessNode[] = [
  { x: 14, y: 12, r: 0.9 }, { x: 14, y: 32, r: 1.15 }, { x: 14, y: 52, r: 0.9 },
  { x: 34, y: 8, r: 0.85 }, { x: 34, y: 23, r: 1.1 }, { x: 34, y: 41, r: 1.1 }, { x: 34, y: 56, r: 0.85 },
  { x: 62, y: 14, r: 1.0 }, { x: 62, y: 32, r: 1.35 }, { x: 62, y: 50, r: 1.0 },
  { x: 88, y: 22, r: 1.05 }, { x: 88, y: 42, r: 1.05 }, { x: 107, y: 32, r: 1.45 },
];

const SLOW_CONNECTIONS: [number, number][] = [
  [0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6],
  [3, 7], [4, 7], [4, 8], [5, 8], [5, 9], [6, 9],
  [7, 10], [8, 10], [8, 11], [9, 11], [10, 12], [11, 12],
];

const SLOW_SIGNAL_PATHS = [
  "M 14 12 L 34 23 L 62 32 L 88 22 L 107 32",
  "M 14 32 L 34 41 L 62 50 L 88 42 L 107 32",
  "M 14 52 L 34 41 L 62 32 L 88 42 L 107 32",
];

// Frontal left hemisphere with a straight medial edge. Mirroring this exact path
// creates the matching right hemisphere, so the two cards show complementary halves.
const BRAIN_PATH =
  "M46 8 C42 5 37 4 33 6 C29 3 23 5 22 9 C16 7 11 11 12 16 C7 18 5 23 8 27 C3 31 4 38 9 40 C7 46 12 51 18 50 C20 55 27 57 32 53 C36 56 42 55 46 52 L46 8 Z";

const BRAIN_FOLDS = [
  "M40 10 C33 10 29 14 31 19 C26 16 20 16 16 20",
  "M42 24 C35 21 28 23 27 28 C22 25 15 27 11 31",
  "M44 35 C37 31 31 34 31 39 C25 36 17 38 13 42",
  "M42 48 C36 44 29 45 25 51",
];



function SystemProcessVisual({ system }: { system: ThinkingSystem }) {
  const reduceMotion = useReducedMotion();
  const isFast = system === "fast";
  const id = useId().replace(/:/g, "");
  const gradientId = `${id}-${isFast ? "fast" : "slow"}`;
  const glowId = `${id}-glow`;
  const softGlowId = `${id}-soft-glow`;
  const brainClipId = `${id}-brain-clip`;
  const pulseDuration = isFast ? 0.64 : 5.6;
  const nodes = isFast ? FAST_NODES : SLOW_NODES;
  const connections = isFast ? FAST_CONNECTIONS : SLOW_CONNECTIONS;
  const brainPath = BRAIN_PATH;
  const folds = BRAIN_FOLDS;
  const brainTransform = isFast
    ? "translate(10,1)"
    : "translate(106,1) scale(-1,1)";


  return (
    <div className="pointer-events-none relative h-[68px] w-[116px] shrink-0" aria-hidden="true">
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
          <filter id={softGlowId} x="-35%" y="-55%" width="170%" height="210%">
            <feGaussianBlur stdDeviation={isFast ? "4.2" : "3.4"} />
          </filter>
          <clipPath id={brainClipId}>
            <path d={brainPath} transform={brainTransform} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${brainClipId})`}>
          <motion.path
            d={brainPath}
            transform={brainTransform}
            fill={`url(#${gradientId})`}
            filter={`url(#${softGlowId})`}
            animate={reduceMotion ? undefined : {
              opacity: isFast ? [0.06, 0.18, 0.06] : [0.05, 0.14, 0.05],
            }}
            transition={reduceMotion ? undefined : {
              duration: pulseDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={reduceMotion ? { opacity: 0.1 } : undefined}
          />

          {!isFast && (
          <g stroke="hsl(var(--area-slow))" strokeWidth="0.35" opacity="0.1">
            <line x1="22" y1="4" x2="22" y2="60" />
            <line x1="48" y1="4" x2="48" y2="60" />
            <line x1="75" y1="4" x2="75" y2="60" />
            <line x1="99" y1="4" x2="99" y2="60" />
            <line x1="4" y1="18" x2="112" y2="18" />
            <line x1="4" y1="32" x2="112" y2="32" />
            <line x1="4" y1="46" x2="112" y2="46" />
          </g>
          )}

          <g filter={`url(#${glowId})`}>
          {connections.map(([from, to], index) => {
            const start = nodes[from];
            const end = nodes[to];
            const baseOpacity = isFast ? 0.05 + (index % 4) * 0.022 : 0.08 + (index % 3) * 0.028;
            return (
              <line
                key={`${from}-${to}-${index}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={`url(#${gradientId})`}
                strokeWidth={index % 6 === 0 ? 0.5 : 0.35}
                opacity={baseOpacity}
              >
                {!reduceMotion && index % (isFast ? 4 : 5) === 0 && (
                  <animate
                    attributeName="opacity"
                    values={`${(baseOpacity * 0.4).toFixed(2)};${Math.min(0.55, baseOpacity * 2.2).toFixed(2)};${(baseOpacity * 0.4).toFixed(2)}`}
                    dur={`${(pulseDuration + (index % 3) * 0.32).toFixed(2)}s`}
                    begin={`${((index % 5) * (isFast ? 0.14 : 0.48)).toFixed(2)}s`}
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}

          {!reduceMotion && isFast && connections.map(([from, to], index) => {
            if (index % 4 !== 0) return null;
            const start = nodes[from];
            const end = nodes[to];
            const duration = pulseDuration * 0.78 + (index % 3) * 0.18;
            return (
              <circle key={`signal-${from}-${to}-${index}`} r="0.95" fill={`url(#${gradientId})`}>
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

          {!reduceMotion && !isFast && SLOW_SIGNAL_PATHS.map((path, index) => (
            <circle key={path} r={index === 0 ? 1.05 : 0.82} fill={`url(#${gradientId})`} opacity="0">
              <animateMotion
                path={path}
                dur={`${(pulseDuration + index * 0.45).toFixed(2)}s`}
                begin={`${(index * 1.15).toFixed(2)}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0.9;0"
                keyTimes="0;0.12;0.82;1"
                dur={`${(pulseDuration + index * 0.45).toFixed(2)}s`}
                begin={`${(index * 1.15).toFixed(2)}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {nodes.map((node, index) => (
            <g key={`${node.x}-${node.y}`}>
              {index % (isFast ? 5 : 4) === 0 && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r * 2.0}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="0.35"
                  opacity="0.08"
                >
                  {!reduceMotion && (
                    <>
                      <animate
                        attributeName="r"
                        values={`${(node.r * 1.4).toFixed(2)};${(node.r * (isFast ? 2.6 : 2.2)).toFixed(2)};${(node.r * 1.4).toFixed(2)}`}
                        dur={`${(pulseDuration + (index % 4) * 0.28).toFixed(2)}s`}
                        begin={`${((index % 5) * 0.2).toFixed(2)}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.03;0.18;0.03"
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
                r={node.r * 0.75}
                fill={`url(#${gradientId})`}
                opacity={0.22 + (index % 3) * 0.06}
              >
                {!reduceMotion && index % (isFast ? 3 : 2) === 0 && (
                  <>
                    <animate
                      attributeName="r"
                      values={`${(node.r * 0.6).toFixed(2)};${(node.r * 1.0).toFixed(2)};${(node.r * 0.6).toFixed(2)}`}
                      dur={`${(pulseDuration + (index % 4) * 0.21).toFixed(2)}s`}
                      begin={`${((index % 6) * 0.16).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.18;0.48;0.18"
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

          {!isFast && (
            <g fill="none" stroke="hsl(var(--area-slow))" strokeWidth="0.55" opacity="0.28">
              <rect x="27.5" y="2.5" width="13" height="58" rx="3" strokeDasharray="1.5 2.5" />
              <rect x="55.5" y="8" width="13" height="48" rx="3" strokeDasharray="1.5 2.5" />
              <path d="M 81 15 H 94 M 81 49 H 94" />
              {!reduceMotion && (
                <animate attributeName="opacity" values="0.16;0.46;0.16" dur={`${pulseDuration}s`} repeatCount="indefinite" />
              )}
            </g>
          )}
        </g>

        {!isFast && (
          <g transform="translate(64, 10)">
            <rect x="-2" y="-2" width="34" height="48" rx="4" fill="hsl(var(--background))" opacity="0.42" />
            <g fill="hsl(var(--area-slow))" fontFamily="monospace" fontWeight="700" letterSpacing="0.02em" opacity="0.95">
              <text x="0" y="14" fontSize="9">87%</text>
              <text x="0" y="29" fontSize="7">P=0.93</text>
              <text x="22" y="25" fontSize="11">Σ</text>
              <text x="0" y="42" fontSize="6.5">IF→THEN</text>
            </g>
            {!reduceMotion && (
              <animate attributeName="opacity" values="0.72;0.98;0.72" dur={`${pulseDuration * 0.7}s`} repeatCount="indefinite" />
            )}
          </g>
        )}

        <g transform={brainTransform}>
          <motion.path
            d={brainPath}
            stroke={`url(#${gradientId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={reduceMotion ? undefined : {
              opacity: isFast ? [0.7, 1, 0.7] : [0.65, 0.95, 0.65],
            }}
            transition={reduceMotion ? undefined : {
              duration: pulseDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={reduceMotion ? { opacity: 0.85 } : undefined}
          />

          <g stroke={`url(#${gradientId})`} strokeWidth="1" opacity="0.5" fill="none" strokeLinecap="round">
            {folds.map((fold) => <path key={fold} d={fold} />)}
          </g>
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
      {/* System selector — distinct motion languages for fast and deliberate processing */}
      <div className="grid grid-cols-2 gap-3">
        {SYSTEMS.map((system) => {
          const isOpen = openSystem === system.id;
          const isFast = system.id === "fast";
          return (
            <button
              key={system.id}
              onClick={() => handleSystemToggle(system.id)}
              aria-expanded={isOpen}
              className={LAB_MODE_CARD_CLASS}
            >
              <div className={LAB_MODE_CARD_AMBIENCE_CLASS} />
              <div className="relative flex h-full flex-col">
                <div className="flex h-4 shrink-0 items-start justify-between">
                  <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.18em] text-foreground/60">
                    {system.label}
                  </span>
                  <span className={cn(
                    "text-[7px] font-semibold uppercase tracking-[0.16em]",
                    isFast ? "text-amber-300/70" : "text-violet-200/65",
                  )}>
                    {isFast ? "Rapid" : "Structured"}
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <SystemProcessVisual system={system.id} />
                </div>

                <div className="h-[52px] shrink-0 border-t border-border/35 pt-2.5">
                  <p className="truncate whitespace-nowrap text-[12px] font-semibold leading-none tracking-tight text-foreground">
                    {isFast ? "Fast · intuitive" : "Slow · analytical"}
                  </p>
                  <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                    <p className={cn(
                      "min-w-0 truncate whitespace-nowrap text-[9px] font-medium leading-none",
                      isFast ? "text-amber-300/75" : "text-violet-200/70",
                    )}>
                      {isFast ? "Detect · react" : "Compare · model · decide"}
                    </p>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-foreground/45 transition-transform",
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
                        "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border bg-card/40 p-3 pr-3.5 text-left transition-colors",
                        isLocked
                          ? "cursor-not-allowed border-border/25"
                          : "border-border/40 hover:border-border/60 hover:bg-card/60",
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
