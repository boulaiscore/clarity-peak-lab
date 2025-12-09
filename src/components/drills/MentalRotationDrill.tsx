// Mental Rotation Drill - Decide if rotated shape is same or different
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MentalRotationDrillProps {
  config: {
    trialsCount: number;
    timePerTrial: number;
  };
  timeLimit: number;
  onComplete: (result: { correct: number; total: number; avgReactionTime: number }) => void;
}

// Generate a random L-shaped block pattern
function generateShape(): number[][] {
  const patterns = [
    [[1,0,0], [1,0,0], [1,1,0]], // L shape
    [[1,1,0], [0,1,0], [0,1,1]], // S shape
    [[1,1,1], [1,0,0], [0,0,0]], // T variant
    [[1,0,0], [1,1,1], [0,0,1]], // Z shape
    [[0,1,0], [1,1,1], [0,1,0]], // + shape
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Rotate a shape matrix 90 degrees clockwise
function rotateShape(shape: number[][]): number[][] {
  const n = shape.length;
  const rotated: number[][] = [];
  for (let i = 0; i < n; i++) {
    rotated.push([]);
    for (let j = 0; j < n; j++) {
      rotated[i].push(shape[n - 1 - j][i]);
    }
  }
  return rotated;
}

// Mirror a shape horizontally
function mirrorShape(shape: number[][]): number[][] {
  return shape.map(row => [...row].reverse());
}

// Render a shape as blocks
function ShapeDisplay({ shape, size = 80 }: { shape: number[][]; size?: number }) {
  const blockSize = size / shape.length;
  return (
    <div className="flex flex-col gap-0.5">
      {shape.map((row, i) => (
        <div key={i} className="flex gap-0.5">
          {row.map((cell, j) => (
            <div
              key={j}
              className={cn(
                "transition-all",
                cell === 1 ? "bg-primary" : "bg-transparent"
              )}
              style={{ width: blockSize, height: blockSize }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MentalRotationDrill({ config, timeLimit, onComplete }: MentalRotationDrillProps) {
  const [trial, setTrial] = useState(0);
  const [originalShape, setOriginalShape] = useState<number[][] | null>(null);
  const [comparisonShape, setComparisonShape] = useState<number[][] | null>(null);
  const [isSame, setIsSame] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [trialStart, setTrialStart] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [canRespond, setCanRespond] = useState(false);

  const trialsCount = config.trialsCount || 8;

  const startNewTrial = useCallback(() => {
    if (trial >= trialsCount) {
      setIsComplete(true);
      const avgRT = reactionTimes.length > 0 
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
      onComplete({ correct, total: trialsCount, avgReactionTime: avgRT });
      return;
    }

    const shape = generateShape();
    setOriginalShape(shape);
    
    // Randomly decide if same (rotated) or different (mirrored)
    const willBeSame = Math.random() > 0.5;
    setIsSame(willBeSame);
    
    // Apply rotations
    const rotations = Math.floor(Math.random() * 3) + 1; // 1-3 rotations (90, 180, 270)
    let comparison = shape;
    for (let i = 0; i < rotations; i++) {
      comparison = rotateShape(comparison);
    }
    
    // If different, also mirror it
    if (!willBeSame) {
      comparison = mirrorShape(comparison);
    }
    
    setComparisonShape(comparison);
    setTrialStart(Date.now());
    setFeedback(null);
    setCanRespond(true);
  }, [trial, trialsCount, correct, reactionTimes, onComplete]);

  useEffect(() => {
    if (!originalShape && trial === 0) {
      setTimeout(startNewTrial, 500);
    }
  }, [originalShape, trial, startNewTrial]);

  const handleResponse = (userSaysSame: boolean) => {
    if (!canRespond) return;
    setCanRespond(false);

    const wasCorrect = userSaysSame === isSame;
    if (wasCorrect) {
      setCorrect(prev => prev + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    const rt = Date.now() - trialStart;
    setReactionTimes(prev => [...prev, rt]);

    setTimeout(() => {
      setTrial(prev => prev + 1);
      setTimeout(startNewTrial, 300);
    }, 800);
  };

  if (isComplete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🧠</div>
        <p className="text-xl font-semibold">Drill Complete!</p>
        <p className="text-muted-foreground mt-2">
          {correct} / {trialsCount} correct
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

      {/* Shapes Display */}
      <div className="flex items-center gap-8 mb-8">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">Original</p>
          <div className={cn(
            "p-4 rounded-xl border-2 border-dashed border-border bg-card/50",
            feedback === "correct" && "border-green-500",
            feedback === "wrong" && "border-red-500"
          )}>
            {originalShape && <ShapeDisplay shape={originalShape} size={90} />}
          </div>
        </div>

        <div className="text-2xl text-muted-foreground">=?</div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">Rotated</p>
          <div className={cn(
            "p-4 rounded-xl border-2 border-dashed border-border bg-card/50",
            feedback === "correct" && "border-green-500",
            feedback === "wrong" && "border-red-500"
          )}>
            {comparisonShape && <ShapeDisplay shape={comparisonShape} size={90} />}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Are these the same shape, just rotated?
      </p>

      {/* Response Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => handleResponse(false)}
          disabled={!canRespond}
          className="w-36"
        >
          Different
        </Button>
        <Button 
          size="lg"
          onClick={() => handleResponse(true)}
          disabled={!canRespond}
          className="w-36"
        >
          Same (Rotated)
        </Button>
      </div>

      {feedback && (
        <p className={cn(
          "mt-4 text-sm font-medium",
          feedback === "correct" ? "text-green-500" : "text-red-500"
        )}>
          {feedback === "correct" ? "Correct!" : `Wrong - They were ${isSame ? "the same" : "different"}`}
        </p>
      )}
    </div>
  );
}