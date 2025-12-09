// Shape Match Drill - Tap when two consecutive shapes are identical
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShapeMatchDrillProps {
  config: {
    shapes: string[];
    displayTime: number;
    totalTrials: number;
    matchProbability?: number;
  };
  timeLimit: number;
  onComplete: (result: { correct: number; total: number; avgReactionTime: number }) => void;
}

const SHAPE_RENDERS: Record<string, (size: number, color: string) => JSX.Element> = {
  circle: (size, color) => (
    <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
  ),
  square: (size, color) => (
    <div style={{ width: size, height: size, backgroundColor: color }} />
  ),
  triangle: (size, color) => (
    <div style={{
      width: 0, height: 0,
      borderLeft: `${size/2}px solid transparent`,
      borderRight: `${size/2}px solid transparent`,
      borderBottom: `${size}px solid ${color}`
    }} />
  ),
  diamond: (size, color) => (
    <div style={{
      width: size, height: size, backgroundColor: color,
      transform: "rotate(45deg)"
    }} />
  ),
  star: (size, color) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
    </svg>
  ),
};

const COLORS = ["#6C5CE7", "#00B894", "#FD79A8", "#FDCB6E", "#74B9FF"];

export function ShapeMatchDrill({ config, timeLimit, onComplete }: ShapeMatchDrillProps) {
  const [currentShape, setCurrentShape] = useState<{ shape: string; color: string } | null>(null);
  const [previousShape, setPreviousShape] = useState<{ shape: string; color: string } | null>(null);
  const [trial, setTrial] = useState(0);
  const [showShape, setShowShape] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [shapeShownAt, setShapeShownAt] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [matchSequence, setMatchSequence] = useState<boolean[]>([]);

  const shapes = config.shapes || ["circle", "square", "triangle", "diamond", "star"];
  const displayTime = config.displayTime || 1200;
  const totalTrials = config.totalTrials || 15;
  const matchProb = config.matchProbability || 0.3;

  // Generate match sequence on mount
  useEffect(() => {
    const sequence: boolean[] = [];
    for (let i = 0; i < totalTrials; i++) {
      sequence.push(Math.random() < matchProb);
    }
    setMatchSequence(sequence);
  }, [totalTrials, matchProb]);

  const showNextShape = useCallback(() => {
    if (trial >= totalTrials) {
      setIsComplete(true);
      const avgRT = reactionTimes.length > 0 
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;
      onComplete({ correct, total: totalTrials, avgReactionTime: avgRT });
      return;
    }

    // Store the shape that was just shown as "previous" for comparison
    const shapeToCompareWith = currentShape;
    
    const isMatch = matchSequence[trial] && shapeToCompareWith;
    let newShape: { shape: string; color: string };
    
    if (isMatch && shapeToCompareWith) {
      // For a match, copy both shape AND color
      newShape = { shape: shapeToCompareWith.shape, color: shapeToCompareWith.color };
    } else {
      // For non-match, pick a different shape
      const availableShapes = shapeToCompareWith 
        ? shapes.filter(s => s !== shapeToCompareWith.shape) 
        : shapes;
      newShape = {
        shape: availableShapes[Math.floor(Math.random() * availableShapes.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }

    // Update previous BEFORE setting current
    setPreviousShape(shapeToCompareWith);
    setCurrentShape(newShape);
    setShowShape(true);
    setCanRespond(true);
    setShapeShownAt(Date.now());
    setFeedback(null);

    setTimeout(() => {
      setShowShape(false);
      setCanRespond(false);
      
      setTrial(prev => prev + 1);
      
      setTimeout(() => {
        showNextShape();
      }, 400);
    }, displayTime);
  }, [trial, totalTrials, matchSequence, currentShape, shapes, displayTime, onComplete, correct, reactionTimes]);

  useEffect(() => {
    if (matchSequence.length > 0 && trial === 0 && !currentShape) {
      setTimeout(showNextShape, 500);
    }
  }, [matchSequence, trial, currentShape, showNextShape]);

  const handleResponse = (userSaysMatch: boolean) => {
    if (!canRespond) return;
    setCanRespond(false);

    const isActualMatch = previousShape && currentShape && 
      previousShape.shape === currentShape.shape;
    const wasCorrect = userSaysMatch === !!isActualMatch;

    if (wasCorrect) {
      setCorrect(prev => prev + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    const rt = Date.now() - shapeShownAt;
    setReactionTimes(prev => [...prev, rt]);
  };

  if (isComplete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">✓</div>
        <p className="text-xl font-semibold">Drill Complete!</p>
        <p className="text-muted-foreground mt-2">
          {correct} / {totalTrials} correct
        </p>
      </div>
    );
  }

  const ShapeComponent = currentShape ? SHAPE_RENDERS[currentShape.shape] : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      {/* Progress */}
      <div className="w-full max-w-xs mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Trial {Math.min(trial + 1, totalTrials)} / {totalTrials}</span>
          <span>Correct: {correct}</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${(trial / totalTrials) * 100}%` }}
          />
        </div>
      </div>

      {/* Shape Display */}
      <div className={cn(
        "w-40 h-40 rounded-2xl border-2 border-dashed border-border flex items-center justify-center mb-8 transition-all duration-200",
        showShape && "border-primary bg-primary/5",
        feedback === "correct" && "border-green-500 bg-green-500/10",
        feedback === "wrong" && "border-red-500 bg-red-500/10"
      )}>
        {showShape && ShapeComponent && (
          <div className="animate-scale-in">
            {ShapeComponent(80, currentShape!.color)}
          </div>
        )}
        {feedback === "correct" && <span className="text-4xl text-green-500">✓</span>}
        {feedback === "wrong" && <span className="text-4xl text-red-500">✗</span>}
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Tap MATCH if this shape is the same as the previous one
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