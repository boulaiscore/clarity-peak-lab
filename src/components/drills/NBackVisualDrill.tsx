import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Circle, Square, Triangle, Star, Diamond } from "lucide-react";

interface NBackVisualDrillProps {
  config: {
    nBack: number;
    shapes: string[];
    displayTime: number;
    intervalTime: number;
    totalTrials: number;
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; incorrect: number; accuracy: number }) => void;
}

type ShapeName = "circle" | "square" | "triangle" | "star" | "diamond";

const SHAPE_COMPONENTS: Record<ShapeName, React.ComponentType<{ className?: string }>> = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
  star: Star,
  diamond: Diamond
};

export function NBackVisualDrill({ config, timeLimit, onComplete }: NBackVisualDrillProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [currentShape, setCurrentShape] = useState<string | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [showShape, setShowShape] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [responded, setResponded] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  
  const isMatchRef = useRef(false);

  const generateNextShape = useCallback(() => {
    const shapes = config.shapes;
    
    // 30% chance of match if we have enough history
    if (history.length >= config.nBack && Math.random() < 0.3) {
      return history[history.length - config.nBack];
    }
    
    // Otherwise random (but try to avoid accidental match)
    let shape: string;
    do {
      shape = shapes[Math.floor(Math.random() * shapes.length)];
    } while (history.length >= config.nBack && shape === history[history.length - config.nBack] && Math.random() > 0.5);
    
    return shape;
  }, [history, config.shapes, config.nBack]);

  const nextTrial = useCallback(() => {
    if (trialIndex >= config.totalTrials) {
      setIsComplete(true);
      return;
    }
    
    const nextShape = generateNextShape();
    const isMatch = history.length >= config.nBack && nextShape === history[history.length - config.nBack];
    isMatchRef.current = isMatch;
    
    setCurrentShape(nextShape);
    setHistory(prev => [...prev, nextShape]);
    setShowShape(true);
    setResponded(false);
    setFeedback(null);
    
    // Hide shape after display time
    setTimeout(() => {
      setShowShape(false);
      
      // Check if user didn't respond
      setTimeout(() => {
        if (!responded) {
          // If it was a match and they didn't respond, that's wrong
          if (isMatchRef.current) {
            setIncorrect(i => i + 1);
          }
          setTrialIndex(i => i + 1);
          nextTrial();
        }
      }, config.intervalTime);
    }, config.displayTime);
  }, [trialIndex, config.totalTrials, config.displayTime, config.intervalTime, generateNextShape, history, responded, config.nBack]);

  // Start game
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaiting(false);
      nextTrial();
    }, 2000);
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

  // Complete
  useEffect(() => {
    if (isComplete) {
      const total = correct + incorrect;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      onComplete({ score, correct, incorrect, accuracy });
    }
  }, [isComplete, score, correct, incorrect, onComplete]);

  const handleResponse = (userSaysMatch: boolean) => {
    if (responded || !currentShape) return;
    
    setResponded(true);
    const isCorrect = userSaysMatch === isMatchRef.current;
    
    if (isCorrect) {
      setCorrect(c => c + 1);
      setScore(s => s + 10);
      setFeedback("correct");
    } else {
      setIncorrect(i => i + 1);
      setFeedback("wrong");
    }
    
    setTimeout(() => {
      setTrialIndex(i => i + 1);
      nextTrial();
    }, 500);
  };

  const ShapeComponent = currentShape ? SHAPE_COMPONENTS[currentShape as ShapeName] : null;

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
            <p className="text-lg font-bold text-muted-foreground">{trialIndex + 1}/{config.totalTrials}</p>
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
        {isWaiting ? (
          <div className="text-center">
            <p className="text-xl font-bold text-primary animate-pulse">Get Ready...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Tap MATCH when shape equals {config.nBack === 1 ? "previous" : `${config.nBack} back`}
            </p>
          </div>
        ) : (
          <>
            {/* Shape Display */}
            <div className={cn(
              "w-32 h-32 rounded-2xl border-2 flex items-center justify-center mb-8 transition-all duration-200",
              showShape ? "bg-primary/20 border-primary" : "bg-card/50 border-border/50"
            )}>
              {showShape && ShapeComponent && (
                <ShapeComponent className="w-20 h-20 text-primary animate-in zoom-in-50 duration-200" />
              )}
            </div>

            {/* Feedback */}
            {feedback && (
              <p className={cn(
                "text-lg font-bold mb-4",
                feedback === "correct" ? "text-green-500" : "text-red-500"
              )}>
                {feedback === "correct" ? "Correct!" : "Wrong!"}
              </p>
            )}

            {/* Response Buttons */}
            <div className="flex gap-4 w-full max-w-xs">
              <button
                onClick={() => handleResponse(true)}
                disabled={responded || !showShape}
                className={cn(
                  "flex-1 py-4 rounded-xl font-bold transition-all",
                  "bg-green-500/20 text-green-500 border-2 border-green-500/50",
                  "hover:bg-green-500/30 active:scale-95",
                  (responded || !showShape) && "opacity-50"
                )}
              >
                MATCH
              </button>
              <button
                onClick={() => handleResponse(false)}
                disabled={responded || !showShape}
                className={cn(
                  "flex-1 py-4 rounded-xl font-bold transition-all",
                  "bg-red-500/20 text-red-500 border-2 border-red-500/50",
                  "hover:bg-red-500/30 active:scale-95",
                  (responded || !showShape) && "opacity-50"
                )}
              >
                NO MATCH
              </button>
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 bg-card/30 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground">
          {config.nBack}-Back: Compare current shape to the one from {config.nBack} step{config.nBack > 1 ? "s" : ""} ago
        </p>
      </div>
    </div>
  );
}
