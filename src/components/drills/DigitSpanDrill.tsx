// Digit Span Drill - Remember a sequence of digits
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DigitSpanDrillProps {
  config: {
    startingLength: number;
    maxLength: number;
    displayTime: number;
    trialsPerLength: number;
  };
  timeLimit: number;
  onComplete: (result: { maxSpan: number; correct: number; total: number }) => void;
}

export function DigitSpanDrill({ config, timeLimit, onComplete }: DigitSpanDrillProps) {
  const [phase, setPhase] = useState<"showing" | "input" | "feedback">("showing");
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [spanLength, setSpanLength] = useState(config.startingLength || 3);
  const [trialInSpan, setTrialInSpan] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [maxSpan, setMaxSpan] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const startingLength = config.startingLength || 3;
  const maxLength = config.maxLength || 9;
  const displayTime = config.displayTime || 800;
  const trialsPerLength = config.trialsPerLength || 2;

  // Generate a new sequence
  const generateSequence = useCallback((length: number) => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * 10));
    }
    return seq;
  }, []);

  // Start showing a new sequence
  const startNewTrial = useCallback(() => {
    const seq = generateSequence(spanLength);
    setCurrentSequence(seq);
    setUserInput([]);
    setDisplayIndex(0);
    setPhase("showing");
    setFeedback(null);
  }, [spanLength, generateSequence]);

  // Show digits one by one
  useEffect(() => {
    if (phase !== "showing" || currentSequence.length === 0) return;

    if (displayIndex < currentSequence.length) {
      const timer = setTimeout(() => {
        setDisplayIndex(prev => prev + 1);
      }, displayTime);
      return () => clearTimeout(timer);
    } else {
      // Done showing, wait a bit then go to input phase
      const timer = setTimeout(() => {
        setPhase("input");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, displayIndex, currentSequence, displayTime]);

  // Start first trial
  useEffect(() => {
    if (currentSequence.length === 0 && !isComplete) {
      setTimeout(startNewTrial, 500);
    }
  }, [currentSequence, startNewTrial, isComplete]);

  const handleDigitInput = (digit: number) => {
    if (phase !== "input") return;
    
    const newInput = [...userInput, digit];
    setUserInput(newInput);

    // Check if input is complete
    if (newInput.length === currentSequence.length) {
      const isCorrect = newInput.every((d, i) => d === currentSequence[i]);
      setTotal(prev => prev + 1);
      
      if (isCorrect) {
        setCorrect(prev => prev + 1);
        setMaxSpan(Math.max(maxSpan, spanLength));
        setFeedback("correct");
      } else {
        setFeedback("wrong");
      }

      setPhase("feedback");

      setTimeout(() => {
        const nextTrial = trialInSpan + 1;
        
        if (nextTrial >= trialsPerLength) {
          // Move to next span length
          if (isCorrect && spanLength < maxLength) {
            setSpanLength(prev => prev + 1);
            setTrialInSpan(0);
            startNewTrial();
          } else if (!isCorrect || spanLength >= maxLength) {
            // End drill
            setIsComplete(true);
            onComplete({ 
              maxSpan: Math.max(maxSpan, isCorrect ? spanLength : spanLength - 1), 
              correct, 
              total: total + 1 
            });
          }
        } else {
          setTrialInSpan(nextTrial);
          startNewTrial();
        }
      }, 1000);
    }
  };

  const handleClear = () => {
    setUserInput([]);
  };

  if (isComplete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🎯</div>
        <p className="text-xl font-semibold">Drill Complete!</p>
        <p className="text-muted-foreground mt-2">
          Max Span: {maxSpan} digits
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {correct} / {total} sequences correct
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      {/* Progress */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">
          Span Length: <span className="text-primary font-semibold">{spanLength}</span>
        </p>
      </div>

      {/* Display Area */}
      <div className={cn(
        "w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center mb-8 transition-all",
        phase === "showing" && "border-primary bg-primary/5",
        feedback === "correct" && "border-green-500 bg-green-500/10",
        feedback === "wrong" && "border-red-500 bg-red-500/10"
      )}>
        {phase === "showing" && displayIndex < currentSequence.length && (
          <span className="text-6xl font-bold text-primary animate-scale-in">
            {currentSequence[displayIndex]}
          </span>
        )}
        {phase === "showing" && displayIndex >= currentSequence.length && (
          <span className="text-muted-foreground">...</span>
        )}
        {phase === "input" && (
          <span className="text-4xl font-mono text-foreground">
            {userInput.join("") || "?"}
          </span>
        )}
        {phase === "feedback" && feedback === "correct" && (
          <span className="text-4xl text-green-500">✓</span>
        )}
        {phase === "feedback" && feedback === "wrong" && (
          <div className="text-center">
            <span className="text-2xl text-red-500">✗</span>
            <p className="text-xs text-muted-foreground mt-1">
              Was: {currentSequence.join("")}
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground mb-6 text-center">
        {phase === "showing" ? "Watch the digits..." : 
         phase === "input" ? "Enter the sequence in order" : ""}
      </p>

      {/* Number Pad */}
      {phase === "input" && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
            <Button
              key={digit}
              variant="outline"
              size="lg"
              className="w-14 h-14 text-xl font-semibold"
              onClick={() => handleDigitInput(digit)}
            >
              {digit}
            </Button>
          ))}
        </div>
      )}

      {phase === "input" && userInput.length > 0 && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
      )}
    </div>
  );
}