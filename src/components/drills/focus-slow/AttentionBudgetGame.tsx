import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onComplete: (result: { score: number; correct: boolean }) => void;
}

// Fixed weights that must be assigned
const FIXED_WEIGHTS = [50, 30, 15, 5] as const;

// Correct weight mapping by position (index 0 should get 50, etc.)
const CORRECT_ALLOCATION = {
  0: 50, // Sudden deviation in stable metric → highest value
  1: 30, // Harmless fluctuations → medium-high
  2: 15, // Always noisy metric → medium-low  
  3: 5,  // Unclear metric → lowest
} as const;

interface WeightChip {
  id: string;
  value: number;
  assignedTo: number | null;
}

export const AttentionBudgetGame = ({ prompt, options, correctIndex, explanation, onComplete }: Props) => {
  const [weights, setWeights] = useState<WeightChip[]>(
    FIXED_WEIGHTS.map((value, i) => ({ id: `weight-${i}`, value, assignedTo: null }))
  );
  const [showResult, setShowResult] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const resultRef = useRef<{ score: number; correct: boolean } | null>(null);

  const getAssignedWeight = (targetIndex: number): WeightChip | undefined => {
    return weights.find(w => w.assignedTo === targetIndex);
  };

  const allAssigned = weights.every(w => w.assignedTo !== null);
  const assignedCount = weights.filter(w => w.assignedTo !== null).length;

  // Tap-based selection: tap weight, then tap target
  const handleWeightTap = useCallback((weightValue: number) => {
    if (showResult) return;
    setSelectedWeight(prev => prev === weightValue ? null : weightValue);
  }, [showResult]);

  const handleTargetTap = useCallback((targetIndex: number) => {
    if (showResult) return;

    // If we have a selected weight, assign it to this target
    if (selectedWeight !== null) {
      setWeights(prev => {
        const newWeights = [...prev];
        
        // Find the weight being assigned
        const selectedIdx = newWeights.findIndex(w => w.value === selectedWeight);
        if (selectedIdx === -1) return prev;
        
        // Check if target already has a weight
        const existingWeightIdx = newWeights.findIndex(w => w.assignedTo === targetIndex);
        
        // If target has a weight, swap or return to pool
        if (existingWeightIdx !== -1 && existingWeightIdx !== selectedIdx) {
          const oldAssignment = newWeights[selectedIdx].assignedTo;
          newWeights[existingWeightIdx].assignedTo = oldAssignment;
        }
        
        newWeights[selectedIdx].assignedTo = targetIndex;
        return newWeights;
      });
      
      setSelectedWeight(null);
    } else {
      // No weight selected - if target has a weight, select it for reassignment
      const assignedWeight = getAssignedWeight(targetIndex);
      if (assignedWeight) {
        setSelectedWeight(assignedWeight.value);
        setWeights(prev => 
          prev.map(w => w.assignedTo === targetIndex ? { ...w, assignedTo: null } : w)
        );
      }
    }
  }, [showResult, selectedWeight]);

  const handleConfirm = () => {
    if (!allAssigned) return;
    setShowResult(true);
    
    // Calculate score based on positional accuracy
    // Each correct position = 25 points (4 positions = 100 max)
    let correctPositions = 0;
    weights.forEach(w => {
      if (w.assignedTo !== null) {
        const expectedWeight = CORRECT_ALLOCATION[w.assignedTo as keyof typeof CORRECT_ALLOCATION];
        if (w.value === expectedWeight) {
          correctPositions++;
        }
      }
    });
    
    const score = Math.round((correctPositions / 4) * 100);
    const isCorrect = correctPositions === 4;
    
    resultRef.current = { score, correct: isCorrect };
  };

  const handleNext = () => {
    if (resultRef.current) {
      onComplete(resultRef.current);
    }
  };

  const unassignedWeights = weights.filter(w => w.assignedTo === null);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] p-4">
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
        
        {/* Allocation completeness indicator */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${i < assignedCount ? 'bg-amber-400' : 'bg-muted/40'}`}
                animate={{ scale: i < assignedCount ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <span className="text-muted-foreground text-xs">{assignedCount}/4 assigned</span>
        </div>
      </motion.div>

      {/* Unassigned weight chips - tap to select */}
      {!showResult && (
        <motion.div 
          className="flex flex-col items-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-xs text-muted-foreground">
            {selectedWeight !== null 
              ? `Tap a target to assign ${selectedWeight} coins` 
              : 'Tap a coin to select, then tap a target'}
          </p>
          <div className="flex gap-3 min-h-[50px] items-center justify-center flex-wrap">
            {unassignedWeights.length > 0 ? (
              unassignedWeights.map((weight) => (
                <motion.button
                  key={weight.id}
                  onClick={() => handleWeightTap(weight.value)}
                  className="touch-manipulation"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: selectedWeight === weight.value ? 1.1 : 1,
                    boxShadow: selectedWeight === weight.value 
                      ? "0 0 25px rgba(251, 191, 36, 0.8)" 
                      : "0 0 10px rgba(251, 191, 36, 0.2)"
                  }}
                >
                  <div className={`flex items-center gap-1 px-4 py-3 bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-2 rounded-xl transition-colors ${
                    selectedWeight === weight.value 
                      ? 'border-amber-400 bg-amber-500/40' 
                      : 'border-amber-500/50'
                  }`}>
                    <span className="text-amber-400 font-bold text-lg">{weight.value}</span>
                    <Coins className="w-4 h-4 text-amber-400/60" />
                  </div>
                </motion.button>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">All weights assigned</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Target options - drop zones */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
        {options.map((option, index) => {
          const assignedWeight = getAssignedWeight(index);
          const isCorrectPosition = showResult && assignedWeight && 
            assignedWeight.value === CORRECT_ALLOCATION[index as keyof typeof CORRECT_ALLOCATION];
          return (
            <motion.button
              key={index}
              onClick={() => handleTargetTap(index)}
              className="flex flex-col items-center touch-manipulation"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              disabled={showResult}
            >
              <motion.div
                className={`relative flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed transition-colors ${
                  selectedWeight !== null && !assignedWeight
                    ? 'border-amber-400 bg-amber-500/20' 
                    : assignedWeight 
                      ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-amber-600/10'
                      : 'border-muted/40 bg-muted/10'
                } ${showResult && isCorrectPosition ? 'border-green-500 bg-green-500/20' : ''}
                  ${showResult && assignedWeight && !isCorrectPosition ? 'border-red-500/50 bg-red-500/10' : ''}`}
                animate={{
                  scale: selectedWeight !== null && !assignedWeight ? 1.05 : 1,
                  boxShadow: assignedWeight 
                    ? "0 0 20px rgba(251, 191, 36, 0.3)" 
                    : "none"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Pulsing ring animation */}
                {assignedWeight && !showResult && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-amber-400/30"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
                
                {assignedWeight ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className={`font-bold text-2xl ${
                      showResult && isCorrectPosition ? 'text-green-400' : 
                      showResult && !isCorrectPosition ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {assignedWeight.value}
                    </span>
                    {!showResult && (
                      <span className="text-[10px] text-muted-foreground mt-1">
                        tap to move
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ opacity: selectedWeight !== null ? 1 : 0.3 }}
                    className="text-muted-foreground text-xs text-center"
                  >
                    {selectedWeight !== null ? "Tap here" : "Empty"}
                  </motion.div>
                )}
              </motion.div>
              
              <p className={`text-[10px] text-center mt-2 h-8 line-clamp-2 ${
                showResult && isCorrectPosition ? 'text-green-400' : 
                showResult && assignedWeight && !isCorrectPosition ? 'text-red-400/80' : 'text-muted-foreground'
              }`}>
                {option}
              </p>
              
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-1 px-2 py-0.5 rounded text-[10px] ${
                    isCorrectPosition
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isCorrectPosition ? "✓ Correct" : `Should be ${CORRECT_ALLOCATION[index as keyof typeof CORRECT_ALLOCATION]}`}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {!showResult && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: allAssigned ? 1 : 0.5, y: 0 }}
          onClick={handleConfirm}
          disabled={!allAssigned}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            allAssigned 
              ? 'bg-amber-500 text-black cursor-pointer hover:bg-amber-400' 
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          {allAssigned ? "Lock In Budget" : "Assign all weights"}
        </motion.button>
      )}

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 w-full max-w-sm"
          >
            {/* Animated Insight Card */}
            <motion.div 
              className="p-4 rounded-xl border bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-500/30 mb-4 relative overflow-hidden"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {/* Sparkle effects */}
              <motion.div
                className="absolute top-2 right-2"
                animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-amber-400/60" />
              </motion.div>
              
              <div className="flex items-center gap-2 mb-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  resultRef.current?.score === 100 
                    ? 'bg-green-500/20 text-green-400' 
                    : resultRef.current?.score && resultRef.current.score >= 50
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'
                }`}>
                  Score: {resultRef.current?.score}%
                </div>
                <span className="text-xs text-muted-foreground">
                  ({weights.filter(w => w.assignedTo !== null && w.value === CORRECT_ALLOCATION[w.assignedTo as keyof typeof CORRECT_ALLOCATION]).length}/4 correct)
                </span>
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs font-medium text-foreground mb-1">💡 Insight</p>
                <p className="text-xs text-muted-foreground">{explanation}</p>
              </motion.div>
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
