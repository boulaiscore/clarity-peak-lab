import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface StroopDrillProps {
  config: {
    words: string[];
    colors: string[];
    trialsCount: number;
    timePerTrial: number;
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; incorrect: number; avgReactionTime: number }) => void;
}

interface Trial {
  word: string;
  displayColor: string;
  correctColorIndex: number;
}

export function StroopDrill({ config, timeLimit, onComplete }: StroopDrillProps) {
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [trialStartTime, setTrialStartTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const colorNames = ["RED", "BLUE", "GREEN", "YELLOW"];

  const generateTrial = useCallback((): Trial => {
    // Pick a random word
    const wordIndex = Math.floor(Math.random() * config.words.length);
    const word = config.words[wordIndex];
    
    // Pick a DIFFERENT color to display (creates Stroop effect)
    let colorIndex: number;
    do {
      colorIndex = Math.floor(Math.random() * config.colors.length);
    } while (colorIndex === wordIndex && Math.random() > 0.3); // 30% congruent trials
    
    return {
      word,
      displayColor: config.colors[colorIndex],
      correctColorIndex: colorIndex
    };
  }, [config.words, config.colors]);

  const startNextTrial = useCallback(() => {
    if (trialIndex >= config.trialsCount) {
      setIsComplete(true);
      return;
    }
    
    setCurrentTrial(generateTrial());
    setTrialStartTime(Date.now());
    setFeedback(null);
  }, [trialIndex, config.trialsCount, generateTrial]);

  // Start first trial
  useEffect(() => {
    const timer = setTimeout(() => {
      startNextTrial();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Timer
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

  // Complete
  useEffect(() => {
    if (isComplete) {
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      onComplete({ score, correct, incorrect, avgReactionTime });
    }
  }, [isComplete, score, correct, incorrect, reactionTimes, onComplete]);

  const handleColorSelect = (colorIndex: number) => {
    if (!currentTrial || feedback) return;
    
    const reactionTime = Date.now() - trialStartTime;
    setReactionTimes(prev => [...prev, reactionTime]);
    
    if (colorIndex === currentTrial.correctColorIndex) {
      setCorrect(c => c + 1);
      setScore(s => s + Math.max(10, 50 - Math.floor(reactionTime / 100)));
      setFeedback("correct");
    } else {
      setIncorrect(i => i + 1);
      setFeedback("wrong");
    }
    
    setTimeout(() => {
      setTrialIndex(i => i + 1);
      startNextTrial();
    }, 500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/50 border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-lg font-bold text-primary">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Correct</p>
            <p className="text-lg font-bold text-green-500">{correct}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Trial</p>
            <p className="text-lg font-bold text-muted-foreground">{trialIndex + 1}/{config.trialsCount}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Time</p>
          <p className={cn("text-lg font-bold", timeLeft <= 10 ? "text-red-500" : "text-foreground")}>
            {timeLeft}s
          </p>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!currentTrial ? (
          <p className="text-xl font-bold text-primary animate-pulse">Get Ready...</p>
        ) : (
          <>
            {/* Display Word */}
            <div className="mb-12">
              <p 
                className={cn(
                  "text-5xl font-black tracking-wider transition-all",
                  feedback === "correct" && "scale-110",
                  feedback === "wrong" && "opacity-50"
                )}
                style={{ color: currentTrial.displayColor }}
              >
                {currentTrial.word}
              </p>
            </div>

            {/* Feedback */}
            {feedback && (
              <p className={cn(
                "text-lg font-bold mb-4",
                feedback === "correct" ? "text-green-500" : "text-red-500"
              )}>
                {feedback === "correct" ? "✓" : "✗"}
              </p>
            )}

            {/* Color Options */}
            <p className="text-sm text-muted-foreground mb-4">
              Tap the COLOR you see (not the word):
            </p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              {config.colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorSelect(index)}
                  disabled={!!feedback}
                  className={cn(
                    "py-4 px-6 rounded-xl font-bold text-white transition-all",
                    "active:scale-95 hover:brightness-110",
                    feedback && "opacity-50"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {colorNames[index]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 bg-card/30 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">
          The Stroop effect: Your brain reads words automatically. Override this to select the COLOR!
        </p>
      </div>
    </div>
  );
}
