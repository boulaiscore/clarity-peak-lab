import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

// Generic reversal consequence descriptions - all look equally plausible
const REVERSAL_CONSEQUENCES = [
  { impact: "Ripple effects across related areas", detail: "Multiple dependencies affected" },
  { impact: "Cascading changes downstream", detail: "Core assumptions invalidated" },
  { impact: "Foundation becomes unstable", detail: "Key constraints removed" },
  { impact: "System equilibrium shifts", detail: "Balance point changes" },
  { impact: "Chain reaction triggered", detail: "Interconnected elements impacted" },
  { impact: "Structural realignment needed", detail: "Framework must adapt" },
];

export const ReversalSimulationGame = ({ prompt, options, correctIndex, explanation, onComplete }: Props) => {
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<{ score: number; correct: boolean } | null>(null);

  // Randomize consequences for each option (but keep stable during session)
  const cardConsequences = useMemo(() => {
    const shuffled = [...REVERSAL_CONSEQUENCES].sort(() => Math.random() - 0.5);
    return options.map((_, i) => shuffled[i % shuffled.length]);
  }, [options]);

  const handleFlip = (index: number) => {
    if (showResult) return;
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    if (selectedIndex === null) return;
    setShowResult(true);
    const isCorrect = selectedIndex === correctIndex;
    resultRef.current = { score: isCorrect ? 100 : 0, correct: isCorrect };
  };

  const handleNext = () => {
    if (resultRef.current) {
      onComplete(resultRef.current);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <RotateCcw className="w-5 h-5 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Reversal Simulation</span>
        </div>
        <p className="text-foreground text-sm max-w-md mb-2">{prompt}</p>
        <p className="text-muted-foreground text-xs max-w-sm">
          Flip each card to imagine its reversal. Which one would cause the biggest change?
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
        {options.map((option, index) => {
          const isFlipped = flippedCards.has(index);
          const isSelected = selectedIndex === index;
          const consequence = cardConsequences[index];
          const isCorrectAndRevealed = showResult && index === correctIndex;
          const isWrongAndSelected = showResult && isSelected && index !== correctIndex;
          
          return (
            <motion.div
              key={index}
              className="perspective-1000"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className={`relative w-full h-28 cursor-pointer rounded-xl ${
                  isSelected && !showResult ? "ring-2 ring-primary" : ""
                } ${isCorrectAndRevealed ? "ring-2 ring-green-500" : ""}
                  ${isWrongAndSelected ? "ring-2 ring-destructive" : ""}`}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                style={{ transformStyle: "preserve-3d" }}
                onClick={() => handleFlip(index)}
              >
                {/* Front */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                    isSelected && !showResult
                      ? "bg-primary/20 border-primary"
                      : isCorrectAndRevealed
                      ? "bg-green-500/20 border-green-500"
                      : isWrongAndSelected
                      ? "bg-destructive/20 border-destructive"
                      : "bg-card/50 border-border/50 hover:border-border"
                  }`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-xs text-center text-foreground">{option}</span>
                  <span className="text-[10px] text-muted-foreground mt-2">Tap to flip</span>
                </div>

                {/* Back - all cards show similar reversal consequences */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-3 rounded-xl border ${
                    isCorrectAndRevealed
                      ? "bg-green-500/20 border-green-500"
                      : isWrongAndSelected
                      ? "bg-destructive/20 border-destructive"
                      : "bg-primary/10 border-primary/30"
                  }`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <RotateCcw className="w-3 h-3 text-primary" />
                      <span className="text-primary text-[10px] font-medium">If reversed:</span>
                    </div>
                    <span className="text-foreground text-xs">{consequence.impact}</span>
                    <div className="text-[10px] text-muted-foreground mt-1">{consequence.detail}</div>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Select button */}
              {!showResult && (
                <motion.button
                  className={`w-full mt-2 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(index);
                  }}
                >
                  {isSelected ? "Selected" : "Select"}
                </motion.button>
              )}

              {/* Result indicator */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 py-1 rounded-lg text-xs text-center ${
                    index === correctIndex
                      ? "bg-green-500/20 text-green-400"
                      : isSelected
                      ? "bg-destructive/20 text-destructive"
                      : "bg-muted/20 text-muted-foreground"
                  }`}
                >
                  {index === correctIndex ? "✓ Biggest impact" : isSelected ? "✗ Your choice" : ""}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!showResult && selectedIndex !== null && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
        >
          <Check className="w-4 h-4" />
          Confirm Choice
        </motion.button>
      )}

      {!showResult && selectedIndex === null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-xs text-center"
        >
          Flip cards to explore, then select your answer
        </motion.p>
      )}

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-sm"
          >
            {/* Insight Card */}
            <motion.div 
              className={`p-4 rounded-xl border mb-4 relative overflow-hidden ${
                selectedIndex === correctIndex
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-destructive/10 border-destructive/30"
              }`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <motion.div
                className="absolute top-2 right-2"
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-primary/40" />
              </motion.div>
              
              <div className="text-xs font-medium mb-2 text-foreground">
                {selectedIndex === correctIndex ? "✓ Correct!" : "✗ Not quite"}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">"{options[correctIndex]}"</span> — {explanation}
              </p>
            </motion.div>
            
            <Button 
              onClick={handleNext}
              variant="hero"
              className="w-full h-12"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
