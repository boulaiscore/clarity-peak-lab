import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VisualVibeDrillProps {
  config: {
    trialsCount: number;
    timePerTrial: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; avgReactionTime: number }) => void;
}

type VibeSet = {
  theme: string[];  // 3 items that share a vibe
  match: string;    // the one that matches the vibe
  distractors: string[];  // 3 distractors
};

// Intuitive vibe matching - pick by feeling, not logic
const VIBE_SETS: VibeSet[] = [
  { theme: ["🌅", "🌄", "🌇"], match: "🌆", distractors: ["🏠", "📱", "🎸"] },
  { theme: ["🎷", "🎺", "🎻"], match: "🎹", distractors: ["⚽", "🚗", "📚"] },
  { theme: ["🌊", "🏄", "🐚"], match: "🏖️", distractors: ["🏔️", "🎮", "💻"] },
  { theme: ["🕯️", "🌙", "✨"], match: "💫", distractors: ["☀️", "🔊", "🏃"] },
  { theme: ["🍂", "🍁", "🌾"], match: "🎃", distractors: ["❄️", "🌸", "☀️"] },
  { theme: ["❄️", "⛄", "🧊"], match: "🌨️", distractors: ["🌴", "🔥", "🌺"] },
  { theme: ["🌸", "🌷", "🌹"], match: "🌺", distractors: ["🎮", "📱", "🔧"] },
  { theme: ["🎪", "🎡", "🎢"], match: "🎠", distractors: ["📖", "💼", "🔬"] },
  { theme: ["🏰", "👑", "⚔️"], match: "🛡️", distractors: ["📱", "🚗", "🎧"] },
  { theme: ["🚀", "🌟", "🛸"], match: "👨‍🚀", distractors: ["🏠", "🌳", "🐕"] },
  { theme: ["🧘", "🌿", "☮️"], match: "🕉️", distractors: ["💥", "🔊", "🏎️"] },
  { theme: ["🎭", "🎬", "📽️"], match: "🎥", distractors: ["🥕", "🔨", "📏"] },
  { theme: ["☕", "📖", "🧣"], match: "🔥", distractors: ["🏊", "🎸", "🚴"] },
  { theme: ["🌴", "🥥", "🌺"], match: "🏝️", distractors: ["❄️", "🏔️", "🌧️"] },
  { theme: ["🎸", "🤘", "🔊"], match: "🎤", distractors: ["📚", "🧘", "🌿"] },
];

function createRandomVibeSet(): { items: string[]; correctIndex: number } {
  const set = VIBE_SETS[Math.floor(Math.random() * VIBE_SETS.length)];
  const correctIndex = Math.floor(Math.random() * 4);
  const options = [...set.distractors];
  options.splice(correctIndex, 0, set.match);
  return { items: options, correctIndex };
}

export function VisualVibeDrill({ config, timeLimit, onComplete }: VisualVibeDrillProps) {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [trialStartTime, setTrialStartTime] = useState(Date.now());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentTheme, setCurrentTheme] = useState<string[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const generateTrial = () => {
    const set = VIBE_SETS[Math.floor(Math.random() * VIBE_SETS.length)];
    const idx = Math.floor(Math.random() * 4);
    const options = [...set.distractors];
    options.splice(idx, 0, set.match);
    setCurrentTheme(set.theme);
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
      setScore(prev => prev + Math.max(100 - Math.floor(reactionTime / 50), 10));
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
    }, 600);
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
        Which one fits the vibe?
      </p>

      {/* Theme display */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
        {currentTheme.map((item, i) => (
          <span key={i} className="text-4xl">{item}</span>
        ))}
        <span className="text-2xl text-primary font-bold">+</span>
        <span className="w-12 h-12 rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center text-xl">?</span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {currentOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={!!feedback}
            className={cn(
              "w-20 h-20 rounded-xl text-4xl flex items-center justify-center",
              "border-2 transition-all duration-150",
              "bg-card hover:bg-primary/10 hover:scale-105",
              feedback && index === correctIndex && "bg-green-500/20 border-green-500 scale-105",
              feedback === "wrong" && index !== correctIndex && "opacity-40",
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
