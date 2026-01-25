/**
 * ============================================
 * SIGNAL VS NOISE - DRILL COMPONENT
 * ============================================
 * 
 * S2 Insight game: detect the causal signal
 * hidden in messy, incomplete data.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X } from "lucide-react";
import { GameExitButton } from "@/components/games/GameExitButton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SignalCase,
  Difficulty,
  DIFFICULTY_CONFIG,
  generateSession,
} from "./signalVsNoiseContent";

// ============================================
// CONSTANTS
// ============================================

const EASE_PREMIUM: [number, number, number, number] = [0.4, 0, 0.2, 1];

function safeHaptic(type: "light" | "medium" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(type === "light" ? 10 : 20);
  }
}

// ============================================
// TYPES
// ============================================

export interface CaseResult {
  caseIndex: number;
  caseId: string;
  domain: string;
  outcomeLabel: string;
  outcomeSeries: number[];
  drivers: SignalCase["drivers"];
  correctDriver: "A" | "B" | "C";
  chosenDriver: "A" | "B" | "C" | null;
  correctWhyId: string;
  chosenWhyId: string | null;
  isDriverCorrect: boolean;
  isWhyCorrect: boolean;
  confidencePct: number;
  responseTimeMs: number;
  timeoutFlag: boolean;
  contextTags: string[];
  // Robustness
  isRobustnessCase: boolean;
  robustnessAnswer: "YES" | "NO" | null;
  robustnessCorrect: boolean | null;
  insightCue: string;
}

export interface SessionMetrics {
  signalDetectionPct: number;
  explanationQualityScore: number;
  robustnessThinkingScore: number;
  calibrationScore: number;
  s2Consistency: number;
  sessionScore: number;
  meanRT: number;
  timeouts: number;
}

interface SignalVsNoiseDrillProps {
  difficulty: Difficulty;
  onComplete: (results: CaseResult[], metrics: SessionMetrics) => void;
  onExit?: () => void;
}

// ============================================
// SPARKLINE COMPONENT
// ============================================

function Sparkline({ 
  data, 
  color = "hsl(var(--primary))",
  height = 32,
  width = 80,
  animate = true 
}: { 
  data: number[]; 
  color?: string;
  height?: number;
  width?: number;
  animate?: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  
  const path = useMemo(() => {
    if (data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const effectiveHeight = height - padding * 2;
    const effectiveWidth = width - padding * 2;
    
    const points = data.map((v, i) => {
      const x = padding + (i / (data.length - 1)) * effectiveWidth;
      const y = padding + effectiveHeight - ((v - min) / range) * effectiveHeight;
      return `${x},${y}`;
    });
    
    return `M${points.join(" L")}`;
  }, [data, height, width]);
  
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [path]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { strokeDashoffset: pathLength, strokeDasharray: pathLength } : {}}
        animate={animate ? { strokeDashoffset: 0, strokeDasharray: pathLength } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

// ============================================
// TIMER RING COMPONENT
// ============================================

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const progress = remaining / total;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  
  return (
    <div className="relative w-9 h-9 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="2"
          opacity={0.3}
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={progress > 0.25 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute text-[9px] font-medium text-muted-foreground">
        {remaining}s
      </span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SignalVsNoiseDrill({ difficulty, onComplete, onExit }: SignalVsNoiseDrillProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [cases] = useState(() => generateSession(difficulty));
  const [currentCase, setCurrentCase] = useState(0);
  const [results, setResults] = useState<CaseResult[]>([]);
  
  // Round state
  const [phase, setPhase] = useState<"playing" | "robustness" | "confidence" | "feedback" | "complete">("playing");
  const [selectedDriver, setSelectedDriver] = useState<"A" | "B" | "C" | null>(null);
  const [selectedWhy, setSelectedWhy] = useState<string | null>(null);
  const [robustnessAnswer, setRobustnessAnswer] = useState<"YES" | "NO" | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [feedbackState, setFeedbackState] = useState<"correct" | "partial" | "missed" | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(config.timePerCase);
  
  const roundStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    roundStartRef.current = Date.now();
    setTimeRemaining(config.timePerCase);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentCase, phase]);

  const currentCaseData = cases[currentCase];

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    safeHaptic("light");
    
    const result = buildResult(null, null, null, true);
    setResults(prev => [...prev, result]);
    setFeedbackState("missed");
    setPhase("feedback");
    
    setTimeout(() => proceedToNextCase(), 1200);
  };

  const handleDriverSelect = (driver: "A" | "B" | "C") => {
    safeHaptic("light");
    setSelectedDriver(driver);
  };

  const handleWhySelect = (whyId: string) => {
    safeHaptic("light");
    setSelectedWhy(whyId);
    
    // If robustness case, go to robustness phase
    if (currentCaseData.isRobustnessCase) {
      setPhase("robustness");
    } else {
      setPhase("confidence");
    }
  };

  const handleRobustnessSelect = (answer: "YES" | "NO") => {
    safeHaptic("light");
    setRobustnessAnswer(answer);
    setPhase("confidence");
  };

  const handleConfidenceSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    safeHaptic("light");
    
    const responseTime = Date.now() - roundStartRef.current;
    const isDriverCorrect = selectedDriver === currentCaseData.correctDriver;
    const isWhyCorrect = selectedWhy === currentCaseData.correctWhyId;
    
    const result = buildResult(selectedDriver, selectedWhy, robustnessAnswer, false, responseTime);
    setResults(prev => [...prev, result]);
    
    if (isDriverCorrect && isWhyCorrect) {
      setFeedbackState("correct");
    } else if (isDriverCorrect) {
      setFeedbackState("partial");
    } else {
      setFeedbackState("missed");
    }
    
    setPhase("feedback");
    setTimeout(() => proceedToNextCase(), 1200);
  };

  const handleChangeChoice = () => {
    setPhase("playing");
    setSelectedDriver(null);
    setSelectedWhy(null);
    setRobustnessAnswer(null);
  };

  const buildResult = (
    driver: "A" | "B" | "C" | null,
    whyId: string | null,
    robAnswer: "YES" | "NO" | null,
    timeout: boolean,
    responseTime?: number
  ): CaseResult => {
    const isDriverCorrect = driver === currentCaseData.correctDriver;
    const isWhyCorrect = whyId === currentCaseData.correctWhyId;
    const robustnessCorrect = currentCaseData.isRobustnessCase && robAnswer !== null
      ? robAnswer === currentCaseData.robustnessCorrectAnswer
      : null;

    return {
      caseIndex: currentCase + 1,
      caseId: currentCaseData.id,
      domain: currentCaseData.domain,
      outcomeLabel: currentCaseData.outcomeLabel,
      outcomeSeries: currentCaseData.outcomeSeries,
      drivers: currentCaseData.drivers,
      correctDriver: currentCaseData.correctDriver,
      chosenDriver: driver,
      correctWhyId: currentCaseData.correctWhyId,
      chosenWhyId: whyId,
      isDriverCorrect: timeout ? false : isDriverCorrect,
      isWhyCorrect: timeout ? false : isWhyCorrect,
      confidencePct: timeout ? 0 : confidence,
      responseTimeMs: timeout ? config.timePerCase * 1000 : (responseTime || 0),
      timeoutFlag: timeout,
      contextTags: currentCaseData.contextTags,
      isRobustnessCase: currentCaseData.isRobustnessCase,
      robustnessAnswer: robAnswer,
      robustnessCorrect,
      insightCue: currentCaseData.insightCue,
    };
  };

  const proceedToNextCase = () => {
    if (currentCase + 1 >= cases.length) {
      const metrics = calculateMetrics(results.concat(results.length === currentCase ? [] : []));
      setPhase("complete");
      setTimeout(() => onComplete(results, metrics), 300);
    } else {
      setCurrentCase(prev => prev + 1);
      setSelectedDriver(null);
      setSelectedWhy(null);
      setRobustnessAnswer(null);
      setConfidence(50);
      setFeedbackState(null);
      setPhase("playing");
    }
  };

  const calculateMetrics = (allResults: CaseResult[]): SessionMetrics => {
    const finalResults = allResults.length > 0 ? allResults : results;
    const total = finalResults.length || 1;
    
    // 1) Signal Detection
    const driverCorrect = finalResults.filter(r => r.isDriverCorrect).length;
    const signalDetectionPct = Math.round((driverCorrect / total) * 100);
    
    // 2) Explanation Quality
    let totalPoints = 0;
    finalResults.forEach(r => {
      if (r.isDriverCorrect && r.isWhyCorrect) totalPoints += 1.0;
      else if (r.isDriverCorrect && !r.isWhyCorrect) totalPoints += 0.6;
      else if (!r.isDriverCorrect && r.isWhyCorrect) totalPoints += 0.3;
    });
    const explanationQualityScore = Math.round((totalPoints / total) * 100);
    
    // 3) Robustness Thinking
    const robustnessCases = finalResults.filter(r => r.isRobustnessCase);
    const robustnessCorrect = robustnessCases.filter(r => r.robustnessCorrect === true).length;
    const robustnessThinkingScore = robustnessCases.length > 0
      ? Math.round((robustnessCorrect / robustnessCases.length) * 100)
      : 75; // Default if no robustness cases
    
    // 4) Calibration (Brier-based)
    let brierSum = 0;
    finalResults.forEach(r => {
      const p = r.confidencePct / 100;
      const y = r.isDriverCorrect ? 1 : 0;
      brierSum += Math.pow(p - y, 2);
    });
    const brierAvg = brierSum / total;
    const calibrationScore = Math.round(Math.max(0, Math.min(100, 100 * (1 - brierAvg))));
    
    // 5) S2 Consistency
    const validRTs = finalResults.filter(r => !r.timeoutFlag).map(r => r.responseTimeMs);
    const meanRT = validRTs.length > 0 ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length : 5000;
    const sdRT = validRTs.length > 1
      ? Math.sqrt(validRTs.reduce((sum, rt) => sum + Math.pow(rt - meanRT, 2), 0) / validRTs.length)
      : 0;
    const rtCV = sdRT / Math.max(meanRT, 1);
    const stabilityScore = Math.round(100 * (1 - Math.min(1, rtCV / 0.60)));
    
    // Block steadiness
    const blockSize = Math.ceil(total / 3);
    const blocks = [
      finalResults.slice(0, blockSize),
      finalResults.slice(blockSize, blockSize * 2),
      finalResults.slice(blockSize * 2),
    ].filter(b => b.length > 0);
    
    const blockAccs = blocks.map(b => b.filter(r => r.isDriverCorrect).length / b.length);
    const accMean = blockAccs.reduce((a, b) => a + b, 0) / blockAccs.length;
    const accSD = Math.sqrt(blockAccs.reduce((sum, acc) => sum + Math.pow(acc - accMean, 2), 0) / blockAccs.length);
    const steadinessScore = Math.round(100 * (1 - Math.min(1, accSD / 0.25)));
    
    const s2Consistency = Math.round(0.70 * stabilityScore + 0.30 * steadinessScore);
    
    // 6) Session Score
    const sessionScore = Math.round(
      0.45 * signalDetectionPct +
      0.35 * explanationQualityScore +
      0.20 * robustnessThinkingScore
    );
    
    return {
      signalDetectionPct,
      explanationQualityScore,
      robustnessThinkingScore,
      calibrationScore,
      s2Consistency,
      sessionScore,
      meanRT,
      timeouts: finalResults.filter(r => r.timeoutFlag).length,
    };
  };

  if (phase === "complete") {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      />
    );
  }

  const getTrendLabel = (series: number[]) => {
    const first = series[0];
    const last = series[series.length - 1];
    const diff = last - first;
    if (diff > 10) return "Rising";
    if (diff < -10) return "Falling";
    return "Flat";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="min-h-screen bg-background p-4 pb-24 relative"
    >
      {/* Exit button - offset to avoid timer overlap */}
      {onExit && <GameExitButton onExit={onExit} className="right-14" />}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold">Signal vs Noise</h1>
            <p className="text-[10px] text-muted-foreground">
              Case {currentCase + 1} of {cases.length}
            </p>
          </div>
        </div>
        <TimerRing remaining={timeRemaining} total={config.timePerCase} />
      </div>

      {/* Progress */}
      <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentCase) / cases.length) * 100}%` }}
          transition={{ duration: 0.28 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentCase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.24, ease: EASE_PREMIUM }}
        >
          {/* Context Tags */}
          <div className="flex gap-2 mb-4">
            {currentCaseData.contextTags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-muted/50 rounded-full text-[9px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Outcome Card */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-border/50 bg-card mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                Outcome
              </span>
              <span className="text-[9px] text-muted-foreground">
                {getTrendLabel(currentCaseData.outcomeSeries)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{currentCaseData.outcomeLabel}</span>
              <Sparkline 
                data={currentCaseData.outcomeSeries} 
                color="hsl(var(--primary))"
                width={100}
                height={36}
              />
            </div>
          </motion.div>

          {/* Drivers Card */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-border/50 bg-card mb-4"
          >
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3 block">
              Candidate Drivers
            </span>
            <div className="space-y-2">
              {(["A", "B", "C"] as const).map((key, i) => {
                const driver = currentCaseData.drivers[key];
                const isSelected = selectedDriver === key;
                const isCorrect = key === currentCaseData.correctDriver;
                const showFeedback = phase === "feedback";
                
                return (
                  <motion.button
                    key={key}
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => phase === "playing" && handleDriverSelect(key)}
                    disabled={phase !== "playing"}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                      isSelected && !showFeedback && "border-primary bg-primary/10",
                      !isSelected && "border-border/30 bg-muted/20",
                      showFeedback && isSelected && feedbackState === "correct" && "border-emerald-500/50 bg-emerald-500/10",
                      showFeedback && isSelected && feedbackState === "partial" && "border-amber-500/50 bg-amber-500/10",
                      showFeedback && isSelected && feedbackState === "missed" && "border-muted bg-muted/30",
                      showFeedback && isCorrect && !isSelected && "border-emerald-500/30",
                      phase === "playing" && "hover:border-primary/50 active:scale-[0.99]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {key}
                      </span>
                      <span className="text-xs">{driver.label}</span>
                    </div>
                    <Sparkline 
                      data={driver.series}
                      color={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                      width={60}
                      height={24}
                      animate={false}
                    />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Why Section */}
          {selectedDriver && phase === "playing" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className="p-4 rounded-xl border border-border/50 bg-card"
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3 block">
                Why is this the driver?
              </span>
              <div className="space-y-2">
                {currentCaseData.whyOptions.map((opt, i) => (
                  <motion.button
                    key={opt.id}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleWhySelect(opt.id)}
                    className={cn(
                      "w-full p-3 text-left rounded-lg border transition-all text-xs",
                      selectedWhy === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border/30 bg-muted/20 hover:border-primary/40"
                    )}
                  >
                    {opt.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Feedback overlay */}
          {phase === "feedback" && feedbackState && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-4 p-3 rounded-lg text-center text-xs",
                feedbackState === "correct" && "bg-emerald-500/10 text-emerald-400",
                feedbackState === "partial" && "bg-amber-500/10 text-amber-400",
                feedbackState === "missed" && "bg-muted text-muted-foreground"
              )}
            >
              {feedbackState === "correct" && "Correct signal identified."}
              {feedbackState === "partial" && "Right driver, but explanation could be stronger."}
              {feedbackState === "missed" && "Not the primary driver."}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Robustness Sheet */}
      <Sheet open={phase === "robustness"} onOpenChange={() => {}}>
        <SheetContent side="bottom" className="rounded-t-2xl [&>button]:hidden">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-sm">Robustness Check</SheetTitle>
          </SheetHeader>
          <p className="text-xs text-muted-foreground mb-4">
            If you removed one noisy datapoint, would your choice still hold?
          </p>
          <div className="flex gap-3 mb-4">
            <Button
              variant={robustnessAnswer === "YES" ? "default" : "outline"}
              onClick={() => handleRobustnessSelect("YES")}
              className="flex-1"
            >
              Yes
            </Button>
            <Button
              variant={robustnessAnswer === "NO" ? "default" : "outline"}
              onClick={() => handleRobustnessSelect("NO")}
              className="flex-1"
            >
              No
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confidence Sheet */}
      <Sheet open={phase === "confidence"} onOpenChange={() => {}}>
        <SheetContent side="bottom" className="rounded-t-2xl [&>button]:hidden">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-sm">How confident are you?</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Unsure</span>
                <span className="font-medium text-foreground">{confidence}%</span>
                <span>Certain</span>
              </div>
              <Slider
                value={[confidence]}
                onValueChange={(v) => setConfidence(v[0])}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[8px] text-muted-foreground/50">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleChangeChoice}
                className="flex-1"
              >
                Change Choice
              </Button>
              <Button
                onClick={handleConfidenceSubmit}
                className="flex-1"
              >
                Submit
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
