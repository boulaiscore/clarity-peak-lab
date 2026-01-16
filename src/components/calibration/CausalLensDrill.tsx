/**
 * Causal Lens Drill (CT - Critical Thinking)
 * 
 * System 2 drill: 3 causal reasoning scenarios
 * NO TIMER, NO COUNTDOWN - user proceeds at own pace
 * 
 * Measures: accuracy only (deliberate reasoning)
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";

interface DrillResult {
  correct: number;
  total: number;
  avgReactionMs?: number;
  sessionScore: number;
  startedAt: string;
  finishedAt: string;
}

interface CausalLensDrillProps {
  onComplete: (result: DrillResult) => void;
}

interface Scenario {
  id: string;
  situation: string;
  question: string;
  options: { label: string; text: string; isCorrect: boolean }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "confounding",
    situation: "A productivity study finds that employees who use a focus app have 20% higher output. The company claims the app causes improved productivity.",
    question: "What is the best critique of this claim?",
    options: [
      { label: "A", text: "The study proves causality because output increased", isCorrect: false },
      { label: "B", text: "Selection bias: motivated employees may choose to use the app", isCorrect: true },
      { label: "C", text: "Productivity cannot be accurately measured", isCorrect: false },
      { label: "D", text: "A mean increase always implies causality", isCorrect: false },
    ],
  },
  {
    id: "counterfactual",
    situation: "After a team changes their morning meeting format, bug reports drop by 30%. The manager claims the new format reduced bugs.",
    question: "What data would best help determine if the meeting change caused the reduction?",
    options: [
      { label: "A", text: "Compare to a similar team that didn't change their meetings", isCorrect: true },
      { label: "B", text: "Ask the manager for their opinion on the change", isCorrect: false },
      { label: "C", text: "Count total meetings before and after", isCorrect: false },
      { label: "D", text: "Look at the same data for another month", isCorrect: false },
    ],
  },
  {
    id: "intervention",
    situation: "An analysis shows that on days when developers drink more coffee, they close more tasks. Someone suggests coffee improves productivity.",
    question: "What would be the best test of this claim?",
    options: [
      { label: "A", text: "Increase coffee supply for all developers", isCorrect: false },
      { label: "B", text: "Run a randomized trial with caffeine vs placebo", isCorrect: true },
      { label: "C", text: "Ask developers about their coffee preferences", isCorrect: false },
      { label: "D", text: "Analyze the data for a different month", isCorrect: false },
    ],
  },
];

export function CausalLensDrill({ onComplete }: CausalLensDrillProps) {
  const [phase, setPhase] = useState<"ready" | "running" | "complete">("ready");
  const [currentScenario, setCurrentScenario] = useState(0);
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
    
    // Show soft nudge after 35s (non-blocking)
    softNudgeTimer.current = setTimeout(() => {
      setShowSoftNudge(true);
    }, 35000);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    if (softNudgeTimer.current) clearTimeout(softNudgeTimer.current);
    
    const scenario = SCENARIOS[currentScenario];
    const isCorrect = scenario.options.find(o => o.label === selectedOption)?.isCorrect || false;
    
    if (isCorrect) {
      correctCount.current++;
    }
    
    if (currentScenario >= SCENARIOS.length - 1) {
      // Complete
      const finishedAt = new Date().toISOString();
      const accScore = (correctCount.current / SCENARIOS.length) * 100;
      // Clamp to 20-80 range
      const sessionScore = Math.round(Math.max(20, Math.min(80, accScore)));
      
      setPhase("complete");
      
      onComplete({
        correct: correctCount.current,
        total: SCENARIOS.length,
        sessionScore,
        startedAt: startedAt.current,
        finishedAt,
      });
    } else {
      setCurrentScenario(prev => prev + 1);
      setSelectedOption(null);
      startSoftNudgeTimer();
    }
  };

  const currentScenarioData = SCENARIOS[currentScenario];

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 overflow-y-auto py-20">
      {/* Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground/60">
            Critical Thinking
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Causal Lens</h2>
      </div>

      {/* Main area */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-lg">
        {phase === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Brain className="w-16 h-16 text-teal-500/30 mx-auto mb-6" />
            <p className="text-sm text-muted-foreground mb-2">
              Evaluate <span className="text-teal-400 font-medium">causal claims</span>
            </p>
            <p className="text-xs text-muted-foreground/60 mb-8">
              3 scenarios • Take your time
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
              key={currentScenario}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {/* Scenario */}
              <div className="mb-6 p-5 rounded-xl border border-border/30 bg-muted/5">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {currentScenarioData.situation}
                </p>
              </div>

              {/* Question */}
              <p className="text-sm font-medium text-foreground mb-4">
                {currentScenarioData.question}
              </p>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentScenarioData.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setSelectedOption(option.label)}
                    className={`
                      w-full text-left p-4 rounded-xl border transition-all
                      ${selectedOption === option.label 
                        ? "border-primary bg-primary/5" 
                        : "border-border/30 bg-muted/5 hover:border-border/50"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                        ${selectedOption === option.label 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/30 text-muted-foreground"
                        }
                      `}>
                        {option.label}
                      </span>
                      <span className="text-sm text-foreground/80">
                        {option.text}
                      </span>
                    </div>
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
              <Brain className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">Complete</p>
          </motion.div>
        )}
      </div>

      {/* Progress */}
      {phase === "running" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-xs text-muted-foreground/50">
            {currentScenario + 1} / {SCENARIOS.length}
          </p>
        </div>
      )}
    </div>
  );
}
