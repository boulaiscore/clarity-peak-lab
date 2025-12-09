import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface VisualSearchDrillProps {
  config: {
    gridSize: number;
    targetShape: string;
    distractorShape: string;
    trialsCount: number;
    timePerTrial: number;
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; avgReactionTime: number }) => void;
}

interface Cell {
  id: number;
  isTarget: boolean;
  rotation: number;
}

export function VisualSearchDrill({ config, timeLimit, onComplete }: VisualSearchDrillProps) {
  const [grid, setGrid] = useState<Cell[]>([]);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [trialStartTime, setTrialStartTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const totalCells = config.gridSize * config.gridSize;

  const generateGrid = useCallback(() => {
    const cells: Cell[] = [];
    const target = Math.floor(Math.random() * totalCells);
    setTargetIndex(target);
    
    for (let i = 0; i < totalCells; i++) {
      cells.push({
        id: i,
        isTarget: i === target,
        rotation: Math.floor(Math.random() * 4) * 90
      });
    }
    
    return cells;
  }, [totalCells]);

  const startNextTrial = useCallback(() => {
    if (trialIndex >= config.trialsCount) {
      setIsComplete(true);
      return;
    }
    
    setGrid(generateGrid());
    setTrialStartTime(Date.now());
    setFeedback(null);
  }, [trialIndex, config.trialsCount, generateGrid]);

  // Start game
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaiting(false);
      startNextTrial();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Timer
  useEffect(() => {
    if (isComplete || isWaiting) return;
    
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
  }, [isComplete, isWaiting]);

  // Complete - use ref to prevent infinite loop
  useEffect(() => {
    if (isComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      onCompleteRef.current({ score, correct, avgReactionTime });
    }
  }, [isComplete, score, correct, reactionTimes]);

  const handleCellTap = (cell: Cell) => {
    if (feedback || isWaiting) return;
    
    const reactionTime = Date.now() - trialStartTime;
    
    if (cell.isTarget) {
      setReactionTimes(prev => [...prev, reactionTime]);
      setCorrect(c => c + 1);
      setScore(s => s + Math.max(10, 50 - Math.floor(reactionTime / 100)));
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
    
    setTimeout(() => {
      setTrialIndex(i => i + 1);
      startNextTrial();
    }, 600);
  };

  // Render shape
  const renderShape = (cell: Cell) => {
    const shape = cell.isTarget ? config.targetShape : config.distractorShape;
    const size = 32;
    
    if (shape === "T") {
      return (
        <div 
          className="flex flex-col items-center text-primary font-bold text-2xl"
          style={{ transform: `rotate(${cell.rotation}deg)` }}
        >
          T
        </div>
      );
    }
    
    return (
      <div 
        className="flex flex-col items-center text-muted-foreground font-bold text-2xl"
        style={{ transform: `rotate(${cell.rotation}deg)` }}
      >
        L
      </div>
    );
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
            <p className="text-xs text-muted-foreground">Found</p>
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
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isWaiting ? (
          <div className="text-center">
            <p className="text-xl font-bold text-primary animate-pulse">Get Ready...</p>
            <p className="text-sm text-muted-foreground mt-2">Find the "T" among the "L"s!</p>
          </div>
        ) : (
          <>
            {feedback && (
              <p className={cn(
                "text-xl font-bold mb-4",
                feedback === "correct" ? "text-green-500" : "text-red-500"
              )}>
                {feedback === "correct" ? "Found it!" : "Not quite!"}
              </p>
            )}

            {/* Grid */}
            <div 
              className="grid gap-2"
              style={{ 
                gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
                width: "min(100%, 320px)"
              }}
            >
              {grid.map(cell => (
                <button
                  key={cell.id}
                  onClick={() => handleCellTap(cell)}
                  disabled={!!feedback}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center transition-all",
                    "bg-card/50 border border-border/50 hover:border-primary/40",
                    "active:scale-95",
                    feedback && cell.isTarget && "bg-green-500/20 border-green-500"
                  )}
                >
                  {renderShape(cell)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Target Indicator */}
      <div className="px-4 py-3 bg-card/30 border-t border-border/30 text-center">
        <div className="flex items-center justify-center gap-4">
          <span className="text-xs text-muted-foreground">Find:</span>
          <span className="text-lg font-bold text-primary">T</span>
          <span className="text-xs text-muted-foreground">Among:</span>
          <span className="text-lg font-bold text-muted-foreground">L L L</span>
        </div>
      </div>
    </div>
  );
}
