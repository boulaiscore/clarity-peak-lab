import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MemoryMatrixDrillProps {
  config: {
    gridSize: number;
    colors: string[];
    startingLength: number;
    maxLength: number;
    flashDuration: number;
    pauseBetween: number;
  };
  timeLimit: number;
  onComplete: (result: { score: number; maxLevel: number; totalCorrect: number }) => void;
}

type GamePhase = "waiting" | "showing" | "input" | "feedback" | "complete";

export function MemoryMatrixDrill({ config, timeLimit, onComplete }: MemoryMatrixDrillProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [currentFlash, setCurrentFlash] = useState<number | null>(null);
  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const buttonCount = config.gridSize * config.gridSize;
  const currentLength = config.startingLength + level - 1;

  const generateSequence = useCallback(() => {
    const newSequence: number[] = [];
    for (let i = 0; i < Math.min(currentLength, config.maxLength); i++) {
      newSequence.push(Math.floor(Math.random() * buttonCount));
    }
    return newSequence;
  }, [currentLength, buttonCount, config.maxLength]);

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase("showing");
    
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, config.pauseBetween));
      setCurrentFlash(seq[i]);
      await new Promise(resolve => setTimeout(resolve, config.flashDuration));
      setCurrentFlash(null);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    setPhase("input");
  }, [config.flashDuration, config.pauseBetween]);

  const startRound = useCallback(() => {
    const newSequence = generateSequence();
    setSequence(newSequence);
    setUserSequence([]);
    playSequence(newSequence);
  }, [generateSequence, playSequence]);

  // Start game
  useEffect(() => {
    const timer = setTimeout(() => {
      startRound();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Timer
  useEffect(() => {
    if (phase === "complete") return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase("complete");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [phase]);

  // Complete
  useEffect(() => {
    if (phase === "complete") {
      onComplete({ score, maxLevel, totalCorrect });
    }
  }, [phase, score, maxLevel, totalCorrect, onComplete]);

  const handleButtonPress = (index: number) => {
    if (phase !== "input") return;
    
    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);
    
    // Check if correct so far
    const isCorrectSoFar = newUserSequence.every((val, idx) => val === sequence[idx]);
    
    if (!isCorrectSoFar) {
      // Wrong
      setFeedback("wrong");
      setPhase("feedback");
      
      setTimeout(() => {
        setFeedback(null);
        if (level > 1) {
          setLevel(l => l - 1);
        }
        startRound();
      }, 1000);
      return;
    }
    
    // Check if complete
    if (newUserSequence.length === sequence.length) {
      setFeedback("correct");
      setPhase("feedback");
      setScore(s => s + currentLength * 10);
      setTotalCorrect(t => t + 1);
      setMaxLevel(m => Math.max(m, level));
      
      setTimeout(() => {
        setFeedback(null);
        if (currentLength < config.maxLength) {
          setLevel(l => l + 1);
        }
        startRound();
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/50 border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Level</p>
            <p className="text-lg font-bold text-primary">{level}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-lg font-bold text-foreground">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Sequence</p>
            <p className="text-lg font-bold text-muted-foreground">{currentLength}</p>
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
        {phase === "waiting" && (
          <p className="text-xl font-bold text-primary animate-pulse mb-8">Get Ready...</p>
        )}
        
        {phase === "showing" && (
          <p className="text-lg text-muted-foreground mb-8">Watch the sequence...</p>
        )}
        
        {phase === "input" && (
          <p className="text-lg text-foreground mb-8">
            Your turn! ({userSequence.length}/{sequence.length})
          </p>
        )}
        
        {feedback && (
          <p className={cn(
            "text-xl font-bold mb-8",
            feedback === "correct" ? "text-green-500" : "text-red-500"
          )}>
            {feedback === "correct" ? "Correct!" : "Wrong!"}
          </p>
        )}

        {/* Simon Grid */}
        <div 
          className="grid gap-4"
          style={{ 
            gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
            width: "min(100%, 320px)"
          }}
        >
          {Array.from({ length: buttonCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleButtonPress(index)}
              disabled={phase !== "input"}
              className={cn(
                "aspect-square rounded-xl transition-all duration-150 border-2",
                currentFlash === index
                  ? "scale-105 brightness-150 shadow-lg"
                  : "opacity-80 hover:opacity-100",
                phase === "input" && "cursor-pointer active:scale-95",
                phase !== "input" && "cursor-default"
              )}
              style={{
                backgroundColor: config.colors[index % config.colors.length],
                borderColor: currentFlash === index ? "white" : "transparent",
                boxShadow: currentFlash === index 
                  ? `0 0 30px ${config.colors[index % config.colors.length]}` 
                  : undefined
              }}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 bg-card/30 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">
          Watch the pattern, then repeat it. Level up by matching longer sequences!
        </p>
      </div>
    </div>
  );
}
