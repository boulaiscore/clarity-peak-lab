import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RuleSwitchDrillProps {
  config: {
    trialsCount: number;
    switchFrequency: number;
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; avgReactionTime: number }) => void;
}

type Rule = "greater" | "smaller" | "even" | "odd";

const RULE_LABELS: Record<Rule, string> = {
  greater: "Greater than 5?",
  smaller: "Smaller than 5?",
  even: "Is it Even?",
  odd: "Is it Odd?",
};

export function RuleSwitchDrill({ config, timeLimit, onComplete }: RuleSwitchDrillProps) {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [trialStartTime, setTrialStartTime] = useState(Date.now());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  
  const [currentNumber, setCurrentNumber] = useState(5);
  const [currentRule, setCurrentRule] = useState<Rule>("greater");
  const [ruleJustChanged, setRuleJustChanged] = useState(false);

  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const rules: Rule[] = ["greater", "smaller", "even", "odd"];

  // Get correct answer
  const getCorrectAnswer = (num: number, rule: Rule): boolean => {
    switch (rule) {
      case "greater": return num > 5;
      case "smaller": return num < 5;
      case "even": return num % 2 === 0;
      case "odd": return num % 2 !== 0;
    }
  };

  // Initialize
  useEffect(() => {
    setCurrentNumber(Math.floor(Math.random() * 9) + 1);
    setCurrentRule(rules[Math.floor(Math.random() * rules.length)]);
    setTrialStartTime(Date.now());
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
    if (isComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      onCompleteRef.current({ score, correct, avgReactionTime });
    }
  }, [isComplete, score, correct, reactionTimes]);

  const handleAnswer = (answer: boolean) => {
    if (feedback) return;

    const reactionTime = Date.now() - trialStartTime;
    setReactionTimes(prev => [...prev, reactionTime]);

    const isCorrect = answer === getCorrectAnswer(currentNumber, currentRule);

    if (isCorrect) {
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
        // Decide if rule should switch
        const shouldSwitch = (currentTrial + 1) % config.switchFrequency === 0;
        
        let newRule = currentRule;
        if (shouldSwitch) {
          const otherRules = rules.filter(r => r !== currentRule);
          newRule = otherRules[Math.floor(Math.random() * otherRules.length)];
          setRuleJustChanged(true);
        } else {
          setRuleJustChanged(false);
        }
        
        setCurrentTrial(prev => prev + 1);
        setCurrentNumber(Math.floor(Math.random() * 9) + 1);
        setCurrentRule(newRule);
        setTrialStartTime(Date.now());
        setFeedback(null);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mb-8">
        <div className="text-sm text-muted-foreground">
          Trial {currentTrial + 1} / {config.trialsCount}
        </div>
        <div className="text-sm font-mono text-primary">{timeLeft}s</div>
        <div className="text-sm text-muted-foreground">
          Score: {score}
        </div>
      </div>

      {/* Rule Display */}
      <div className={cn(
        "mb-6 px-6 py-3 rounded-lg transition-all duration-300",
        ruleJustChanged ? "bg-area-fast/20 border border-area-fast/50" : "bg-primary/20 border border-primary/30"
      )}>
        <span className={cn(
          "text-lg font-semibold",
          ruleJustChanged ? "text-area-fast" : "text-primary"
        )}>
          {RULE_LABELS[currentRule]}
        </span>
        {ruleJustChanged && (
          <span className="ml-2 text-xs text-area-fast">(RULE CHANGED!)</span>
        )}
      </div>

      {/* Number Display */}
      <div className="mb-8 w-32 h-32 rounded-xl bg-card border border-border flex items-center justify-center">
        <span className="text-6xl font-bold">{currentNumber}</span>
      </div>

      {/* Answer Buttons */}
      <div className="flex gap-4 w-full max-w-xs">
        <button
          onClick={() => handleAnswer(true)}
          disabled={!!feedback}
          className={cn(
            "flex-1 h-16 rounded-xl text-xl font-bold",
            "border-2 transition-all duration-200",
            "bg-green-500/10 hover:bg-green-500/20 border-green-500/30 hover:border-green-500",
            feedback === "correct" && "bg-green-500/30 border-green-500",
            feedback && "pointer-events-none"
          )}
        >
          YES
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={!!feedback}
          className={cn(
            "flex-1 h-16 rounded-xl text-xl font-bold",
            "border-2 transition-all duration-200",
            "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 hover:border-red-500",
            feedback === "wrong" && "bg-red-500/30 border-red-500",
            feedback && "pointer-events-none"
          )}
        >
          NO
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "mt-6 text-lg font-semibold",
          feedback === "correct" ? "text-green-400" : "text-red-400"
        )}>
          {feedback === "correct" ? "Correct!" : "Wrong!"}
        </div>
      )}

      {/* Progress */}
      <div className="w-full max-w-md mt-8">
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
