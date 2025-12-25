// Shape Match Drill - Tap when two consecutive shapes are identical
// Progressive difficulty: display time decreases as you get consecutive correct answers
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

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

// Difficulty levels based on consecutive correct answers
const DIFFICULTY_LEVELS = [
  { streak: 0, displayTime: 2500, label: "Normal" },
  { streak: 3, displayTime: 2000, label: "Fast" },
  { streak: 5, displayTime: 1500, label: "Faster" },
  { streak: 7, displayTime: 1200, label: "Expert" },
  { streak: 10, displayTime: 900, label: "Master" },
];

function getDifficultyForStreak(streak: number) {
  let level = DIFFICULTY_LEVELS[0];
  for (const l of DIFFICULTY_LEVELS) {
    if (streak >= l.streak) level = l;
  }
  return level;
}

interface TrialData {
  shape: string;
  color: string;
  isMatch: boolean;
}

export function ShapeMatchDrill({ config, onComplete }: ShapeMatchDrillProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'complete'>('intro');
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [speedUpNotice, setSpeedUpNotice] = useState(false);
  
  const shapes = config?.shapes || ["circle", "square", "triangle", "diamond", "hexagon", "pentagon"];
  const totalTrials = config?.totalTrials || 12;
  const matchProb = config?.matchProbability || 0.35;

  // Pre-generate all trials
  const trialsRef = useRef<TrialData[]>([]);
  const shapeShownAtRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Generate trials once
  useEffect(() => {
    const sequence: TrialData[] = [];
    let prev: { shape: string; color: string } | null = null;
    
    for (let i = 0; i < totalTrials; i++) {
      const shouldMatch = i > 0 && Math.random() < matchProb;
      let newShape: { shape: string; color: string };
      
      if (shouldMatch && prev) {
        newShape = { shape: prev.shape, color: prev.color };
      } else {
        const availableShapes = prev ? shapes.filter(s => s !== prev!.shape) : shapes;
        newShape = {
          shape: availableShapes[Math.floor(Math.random() * availableShapes.length)],
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
      }
      
      sequence.push({ ...newShape, isMatch: shouldMatch && prev !== null });
      prev = newShape;
    }
    
    trialsRef.current = sequence;
  }, [totalTrials, matchProb, shapes]);

  const currentTrial = trialsRef.current[trial];
  const previousTrial = trial > 0 ? trialsRef.current[trial - 1] : null;
  const difficulty = getDifficultyForStreak(streak);

  // Start timer when trial changes during playing phase
  useEffect(() => {
    if (phase !== 'playing' || feedback !== null) return;
    
    shapeShownAtRef.current = Date.now();
    
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Auto-fail if no response within display time
    timerRef.current = setTimeout(() => {
      if (feedback === null && phase === 'playing') {
        handleMiss();
      }
    }, difficulty.displayTime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trial, phase, feedback, difficulty.displayTime]);

  const handleMiss = () => {
    setStreak(0);
    setFeedback("wrong");
    
    setTimeout(() => {
      advanceToNextTrial();
    }, 400);
  };

  const advanceToNextTrial = () => {
    setFeedback(null);
    if (trial + 1 >= totalTrials) {
      finishDrill();
    } else {
      setTrial(t => t + 1);
    }
  };

  const finishDrill = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    
    setPhase('complete');
    const avgRT = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;
    onComplete({ correct, total: totalTrials, avgReactionTime: avgRT });
  };

  const handleResponse = (userSaysMatch: boolean) => {
    if (feedback !== null || phase !== 'playing') return;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const rt = Date.now() - shapeShownAtRef.current;
    setReactionTimes(prev => [...prev, rt]);

    const wasCorrect = userSaysMatch === (currentTrial?.isMatch ?? false);
    const prevStreak = streak;

    if (wasCorrect) {
      const newStreak = streak + 1;
      setCorrect(c => c + 1);
      setStreak(newStreak);
      setFeedback("correct");
      
      // Check if we leveled up
      const prevLevel = getDifficultyForStreak(prevStreak);
      const newLevel = getDifficultyForStreak(newStreak);
      if (newLevel.streak > prevLevel.streak && newLevel.streak > 0) {
        setSpeedUpNotice(true);
        setTimeout(() => setSpeedUpNotice(false), 1500);
      }
    } else {
      setStreak(0);
      setFeedback("wrong");
    }

    setTimeout(() => {
      advanceToNextTrial();
    }, 400);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
            Compare each shape to the <strong>previous one</strong>. Tap MATCH if identical, DIFFERENT otherwise.
          </p>
        </div>

        <div className="space-y-3 mb-6 text-sm text-left bg-muted/50 p-4 rounded-xl max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs">1</div>
            <span>First shape: just observe, then tap DIFFERENT</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs">2</div>
            <span>Same shape + color = MATCH</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs">3</div>
            <span>Different = DIFFERENT</span>
          </div>
        </div>

        {/* Progressive difficulty notice */}
        <div className="mb-6 p-3 rounded-xl bg-primary/10 border border-primary/20 max-w-xs">
          <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
            <Zap size={16} />
            <span>Difficoltà Progressiva</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Più risposte corrette consecutive = meno tempo per rispondere. Mantieni la serie per aumentare la sfida!
          </p>
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

  if (!currentTrial) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const ShapeComponent = SHAPE_RENDERS[currentTrial.shape];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      {/* Speed up notice */}
      <AnimatePresence>
        {speedUpNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium flex items-center gap-2 z-50"
          >
            <Zap size={16} />
            Speed Up! {difficulty.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress & Stats */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Trial {trial + 1} / {totalTrials}</span>
          <div className="flex gap-3">
            <span>✓ {correct}</span>
            {streak >= 2 && (
              <span className="text-primary font-medium">🔥 {streak}</span>
            )}
            <span className="text-xs opacity-70">{difficulty.label}</span>
          </div>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            animate={{ width: `${((trial) / totalTrials) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Previous shape indicator */}
      {previousTrial && (
        <div className="mb-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Previous shape:</p>
          <div className="w-14 h-14 mx-auto opacity-60 flex items-center justify-center border border-dashed border-border rounded-xl">
            {SHAPE_RENDERS[previousTrial.shape]?.(45, previousTrial.color)}
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
          {feedback === null && ShapeComponent && (
            <motion.div
              key={`shape-${trial}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {ShapeComponent(90, currentTrial.color)}
            </motion.div>
          )}
          {feedback === "correct" && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-5xl text-green-500"
            >
              ✓
            </motion.span>
          )}
          {feedback === "wrong" && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-5xl text-red-500"
            >
              ✗
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground mb-6 text-center">
        {trial === 0 
          ? "This is the first shape. Observe it, then press DIFFERENT." 
          : "Is this the same shape & color as the previous one?"
        }
      </p>

      {/* Response Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => handleResponse(false)}
          disabled={feedback !== null}
          className="w-32 h-14 text-lg"
        >
          Different
        </Button>
        <Button 
          size="lg"
          onClick={() => handleResponse(true)}
          disabled={feedback !== null || trial === 0}
          className="w-32 h-14 text-lg"
        >
          MATCH
        </Button>
      </div>

      {/* Timer indicator */}
      {feedback === null && (
        <motion.div 
          className="mt-6 w-full max-w-sm h-1.5 bg-muted rounded-full overflow-hidden"
        >
          <motion.div
            key={`timer-${trial}-${streak}`}
            className={cn(
              "h-full rounded-full",
              streak >= 7 ? "bg-red-500" : streak >= 5 ? "bg-orange-500" : streak >= 3 ? "bg-yellow-500" : "bg-primary/50"
            )}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: difficulty.displayTime / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </div>
  );
}
