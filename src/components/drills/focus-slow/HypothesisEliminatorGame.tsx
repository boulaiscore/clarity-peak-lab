import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  context?: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

// Elimination power based on correctness - correct answer has highest power
const getEliminationPower = (index: number, correctIndex: number, totalOptions: number): number => {
  if (index === correctIndex) return totalOptions - 1; // Correct answer eliminates all others
  // Other options have decreasing power based on distance from correct
  const distance = Math.abs(index - correctIndex);
  return Math.max(0, totalOptions - 2 - distance);
};

export const HypothesisEliminatorGame = ({ context, prompt, options, correctIndex, explanation, onComplete }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<{ score: number; correct: boolean } | null>(null);

  const handleCardTap = (index: number) => {
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

  const handleReset = () => {
    setSelectedIndex(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Target className="w-5 h-5 text-cyan-400" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Hypothesis Eliminator</span>
        </div>
      </motion.div>

      {/* Context Section - scenario */}
      {context && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm mb-3 p-3 rounded-lg bg-muted/30 border border-border/50"
        >
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {context}
            </p>
          </div>
        </motion.div>
      )}

      {/* Prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-sm mb-4 text-center"
      >
        <p className="text-sm font-medium text-foreground">{prompt}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <motion.button
                onClick={() => handleCardTap(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden min-h-[80px] ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-500"
                    : "bg-card/50 border-border/50 hover:border-border"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xs text-foreground">{option}</span>
                
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </motion.div>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Confirm/Reset buttons */}
      {!showResult && selectedIndex !== null && (
        <div className="flex gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleReset}
            className="px-4 py-2 bg-muted/50 text-muted-foreground rounded-xl text-sm"
          >
            Try Another
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-black rounded-xl font-medium text-sm"
          >
            <Target className="w-4 h-4" />
            Confirm
          </motion.button>
        </div>
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
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-destructive/10 border-destructive/30"
            }`}>
              <div className="text-xs font-medium mb-3 text-foreground">
                {selectedIndex === correctIndex 
                  ? "✓ Correct!" 
                  : "✗ Not quite"}
              </div>
              
              {/* Elimination power comparison - shown only after confirmation */}
              <div className="mb-3 p-2 bg-background/50 rounded-lg">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Elimination Power</div>
                <div className="space-y-1.5">
                  {options.map((option, index) => {
                    const power = getEliminationPower(index, correctIndex, options.length);
                    const isCorrectOption = index === correctIndex;
                    const isUserChoice = index === selectedIndex;
                    
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(options.length - 1)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i < power 
                                  ? isCorrectOption ? "bg-cyan-400" : "bg-muted-foreground" 
                                  : "bg-muted/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] truncate flex-1 ${
                          isCorrectOption 
                            ? "text-cyan-400 font-medium" 
                            : isUserChoice 
                              ? "text-foreground" 
                              : "text-muted-foreground"
                        }`}>
                          {option}
                          {isUserChoice && !isCorrectOption && " (your choice)"}
                          {isCorrectOption && " ✓"}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
