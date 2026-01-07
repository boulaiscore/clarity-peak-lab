// Speed Sort - Level 1 Reactive Focus
// Rapidly classify stimuli into two categories via drag/swipe
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface SpeedSortDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

type Category = 'living' | 'object';

interface SortItem {
  id: number;
  word: string;
  category: Category;
}

const LIVING = ['Dog', 'Cat', 'Bird', 'Fish', 'Tree', 'Flower', 'Bee', 'Lion', 'Frog', 'Ant'];
const OBJECTS = ['Chair', 'Phone', 'Book', 'Cup', 'Lamp', 'Key', 'Clock', 'Shoe', 'Bag', 'Pen'];

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { itemTime: 3500 },
  medium: { itemTime: 2500 },
  hard: { itemTime: 1800 },
};

export const SpeedSortDrill: React.FC<SpeedSortDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [currentItem, setCurrentItem] = useState<SortItem | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const statsRef = useRef({ correct: 0, wrong: 0, reactionTimes: [] as number[], itemStartTime: 0 });
  const startTimeRef = useRef(0);
  const idRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];
  
  const x = useMotionValue(0);
  const background = useTransform(x, [-100, 0, 100], [
    'hsl(var(--destructive) / 0.1)',
    'hsl(var(--background))',
    'hsl(140, 70%, 45%, 0.1)',
  ]);

  const generateItem = useCallback((): SortItem => {
    const isLiving = Math.random() > 0.5;
    const pool = isLiving ? LIVING : OBJECTS;
    return {
      id: idRef.current++,
      word: pool[Math.floor(Math.random() * pool.length)],
      category: isLiving ? 'living' : 'object',
    };
  }, []);

  const nextItem = useCallback(() => {
    setCurrentItem(generateItem());
    statsRef.current.itemStartTime = Date.now();
    x.set(0);
  }, [generateItem, x]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    nextItem();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('complete');
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [phase, nextItem]);

  const handleSort = useCallback((direction: 'left' | 'right') => {
    if (!currentItem) return;
    
    const rt = Date.now() - statsRef.current.itemStartTime;
    statsRef.current.reactionTimes.push(rt);
    
    const sortedAsLiving = direction === 'right';
    const isCorrect = (sortedAsLiving && currentItem.category === 'living') || 
                      (!sortedAsLiving && currentItem.category === 'object');
    
    if (isCorrect) {
      statsRef.current.correct++;
      setFeedback('correct');
    } else {
      statsRef.current.wrong++;
      setFeedback('wrong');
    }
    
    animate(x, direction === 'left' ? -200 : 200, { duration: 0.2 });
    
    setTimeout(() => {
      setFeedback(null);
      nextItem();
    }, 300);
  }, [currentItem, nextItem, x]);

  const handleDragEnd = useCallback(() => {
    const currentX = x.get();
    if (Math.abs(currentX) > 50) {
      handleSort(currentX > 0 ? 'right' : 'left');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  }, [x, handleSort]);

  useEffect(() => {
    if (phase === 'complete') {
      const { correct, wrong, reactionTimes } = statsRef.current;
      const total = correct + wrong;
      const accuracy = total > 0 ? correct / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(accuracy * 100);
      onComplete({ score, correct, avgReactionTime: Math.round(avgRT) });
    }
  }, [phase, onComplete]);

  if (phase === 'intro') {
    return (
      <motion.div 
        className="flex-1 bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <div className="flex gap-8 mb-4">
          <div className="text-center">
            <span className="text-2xl">📦</span>
            <p className="text-xs text-muted-foreground mt-1">← Object</p>
          </div>
          <div className="text-center">
            <span className="text-2xl">🌱</span>
            <p className="text-xs text-muted-foreground mt-1">Living →</p>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Speed Sort</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 1 • Reactive Focus</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Swipe left for objects, right for living things. Be fast and accurate.
        </p>
        <motion.button
          className="w-full max-w-xs py-3.5 bg-primary text-primary-foreground rounded-xl font-medium"
          whileTap={{ scale: 0.98 }}
          onClick={() => setPhase('active')}
        >
          Start
        </motion.button>
      </motion.div>
    );
  }

  const progress = timeLeft / DURATION;

  return (
    <motion.div className="min-h-screen flex flex-col" style={{ background }}>
      {/* Header */}
      <div className="p-4 bg-background/90">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>← Object | Living →</span>
          <span>{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Category labels */}
      <div className="flex justify-between px-6 py-2">
        <span className="text-sm font-medium text-muted-foreground">📦 Object</span>
        <span className="text-sm font-medium text-muted-foreground">Living 🌱</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6">
        {currentItem && (
          <motion.div
            className="w-full max-w-xs bg-card rounded-2xl border border-border shadow-lg p-8 cursor-grab active:cursor-grabbing"
            style={{ x }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={handleDragEnd}
          >
            <p className="text-3xl font-bold text-foreground text-center">{currentItem.word}</p>
          </motion.div>
        )}
        
        {feedback && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className={`text-6xl ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? '✓' : '✗'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Sorted: {statsRef.current.correct + statsRef.current.wrong} | Correct: {statsRef.current.correct}
        </p>
      </div>
    </motion.div>
  );
};

export default SpeedSortDrill;
