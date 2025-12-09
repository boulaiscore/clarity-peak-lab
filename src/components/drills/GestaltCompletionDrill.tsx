import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GestaltCompletionDrillProps {
  config: {
    trialsCount: number;
    timePerTrial: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; avgReactionTime: number }) => void;
}

type GestaltSet = {
  partial: string[];  // incomplete visual pattern
  complete: string;   // what completes it intuitively
  wrong: string[];    // distractors
};

// Gestalt completion - instant visual intuition
const GESTALT_SETS: GestaltSet[] = [
  { partial: ["◢", "◣"], complete: "▼", wrong: ["▲", "◆", "●"] },
  { partial: ["◠", "◠"], complete: "◯", wrong: ["□", "△", "◇"] },
  { partial: ["╱", "╲"], complete: "✕", wrong: ["✓", "○", "□"] },
  { partial: ["├", "┤"], complete: "┼", wrong: ["│", "─", "┬"] },
  { partial: ["◖", "◗"], complete: "●", wrong: ["◐", "◑", "○"] },
  { partial: ["⌐", "¬"], complete: "┐", wrong: ["└", "┘", "├"] },
  { partial: ["(", ")"], complete: "○", wrong: ["□", "△", "◇"] },
  { partial: ["<", ">"], complete: "◇", wrong: ["○", "□", "△"] },
  { partial: ["┌", "┘"], complete: "□", wrong: ["○", "△", "◇"] },
  { partial: ["╔", "╝"], complete: "▣", wrong: ["●", "▲", "◆"] },
  { partial: ["∧", "∨"], complete: "◇", wrong: ["○", "□", "△"] },
  { partial: ["⟨", "⟩"], complete: "◊", wrong: ["○", "□", "△"] },
];

function getRandomGestaltSet(): { partial: string[]; options: string[]; correctIndex: number } {
  const set = GESTALT_SETS[Math.floor(Math.random() * GESTALT_SETS.length)];
  const correctIndex = Math.floor(Math.random() * 4);
  const options = [...set.wrong];
  options.splice(correctIndex, 0, set.complete);
  return { partial: set.partial, options, correctIndex };
}

export function GestaltCompletionDrill({ config, timeLimit, onComplete }: GestaltCompletionDrillProps) {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [trialStartTime, setTrialStartTime] = useState(Date.now());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentPartial, setCurrentPartial] = useState<string[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const generateTrial = () => {
    const { partial, options, correctIndex: idx } = getRandomGestaltSet();
    setCurrentPartial(partial);
    setCurrentOptions(options);
    setCorrectIndex(idx);
  };

  useEffect(() => {
    generateTrial();
    setTrialStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (isComplete) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isComplete]);

  useEffect(() => {
    if (isComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      onCompleteRef.current({ score, correct, avgReactionTime });
    }
  }, [isComplete, score, correct, reactionTimes]);

  const handleSelect = (index: number) => {
    if (feedback) return;

    const reactionTime = Date.now() - trialStartTime;
    setReactionTimes(prev => [...prev, reactionTime]);

    if (index === correctIndex) {
      setFeedback("correct");
      setCorrect(prev => prev + 1);
      setScore(prev => prev + Math.max(100 - Math.floor(reactionTime / 40), 15));
    } else {
      setFeedback("wrong");
    }

    setTimeout(() => {
      if (currentTrial + 1 >= config.trialsCount) {
        setIsComplete(true);
      } else {
        setCurrentTrial(prev => prev + 1);
        generateTrial();
        setTrialStartTime(Date.now());
        setFeedback(null);
      }
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <div className="text-sm text-muted-foreground">
          {currentTrial + 1} / {config.trialsCount}
        </div>
        <div className="text-sm font-mono text-primary">{timeLeft}s</div>
        <div className="text-sm text-muted-foreground">
          {score} pts
        </div>
      </div>

      <p className="text-lg text-center mb-4 text-muted-foreground">
        Complete the shape
      </p>

      {/* Partial shape display */}
      <div className="flex items-center gap-1 mb-8 p-6 bg-card rounded-2xl border border-border">
        {currentPartial.map((char, i) => (
          <span key={i} className="text-6xl font-light text-foreground">{char}</span>
        ))}
        <span className="text-5xl text-primary/50 mx-2">→</span>
        <span className="w-16 h-16 rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center text-3xl text-primary">?</span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-4 gap-3">
        {currentOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={!!feedback}
            className={cn(
              "w-16 h-16 rounded-xl text-4xl flex items-center justify-center",
              "border-2 transition-all duration-150",
              "bg-card hover:bg-primary/10 hover:scale-110",
              feedback && index === correctIndex && "bg-green-500/20 border-green-500 scale-110",
              feedback === "wrong" && index !== correctIndex && "opacity-30",
              !feedback && "border-border hover:border-primary"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={cn(
          "mt-4 text-lg font-semibold",
          feedback === "correct" ? "text-green-400" : "text-red-400"
        )}>
          {feedback === "correct" ? "✓" : "✗"}
        </div>
      )}

      <div className="w-full max-w-md mt-6">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentTrial / config.trialsCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
