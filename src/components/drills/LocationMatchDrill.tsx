// Location Match Drill - Tap when dot appears in same position as before
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationMatchDrillProps {
  config: {
    gridSize: number;
    trialsCount: number;
    displayTime: number;
    matchProbability: number;
  };
  timeLimit: number;
  onComplete: (result: { correct: number; total: number; avgReactionTime: number }) => void;
}

export function LocationMatchDrill({ config, timeLimit, onComplete }: LocationMatchDrillProps) {
  const [trial, setTrial] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<number | null>(null);
  const [previousPosition, setPreviousPosition] = useState<number | null>(null);
  const [showDot, setShowDot] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  const [matchSequence, setMatchSequence] = useState<boolean[]>([]);

  const dotShownAt = useRef(0);
  const respondedThisTrial = useRef(false);

  const gridSize = config.gridSize || 3;
  const trialsCount = config.trialsCount || 15;
  const displayTime = config.displayTime || 1500;
  const matchProbability = config.matchProbability || 0.3;
  const totalCells = gridSize * gridSize;

  // Generate match sequence on mount
  useEffect(() => {
    const sequence: boolean[] = [];
    for (let i = 0; i < trialsCount; i++) {
      sequence.push(i > 0 && Math.random() < matchProbability);
    }
    setMatchSequence(sequence);
  }, [trialsCount, matchProbability]);

  const runTrial = useCallback(() => {
    if (trial >= trialsCount) {
      setIsComplete(true);
      const avgRT = reactionTimes.length > 0 
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
      onComplete({ correct, total: trialsCount, avgReactionTime: avgRT });
      return;
    }

    // Determine position
    const isMatch = matchSequence[trial] && previousPosition !== null;
    let newPosition: number;
    
    if (isMatch) {
      newPosition = previousPosition!;
    } else {
      // Pick a different position
      const availablePositions = Array.from({ length: totalCells }, (_, i) => i)
        .filter(p => p !== previousPosition);
      newPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    }

    setPreviousPosition(currentPosition);
    setCurrentPosition(newPosition);
    setShowDot(true);
    setCanRespond(true);
    respondedThisTrial.current = false;
    dotShownAt.current = Date.now();
    setFeedback(null);

    // Hide dot after display time
    setTimeout(() => {
      setShowDot(false);
      setCanRespond(false);
      
      // If no response was made
      if (!respondedThisTrial.current) {
        // If it was a match, this is a miss
        if (isMatch) {
          // Don't count as correct
        }
      }

      setTimeout(() => {
        setTrial(prev => prev + 1);
      }, 400);
    }, displayTime);
  }, [trial, trialsCount, matchSequence, previousPosition, currentPosition, totalCells, displayTime, correct, reactionTimes, onComplete]);

  useEffect(() => {
    if (matchSequence.length > 0 && trial === 0 && currentPosition === null) {
      setTimeout(runTrial, 500);
    } else if (matchSequence.length > 0 && trial > 0 && !showDot && feedback === null) {
      runTrial();
    }
  }, [matchSequence, trial, currentPosition, showDot, feedback, runTrial]);

  const handleResponse = (userSaysMatch: boolean) => {
    if (!canRespond || respondedThisTrial.current) return;
    respondedThisTrial.current = true;

    const isActualMatch = previousPosition !== null && currentPosition === previousPosition;
    const wasCorrect = userSaysMatch === isActualMatch;

    if (wasCorrect) {
      setCorrect(prev => prev + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    const rt = Date.now() - dotShownAt.current;
    setReactionTimes(prev => [...prev, rt]);
  };

  if (isComplete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">📍</div>
        <p className="text-xl font-semibold">Drill Complete!</p>
        <p className="text-muted-foreground mt-2">
          {correct} / {trialsCount} correct
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Avg RT: {reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a,b) => a+b, 0) / reactionTimes.length) : 0}ms
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      {/* Progress */}
      <div className="w-full max-w-xs mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Trial {Math.min(trial + 1, trialsCount)} / {trialsCount}</span>
          <span>Correct: {correct}</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${(trial / trialsCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Grid */}
      <div 
        className={cn(
          "grid gap-2 p-4 rounded-xl border-2 border-dashed border-border bg-card/30 mb-8",
          feedback === "correct" && "border-green-500",
          feedback === "wrong" && "border-red-500"
        )}
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          width: gridSize * 60 + (gridSize - 1) * 8 + 32
        }}
      >
        {Array.from({ length: totalCells }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-12 h-12 rounded-lg transition-all duration-200",
              showDot && currentPosition === i 
                ? "bg-primary" 
                : "bg-muted/30"
            )}
          />
        ))}
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Tap MATCH if the dot is in the same position as the previous trial
      </p>

      {/* Response Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => handleResponse(false)}
          disabled={!canRespond}
          className="w-32"
        >
          Different
        </Button>
        <Button 
          size="lg"
          onClick={() => handleResponse(true)}
          disabled={!canRespond}
          className="w-32"
        >
          MATCH
        </Button>
      </div>
    </div>
  );
}