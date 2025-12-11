import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

// Fixed scenario for Hypothesis Eliminator
const SCENARIO = {
  context: "A team's productivity has noticeably dropped over the past two weeks.",
  prompt: "Which factor has the highest causal relevance?",
  options: [
    { text: "The team lead was on vacation.", eliminates: 3, isCorrect: true },
    { text: "Office lighting was changed.", eliminates: 1, isCorrect: false },
    { text: "Two team members are new.", eliminates: 2, isCorrect: false },
    { text: "The coffee machine broke.", eliminates: 0, isCorrect: false }
  ],
  explanation: "In this exercise, you tested each hypothesis to see how many alternative explanations it could eliminate. The team lead's absence affects direction, decision-making, and morale simultaneously—eliminating multiple competing explanations. Other factors have more limited scope."
};

export const HypothesisEliminatorGame = ({ onComplete }: Props) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [eliminatedCards, setEliminatedCards] = useState<Set<number>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const resultRef = useRef<{ score: number; correct: boolean } | null>(null);

  const correctIndex = SCENARIO.options.findIndex(opt => opt.isCorrect);

  const handleCardTap = (index: number) => {
    if (showResult) return;
    
    setSelectedIndex(index);
    setPreviewMode(true);
    
    // Show which cards would be eliminated based on predefined elimination power
    const eliminationCount = SCENARIO.options[index].eliminates;
    const toEliminate = new Set<number>();
    
    // Eliminate other cards based on power
    const otherIndices = SCENARIO.options.map((_, i) => i).filter(i => i !== index);
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
        className="text-center mb-4"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Target className="w-5 h-5 text-cyan-400" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Hypothesis Eliminator</span>
        </div>
      </motion.div>

      {/* Context Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm mb-4 p-3 rounded-lg bg-muted/30 border border-border/50"
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-foreground mb-1">Context</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {SCENARIO.context}
            </p>
          </div>
        </div>
      </motion.div>

      {previewMode && !showResult && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-cyan-400 text-xs mb-3"
        >
          {eliminatedCards.size} hypothesis{eliminatedCards.size !== 1 ? 'es' : ''} eliminated
        </motion.p>
      )}

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
        {SCENARIO.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isEliminated = eliminatedCards.has(index);
          const eliminationPower = isSelected ? option.eliminates : 0;
          
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
                {/* Elimination power indicator - only show for selected card */}
                <div className="flex items-center gap-1 mb-2 h-2">
                  {isSelected ? (
                    [...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ 
                          scale: 1,
                        }}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < eliminationPower ? "bg-cyan-400" : "bg-muted/30"
                        }`}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                      />
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50">Tap to test</span>
                  )}
                </div>
                
                <span className="text-xs text-foreground">{option.text}</span>
                
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
              <p className="text-xs text-muted-foreground">{SCENARIO.explanation}</p>
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
