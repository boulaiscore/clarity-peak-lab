/**
 * Constraint Solve Drill (IN - Insight)
 * 
 * System 2 drill: 2 constraint-based puzzles
 * NO TIMER, NO COUNTDOWN - user proceeds at own pace
 * 
 * Measures: accuracy only (insight + constraint satisfaction)
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronRight } from "lucide-react";

interface DrillResult {
  correct: number;
  total: number;
  avgReactionMs?: number;
  sessionScore: number;
  startedAt: string;
  finishedAt: string;
}

interface ConstraintSolveDrillProps {
  onComplete: (result: DrillResult) => void;
}

interface Puzzle {
  id: string;
  description: string;
  constraints: string[];
  question: string;
  options: { label: string; text: string; isCorrect: boolean }[];
}

const PUZZLES: Puzzle[] = [
  {
    id: "digit-code",
    description: "A 3-digit code XYZ must satisfy these constraints:",
    constraints: [
      "X is an even number",
      "Y is greater than X",
      "Z equals Y minus X",
    ],
    question: "Which code is valid?",
    options: [
      { label: "A", text: "248", isCorrect: false },
      { label: "B", text: "264", isCorrect: true },
      { label: "C", text: "286", isCorrect: false },
      { label: "D", text: "426", isCorrect: false },
    ],
  },
  {
    id: "ordering",
    description: "Three items A, B, C must be ordered with these constraints:",
    constraints: [
      "A must come before B",
      "C cannot be last",
    ],
    question: "Which ordering is valid?",
    options: [
      { label: "A", text: "C → A → B", isCorrect: true },
      { label: "B", text: "A → B → C", isCorrect: false },
      { label: "C", text: "A → C → B", isCorrect: false },
      { label: "D", text: "B → A → C", isCorrect: false },
    ],
  },
];

export function ConstraintSolveDrill({ onComplete }: ConstraintSolveDrillProps) {
  const [phase, setPhase] = useState<"ready" | "running" | "complete">("ready");
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showSoftNudge, setShowSoftNudge] = useState(false);
  
  const startedAt = useRef<string>("");
  const correctCount = useRef(0);
  const softNudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStart = () => {
    startedAt.current = new Date().toISOString();
    setPhase("running");
    startSoftNudgeTimer();
  };

  const startSoftNudgeTimer = () => {
    if (softNudgeTimer.current) clearTimeout(softNudgeTimer.current);
    setShowSoftNudge(false);
    
    // Show soft nudge after 40s (non-blocking)
    softNudgeTimer.current = setTimeout(() => {
      setShowSoftNudge(true);
    }, 40000);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    if (softNudgeTimer.current) clearTimeout(softNudgeTimer.current);
    
    const puzzle = PUZZLES[currentPuzzle];
    const isCorrect = puzzle.options.find(o => o.label === selectedOption)?.isCorrect || false;
    
    if (isCorrect) {
      correctCount.current++;
    }
    
    if (currentPuzzle >= PUZZLES.length - 1) {
      // Complete
      const finishedAt = new Date().toISOString();
      const accScore = (correctCount.current / PUZZLES.length) * 100;
      // Clamp to 20-80 range
      const sessionScore = Math.round(Math.max(20, Math.min(80, accScore)));
      
      setPhase("complete");
      
      onComplete({
        correct: correctCount.current,
        total: PUZZLES.length,
        sessionScore,
        startedAt: startedAt.current,
        finishedAt,
      });
    } else {
      setCurrentPuzzle(prev => prev + 1);
      setSelectedOption(null);
      startSoftNudgeTimer();
    }
  };

  const currentPuzzleData = PUZZLES[currentPuzzle];

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 overflow-y-auto py-20">
      {/* Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground/60">
            Insight
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Constraint Solve</h2>
      </div>

      {/* Main area */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-lg">
        {phase === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Lightbulb className="w-16 h-16 text-violet-500/30 mx-auto mb-6" />
            <p className="text-sm text-muted-foreground mb-2">
              Solve <span className="text-violet-400 font-medium">constraint puzzles</span>
            </p>
            <p className="text-xs text-muted-foreground/60 mb-8">
              2 puzzles • Take your time
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm"
            >
              Start
            </button>
          </motion.div>
        )}

        {phase === "running" && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPuzzle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {/* Puzzle description */}
              <div className="mb-4 p-5 rounded-xl border border-border/30 bg-muted/5">
                <p className="text-sm text-foreground/90 mb-3">
                  {currentPuzzleData.description}
                </p>
                <ul className="space-y-1.5">
                  {currentPuzzleData.constraints.map((constraint, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
                      {constraint}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Question */}
              <p className="text-sm font-medium text-foreground mb-4">
                {currentPuzzleData.question}
              </p>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {currentPuzzleData.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setSelectedOption(option.label)}
                    className={`
                      text-center p-4 rounded-xl border transition-all
                      ${selectedOption === option.label 
                        ? "border-primary bg-primary/5" 
                        : "border-border/30 bg-muted/5 hover:border-border/50"
                      }
                    `}
                  >
                    <span className={`
                      inline-block w-6 h-6 rounded-full mb-2 text-xs font-medium leading-6
                      ${selectedOption === option.label 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/30 text-muted-foreground"
                      }
                    `}>
                      {option.label}
                    </span>
                    <p className="text-sm text-foreground font-mono">
                      {option.text}
                    </p>
                  </button>
                ))}
              </div>

              {/* Soft nudge (non-blocking) */}
              <AnimatePresence>
                {showSoftNudge && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-muted-foreground/40 text-center mb-4"
                  >
                    Answer with your best judgment.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!selectedOption}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </AnimatePresence>
        )}

        {phase === "complete" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">Complete</p>
          </motion.div>
        )}
      </div>

      {/* Progress */}
      {phase === "running" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-xs text-muted-foreground/50">
            {currentPuzzle + 1} / {PUZZLES.length}
          </p>
        </div>
      )}
    </div>
  );
}
