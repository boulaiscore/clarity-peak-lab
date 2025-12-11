import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import { ReversalSimulationGame } from "./ReversalSimulationGame";
import { AttentionBudgetGame } from "./AttentionBudgetGame";
import { HypothesisEliminatorGame } from "./HypothesisEliminatorGame";

const SOCRATIC_FOCUS_EXERCISES = [
  {
    id: "SF1",
    gameType: "hypothesis",
    context: "A project team has been missing deadlines consistently for the past month.",
    prompt: "Which factor has the highest causal relevance?",
    options: [
      "The team is behind schedule.",
      "Tasks were never clearly defined.",
      "People are stressed.",
      "Meetings doubled in frequency."
    ],
    correctIndex: 1,
    explanation: "Unclear tasks explain all the other symptoms - stress, missed deadlines, and excessive meetings are all downstream effects."
  },
  {
    id: "SF2",
    gameType: "reversal",
    prompt: "Flip each scenario. Which reversal meaningfully changes the whole situation?",
    options: [
      "Dashboard color.",
      "Goal clarity.",
      "Team mood.",
      "Meeting room."
    ],
    correctIndex: 1,
    explanation: "A change in goal clarity transforms the entire decision landscape."
  },
  {
    id: "SF3",
    gameType: "hypothesis",
    context: "Sales dropped 15% last quarter. The team is debating what caused it.",
    prompt: "Which explanation requires the fewest assumptions?",
    options: [
      "Customers feel less valued.",
      "A competitor launched a rumor campaign.",
      "Pricing increased 10% in Q2.",
      "The economy is hurting our segment."
    ],
    correctIndex: 2,
    explanation: "The pricing change is a direct, measurable factor requiring no speculation about customer feelings, competitor actions, or macro trends."
  },
  {
    id: "SF4",
    gameType: "reversal",
    prompt: "Which detail is a necessary condition for progress?",
    options: [
      "High motivation.",
      "Stakeholder approval.",
      "Clear requirements.",
      "Market positivity."
    ],
    correctIndex: 2,
    explanation: "If requirements aren't clear, no progress is possible."
  },
  {
    id: "SF5",
    gameType: "budget",
    prompt: "Rank these signals by informational value. Drag weights (50, 30, 15, 5) to each option.",
    options: [
      "Sudden 12% conversion drop (was stable).",
      "Minor daily fluctuations.",
      "Metric that's always volatile.",
      "Unclear tracking data."
    ],
    correctIndex: 0,
    explanation: "Unexpected deviations in stable metrics carry the highest informational value."
  },
  {
    id: "SF6",
    gameType: "hypothesis",
    context: "A remote team's productivity dropped noticeably over the past two weeks.",
    prompt: "Which factor has the highest causal relevance?",
    options: [
      "Home office lighting changed.",
      "Sprint goals were left undefined.",
      "People are taking longer breaks.",
      "The team switched to a new coffee brand."
    ],
    correctIndex: 1,
    explanation: "Undefined goals create ambiguity that ripples through everything - longer breaks, confusion, and reduced output are symptoms, not causes."
  },
  {
    id: "SF7",
    gameType: "reversal",
    prompt: "Which detail, if false, collapses all progress?",
    options: [
      "Team enjoyment.",
      "Prerequisite completed.",
      "Manager review.",
      "Recent discussions."
    ],
    correctIndex: 1,
    explanation: "If prerequisites are incomplete, progress halts entirely."
  },
  {
    id: "SF8",
    gameType: "budget",
    prompt: "Allocate cognitive attention to these performance metrics. Drag weights (50, 30, 15, 5).",
    options: [
      "Sudden spike in error rate (was near-zero).",
      "Slight dip in response time.",
      "Random noise in load balancer.",
      "Ambiguous logging data."
    ],
    correctIndex: 0,
    explanation: "Unexpected deviations in stable metrics carry the highest informational value."
  },
  {
    id: "SF9",
    gameType: "hypothesis",
    context: "Your inbox is flooded with requests. You can only address one issue today.",
    prompt: "Which issue deserves your real attention?",
    options: [
      "Urgent request from a loud colleague (minor impact).",
      "Trending complaint on social media (superficial).",
      "Quiet bug affecting 40% of revenue.",
      "Emotionally charged team conflict."
    ],
    correctIndex: 2,
    explanation: "Impact dominates urgency and emotional salience. The quiet bug affecting revenue has real business consequences."
  },
  {
    id: "SF10",
    gameType: "budget",
    prompt: "Prioritize these user behavior signals. Drag weights (50, 30, 15, 5).",
    options: [
      "Sudden drop in engagement (was consistent).",
      "Normal weekend dip pattern.",
      "Feature rarely used by anyone.",
      "Incomplete analytics setup."
    ],
    correctIndex: 0,
    explanation: "Unexpected deviations in stable metrics carry the highest informational value."
  }
];

interface Props {
  exerciseCount?: number;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

export const SocraticFocusGamifiedSession = ({ exerciseCount = 1, onComplete }: Props) => {
  // Randomly select exercises for this session
  const selectedExercises = useMemo(() => {
    const shuffled = [...SOCRATIC_FOCUS_EXERCISES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(exerciseCount, shuffled.length));
  }, [exerciseCount]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  const currentExercise = selectedExercises[currentIndex];
  const isLastExercise = currentIndex === selectedExercises.length - 1;

  const handleExerciseComplete = (result: { score: number; correct: boolean }) => {
    const newScores = [...scores, result.score];
    setScores(newScores);
    
    if (result.correct) {
      setCorrectCount(prev => prev + 1);
    }

    if (isLastExercise) {
      // Calculate final score
      const avgScore = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length);
      onComplete({ 
        score: avgScore, 
        correct: correctCount + (result.correct ? 1 : 0) > selectedExercises.length / 2 
      });
    } else {
      // Move to next exercise immediately (user already clicked Next button)
      setCurrentIndex(prev => prev + 1);
    }
  };

  const renderGame = () => {
    const props = {
      prompt: currentExercise.prompt,
      options: currentExercise.options,
      correctIndex: currentExercise.correctIndex,
      explanation: currentExercise.explanation,
      onComplete: handleExerciseComplete,
    };

    switch (currentExercise.gameType) {
      case "reversal":
        return <ReversalSimulationGame {...props} />;
      case "budget":
        return <AttentionBudgetGame {...props} />;
      case "hypothesis":
        return <HypothesisEliminatorGame {...props} context={(currentExercise as any).context} />;
      default:
        return <HypothesisEliminatorGame {...props} />;
    }
  };

  return (
    <div className="w-full">
      {/* Progress indicator */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            Socratic Focus Training
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selectedExercises.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index < currentIndex
                  ? "bg-primary"
                  : index === currentIndex
                  ? "bg-primary/50"
                  : "bg-muted/30"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentExercise.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderGame()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export { SOCRATIC_FOCUS_EXERCISES };
