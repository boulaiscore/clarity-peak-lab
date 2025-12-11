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
    prompt: "Choose the detail whose truth eliminates the largest number of other explanations.",
    options: [
      "The team is behind schedule.",
      "Tasks were never clearly defined.",
      "People are stressed.",
      "Meetings doubled in frequency."
    ],
    correctIndex: 1,
    explanation: "Unclear tasks explain all the other symptoms."
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
    prompt: "Select the detail that requires the fewest assumptions.",
    options: [
      "Emotional interpretation.",
      "Rumor about risk.",
      "Controlled discrepancy.",
      "Narrative of failures."
    ],
    correctIndex: 2,
    explanation: "Direct measurement demands the fewest assumptions."
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
    prompt: "Which detail deserves the least attention? Allocate your 100 focus coins.",
    options: [
      "A 12% conversion drop.",
      "Funnel unchanged.",
      "One customer's long email.",
      "Drop isolated to mobile."
    ],
    correctIndex: 2,
    explanation: "Single anecdotes have minimal informational value."
  },
  {
    id: "SF6",
    gameType: "hypothesis",
    prompt: "Choose the detail with the highest causal relevance.",
    options: [
      "Lighting change.",
      "Undefined tasks.",
      "Longer breaks.",
      "Coffee brand."
    ],
    correctIndex: 1,
    explanation: "Task ambiguity is causally dominant."
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
    prompt: "Which metric deserves the highest share of attention?",
    options: [
      "Harmless fluctuations.",
      "Sudden deviation in stable metric.",
      "Always noisy metric.",
      "Unclear metric."
    ],
    correctIndex: 1,
    explanation: "An unexpected deviation in a stable metric is a strong signal."
  },
  {
    id: "SF9",
    gameType: "hypothesis",
    prompt: "Which issue deserves real attention?",
    options: [
      "Urgent but low impact.",
      "Loud but superficial.",
      "Quiet but high impact.",
      "Emotionally charged."
    ],
    correctIndex: 2,
    explanation: "Impact dominates urgency and salience."
  },
  {
    id: "SF10",
    gameType: "budget",
    prompt: "Where should you allocate most cognitive attention?",
    options: [
      "Meeting impressions.",
      "Metric tied to core objective.",
      "Anecdote.",
      "Random variance."
    ],
    correctIndex: 1,
    explanation: "The variable tied to core objective gives highest inferential leverage."
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
        return <HypothesisEliminatorGame {...props} />;
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
