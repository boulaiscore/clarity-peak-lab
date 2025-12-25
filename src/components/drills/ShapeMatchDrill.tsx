// Shape Match Drill - Tap when two consecutive shapes are identical
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ShapeMatchDrillProps {
  config: {
    shapes?: string[];
    displayTime?: number;
    totalTrials?: number;
    matchProbability?: number;
  };
  timeLimit: number;
  onComplete: (result: { correct: number; total: number; avgReactionTime: number }) => void;
}

const SHAPE_RENDERS: Record<string, (size: number, color: string) => JSX.Element> = {
  circle: (size, color) => (
    <div className="rounded-full shadow-lg" style={{ width: size, height: size, backgroundColor: color }} />
  ),
  square: (size, color) => (
    <div className="rounded-md shadow-lg" style={{ width: size, height: size, backgroundColor: color }} />
  ),
  triangle: (size, color) => (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,10 90,90 10,90" fill={color} />
    </svg>
  ),
  diamond: (size, color) => (
    <div className="shadow-lg" style={{
      width: size * 0.7, height: size * 0.7, backgroundColor: color,
      transform: "rotate(45deg)"
    }} />
  ),
  hexagon: (size, color) => (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill={color} />
    </svg>
  ),
  pentagon: (size, color) => (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 97,38 79,92 21,92 3,38" fill={color} />
    </svg>
  ),
};

const COLORS = ["#6C5CE7", "#00B894", "#E17055", "#FDCB6E", "#74B9FF", "#A29BFE"];

export function ShapeMatchDrill({ config, timeLimit, onComplete }: ShapeMatchDrillProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'complete'>('intro');
  const [currentShape, setCurrentShape] = useState<{ shape: string; color: string } | null>(null);
  const [previousShape, setPreviousShape] = useState<{ shape: string; color: string } | null>(null);
  const [trial, setTrial] = useState(0);
  const [canRespond, setCanRespond] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [shapeShownAt, setShapeShownAt] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isMatch, setIsMatch] = useState(false);
  const [streak, setStreak] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);

  const shapes = config?.shapes || ["circle", "square", "triangle", "diamond", "hexagon", "pentagon"];
  const displayTime = config?.displayTime || 2500; // Increased from 1200ms to 2500ms
  const totalTrials = config?.totalTrials || 12;
  const matchProb = config?.matchProbability || 0.35;

  // Pre-generate the entire trial sequence on mount
  const trialSequence = useRef<Array<{ shape: string; color: string; isMatch: boolean }>>([]);

  useEffect(() => {
    // Generate all trials upfront with deterministic match/no-match
    const sequence: Array<{ shape: string; color: string; isMatch: boolean }> = [];
    let prev: { shape: string; color: string } | null = null;
    
    for (let i = 0; i < totalTrials; i++) {
      const shouldMatch = i > 0 && Math.random() < matchProb;
      let newShape: { shape: string; color: string };
      
      if (shouldMatch && prev) {
        // Match: same shape, same color
        newShape = { shape: prev.shape, color: prev.color };
      } else {
        // Different: pick a different shape
        const availableShapes = prev 
          ? shapes.filter(s => s !== prev.shape)
          : shapes;
        newShape = {
          shape: availableShapes[Math.floor(Math.random() * availableShapes.length)],
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
      }
      
      sequence.push({ ...newShape, isMatch: shouldMatch && prev !== null });
      prev = newShape;
    }
    
    trialSequence.current = sequence;
  }, [totalTrials, matchProb, shapes]);

  const finishDrill = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    
    setPhase('complete');
    const avgRT = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;
    onComplete({ correct, total: totalTrials, avgReactionTime: avgRT });
  }, [correct, reactionTimes, totalTrials, onComplete]);

  const showNextTrial = useCallback(() => {
    if (trial >= totalTrials) {
      finishDrill();
      return;
    }

    const trialData = trialSequence.current[trial];
    if (!trialData) return;

    // Save current shape as previous before showing new one
    setPreviousShape(currentShape);
    setCurrentShape({ shape: trialData.shape, color: trialData.color });
    setIsMatch(trialData.isMatch);
    setCanRespond(true);
    setShapeShownAt(Date.now());
    setFeedback(null);

    // Auto-advance after display time (miss)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (canRespond) {
        // User didn't respond - count as incorrect
        setFeedback("wrong");
        setStreak(0);
        setTimeout(() => {
          setTrial(prev => prev + 1);
        }, 300);
      }
    }, displayTime);
  }, [trial, totalTrials, currentShape, displayTime, finishDrill, canRespond]);

  // Start game when phase changes to playing
  useEffect(() => {
    if (phase === 'playing' && trial === 0 && trialSequence.current.length > 0) {
      showNextTrial();
    }
  }, [phase, trial, showNextTrial]);

  // Advance to next trial
  useEffect(() => {
    if (phase === 'playing' && trial > 0 && trial < totalTrials && feedback === null) {
      const timeout = setTimeout(showNextTrial, 400);
      return () => clearTimeout(timeout);
    }
  }, [trial, phase, totalTrials, feedback, showNextTrial]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleResponse = (userSaysMatch: boolean) => {
    if (!canRespond || feedback !== null) return;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    setCanRespond(false);

    const wasCorrect = userSaysMatch === isMatch;
    const rt = Date.now() - shapeShownAt;
    setReactionTimes(prev => [...prev, rt]);

    if (wasCorrect) {
      setCorrect(prev => prev + 1);
      setStreak(prev => prev + 1);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }

    // Advance after showing feedback
    setTimeout(() => {
      setFeedback(null);
      setTrial(prev => prev + 1);
    }, 500);
  };

  // Intro screen
  if (phase === 'intro') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Shape Match</h2>
          <p className="text-muted-foreground max-w-xs">
            Compare each shape to the <strong>previous one</strong>. Tap MATCH if they're identical, DIFFERENT if they're not.
          </p>
        </div>

        <div className="space-y-3 mb-8 text-sm text-left bg-muted/50 p-4 rounded-xl max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs">1</div>
            <span>First shape has no "previous" - just observe it</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs">2</div>
            <span>Same shape + same color = MATCH</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs">3</div>
            <span>Different shape or color = DIFFERENT</span>
          </div>
        </div>

        <Button size="lg" onClick={() => setPhase('playing')} className="w-full max-w-xs">
          Start Drill
        </Button>
      </motion.div>
    );
  }

  // Complete screen
  if (phase === 'complete') {
    const accuracy = Math.round((correct / totalTrials) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center p-6"
      >
        <div className={cn(
          "text-7xl mb-4",
          accuracy >= 80 ? "text-green-500" : accuracy >= 60 ? "text-yellow-500" : "text-red-500"
        )}>
          {accuracy >= 80 ? "🎯" : accuracy >= 60 ? "👍" : "💪"}
        </div>
        <p className="text-2xl font-bold mb-2">
          {accuracy}% Accuracy
        </p>
        <p className="text-muted-foreground">
          {correct} / {totalTrials} correct
        </p>
      </motion.div>
    );
  }

  const ShapeComponent = currentShape ? SHAPE_RENDERS[currentShape.shape] : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      {/* Progress & Stats */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Trial {trial + 1} / {totalTrials}</span>
          <div className="flex gap-4">
            <span>✓ {correct}</span>
            {streak >= 2 && (
              <span className="text-primary font-medium">🔥 {streak}</span>
            )}
          </div>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((trial) / totalTrials) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Previous shape indicator */}
      {previousShape && trial > 0 && (
        <div className="mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Previous shape:</p>
          <div className="w-12 h-12 mx-auto opacity-50 flex items-center justify-center">
            {SHAPE_RENDERS[previousShape.shape]?.(40, previousShape.color)}
          </div>
        </div>
      )}

      {/* Current Shape Display */}
      <div className={cn(
        "w-44 h-44 rounded-2xl border-2 border-dashed flex items-center justify-center mb-6 transition-all duration-200",
        feedback === null && "border-border",
        feedback === "correct" && "border-green-500 bg-green-500/10",
        feedback === "wrong" && "border-red-500 bg-red-500/10"
      )}>
        <AnimatePresence mode="wait">
          {feedback === null && currentShape && ShapeComponent && (
            <motion.div
              key={`${currentShape.shape}-${trial}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {ShapeComponent(90, currentShape.color)}
            </motion.div>
          )}
          {feedback === "correct" && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-5xl"
            >
              ✓
            </motion.span>
          )}
          {feedback === "wrong" && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-5xl"
            >
              ✗
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground mb-6 text-center">
        {trial === 0 
          ? "This is the first shape. Observe it, then press DIFFERENT to continue." 
          : "Is this the same shape & color as the previous one?"
        }
      </p>

      {/* Response Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => handleResponse(false)}
          disabled={!canRespond || feedback !== null}
          className="w-32 h-14 text-lg"
        >
          Different
        </Button>
        <Button 
          size="lg"
          onClick={() => handleResponse(true)}
          disabled={!canRespond || feedback !== null || trial === 0}
          className="w-32 h-14 text-lg"
        >
          MATCH
        </Button>
      </div>

      {/* Timer indicator */}
      {canRespond && feedback === null && (
        <motion.div 
          className="mt-6 w-full max-w-sm h-1 bg-muted rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-primary/50"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: displayTime / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </div>
  );
}
