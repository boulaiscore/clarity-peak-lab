import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
  metadata?: Record<string, any>;
}

interface FocusSlowBlindspotPatternExtractionProps {
  onComplete: (result: DrillResult) => void;
}

type Phase = 'intro' | 'demo' | 'active' | 'complete';

// Different shape patterns - some are similar to make it challenging
type ShapeType = 'circle' | 'square' | 'triangle' | 'diamond' | 'pentagon' | 'hexagon';

const SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon'];

const ShapeIcon: React.FC<{ type: ShapeType; size?: number; filled?: boolean }> = ({ type, size = 48, filled = true }) => {
  const color = filled ? 'currentColor' : 'none';
  const stroke = filled ? 'none' : 'currentColor';
  const strokeWidth = filled ? 0 : 3;
  
  const icons: Record<ShapeType, JSX.Element> = {
    circle: (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="18" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    ),
    square: (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <rect x="8" y="8" width="32" height="32" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    ),
    triangle: (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <polygon points="24,6 42,42 6,42" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    ),
    diamond: (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <polygon points="24,4 44,24 24,44 4,24" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    ),
    pentagon: (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <polygon points="24,4 44,18 38,42 10,42 4,18" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    ),
    hexagon: (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill={color} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    ),
  };
  
  return icons[type];
};

const DURATION = 15000; // 15 seconds
const ITEM_DISPLAY_TIME = 1200; // Show each item for 1.2s
const TOTAL_ITEMS = 12;

export const FocusSlowBlindspotPatternExtraction: React.FC<FocusSlowBlindspotPatternExtractionProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [targetShape, setTargetShape] = useState<ShapeType>('circle');
  const [currentItem, setCurrentItem] = useState<{ shape: ShapeType; isTarget: boolean } | null>(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  
  const statsRef = useRef({
    correctHits: 0,
    falseHits: 0,
    misses: 0,
    reactionTimes: [] as number[],
  });
  
  const itemsRef = useRef<{ shape: ShapeType; isTarget: boolean }[]>([]);
  const itemStartRef = useRef(0);
  const startTimeRef = useRef(0);
  const hasRespondedRef = useRef(false);

  // Generate sequence when phase becomes active
  useEffect(() => {
    if (phase === 'active') {
      // Pick a random target shape
      const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      setTargetShape(target);
      
      // Generate item sequence - about 35% are targets
      const items: { shape: ShapeType; isTarget: boolean }[] = [];
      for (let i = 0; i < TOTAL_ITEMS; i++) {
        const isTarget = Math.random() < 0.35;
        const shape = isTarget ? target : SHAPES.filter(s => s !== target)[Math.floor(Math.random() * 5)];
        items.push({ shape, isTarget });
      }
      itemsRef.current = items;
      startTimeRef.current = Date.now();
      setItemIndex(0);
      setCurrentItem(items[0]);
      itemStartRef.current = Date.now();
      hasRespondedRef.current = false;
    }
  }, [phase]);

  // Item progression
  useEffect(() => {
    if (phase !== 'active' || !currentItem) return;
    
    const timer = setTimeout(() => {
      // If didn't respond and it was a target, count as miss
      if (!hasRespondedRef.current && currentItem.isTarget) {
        statsRef.current.misses++;
      }
      
      // Next item
      const nextIndex = itemIndex + 1;
      if (nextIndex >= TOTAL_ITEMS) {
        setPhase('complete');
      } else {
        setItemIndex(nextIndex);
        setCurrentItem(itemsRef.current[nextIndex]);
        itemStartRef.current = Date.now();
        hasRespondedRef.current = false;
        setFeedback(null);
      }
    }, ITEM_DISPLAY_TIME);
    
    return () => clearTimeout(timer);
  }, [phase, currentItem, itemIndex]);

  // Timer
  useEffect(() => {
    if (phase !== 'active') return;
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setPhase('complete');
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [phase]);

  // Complete calculation
  useEffect(() => {
    if (phase === 'complete') {
      const { correctHits, falseHits, misses, reactionTimes } = statsRef.current;
      const totalTargets = correctHits + misses;
      const accuracy = totalTargets > 0 ? correctHits / totalTargets : 0;
      const precision = (correctHits + falseHits) > 0 ? correctHits / (correctHits + falseHits) : 1;
      
      const accuracyScore = accuracy * 50;
      const precisionScore = precision * 30;
      const speedBonus = reactionTimes.length > 0 
        ? Math.max(0, 20 - (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 50))
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, accuracyScore + precisionScore + speedBonus)));
      
      onComplete({
        score,
        correct: correctHits,
        avgReactionTime: reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0,
        metadata: { totalTargets, falseHits, misses },
      });
    }
  }, [phase, onComplete]);

  const handleTap = useCallback(() => {
    if (phase !== 'active' || !currentItem || hasRespondedRef.current) return;
    
    hasRespondedRef.current = true;
    const reactionTime = Date.now() - itemStartRef.current;
    
    if (currentItem.isTarget) {
      statsRef.current.correctHits++;
      statsRef.current.reactionTimes.push(reactionTime);
      setFeedback('correct');
    } else {
      statsRef.current.falseHits++;
      setFeedback('wrong');
    }
  }, [phase, currentItem]);

  if (phase === 'intro') {
    return (
      <motion.div
        className="min-h-[400px] bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ShapeIcon type="hexagon" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Shape Vigilance</h2>
          <p className="text-muted-foreground mb-2 text-sm">Focus Arena • Slow Thinking</p>
          <p className="text-sm text-muted-foreground mb-6">
            Shapes will appear one at a time. Tap only when you see the target shape. 
            Don't tap for other shapes!
          </p>
          <motion.button
            className="w-full py-4 bg-cyan-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('demo')}
          >
            See Example
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  if (phase === 'demo') {
    return (
      <motion.div
        className="min-h-[400px] bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h3 className="text-lg font-medium text-foreground mb-4">Example</h3>
          
          {/* Demo target */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-sm text-muted-foreground">Target:</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg">
              <span className="text-cyan-400">
                <ShapeIcon type="circle" size={28} />
              </span>
            </div>
          </div>
          
          {/* Demo sequence */}
          <div className="flex justify-center gap-4 mb-6">
            <motion.div 
              className="w-16 h-16 rounded-xl border border-border bg-card flex items-center justify-center text-foreground"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ShapeIcon type="square" size={32} />
            </motion.div>
            <motion.div 
              className="w-16 h-16 rounded-xl border-2 border-green-500 bg-green-500/20 flex items-center justify-center text-foreground relative"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <ShapeIcon type="circle" size={32} />
              <span className="absolute -bottom-6 text-xs text-green-400">TAP ✓</span>
            </motion.div>
            <motion.div 
              className="w-16 h-16 rounded-xl border border-border bg-card flex items-center justify-center text-foreground"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
            >
              <ShapeIcon type="triangle" size={32} />
            </motion.div>
          </div>
          
          <motion.p 
            className="text-xs text-muted-foreground mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Tap only for the target shape, ignore others
          </motion.p>
          
          <motion.button
            className="w-full py-4 bg-cyan-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('active')}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const progress = timeLeft / DURATION;
  const targetLabel = targetShape.charAt(0).toUpperCase() + targetShape.slice(1);

  return (
    <motion.div 
      className="min-h-[400px] bg-background flex flex-col p-4"
      onClick={handleTap}
    >
      {/* Header with target */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-sm text-muted-foreground">Target:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-lg">
            <span className="text-cyan-400">
              <ShapeIcon type={targetShape} size={24} />
            </span>
          </div>
        </div>
        
        {/* Timer */}
        <div className="h-1 bg-muted rounded-full overflow-hidden max-w-[200px] mx-auto">
          <motion.div
            className="h-full bg-cyan-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {itemIndex + 1}/{TOTAL_ITEMS}
        </p>
      </div>
      
      {/* Main shape display */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {currentItem && (
            <motion.div
              key={itemIndex}
              className={`w-32 h-32 rounded-2xl flex items-center justify-center transition-colors ${
                feedback === 'correct'
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : feedback === 'wrong'
                  ? 'bg-red-500/20 border-2 border-red-500'
                  : 'bg-card border border-border'
              }`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <span className={
                feedback === 'correct' 
                  ? 'text-green-400' 
                  : feedback === 'wrong' 
                  ? 'text-red-400' 
                  : 'text-foreground'
              }>
                <ShapeIcon type={currentItem.shape} size={64} />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Instructions */}
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground">
          Tap anywhere when you see the target
        </p>
      </div>
    </motion.div>
  );
};

export default FocusSlowBlindspotPatternExtraction;
