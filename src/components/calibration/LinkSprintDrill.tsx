/**
 * Link Sprint Drill (RA - Rapid Association)
 * 
 * Fast drill (~20s): 12 items YES/NO association
 * Auto-advance after 2s with no response (counts as wrong)
 * NO visible timer/countdown
 * 
 * Measures: accuracy + reaction speed
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, X } from "lucide-react";

interface DrillResult {
  correct: number;
  total: number;
  avgReactionMs?: number;
  sessionScore: number;
  startedAt: string;
  finishedAt: string;
}

interface LinkSprintDrillProps {
  onComplete: (result: DrillResult) => void;
}

const TOTAL_ITEMS = 12;
const AUTO_ADVANCE_MS = 2000;
const T_FAST = 500;
const T_SLOW = 1800;

interface AssociationItem {
  anchor: string;
  candidate: string;
  isRelated: boolean;
}

const ASSOCIATION_ITEMS: AssociationItem[] = [
  { anchor: "Ocean", candidate: "Wave", isRelated: true },
  { anchor: "Forest", candidate: "Keyboard", isRelated: false },
  { anchor: "Music", candidate: "Melody", isRelated: true },
  { anchor: "Clock", candidate: "Orange", isRelated: false },
  { anchor: "Fire", candidate: "Heat", isRelated: true },
  { anchor: "Book", candidate: "Volcano", isRelated: false },
  { anchor: "Mountain", candidate: "Summit", isRelated: true },
  { anchor: "Coffee", candidate: "Glacier", isRelated: false },
  { anchor: "Storm", candidate: "Thunder", isRelated: true },
  { anchor: "Lamp", candidate: "Whale", isRelated: false },
  { anchor: "River", candidate: "Current", isRelated: true },
  { anchor: "Chair", candidate: "Comet", isRelated: false },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function LinkSprintDrill({ onComplete }: LinkSprintDrillProps) {
  const [phase, setPhase] = useState<"ready" | "running" | "complete">("ready");
  const [items] = useState<AssociationItem[]>(() => shuffleArray(ASSOCIATION_ITEMS));
  const [currentItem, setCurrentItem] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  
  const startedAt = useRef<string>("");
  const itemStartTime = useRef<number>(0);
  const correctCount = useRef(0);
  const reactionTimes = useRef<number[]>([]);
  const hasResponded = useRef(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processResult = useCallback(() => {
    const finishedAt = new Date().toISOString();
    const avgReactionMs = reactionTimes.current.length > 0
      ? reactionTimes.current.reduce((a, b) => a + b, 0) / reactionTimes.current.length
      : T_SLOW;
    
    // Calculate scores
    const accScore = (correctCount.current / TOTAL_ITEMS) * 100;
    const speedScore = Math.max(0, Math.min(100, 
      ((T_SLOW - avgReactionMs) / (T_SLOW - T_FAST)) * 100
    ));
    const sessionScore = Math.round(0.50 * accScore + 0.50 * speedScore);
    
    onComplete({
      correct: correctCount.current,
      total: TOTAL_ITEMS,
      avgReactionMs: Math.round(avgReactionMs),
      sessionScore,
      startedAt: startedAt.current,
      finishedAt,
    });
  }, [onComplete]);

  const nextItem = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    if (currentItem >= TOTAL_ITEMS - 1) {
      setPhase("complete");
      processResult();
      return;
    }
    
    setCurrentItem(prev => prev + 1);
    setFeedback(null);
    hasResponded.current = false;
    itemStartTime.current = performance.now();
    
    // Set auto-advance timer (no visible countdown)
    autoAdvanceTimer.current = setTimeout(() => {
      if (!hasResponded.current) {
        setFeedback("wrong");
        setTimeout(nextItem, 200);
      }
    }, AUTO_ADVANCE_MS);
  }, [currentItem, processResult]);

  const handleResponse = useCallback((answeredYes: boolean) => {
    if (phase !== "running" || hasResponded.current) return;
    
    hasResponded.current = true;
    const reactionTime = performance.now() - itemStartTime.current;
    reactionTimes.current.push(reactionTime);
    
    const item = items[currentItem];
    const isCorrect = (answeredYes && item.isRelated) || (!answeredYes && !item.isRelated);
    
    if (isCorrect) {
      correctCount.current++;
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
    
    setTimeout(nextItem, 200);
  }, [phase, items, currentItem, nextItem]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  // Start drill
  const handleStart = () => {
    startedAt.current = new Date().toISOString();
    setPhase("running");
    itemStartTime.current = performance.now();
    
    // Set auto-advance for first item
    autoAdvanceTimer.current = setTimeout(() => {
      if (!hasResponded.current) {
        setFeedback("wrong");
        setTimeout(nextItem, 200);
      }
    }, AUTO_ADVANCE_MS);
  };

  const currentItemData = items[currentItem];

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      {/* Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground/60">
            Rapid Association
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Link Sprint</h2>
      </div>

      {/* Main area */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-sm">
        {phase === "ready" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Zap className="w-16 h-16 text-blue-500/30 mx-auto mb-6" />
            <p className="text-sm text-muted-foreground mb-2">
              Are these words <span className="text-blue-400 font-medium">related</span>?
            </p>
            <p className="text-xs text-muted-foreground/60 mb-8">
              Tap YES or NO for each pair
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
              key={currentItem}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              className="text-center w-full"
            >
              {/* Word pair */}
              <div className={`
                mb-10 p-6 rounded-2xl border transition-colors
                ${feedback === "correct" ? "border-emerald-500/50 bg-emerald-500/5" : ""}
                ${feedback === "wrong" ? "border-red-500/50 bg-red-500/5" : ""}
                ${feedback === null ? "border-border/30 bg-muted/5" : ""}
              `}>
                <p className="text-2xl font-semibold text-foreground mb-2">
                  {currentItemData.anchor}
                </p>
                <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-2">
                  ↓
                </p>
                <p className="text-xl text-muted-foreground">
                  {currentItemData.candidate}
                </p>
              </div>

              {/* Response buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleResponse(true)}
                  disabled={hasResponded.current}
                  className="flex-1 max-w-[140px] py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  YES
                </button>
                <button
                  onClick={() => handleResponse(false)}
                  disabled={hasResponded.current}
                  className="flex-1 max-w-[140px] py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  NO
                </button>
              </div>
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
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">Complete</p>
          </motion.div>
        )}
      </div>

      {/* Progress */}
      {phase === "running" && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-xs text-muted-foreground/50">
            {currentItem + 1} / {TOTAL_ITEMS}
          </p>
        </div>
      )}

      {/* Instruction */}
      {phase === "running" && (
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          Semantic association
        </p>
      )}
    </div>
  );
}
