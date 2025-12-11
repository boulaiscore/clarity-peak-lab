import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

export const ReversalSimulationGame = ({ prompt, options, correctIndex, explanation, onComplete }: Props) => {
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<{ score: number; correct: boolean } | null>(null);

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

  const isCorrectOption = (index: number) => index === correctIndex;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <RotateCcw className="w-5 h-5 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Reversal Simulation</span>
        </div>
        <p className="text-foreground text-sm max-w-md">{prompt}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
        {options.map((option, index) => {
          const isFlipped = flippedCards.has(index);
          const isSelected = selectedIndex === index;
          const showChaos = isFlipped && isCorrectOption(index);
          
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
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                style={{ transformStyle: "preserve-3d" }}
                onClick={() => handleFlip(index)}
              >
                {/* Front */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                    isSelected
                      ? "bg-primary/20 border-primary"
                      : "bg-card/50 border-border/50 hover:border-border"
                  }`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-xs text-center text-foreground">{option}</span>
                  <span className="text-[10px] text-muted-foreground mt-2">Tap to flip</span>
                </div>

                {/* Back */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-3 rounded-xl border ${
                    showChaos
                      ? "bg-destructive/20 border-destructive"
                      : "bg-muted/30 border-border/30"
                  }`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  {showChaos ? (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 0.9, 1.05, 1],
                        rotate: [0, -5, 5, -3, 0]
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-center"
                    >
                      <span className="text-destructive text-xs font-bold">CHAOS</span>
                      <div className="text-[10px] text-destructive/70 mt-1">State changed!</div>
                    </motion.div>
                  ) : (
                    <div className="text-center">
                      <span className="text-muted-foreground text-xs">Stable</span>
                      <div className="text-[10px] text-muted-foreground/70 mt-1">No change</div>
                    </div>
                  )}
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

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-sm"
          >
            <div className={`p-4 rounded-xl border mb-4 ${
              selectedIndex === correctIndex
                ? "bg-green-500/10 border-green-500/30"
                : "bg-destructive/10 border-destructive/30"
            }`}>
              <div className="text-xs font-medium mb-2 text-foreground">
                {selectedIndex === correctIndex ? "✓ Correct!" : "✗ Incorrect"}
              </div>
              <p className="text-xs text-muted-foreground">{explanation}</p>
            </div>
            
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
