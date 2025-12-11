import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronRight } from "lucide-react";

interface DrillResult {
  score: number;
  correct: number;
  metadata?: Record<string, unknown>;
}

interface Props {
  onComplete: (result: DrillResult) => void;
}

const DRILL_DATA = {
  title: "Fact / Inference / Value",
  prompt: "\"The company is in crisis because the managers don't understand AI.\"",
  question: "How should \"don't understand AI\" be classified?",
  options: [
    { id: "a", text: "Fact — verified observation", isCorrect: false },
    { id: "b", text: "Inference — unverified conclusion", isCorrect: true },
    { id: "c", text: "Value judgment — subjective opinion", isCorrect: false },
  ],
  explanation: "This is an inference, not a fact. It's an unverified conclusion drawn from other observations. A fact would require direct evidence of the managers' AI knowledge."
};

export function FactInferenceClassification({ onComplete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSelect = (id: string) => {
    if (showResult) return;
    setSelectedId(id);
    setTimeout(() => setShowResult(true), 300);
  };

  const handleContinue = () => {
    const isCorrect = DRILL_DATA.options.find(o => o.id === selectedId)?.isCorrect ?? false;
    const reactionTime = Date.now() - startTime;
    onComplete({
      score: isCorrect ? 100 : 0,
      correct: isCorrect ? 1 : 0,
      metadata: { reactionTime, selectedAnswer: selectedId }
    });
  };

  const selectedOption = DRILL_DATA.options.find(o => o.id === selectedId);
  const correctOption = DRILL_DATA.options.find(o => o.isCorrect);

  return (
    <div className="flex-1 bg-background flex flex-col p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col max-w-lg mx-auto w-full"
      >
        <div className="text-center mb-4">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{DRILL_DATA.title}</h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 border border-border/50 rounded-xl p-4 mb-4"
        >
          <p className="text-foreground/90 italic text-center">{DRILL_DATA.prompt}</p>
        </motion.div>

        <p className="text-muted-foreground text-sm text-center mb-4">{DRILL_DATA.question}</p>

        <div className="space-y-2 mb-4">
          {DRILL_DATA.options.map((option) => {
            const isSelected = selectedId === option.id;
            const isCorrect = option.isCorrect;
            const showCorrectness = showResult;

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={showResult}
                className={`w-full p-3 rounded-xl border text-left transition-colors duration-200 ${
                  showCorrectness
                    ? isCorrect
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : isSelected
                        ? "bg-red-500/20 border-red-500/50 text-red-300"
                        : "bg-card/30 border-border/30 text-muted-foreground"
                    : isSelected
                      ? "bg-primary/20 border-primary/50 text-foreground"
                      : "bg-card/50 border-border/50 text-foreground hover:bg-card/70 hover:border-border"
                }`}
              >
                <span className="text-sm">{option.text}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-card/80 border border-border/50 rounded-xl p-4 mb-4"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedOption?.isCorrect ? "bg-emerald-500/20" : "bg-amber-500/20"
                }`}>
                  <Layers className={`w-4 h-4 ${
                    selectedOption?.isCorrect ? "text-emerald-400" : "text-amber-400"
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {selectedOption?.isCorrect ? "Correct" : `Correct answer: ${correctOption?.text}`}
                  </p>
                  <p className="text-sm text-foreground/90">{DRILL_DATA.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showResult && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleContinue}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
