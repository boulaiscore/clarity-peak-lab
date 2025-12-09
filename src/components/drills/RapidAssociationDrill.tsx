import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RapidAssociationDrillProps {
  config: {
    trialsCount: number;
    timePerTrial: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; avgReactionTime: number }) => void;
}

type AssociationSet = {
  trigger: string;     // instant emotional/visual trigger
  match: string;       // the intuitive match
  distractors: string[];
};

// Rapid intuitive association - first instinct wins
const ASSOCIATION_SETS: AssociationSet[] = [
  { trigger: "🔥", match: "🌶️", distractors: ["🧊", "💧", "❄️"] },
  { trigger: "💤", match: "🌙", distractors: ["☀️", "⚡", "🏃"] },
  { trigger: "💔", match: "😢", distractors: ["😀", "🎉", "💪"] },
  { trigger: "🎉", match: "🥳", distractors: ["😴", "😢", "😡"] },
  { trigger: "⚡", match: "🏃", distractors: ["🐢", "🛋️", "😴"] },
  { trigger: "🌧️", match: "😔", distractors: ["🎉", "💪", "😀"] },
  { trigger: "☀️", match: "😊", distractors: ["😢", "😴", "😡"] },
  { trigger: "❄️", match: "🥶", distractors: ["🥵", "🔥", "☀️"] },
  { trigger: "🎵", match: "💃", distractors: ["📚", "💼", "🔧"] },
  { trigger: "💪", match: "🏆", distractors: ["🛋️", "😴", "📚"] },
  { trigger: "📚", match: "🤓", distractors: ["🏃", "💃", "🎮"] },
  { trigger: "🌊", match: "🏄", distractors: ["🏔️", "🌵", "❄️"] },
  { trigger: "🍕", match: "😋", distractors: ["🤢", "😴", "😢"] },
  { trigger: "🎮", match: "🤩", distractors: ["😴", "📚", "💼"] },
  { trigger: "💰", match: "🤑", distractors: ["😢", "😴", "😡"] },
];

function getRandomAssociation(): { trigger: string; options: string[]; correctIndex: number } {
  const set = ASSOCIATION_SETS[Math.floor(Math.random() * ASSOCIATION_SETS.length)];
  const correctIndex = Math.floor(Math.random() * 4);
  const options = [...set.distractors];
  options.splice(correctIndex, 0, set.match);
  return { trigger: set.trigger, options, correctIndex };
}

export function RapidAssociationDrill({ config, timeLimit, onComplete }: RapidAssociationDrillProps) {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [trialStartTime, setTrialStartTime] = useState(Date.now());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentTrigger, setCurrentTrigger] = useState("");
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const generateTrial = () => {
    const { trigger, options, correctIndex: idx } = getRandomAssociation();
    setCurrentTrigger(trigger);
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
      // Faster response = more points (creativity rewards speed)
      setScore(prev => prev + Math.max(120 - Math.floor(reactionTime / 30), 20));
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
    }, 400); // Very fast transition for rapid association
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

      <p className="text-sm text-center mb-2 text-muted-foreground">
        First instinct!
      </p>

      {/* Trigger - big and prominent */}
      <div className="mb-8 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
        <span className="text-8xl animate-pulse">{currentTrigger}</span>
      </div>

      {/* Options - laid out for quick tapping */}
      <div className="grid grid-cols-2 gap-4">
        {currentOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={!!feedback}
            className={cn(
              "w-20 h-20 rounded-2xl text-5xl flex items-center justify-center",
              "border-2 transition-all duration-100",
              "bg-card hover:bg-primary/15 active:scale-95",
              feedback && index === correctIndex && "bg-green-500/20 border-green-500",
              feedback === "wrong" && index !== correctIndex && "opacity-25",
              !feedback && "border-border hover:border-primary"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={cn(
          "mt-4 text-2xl font-bold",
          feedback === "correct" ? "text-green-400" : "text-red-400"
        )}>
          {feedback === "correct" ? "⚡" : "💨"}
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
