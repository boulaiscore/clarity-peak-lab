import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface WordAssociationDrillProps {
  config: {
    trialsCount: number;
    timePerTrial: number;
  };
  timeLimit: number;
  onComplete: (result: { score: number; correct: number; avgReactionTime: number }) => void;
}

type WordPuzzle = {
  words: string[];
  commonWord: string;
  options: string[];
  correctIndex: number;
};

// Base puzzles - correctIndex will be randomized at runtime
const BASE_PUZZLES = [
  { words: ["Snow", "Cone", "Cream"], correct: "Ice", distractors: ["Cold", "White", "Water"] },
  { words: ["Light", "Day", "Moon"], correct: "Sun", distractors: ["Star", "Sky", "Night"] },
  { words: ["Work", "Book", "News"], correct: "Paper", distractors: ["Read", "Office", "Print"] },
  { words: ["Coat", "Bow", "Drop"], correct: "Rain", distractors: ["Storm", "Water", "Cloud"] },
  { words: ["Worm", "Mark", "Shelf"], correct: "Book", distractors: ["Read", "Page", "Word"] },
  { words: ["Ball", "Work", "Print"], correct: "Foot", distractors: ["Hand", "Step", "Walk"] },
  { words: ["Box", "Code", "Card"], correct: "Post", distractors: ["Mail", "Send", "Pack"] },
  { words: ["Cake", "Day", "Card"], correct: "Birth", distractors: ["Party", "Gift", "Happy"] },
  { words: ["Berry", "Bird", "Bell"], correct: "Blue", distractors: ["Red", "Color", "Sky"] },
  { words: ["Chair", "Rest", "Band"], correct: "Arm", distractors: ["Leg", "Hand", "Body"] },
  { words: ["Storm", "Bolt", "Bug"], correct: "Lightning", distractors: ["Thunder", "Flash", "Strike"] },
  { words: ["Fly", "Milk", "Scotch"], correct: "Butter", distractors: ["Bread", "Cream", "Sweet"] },
];

// Dynamically create puzzle with randomized option positions
function createRandomWordPuzzle(): WordPuzzle {
  const base = BASE_PUZZLES[Math.floor(Math.random() * BASE_PUZZLES.length)];
  const correctIndex = Math.floor(Math.random() * 4);
  const options = [...base.distractors];
  options.splice(correctIndex, 0, base.correct);
  return { words: base.words, commonWord: base.correct, options, correctIndex };
}

export function WordAssociationDrill({ config, timeLimit, onComplete }: WordAssociationDrillProps) {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [trialStartTime, setTrialStartTime] = useState(Date.now());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<WordPuzzle | null>(null);

  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Generate new puzzle with randomized position
  const generatePuzzle = () => {
    return createRandomWordPuzzle();
  };

  // Initialize
  useEffect(() => {
    setCurrentPuzzle(generatePuzzle());
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

  const handleSelect = (index: number) => {
    if (feedback || !currentPuzzle) return;

    const reactionTime = Date.now() - trialStartTime;
    setReactionTimes(prev => [...prev, reactionTime]);

    if (index === currentPuzzle.correctIndex) {
      setFeedback("correct");
      setCorrect(prev => prev + 1);
      setScore(prev => prev + Math.max(150 - Math.floor(reactionTime / 100), 25));
    } else {
      setFeedback("wrong");
    }

    setTimeout(() => {
      if (currentTrial + 1 >= config.trialsCount) {
        setIsComplete(true);
      } else {
        setCurrentTrial(prev => prev + 1);
        setCurrentPuzzle(generatePuzzle());
        setTrialStartTime(Date.now());
        setFeedback(null);
      }
    }, 1000);
  };

  if (!currentPuzzle) return null;

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

      {/* Instruction */}
      <p className="text-lg text-center mb-6 text-muted-foreground">
        What word connects all three?
      </p>

      {/* Words Display */}
      <div className="flex items-center gap-4 mb-8">
        {currentPuzzle.words.map((word, index) => (
          <div
            key={index}
            className="px-4 py-3 rounded-lg bg-primary/10 border border-primary/30"
          >
            <span className="text-lg font-medium">__{word}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Find the word that can precede each word above
      </p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {currentPuzzle.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={!!feedback}
            className={cn(
              "h-14 rounded-xl text-lg font-medium",
              "border-2 transition-all duration-200",
              "bg-card hover:bg-primary/10",
              feedback && index === currentPuzzle.correctIndex && "bg-green-500/20 border-green-500",
              feedback === "wrong" && index !== currentPuzzle.correctIndex && "opacity-50",
              !feedback && "border-border hover:border-primary"
            )}
          >
            {option}
          </button>
        ))}
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
