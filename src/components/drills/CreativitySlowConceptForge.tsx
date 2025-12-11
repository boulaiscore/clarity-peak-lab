import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
  metadata?: Record<string, any>;
}

interface CreativitySlowConceptForgeProps {
  onComplete: (result: DrillResult) => void;
}

type Phase = 'intro' | 'demo' | 'active';

interface AnalogyPuzzle {
  id: string;
  // A is to B as C is to ?
  itemA: { shape: string; color: string };
  itemB: { shape: string; color: string };
  itemC: { shape: string; color: string };
  options: { shape: string; color: string }[];
  correctIndex: number;
  relationship: string; // For explanation
}

// Generate visual analogy puzzles
const generatePuzzles = (): AnalogyPuzzle[] => {
  const shapes = ['●', '■', '▲', '◆', '★', '⬟'];
  const colors = ['text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400', 'text-cyan-400'];
  
  const puzzles: AnalogyPuzzle[] = [
    {
      id: '1',
      // Small circle → Big circle, Small square → ?
      itemA: { shape: '●', color: 'text-red-400' },
      itemB: { shape: '⬤', color: 'text-red-400' },
      itemC: { shape: '■', color: 'text-blue-400' },
      options: [
        { shape: '▲', color: 'text-blue-400' },
        { shape: '◼', color: 'text-blue-400' },
        { shape: '■', color: 'text-green-400' },
        { shape: '●', color: 'text-blue-400' },
      ],
      correctIndex: 1,
      relationship: 'Size increase (small → large)',
    },
    {
      id: '2',
      // Red circle → Blue circle, Red square → ?
      itemA: { shape: '●', color: 'text-red-400' },
      itemB: { shape: '●', color: 'text-blue-400' },
      itemC: { shape: '■', color: 'text-red-400' },
      options: [
        { shape: '■', color: 'text-green-400' },
        { shape: '▲', color: 'text-blue-400' },
        { shape: '■', color: 'text-blue-400' },
        { shape: '●', color: 'text-red-400' },
      ],
      correctIndex: 2,
      relationship: 'Color change (red → blue)',
    },
    {
      id: '3',
      // Circle → Square, Triangle → ?
      itemA: { shape: '●', color: 'text-purple-400' },
      itemB: { shape: '■', color: 'text-purple-400' },
      itemC: { shape: '▲', color: 'text-purple-400' },
      options: [
        { shape: '◆', color: 'text-purple-400' },
        { shape: '●', color: 'text-purple-400' },
        { shape: '▲', color: 'text-blue-400' },
        { shape: '★', color: 'text-purple-400' },
      ],
      correctIndex: 0,
      relationship: 'Shape progression (+1 side)',
    },
    {
      id: '4',
      // 1 circle → 2 circles, 1 star → ?
      itemA: { shape: '●', color: 'text-yellow-400' },
      itemB: { shape: '●●', color: 'text-yellow-400' },
      itemC: { shape: '★', color: 'text-cyan-400' },
      options: [
        { shape: '★', color: 'text-yellow-400' },
        { shape: '★★', color: 'text-cyan-400' },
        { shape: '●●', color: 'text-cyan-400' },
        { shape: '◆◆', color: 'text-cyan-400' },
      ],
      correctIndex: 1,
      relationship: 'Quantity doubling',
    },
    {
      id: '5',
      // Filled → Outline, Circle filled → Circle outline
      itemA: { shape: '●', color: 'text-green-400' },
      itemB: { shape: '○', color: 'text-green-400' },
      itemC: { shape: '■', color: 'text-red-400' },
      options: [
        { shape: '■', color: 'text-green-400' },
        { shape: '●', color: 'text-red-400' },
        { shape: '□', color: 'text-red-400' },
        { shape: '▲', color: 'text-red-400' },
      ],
      correctIndex: 2,
      relationship: 'Fill change (solid → outline)',
    },
  ];
  
  // Shuffle puzzles
  return puzzles.sort(() => Math.random() - 0.5).slice(0, 3);
};

const DURATION = 20000; // 20 seconds

export const CreativitySlowConceptForge: React.FC<CreativitySlowConceptForgeProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [puzzles, setPuzzles] = useState<AnalogyPuzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<{ option: { shape: string; color: string }; originalIndex: number }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize puzzles
  useEffect(() => {
    if (phase === 'active' && puzzles.length === 0) {
      setPuzzles(generatePuzzles());
      setStartTime(Date.now());
      
      // Set timeout for drill
      timerRef.current = setTimeout(() => {
        finishDrill();
      }, DURATION);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  // Shuffle options when puzzle changes
  useEffect(() => {
    if (puzzles.length > 0 && currentPuzzleIndex < puzzles.length) {
      const puzzle = puzzles[currentPuzzleIndex];
      const optionsWithIndex = puzzle.options.map((opt, idx) => ({ option: opt, originalIndex: idx }));
      setShuffledOptions(optionsWithIndex.sort(() => Math.random() - 0.5));
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [currentPuzzleIndex, puzzles]);

  const finishDrill = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const avgRT = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;
    
    const accuracy = puzzles.length > 0 ? correctCount / puzzles.length : 0;
    const score = Math.round(accuracy * 100);
    
    onComplete({
      score,
      correct: correctCount,
      avgReactionTime: avgRT,
      metadata: {
        totalPuzzles: puzzles.length,
        accuracy,
      },
    });
  }, [correctCount, puzzles.length, reactionTimes, onComplete]);

  const handleOptionSelect = useCallback((shuffledIndex: number) => {
    if (feedback !== null || puzzles.length === 0) return;
    
    const selectedOriginalIndex = shuffledOptions[shuffledIndex].originalIndex;
    const puzzle = puzzles[currentPuzzleIndex];
    const isCorrect = selectedOriginalIndex === puzzle.correctIndex;
    const rt = Date.now() - startTime;
    
    setSelectedOption(shuffledIndex);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setReactionTimes(prev => [...prev, rt]);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
  }, [feedback, puzzles, currentPuzzleIndex, startTime, shuffledOptions]);

  const handleNextPuzzle = useCallback(() => {
    if (currentPuzzleIndex + 1 < puzzles.length) {
      setCurrentPuzzleIndex(prev => prev + 1);
      setStartTime(Date.now());
      setFeedback(null);
      setSelectedOption(null);
    } else {
      finishDrill();
    }
  }, [currentPuzzleIndex, puzzles.length, finishDrill]);

  // Intro screen
  if (phase === 'intro') {
    return (
      <motion.div
        className="flex-1 bg-background flex flex-col items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.div 
            className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center"
          >
            <span className="text-2xl">🔗</span>
          </motion.div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Visual Analogies</h2>
          <p className="text-muted-foreground mb-1 text-xs">Creativity • Slow Thinking</p>
          <p className="text-sm text-muted-foreground mb-5">
            A is to B as C is to...? Find the pattern.
          </p>
          <motion.button
            className="w-full py-3.5 bg-purple-500 text-white rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('demo')}
          >
            See Example
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Demo screen
  if (phase === 'demo') {
    return (
      <motion.div
        className="flex-1 bg-background flex flex-col items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h3 className="text-base font-medium text-foreground mb-4">Example</h3>
          
          {/* Analogy display */}
          <div className="bg-card/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex flex-col items-center">
                <span className="text-3xl text-red-400">●</span>
                <span className="text-[10px] text-muted-foreground">A</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl text-red-400">⬤</span>
                <span className="text-[10px] text-muted-foreground">B</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-3xl text-blue-400">■</span>
                <span className="text-[10px] text-muted-foreground">C</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl text-blue-400 bg-green-500/20 rounded px-1">◼</span>
                <span className="text-[10px] text-green-400">? ✓</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4">
            <strong>Pattern:</strong> Small → Big<br/>
            So: Small blue square → <span className="text-green-400">Big blue square</span>
          </p>
          
          <motion.button
            className="w-full py-3.5 bg-purple-500 text-white rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('active')}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Active phase
  if (puzzles.length === 0 || currentPuzzleIndex >= puzzles.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentPuzzle = puzzles[currentPuzzleIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      {/* Progress */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">
          {currentPuzzleIndex + 1} / {puzzles.length}
        </span>
        <span className="text-sm text-muted-foreground">
          {correctCount} correct
        </span>
      </div>
      
      {/* Analogy Question */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-sm text-muted-foreground mb-4">A is to B as C is to...?</p>
        
        {/* A → B */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-card/50 rounded-xl flex items-center justify-center">
              <span className={`text-5xl ${currentPuzzle.itemA.color}`}>{currentPuzzle.itemA.shape}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">A</span>
          </div>
          
          <span className="text-2xl text-muted-foreground">→</span>
          
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-card/50 rounded-xl flex items-center justify-center">
              <span className={`text-5xl ${currentPuzzle.itemB.color}`}>{currentPuzzle.itemB.shape}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">B</span>
          </div>
        </div>
        
        {/* C → ? */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-card/50 rounded-xl flex items-center justify-center">
              <span className={`text-5xl ${currentPuzzle.itemC.color}`}>{currentPuzzle.itemC.shape}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">C</span>
          </div>
          
          <span className="text-2xl text-muted-foreground">→</span>
          
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-card/30 border-2 border-dashed border-purple-500/50 rounded-xl flex items-center justify-center">
              <span className="text-3xl text-purple-400">?</span>
            </div>
            <span className="text-xs text-purple-400 mt-1">Select below</span>
          </div>
        </div>
        
        {/* Options */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {shuffledOptions.map((item, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = item.originalIndex === currentPuzzle.correctIndex;
            
            let bgClass = 'bg-card border border-border';
            if (feedback !== null && isSelected) {
              bgClass = feedback === 'correct' 
                ? 'bg-green-500/20 border-2 border-green-500' 
                : 'bg-red-500/20 border-2 border-red-500';
            } else if (feedback === 'incorrect' && isCorrect) {
              bgClass = 'bg-green-500/20 border-2 border-green-500';
            }
            
            return (
              <motion.button
                key={idx}
                className={`p-4 rounded-xl flex items-center justify-center transition-all ${bgClass}`}
                whileTap={{ scale: feedback === null ? 0.95 : 1 }}
                onClick={() => handleOptionSelect(idx)}
                disabled={feedback !== null}
              >
                <span className={`text-4xl ${item.option.color}`}>{item.option.shape}</span>
              </motion.button>
            );
          })}
        </div>
        
        {/* Feedback */}
        {feedback && (
          <motion.div 
            className="mt-4 w-full max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className={`text-sm font-medium mb-3 text-center ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
              {feedback === 'correct' ? '✓ Correct!' : `✗ Pattern: ${currentPuzzle.relationship}`}
            </p>
            
            <Button 
              onClick={handleNextPuzzle}
              variant="hero"
              className="w-full h-12"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreativitySlowConceptForge;
