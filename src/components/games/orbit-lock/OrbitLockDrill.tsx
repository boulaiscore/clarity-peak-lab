import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThumbDial } from "./ThumbDial";
import { OrbitPlayfield } from "./OrbitPlayfield";
import { OrbitLockResults } from "./OrbitLockResults";
import { Target, Zap, Shield } from "lucide-react";
import { GameExitButton } from "@/components/games/GameExitButton";

// ============================================
// TYPES & CONFIGURATION
// ============================================

interface OrbitLockDrillProps {
  difficulty: "easy" | "medium" | "hard";
  onComplete: (results: OrbitLockFinalResults) => void;
  onExit?: () => void;
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
import { GAME_XP_BY_DIFFICULTY, calculateGameXP } from "@/lib/trainingPlans";

const ACT_CONFIGS: ActConfig[] = [
  { duration: 25, label: "Stabilize", description: "Find your rhythm", driftStrength: 1.0, pulseFrequency: 0, glintFrequency: 0, orbitSpeedMult: 1.0 },
  { duration: 30, label: "Resist", description: "Ignore distractions", driftStrength: 1.2, pulseFrequency: 3, glintFrequency: 2, orbitSpeedMult: 1.0 },
  { duration: 35, label: "Hold", description: "Maintain stability", driftStrength: 1.4, pulseFrequency: 4, glintFrequency: 3, orbitSpeedMult: 1.1 },
];

const DIFFICULTY_CONFIGS: Record<"easy" | "medium" | "hard", DifficultyConfig> = {
  easy: { bandWidth: 0.18, baseDrift: 0.008, distractionIntensity: 0.5 },
  medium: { bandWidth: 0.12, baseDrift: 0.012, distractionIntensity: 1.0 },
  hard: { bandWidth: 0.08, baseDrift: 0.016, distractionIntensity: 1.5 },
};

const PERFECT_TIME_IN_BAND_THRESHOLD = 0.85;
const PERFECT_OVERCORRECTION_THRESHOLD = 0.3;

// ============================================
// MAIN COMPONENT
// ============================================

export function OrbitLockDrill({ difficulty, onComplete, onExit }: OrbitLockDrillProps) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  // Game phases
  const [phase, setPhase] = useState<"instruction" | "playing" | "act_complete" | "transition" | "results">("instruction");
  const [currentAct, setCurrentAct] = useState(0); // 0-indexed
  const [actTimeRemaining, setActTimeRemaining] = useState(ACT_CONFIGS[0].duration);
  
  // Core gameplay state
  const [dialValue, setDialValue] = useState(0.5); // 0-1, center at 0.5
  const [signalOffset, setSignalOffset] = useState(0.5); // Position relative to band (0.5 = center)
  const [inBand, setInBand] = useState(true);
  
  // Distraction state
  const [showPulse, setShowPulse] = useState(false);
  const [showGlint, setShowGlint] = useState(false);
  
  // Tracking for scoring - use refs to avoid re-renders during gameplay
  const timeInBandPerActRef = useRef<number[]>([0, 0, 0]);
  const totalTimePerActRef = useRef<number[]>([0, 0, 0]);
  const dialChangesRef = useRef<number[]>([]); // For overcorrection calc
  const distractionTimeInBandRef = useRef(0);
  const distractionTotalTimeRef = useRef(0);
  
  // Only expose state for final results
  const [timeInBandPerAct, setTimeInBandPerAct] = useState<number[]>([0, 0, 0]);
  const [totalTimePerAct, setTotalTimePerAct] = useState<number[]>([0, 0, 0]);
  const [dialChanges, setDialChanges] = useState<number[]>([]);
  const [distractionTimeInBand, setDistractionTimeInBand] = useState(0);
  const [distractionTotalTime, setDistractionTotalTime] = useState(0);
  
  const prevDialValue = useRef(dialValue);
  const lastUpdateTime = useRef(Date.now());
  const driftDirection = useRef(1);
  const driftVelocity = useRef(0);
  
  // ============================================
  // GAME LOOP
  // ============================================
  
  useEffect(() => {
    if (phase !== "playing") return;
    
    const actConfig = ACT_CONFIGS[currentAct];
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastUpdateTime.current) / 1000;
      lastUpdateTime.current = now;
      
      // Apply drift
      const driftForce = config.baseDrift * actConfig.driftStrength;
      
      // Random drift direction changes
      if (Math.random() < 0.02) {
        driftDirection.current *= -1;
      }
      
      // Natural drift with some inertia
      driftVelocity.current += driftDirection.current * driftForce * dt;
      driftVelocity.current *= 0.98; // Damping
      
      // Apply dial correction force (opposite direction)
      const dialCorrection = (dialValue - 0.5) * 0.05;
      driftVelocity.current -= dialCorrection;
      
      // Update signal position (this one needs to be state for rendering)
      setSignalOffset(prev => {
        const newPos = prev + driftVelocity.current;
        return Math.max(0, Math.min(1, newPos));
      });
      
      // Check if in band
      const bandHalf = config.bandWidth / 2;
      const distanceFromCenter = Math.abs(signalOffset - 0.5);
      const isInBand = distanceFromCenter <= bandHalf;
      setInBand(isInBand);
      
      // Track dial changes for overcorrection (use ref, no re-render)
      const dialChange = Math.abs(dialValue - prevDialValue.current);
      if (dialChange > 0.01) {
        dialChangesRef.current = [...dialChangesRef.current.slice(-50), dialChange];
      }
      prevDialValue.current = dialValue;
      
      // Update time tracking (use refs, no re-render during gameplay)
      totalTimePerActRef.current[currentAct] += dt;
      
      if (isInBand) {
        timeInBandPerActRef.current[currentAct] += dt;
      }
      
      // Track distraction performance (use refs)
      if (showPulse || showGlint) {
        distractionTotalTimeRef.current += dt;
        if (isInBand) {
          distractionTimeInBandRef.current += dt;
        }
      }
      
      // Timer countdown - still need state for UI display
      setActTimeRemaining(prev => {
        if (prev <= dt) {
          // Act complete - sync refs to state for results calculation
          setTimeInBandPerAct([...timeInBandPerActRef.current]);
          setTotalTimePerAct([...totalTimePerActRef.current]);
          setDialChanges([...dialChangesRef.current]);
          setDistractionTimeInBand(distractionTimeInBandRef.current);
          setDistractionTotalTime(distractionTotalTimeRef.current);
          handleActComplete();
          return 0;
        }
        return prev - dt;
      });
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [phase, currentAct, dialValue, signalOffset, config, showPulse, showGlint]);
  
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
          setTimeout(() => setShowPulse(false), 1000);
        }
      }, (10000 / actConfig.pulseFrequency));
      
      return () => clearInterval(pulseInterval);
    }
  }, [phase, currentAct, config.distractionIntensity]);
  
  useEffect(() => {
    if (phase !== "playing") return;
    
    const actConfig = ACT_CONFIGS[currentAct];
    
    // Glint distractions
    if (actConfig.glintFrequency > 0) {
      const glintInterval = setInterval(() => {
        if (Math.random() < 0.25 * config.distractionIntensity) {
          setShowGlint(true);
          setTimeout(() => setShowGlint(false), 800);
        }
      }, (12000 / actConfig.glintFrequency));
      
      return () => clearInterval(glintInterval);
    }
  }, [phase, currentAct, config.distractionIntensity]);
  
  // ============================================
  // ACT TRANSITIONS
  // ============================================
  
  const handleActComplete = useCallback(() => {
    setPhase("act_complete");
    
    // Brief freeze, then transition
    setTimeout(() => {
      if (currentAct < 2) {
        setPhase("transition");
        setTimeout(() => {
          setCurrentAct(prev => prev + 1);
          setActTimeRemaining(ACT_CONFIGS[currentAct + 1]?.duration || 0);
          setSignalOffset(0.5);
          setDialValue(0.5);
          driftVelocity.current = 0;
          setPhase("playing");
          lastUpdateTime.current = Date.now();
        }, 1500);
      } else {
        // Session complete
        setPhase("results");
      }
    }, 300);
  }, [currentAct]);
  
  const handleStart = useCallback(() => {
    setPhase("playing");
    setCurrentAct(0);
    setActTimeRemaining(ACT_CONFIGS[0].duration);
    setSignalOffset(0.5);
    setDialValue(0.5);
    lastUpdateTime.current = Date.now();
    driftDirection.current = Math.random() > 0.5 ? 1 : -1;
  }, []);
  
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
    const xpAwarded = calculateGameXP(difficulty, isPerfect);
    
    return {
      score,
      xpAwarded,
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
    };
  }, [phase, timeInBandPerAct, totalTimePerAct, dialChanges, distractionTimeInBand, distractionTotalTime, difficulty]);
  
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
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
              Un pallino luminoso orbita attorno al nucleo. Il tuo obiettivo è mantenerlo nella banda target (zona evidenziata).
            </p>
          </div>
          
          {/* How to play */}
          <div className="bg-muted/30 rounded-xl p-4 text-left space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Come giocare</h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>Il segnale <span className="text-cyan-400">deriva naturalmente</span> dall'orbita</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Usa la <span className="text-foreground font-medium">rotella a destra</span> per contrastare la deriva</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>Movimenti <span className="text-foreground font-medium">piccoli e fluidi</span> funzionano meglio!</span>
              </li>
            </ul>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
              <span>In banda</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-400 shadow-lg shadow-orange-400/50" />
              <span>Fuori banda</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            {ACT_CONFIGS.map((act, i) => (
              <div key={i} className="p-2 rounded-lg bg-muted/30 border border-border/50">
                <div className="font-medium text-foreground">Fase {i + 1}</div>
                <div className="text-muted-foreground">{act.label}</div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleStart}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Inizia Sessione
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Results screen
  if (phase === "results" && finalResults) {
    return (
      <OrbitLockResults 
        results={finalResults} 
        onContinue={() => onComplete(finalResults)} 
      />
    );
  }
  
  // Act complete overlay
  if (phase === "act_complete") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
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
      <div className="min-h-[70vh] flex items-center justify-center">
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
