import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ColorHarmonyDrillProps {
  config: {
    trialsCount: number;
    timePerTrial: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; avgReactionTime: number }) => void;
}

type ColorSet = {
  palette: string[];  // 3 colors that harmonize
  match: string;      // the matching color
  clashes: string[];  // 3 clashing colors
};

// Aesthetic color harmony - pick by feeling
const COLOR_SETS: ColorSet[] = [
  { palette: ["#FF6B6B", "#FF8E8E", "#FFB4B4"], match: "#FFD4D4", clashes: ["#00FF00", "#0000FF", "#FFFF00"] },
  { palette: ["#4ECDC4", "#45B7AA", "#3CA99E"], match: "#339B92", clashes: ["#FF0000", "#FF00FF", "#FFA500"] },
  { palette: ["#667EEA", "#764BA2", "#6B8DD6"], match: "#5C6BC0", clashes: ["#00FF00", "#FFFF00", "#FF6600"] },
  { palette: ["#F093FB", "#F5576C", "#FA709A"], match: "#FF85A2", clashes: ["#00FF00", "#006400", "#32CD32"] },
  { palette: ["#43E97B", "#38F9D7", "#4FFFB0"], match: "#72FFB8", clashes: ["#FF0000", "#8B0000", "#DC143C"] },
  { palette: ["#FA709A", "#FEE140", "#FFA07A"], match: "#FFB347", clashes: ["#0000FF", "#000080", "#4169E1"] },
  { palette: ["#A8EDEA", "#FED6E3", "#D4FCF6"], match: "#E8F8F5", clashes: ["#8B0000", "#FF4500", "#FF0000"] },
  { palette: ["#2C3E50", "#34495E", "#2E4053"], match: "#1C2833", clashes: ["#FFFF00", "#00FF00", "#FF00FF"] },
  { palette: ["#E74C3C", "#C0392B", "#D35400"], match: "#E67E22", clashes: ["#00CED1", "#00FFFF", "#40E0D0"] },
  { palette: ["#9B59B6", "#8E44AD", "#7D3C98"], match: "#6C3483", clashes: ["#ADFF2F", "#7FFF00", "#00FF7F"] },
];

function getRandomColorSet(): { palette: string[]; options: string[]; correctIndex: number } {
  const set = COLOR_SETS[Math.floor(Math.random() * COLOR_SETS.length)];
  const correctIndex = Math.floor(Math.random() * 4);
  const options = [...set.clashes];
  options.splice(correctIndex, 0, set.match);
  return { palette: set.palette, options, correctIndex };
}

export function ColorHarmonyDrill({ config, timeLimit, onComplete }: ColorHarmonyDrillProps) {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [trialStartTime, setTrialStartTime] = useState(Date.now());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentPalette, setCurrentPalette] = useState<string[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const generateTrial = () => {
    const { palette, options, correctIndex: idx } = getRandomColorSet();
    setCurrentPalette(palette);
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
        Pick the color that fits
      </p>

      {/* Palette display */}
      <div className="flex items-center gap-2 mb-6 p-4 bg-card rounded-xl border border-border">
        {currentPalette.map((color, i) => (
          <div 
            key={i} 
            className="w-14 h-14 rounded-lg shadow-md"
            style={{ backgroundColor: color }}
          />
        ))}
        <div className="w-14 h-14 rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center">
          <span className="text-primary text-xl">?</span>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {currentOptions.map((color, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={!!feedback}
            className={cn(
              "w-20 h-20 rounded-xl shadow-lg",
              "border-4 transition-all duration-150",
              "hover:scale-110",
              feedback && index === correctIndex && "ring-4 ring-green-500 scale-110",
              feedback === "wrong" && index !== correctIndex && "opacity-30",
              !feedback && "border-transparent hover:border-primary/50"
            )}
            style={{ backgroundColor: color }}
          />
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
