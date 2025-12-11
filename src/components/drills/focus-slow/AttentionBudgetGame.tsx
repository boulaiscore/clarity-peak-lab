import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Check, Minus, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

export const AttentionBudgetGame = ({ prompt, options, correctIndex, explanation, onComplete }: Props) => {
  const [allocations, setAllocations] = useState<number[]>(options.map(() => 25));
  const [showResult, setShowResult] = useState(false);
  const [pulsingNode, setPulsingNode] = useState<number | null>(null);
  const resultRef = useRef<{ score: number; correct: boolean } | null>(null);

  const totalCoins = allocations.reduce((a, b) => a + b, 0);
  const remainingCoins = 100 - totalCoins;

  const adjustAllocation = (index: number, delta: number) => {
    if (showResult) return;
    
    setAllocations(prev => {
      const newAllocations = [...prev];
      const newValue = Math.max(0, Math.min(100, newAllocations[index] + delta));
      const totalOthers = newAllocations.reduce((sum, val, i) => i !== index ? sum + val : sum, 0);
      
      if (newValue + totalOthers <= 100) {
        newAllocations[index] = newValue;
      }
      return newAllocations;
    });
    
    setPulsingNode(index);
    setTimeout(() => setPulsingNode(null), 300);
  };

  const handleConfirm = () => {
    setShowResult(true);
    
    // Calculate score based on how much was allocated to correct option
    const correctAllocation = allocations[correctIndex];
    const maxPossible = 100;
    
    // Score: higher allocation to correct = better score
    // Ideal: 100% on correct, 0% on others
    const score = Math.round((correctAllocation / maxPossible) * 100);
    const isCorrect = allocations.indexOf(Math.max(...allocations)) === correctIndex;
    
    resultRef.current = { score, correct: isCorrect };
  };

  const handleNext = () => {
    if (resultRef.current) {
      onComplete(resultRef.current);
    }
  };

  const getNodeSize = (allocation: number) => {
    const minSize = 60;
    const maxSize = 100;
    return minSize + (allocation / 100) * (maxSize - minSize);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Attention Budget</span>
        </div>
        <p className="text-foreground text-sm max-w-md mb-2">{prompt}</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-amber-400 font-mono text-lg">{100 - remainingCoins}</span>
          <span className="text-muted-foreground text-xs">/ 100 coins allocated</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
        {options.map((option, index) => {
          const size = getNodeSize(allocations[index]);
          const isPulsing = pulsingNode === index;
          
          return (
            <motion.div
              key={index}
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30"
                animate={{
                  width: size,
                  height: size,
                  scale: isPulsing ? 1.1 : 1,
                  boxShadow: isPulsing 
                    ? "0 0 20px rgba(251, 191, 36, 0.4)" 
                    : "0 0 10px rgba(251, 191, 36, 0.1)"
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="text-center">
                  <span className="text-amber-400 font-bold text-lg">{allocations[index]}</span>
                </div>
                
                {/* Floating coin particles */}
                <AnimatePresence>
                  {isPulsing && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-amber-400 rounded-full"
                          initial={{ opacity: 1, scale: 1 }}
                          animate={{
                            opacity: 0,
                            scale: 0,
                            x: (Math.random() - 0.5) * 40,
                            y: (Math.random() - 0.5) * 40,
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
              
              <p className="text-[10px] text-muted-foreground text-center mt-2 h-8 line-clamp-2">{option}</p>
              
              {!showResult && (
                <div className="flex items-center gap-2 mt-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => adjustAllocation(index, -10)}
                    className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted"
                    disabled={allocations[index] <= 0}
                  >
                    <Minus className="w-3 h-3" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => adjustAllocation(index, 10)}
                    className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 hover:bg-amber-500/30"
                    disabled={remainingCoins <= 0}
                  >
                    <Plus className="w-3 h-3" />
                  </motion.button>
                </div>
              )}

              {showResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-1 px-2 py-0.5 rounded text-[10px] ${
                    index === correctIndex
                      ? "bg-green-500/20 text-green-400"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {index === correctIndex ? "Optimal" : ""}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!showResult && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-xl font-medium"
        >
          <Check className="w-4 h-4" />
          Lock In Budget
        </motion.button>
      )}

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-sm"
          >
            <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 mb-4">
              <div className="text-xs font-medium mb-2 text-foreground">
                Allocation Score: {Math.round((allocations[correctIndex] / 100) * 100)}%
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
