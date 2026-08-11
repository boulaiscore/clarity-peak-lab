import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThumbDial } from "./ThumbDial";
import { OrbitPlayfield } from "./OrbitPlayfield";
import { OrbitLockResults } from "./OrbitLockResults";
import { Target, Zap, Shield } from "lucide-react";
import { GameExitButton } from "@/components/games/GameExitButton";
import { useSafeTimeout } from "@/hooks/useSafeTimeout";

// ============================================
// TYPES & CONFIGURATION
// ============================================

interface OrbitLockDrillProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (results: OrbitLockFinalResults) => Promise<number>;
  onExit?: () => void;
  onStart?: () => void;
}

export interface OrbitLockFinalResults {
  score: number;
  xpAwarded: number;
  totalTimeInBandPct: number;
  act1TimeInBandPct: number;
  act2TimeInBandPct: number;
  act3TimeInBandPct: number;
  overcorrectionIndex: number;
  dropoutTimePct: number;
  distractionResistanceIndex: number;
  degradationSlope: number;
  isPerfect: boolean;
  difficulty: "easy" | "medium" | "hard";
  actsCount: number;
  qualityScore: number;
  qualityLine?: string;
  bonusApplied: boolean;
}

interface ActConfig {
  duration: number; // seconds
  label: string;
  description: string;
  driftStrength: number;
  pulseFrequency: number; // 0 = none, higher = more frequent
  glintFrequency: number;
  orbitSpeedMult: number;
}

interface DifficultyConfig {
  bandWidth: number; // 0-1 (portion of orbit that is target)
  baseDrift: number;
  distractionIntensity: number;
}

// v1.5: XP imported from centralized config
import { GAME_XP_BY_DIFFICULTY, calculateScoredDrillXP } from "@/lib/trainingPlans";
import { calculateQualityBonus } from "@/lib/gameQualityBonus";

const ACT_CONFIGS: ActConfig[] = [
  { duration: 25, label: "Stabilize", description: "Find your rhythm", driftStrength: 1.0, pulseFrequency: 0, glintFrequency: 0, orbitSpeedMult: 1.0 },
  { duration: 30, label: "Resist", description: "Ignore distractions", driftStrength: 1.3, pulseFrequency: 3, glintFrequency: 2, orbitSpeedMult: 1.0 },
  { duration: 35, label: "Hold", description: "Maintain stability", driftStrength: 1.6, pulseFrequency: 4, glintFrequency: 3, orbitSpeedMult: 1.1 },
];

// Physics units: positions are normalized 0-1 along the orbit (angular).
// baseDrift = drift force magnitude in pos/sec². dialStrength = max dial force in pos/sec² (5–7x drift so the user can always recover).
const DIFFICULTY_CONFIGS: Record<"easy" | "medium" | "hard", DifficultyConfig> = {
  easy: { bandWidth: 0.18, baseDrift: 0.18, distractionIntensity: 0.5 },
  medium: { bandWidth: 0.12, baseDrift: 0.26, distractionIntensity: 1.0 },
  hard: { bandWidth: 0.08, baseDrift: 0.34, distractionIntensity: 1.5 },
};

// Damping rate (per second) and dial authority (max force at full deflection).
const VELOCITY_DAMPING_PER_SEC = 1.4;
const DIAL_FORCE_MAX = 1.6; // pos/sec² at dialValue = 0 or 1

const PERFECT_TIME_IN_BAND_THRESHOLD = 0.85;
const PERFECT_OVERCORRECTION_THRESHOLD = 0.3;

// ============================================
// MAIN COMPONENT
// ============================================

export function OrbitLockDrill({ difficulty, onComplete, onExit, onStart }: OrbitLockDrillProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const scheduleTimeout = useSafeTimeout();
  
  // Game phases
  const [phase, setPhase] = useState<"instruction" | "playing" | "act_complete" | "transition" | "results">("instruction");
  const [currentAct, setCurrentAct] = useState(0); // 0-indexed
  const [actTimeRemaining, setActTimeRemaining] = useState(ACT_CONFIGS[0].duration);
  
  // Core gameplay state — signalOffset is now ANGULAR position 0-1 around the orbit.
  // Band is centered at 0.5 with width = config.bandWidth.
  const [dialValue, setDialValueState] = useState(0.5); // 0-1
  const [signalOffset, setSignalOffset] = useState(0.5);
  const [inBand, setInBand] = useState(true);

  // Distraction state
  const [showPulse, setShowPulse] = useState(false);
  const [showGlint, setShowGlint] = useState(false);

  // Live refs (avoid recreating the game loop on every render)
  const dialValueRef = useRef(0.5);
  const signalPosRef = useRef(0.5);
  const setDialValue = useCallback((v: number) => {
    dialValueRef.current = v;
    setDialValueState(v);
  }, []);

  // Tracking for scoring - use refs to avoid re-renders during gameplay
  const timeInBandPerActRef = useRef<number[]>([0, 0, 0]);
  const totalTimePerActRef = useRef<number[]>([0, 0, 0]);
  const dialChangesRef = useRef<number[]>([]);
  const distractionTimeInBandRef = useRef(0);
  const distractionTotalTimeRef = useRef(0);

  // Only expose state for final results
  const [timeInBandPerAct, setTimeInBandPerAct] = useState<number[]>([0, 0, 0]);
  const [totalTimePerAct, setTotalTimePerAct] = useState<number[]>([0, 0, 0]);
  const [dialChanges, setDialChanges] = useState<number[]>([]);
  const [distractionTimeInBand, setDistractionTimeInBand] = useState(0);
  const [distractionTotalTime, setDistractionTotalTime] = useState(0);
  const [persistedXP, setPersistedXP] = useState<number | null>(null);
  const saveStartedRef = useRef(false);
  const actTimeRemainingRef = useRef(ACT_CONFIGS[0].duration);
  const actCompletionLockedRef = useRef(false);

  const prevDialValue = useRef(0.5);
  const lastUpdateTime = useRef(Date.now());
  const driftDirection = useRef(1);
  const driftVelocity = useRef(0);
  const directionChangeTimer = useRef(0);

  // The completion guard is essential because React may invoke state updater
  // functions more than once in development and consecutive animation frames
  // can otherwise observe the timer at zero before the phase commit lands.
  const handleActComplete = useCallback(() => {
    setPhase("act_complete");

    scheduleTimeout(() => {
      if (currentAct < 2) {
        const nextAct = currentAct + 1;
        setPhase("transition");
        scheduleTimeout(() => {
          const nextDuration = ACT_CONFIGS[nextAct]?.duration ?? 0;
          setCurrentAct(nextAct);
          actTimeRemainingRef.current = nextDuration;
          setActTimeRemaining(nextDuration);
          signalPosRef.current = 0.5;
          setSignalOffset(0.5);
          setDialValue(0.5);
          driftVelocity.current = 0;
          directionChangeTimer.current = 0;
          actCompletionLockedRef.current = false;
          setPhase("playing");
          lastUpdateTime.current = Date.now();
        }, 1500);
      } else {
        setPhase("results");
      }
    }, 300);
  }, [currentAct, scheduleTimeout, setDialValue]);

  // ============================================
  // GAME LOOP — driven by requestAnimationFrame, refs only
  // ============================================

  useEffect(() => {
    if (phase !== "playing") return;

    const actConfig = ACT_CONFIGS[currentAct];
    const distractionForceRef = { current: 0 };
    let raf = 0;

    const tick = () => {
      const now = Date.now();
      const dt = Math.min(0.05, (now - lastUpdateTime.current) / 1000); // cap dt to avoid jumps
      lastUpdateTime.current = now;

      const dialV = dialValueRef.current;

      // 1) Drift direction shifts every ~2s (smoother than per-frame randomness)
      directionChangeTimer.current -= dt;
      if (directionChangeTimer.current <= 0) {
        driftDirection.current = Math.random() > 0.5 ? 1 : -1;
        directionChangeTimer.current = 1.5 + Math.random() * 1.5;
      }

      // 2) Forces in pos/sec²
      const driftForce = driftDirection.current * config.baseDrift * actConfig.driftStrength;
      const dialForce = (dialV - 0.5) * 2 * DIAL_FORCE_MAX; // -DIAL_FORCE_MAX..+DIAL_FORCE_MAX

      // Distractions add a brief impulsive nudge
      let distractionForce = 0;
      if (showPulse) distractionForce += driftDirection.current * config.distractionIntensity * 0.3;
      if (showGlint) distractionForce += -driftDirection.current * config.distractionIntensity * 0.2;

      // 3) Integrate velocity (semi-implicit Euler)
      driftVelocity.current += (driftForce + dialForce + distractionForce) * dt;
      // Apply continuous-time damping
      driftVelocity.current *= Math.exp(-VELOCITY_DAMPING_PER_SEC * dt);

      // 4) Update angular position (wrap into [0,1))
      let nextPos = signalPosRef.current + driftVelocity.current * dt;
      nextPos = ((nextPos % 1) + 1) % 1;
      signalPosRef.current = nextPos;
      setSignalOffset(nextPos);

      // 5) In-band check (angular distance from 0.5, with wrap)
      const rawDist = Math.abs(nextPos - 0.5);
      const distance = Math.min(rawDist, 1 - rawDist);
      const isInBand = distance <= config.bandWidth / 2;
      setInBand(isInBand);

      // 6) Track dial changes for overcorrection
      const dialChange = Math.abs(dialV - prevDialValue.current);
      if (dialChange > 0.01) {
        dialChangesRef.current = [...dialChangesRef.current.slice(-50), dialChange];
      }
      prevDialValue.current = dialV;

      // 7) Time tracking
      totalTimePerActRef.current[currentAct] += dt;
      if (isInBand) timeInBandPerActRef.current[currentAct] += dt;
      if (showPulse || showGlint) {
        distractionTotalTimeRef.current += dt;
        if (isInBand) distractionTimeInBandRef.current += dt;
      }

      // 8) Countdown. Keep completion outside a React state updater: updater
      // functions must be pure and can be replayed by React Strict Mode.
      const nextTime = Math.max(0, actTimeRemainingRef.current - dt);
      actTimeRemainingRef.current = nextTime;
      setActTimeRemaining(nextTime);

      if (nextTime <= 0) {
        if (!actCompletionLockedRef.current) {
          actCompletionLockedRef.current = true;
          setTimeInBandPerAct([...timeInBandPerActRef.current]);
          setTotalTimePerAct([...totalTimePerActRef.current]);
          setDialChanges([...dialChangesRef.current]);
          setDistractionTimeInBand(distractionTimeInBandRef.current);
          setDistractionTotalTime(distractionTotalTimeRef.current);
          handleActComplete();
        }
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    lastUpdateTime.current = Date.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, currentAct, showPulse, showGlint, config.baseDrift, config.bandWidth, config.distractionIntensity, handleActComplete]);
  
  // ============================================
  // DISTRACTION TRIGGERS
  // ============================================
  
  useEffect(() => {
    if (phase !== "playing") return;
    
    const actConfig = ACT_CONFIGS[currentAct];
    
    // Pulse distractions
    if (actConfig.pulseFrequency > 0) {
      const pulseInterval = setInterval(() => {
        if (Math.random() < 0.3 * config.distractionIntensity) {
          setShowPulse(true);
          scheduleTimeout(() => setShowPulse(false), 1000);
        }
      }, (10000 / actConfig.pulseFrequency));
      
      return () => clearInterval(pulseInterval);
    }
  }, [phase, currentAct, config.distractionIntensity, scheduleTimeout]);
  
  useEffect(() => {
    if (phase !== "playing") return;
    
    const actConfig = ACT_CONFIGS[currentAct];
    
    // Glint distractions
    if (actConfig.glintFrequency > 0) {
      const glintInterval = setInterval(() => {
        if (Math.random() < 0.25 * config.distractionIntensity) {
          setShowGlint(true);
          scheduleTimeout(() => setShowGlint(false), 800);
        }
      }, (12000 / actConfig.glintFrequency));
      
      return () => clearInterval(glintInterval);
    }
  }, [phase, currentAct, config.distractionIntensity, scheduleTimeout]);
  
  const handleStart = useCallback(() => {
    onStart?.();
    timeInBandPerActRef.current = [0, 0, 0];
    totalTimePerActRef.current = [0, 0, 0];
    dialChangesRef.current = [];
    distractionTimeInBandRef.current = 0;
    distractionTotalTimeRef.current = 0;
    setTimeInBandPerAct([0, 0, 0]);
    setTotalTimePerAct([0, 0, 0]);
    setDialChanges([]);
    setDistractionTimeInBand(0);
    setDistractionTotalTime(0);
    setPersistedXP(null);
    saveStartedRef.current = false;
    actCompletionLockedRef.current = false;
    setPhase("playing");
    setCurrentAct(0);
    actTimeRemainingRef.current = ACT_CONFIGS[0].duration;
    setActTimeRemaining(ACT_CONFIGS[0].duration);
    signalPosRef.current = 0.5;
    setSignalOffset(0.5);
    setDialValue(0.5);
    driftVelocity.current = 0;
    directionChangeTimer.current = 0;
    lastUpdateTime.current = Date.now();
    driftDirection.current = Math.random() > 0.5 ? 1 : -1;
  }, [onStart, setDialValue]);
  
  // ============================================
  // CALCULATE FINAL RESULTS
  // ============================================
  
  const finalResults = useMemo((): OrbitLockFinalResults | null => {
    if (phase !== "results") return null;
    
    const act1Pct = totalTimePerAct[0] > 0 ? timeInBandPerAct[0] / totalTimePerAct[0] : 0;
    const act2Pct = totalTimePerAct[1] > 0 ? timeInBandPerAct[1] / totalTimePerAct[1] : 0;
    const act3Pct = totalTimePerAct[2] > 0 ? timeInBandPerAct[2] / totalTimePerAct[2] : 0;
    
    const totalTimeInBand = timeInBandPerAct.reduce((a, b) => a + b, 0);
    const totalTime = totalTimePerAct.reduce((a, b) => a + b, 0);
    const totalTimeInBandPct = totalTime > 0 ? totalTimeInBand / totalTime : 0;
    
    // Overcorrection: average dial change magnitude (high = oscillating)
    const avgDialChange = dialChanges.length > 0 
      ? dialChanges.reduce((a, b) => a + b, 0) / dialChanges.length 
      : 0;
    const overcorrectionIndex = Math.min(1, avgDialChange * 10);
    
    // Dropout time
    const dropoutTimePct = 1 - totalTimeInBandPct;
    
    // Distraction resistance (how well user maintains band during distractions)
    const baselineTimeInBand = totalTimeInBandPct;
    const distractionPct = distractionTotalTime > 0 
      ? distractionTimeInBand / distractionTotalTime 
      : baselineTimeInBand;
    const distractionResistanceIndex = distractionTotalTime > 0
      ? Math.min(1, distractionPct / Math.max(0.1, baselineTimeInBand))
      : 1;
    
    // Degradation slope (Act 1 vs Act 3 performance)
    const degradationSlope = act1Pct > 0 ? (act3Pct - act1Pct) / act1Pct : 0;
    
    // Score (0-100)
    const score = Math.round(
      totalTimeInBandPct * 60 + // 60% weight on time in band
      (1 - overcorrectionIndex) * 25 + // 25% weight on smooth control
      distractionResistanceIndex * 15 // 15% weight on distraction resistance
    );
    
    // XP calculation - v1.5: Using centralized XP
    const isPerfect = totalTimeInBandPct >= PERFECT_TIME_IN_BAND_THRESHOLD 
      && overcorrectionIndex < PERFECT_OVERCORRECTION_THRESHOLD
      && act3Pct >= act1Pct * 0.8; // No major degradation
    const baseXP = calculateScoredDrillXP(difficulty, score, isPerfect);
    const quality = calculateQualityBonus("S1-AE", baseXP, {
      hitRate: totalTimeInBandPct,
      falseAlarmRate: dropoutTimePct,
      rtVariability: overcorrectionIndex * 150,
      degradationSlope,
    }, difficulty);
    
    return {
      score,
      xpAwarded: quality.totalXP,
      totalTimeInBandPct: Math.round(totalTimeInBandPct * 100),
      act1TimeInBandPct: Math.round(act1Pct * 100),
      act2TimeInBandPct: Math.round(act2Pct * 100),
      act3TimeInBandPct: Math.round(act3Pct * 100),
      overcorrectionIndex: Math.round(overcorrectionIndex * 100) / 100,
      dropoutTimePct: Math.round(dropoutTimePct * 100),
      distractionResistanceIndex: Math.round(distractionResistanceIndex * 100) / 100,
      degradationSlope: Math.round(degradationSlope * 100) / 100,
      isPerfect,
      difficulty,
      actsCount: 3,
      qualityScore: quality.qualityScore,
      qualityLine: quality.qualityLine,
      bonusApplied: quality.bonus > 0,
    };
  }, [phase, timeInBandPerAct, totalTimePerAct, dialChanges, distractionTimeInBand, distractionTotalTime, difficulty]);

  useEffect(() => {
    if (phase !== "results" || !finalResults || saveStartedRef.current) return;
    saveStartedRef.current = true;
    void onComplete(finalResults).then(setPersistedXP).catch(() => setPersistedXP(0));
  }, [finalResults, onComplete, phase]);
  
  // ============================================
  // RENDER
  // ============================================
  
  const actConfig = ACT_CONFIGS[currentAct] || ACT_CONFIGS[0];
  const actProgress = actConfig.duration > 0 
    ? 1 - (actTimeRemaining / actConfig.duration) 
    : 0;
  
  // Instruction screen
  if (phase === "instruction") {
    return (
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        {onExit && <GameExitButton onExit={onExit} />}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-sm"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/30 flex items-center justify-center">
            <Target className="w-8 h-8 text-cyan-400" />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Orbit Lock</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Keep the signal inside the target band as the orbit drifts. Use small, deliberate corrections.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-muted/30 rounded-xl p-4 text-left space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">How it works</h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>A <span className="text-cyan-400">constant drift</span> moves the signal away from the target band</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Use the <span className="text-foreground font-medium">control</span>: <span className="text-cyan-400">◀ ANTI</span> moves counter-clockwise, <span className="text-cyan-400">PRO ▶</span> clockwise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>Larger movements apply more <span className="text-foreground font-medium">force</span>. Aim for steady balance.</span>
              </li>
            </ul>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
              <span>In band</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-400 shadow-lg shadow-orange-400/50" />
              <span>Out of band</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            {ACT_CONFIGS.map((act, i) => (
              <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/50">
                <div className="font-medium text-foreground">Act {i + 1}</div>
                <div className="text-muted-foreground">{act.label}</div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleStart}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Start Drill
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Results screen
  if (phase === "results" && finalResults) {
    if (persistedXP === null) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center text-sm text-muted-foreground">
          Saving session…
        </div>
      );
    }
    return (
      <div className="relative">
        {onExit && <GameExitButton onExit={onExit} />}
        <OrbitLockResults
          results={{ ...finalResults, xpAwarded: persistedXP }}
          onContinue={() => onExit?.()}
        />
      </div>
    );
  }
  
  // Act complete overlay
  if (phase === "act_complete") {
    return (
      <div className="relative min-h-[70vh] flex items-center justify-center">
        {onExit && <GameExitButton onExit={onExit} />}
        <motion.div
          initial={false}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-lg font-semibold text-cyan-400 mb-1">ACT COMPLETE</div>
          <div className="text-sm text-muted-foreground">{actConfig.label}</div>
        </motion.div>
      </div>
    );
  }
  
  // Transition screen
  if (phase === "transition") {
    const nextAct = ACT_CONFIGS[currentAct + 1];
    return (
      <div className="relative min-h-[70vh] flex items-center justify-center">
        {onExit && <GameExitButton onExit={onExit} />}
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          className="text-center space-y-2"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Next</div>
          <div className="text-lg font-semibold text-foreground">Act {currentAct + 2}: {nextAct?.label}</div>
          <div className="text-sm text-muted-foreground">{nextAct?.description}</div>
        </motion.div>
      </div>
    );
  }
  
  // Playing state
  return (
    <div className="min-h-[70vh] flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-white/5 overflow-hidden relative">
      {/* Exit button */}
      {onExit && <GameExitButton onExit={onExit} />}
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="text-xs">
          <span className="text-muted-foreground">Act {currentAct + 1}/3</span>
          <span className="text-cyan-400/70 ml-2">• {actConfig.label}</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {Math.ceil(actTimeRemaining)}s
        </div>
      </div>
      
      {/* Progress bar across acts */}
      <div className="h-1 bg-white/5 flex">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 relative">
            {i < currentAct && (
              <div className="absolute inset-0 bg-cyan-400" />
            )}
            {i === currentAct && (
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-violet-400"
                style={{ width: `${actProgress * 100}%` }}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Main playfield + dial layout - vertical on mobile, horizontal on desktop */}
      <div className="flex-1 flex items-center justify-center px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Orbit Playfield */}
          <OrbitPlayfield
            signalPosition={signalOffset}
            bandStart={0.5 - config.bandWidth / 2}
            bandEnd={0.5 + config.bandWidth / 2}
            inBand={inBand}
            showPulse={showPulse}
            showGlint={showGlint}
            actProgress={actProgress}
            currentAct={currentAct + 1}
            orbitSpeedMultiplier={actConfig.orbitSpeedMult}
          />
          
          {/* Thumb Dial - native horizontal on mobile, vertical on desktop */}
          <div className="sm:ml-2">
            <ThumbDial
              value={dialValue}
              onChange={setDialValue}
            />
          </div>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-center gap-6 px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full transition-colors",
            inBand ? "bg-cyan-400" : "bg-orange-400"
          )} />
          <span className="text-xs text-muted-foreground">
            {inBand ? "Locked" : "Drifting"}
          </span>
        </div>
        
        {(showPulse || showGlint) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-violet-400"
          >
            <Zap className="w-3 h-3" />
            <span>Distraction</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
