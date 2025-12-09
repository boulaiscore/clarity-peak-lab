import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PatternSequenceDrillProps {
  config: {
    gridSize: number;
    startingLength: number;
    maxLength: number;
    flashDuration: number;
    flashInterval: number;
  };
  timeLimit: number;
  onComplete: (result: { score: number; maxLevel: number; totalCorrect: number }) => void;
}

type Phase = "waiting" | "showing" | "input" | "feedback" | "complete";

export function PatternSequenceDrill({ config, timeLimit, onComplete }: PatternSequenceDrillProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [currentFlash, setCurrentFlash] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const totalCells = config.gridSize * config.gridSize;
  const currentLength = config.startingLength + level - 1;

  const generateSequence = useCallback(() => {
    const newSequence: number[] = [];
    for (let i = 0; i < Math.min(currentLength, config.maxLength); i++) {
      let nextCell: number;
      do {
        nextCell = Math.floor(Math.random() * totalCells);
      } while (newSequence.length > 0 && nextCell === newSequence[newSequence.length - 1]);
      newSequence.push(nextCell);
    }
    return newSequence;
  }, [currentLength, totalCells, config.maxLength]);

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase("showing");
    
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, config.flashInterval));
      setCurrentFlash(seq[i]);
      await new Promise(resolve => setTimeout(resolve, config.flashDuration));
      setCurrentFlash(null);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    setPhase("input");
  }, [config.flashDuration, config.flashInterval]);

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

  const handleCellTap = (index: number) => {
    if (phase !== "input") return;
    
    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);
    
    // Flash the tapped cell briefly
    setCurrentFlash(index);
    setTimeout(() => setCurrentFlash(null), 150);
    
    // Check if correct
    const isCorrectSoFar = newUserSequence.every((val, idx) => val === sequence[idx]);
    
    if (!isCorrectSoFar) {
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
      setScore(s => s + currentLength * 15);
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
            <p className="text-xs text-muted-foreground">Pattern</p>
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
          <p className="text-lg text-muted-foreground mb-8">Watch the pattern...</p>
        )}
        
        {phase === "input" && (
          <p className="text-lg text-foreground mb-8">
            Repeat it! ({userSequence.length}/{sequence.length})
          </p>
        )}
        
        {feedback && (
          <p className={cn(
            "text-xl font-bold mb-8",
            feedback === "correct" ? "text-green-500" : "text-red-500"
          )}>
            {feedback === "correct" ? "Perfect!" : "Try again!"}
          </p>
        )}

        {/* Grid */}
        <div 
          className="grid gap-3"
          style={{ 
            gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
            width: "min(100%, 280px)"
          }}
        >
          {Array.from({ length: totalCells }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleCellTap(index)}
              disabled={phase !== "input"}
              className={cn(
                "aspect-square rounded-xl transition-all duration-150 border-2",
                currentFlash === index
                  ? "bg-primary scale-105 border-primary shadow-lg shadow-primary/50"
                  : "bg-card/50 border-border/50 hover:border-primary/40",
                phase === "input" && "cursor-pointer active:scale-95",
                phase !== "input" && "cursor-default"
              )}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 bg-card/30 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">
          Watch which cells light up, then tap them in the same order!
        </p>
      </div>
    </div>
  );
}
