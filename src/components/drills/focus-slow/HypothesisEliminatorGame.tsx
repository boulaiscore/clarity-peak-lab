import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

export const HypothesisEliminatorGame = ({ prompt, options, correctIndex, explanation, onComplete }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [eliminatedCards, setEliminatedCards] = useState<Set<number>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const resultRef = useRef<{ score: number; correct: boolean } | null>(null);

  const getEliminationCount = (index: number) => {
    // The correct option eliminates the most hypotheses
    if (index === correctIndex) return options.length - 1;
    // Others eliminate fewer
    return Math.max(0, Math.floor(Math.random() * 2));
  };

  const handleCardTap = (index: number) => {
    if (showResult) return;
    
    setSelectedIndex(index);
    setPreviewMode(true);
    
    // Show which cards would be eliminated
    const eliminationCount = getEliminationCount(index);
    const toEliminate = new Set<number>();
    
    // Eliminate other cards based on power
    const otherIndices = options.map((_, i) => i).filter(i => i !== index);
    for (let i = 0; i < Math.min(eliminationCount, otherIndices.length); i++) {
      toEliminate.add(otherIndices[i]);
    }
    
    setEliminatedCards(toEliminate);
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
    setEliminatedCards(new Set());
    setPreviewMode(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Target className="w-5 h-5 text-cyan-400" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Hypothesis Eliminator</span>
        </div>
        <p className="text-foreground text-sm max-w-md">{prompt}</p>
        {previewMode && !showResult && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-cyan-400 text-xs mt-2"
          >
            {eliminatedCards.size} hypothesis{eliminatedCards.size !== 1 ? 'es' : ''} eliminated
          </motion.p>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isEliminated = eliminatedCards.has(index);
          const eliminationPower = getEliminationCount(index);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: isEliminated ? 0.3 : 1, 
                scale: isEliminated ? 0.9 : 1,
                filter: isEliminated ? "grayscale(100%)" : "grayscale(0%)"
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                onClick={() => handleCardTap(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-500"
                    : isEliminated
                    ? "bg-muted/20 border-border/30"
                    : "bg-card/50 border-border/50 hover:border-border"
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {/* Elimination power indicator */}
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < eliminationPower ? "bg-cyan-400" : "bg-muted/30"
                      }`}
                      animate={isSelected && i < eliminationPower ? {
                        scale: [1, 1.5, 1],
                      } : {}}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    />
                  ))}
                </div>
                
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
                
                {/* Eliminated overlay */}
                <AnimatePresence>
                  {isEliminated && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-background/50"
                    >
                      <span className="text-xs text-muted-foreground line-through">Eliminated</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {!showResult && previewMode && (
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

      {!showResult && !previewMode && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-xs"
        >
          Tap a hypothesis to see its elimination power
        </motion.p>
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
              <div className="text-xs font-medium mb-2 text-foreground">
                {selectedIndex === correctIndex 
                  ? "✓ Maximum Elimination Power!" 
                  : "✗ Low Elimination Power"}
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
