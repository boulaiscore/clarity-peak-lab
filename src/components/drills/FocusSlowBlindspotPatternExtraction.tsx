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

type ItemType = 'symmetric' | 'hierarchical' | 'organic' | 'geometric';
type Phase = 'intro' | 'demo' | 'scanning' | 'complete';

interface GridItem {
  id: string;
  type: ItemType;
  isTarget: boolean;
}

const ITEM_TYPES: ItemType[] = ['symmetric', 'hierarchical', 'organic', 'geometric'];

const ItemIcon: React.FC<{ type: ItemType; size?: number }> = ({ type, size = 32 }) => {
  const icons: Record<ItemType, JSX.Element> = {
    symmetric: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect x="4" y="4" width="10" height="10" fill="currentColor" opacity="0.7" />
        <rect x="18" y="4" width="10" height="10" fill="currentColor" opacity="0.7" />
        <rect x="4" y="18" width="10" height="10" fill="currentColor" opacity="0.7" />
        <rect x="18" y="18" width="10" height="10" fill="currentColor" opacity="0.7" />
      </svg>
    ),
    hierarchical: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="6" r="4" fill="currentColor" />
        <circle cx="8" cy="18" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="24" cy="18" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="16" cy="28" r="2" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    organic: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M16,4 Q28,8 24,16 Q20,24 16,28 Q12,24 8,16 Q4,8 16,4" fill="currentColor" opacity="0.7" />
      </svg>
    ),
    geometric: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <polygon points="16,2 30,26 2,26" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="18" r="5" fill="currentColor" opacity="0.6" />
      </svg>
    ),
  };
  
  return icons[type];
};

const DURATION = 25000; // 25 seconds
const TOTAL_ITEMS = 12;

export const FocusSlowBlindspotPatternExtraction: React.FC<FocusSlowBlindspotPatternExtractionProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [items, setItems] = useState<GridItem[]>([]);
  const [targetType, setTargetType] = useState<ItemType>('hierarchical');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(DURATION);
  
  const statsRef = useRef({
    correctHits: 0,
    falseHits: 0,
    misses: 0,
    reactionTimes: [] as number[],
  });
  
  const itemStartRef = useRef(0);
  const startTimeRef = useRef(0);

  // Generate items when phase becomes scanning
  useEffect(() => {
    if (phase === 'scanning') {
      // Pick a random target type
      const target = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
      setTargetType(target);
      
      // Generate items - about 30% are targets
      const newItems: GridItem[] = [];
      for (let i = 0; i < TOTAL_ITEMS; i++) {
        const isTarget = Math.random() < 0.35;
        const type = isTarget ? target : ITEM_TYPES.filter(t => t !== target)[Math.floor(Math.random() * 3)];
        newItems.push({
          id: `item-${i}`,
          type,
          isTarget: type === target,
        });
      }
      setItems(newItems);
      startTimeRef.current = Date.now();
      itemStartRef.current = Date.now();
    }
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== 'scanning') return;
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        // Calculate final score
        const targets = items.filter(item => item.isTarget);
        const correctHits = targets.filter(item => selectedItems.has(item.id)).length;
        const falseHits = [...selectedItems].filter(id => !items.find(i => i.id === id)?.isTarget).length;
        const misses = targets.length - correctHits;
        
        statsRef.current = { correctHits, falseHits, misses, reactionTimes: [] };
        setPhase('complete');
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [phase, items, selectedItems]);

  // Complete calculation
  useEffect(() => {
    if (phase === 'complete') {
      const { correctHits, falseHits, misses } = statsRef.current;
      const totalTargets = correctHits + misses;
      const accuracy = totalTargets > 0 ? correctHits / totalTargets : 0;
      const precision = (correctHits + falseHits) > 0 ? correctHits / (correctHits + falseHits) : 0;
      
      const accuracyScore = accuracy * 60;
      const precisionScore = precision * 40;
      
      const score = Math.round(Math.max(0, Math.min(100, accuracyScore + precisionScore)));
      
      onComplete({
        score,
        correct: correctHits,
        avgReactionTime: 0,
        metadata: { totalTargets, falseHits, misses },
      });
    }
  }, [phase, onComplete]);

  const handleItemClick = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

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
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="16" r="4" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Pattern Recognition</h2>
          <p className="text-muted-foreground mb-2 text-sm">Focus Arena • Slow Thinking</p>
          <p className="text-sm text-muted-foreground mb-6">
            A target pattern type will be shown. Tap all items that match the target pattern. 
            You have 25 seconds.
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">Find all:</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg">
              <span className="text-cyan-400">
                <ItemIcon type="hierarchical" size={24} />
              </span>
              <span className="text-cyan-400 font-medium">Hierarchical</span>
            </div>
          </div>
          
          {/* Demo grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="aspect-square rounded-lg border border-border bg-card flex items-center justify-center text-foreground">
              <ItemIcon type="symmetric" size={24} />
            </div>
            <motion.div 
              className="aspect-square rounded-lg border-2 border-cyan-500 bg-cyan-500/30 flex items-center justify-center text-foreground"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <ItemIcon type="hierarchical" size={24} />
            </motion.div>
            <div className="aspect-square rounded-lg border border-border bg-card flex items-center justify-center text-foreground">
              <ItemIcon type="organic" size={24} />
            </div>
            <div className="aspect-square rounded-lg border border-border bg-card flex items-center justify-center text-foreground">
              <ItemIcon type="geometric" size={24} />
            </div>
            <div className="aspect-square rounded-lg border border-border bg-card flex items-center justify-center text-foreground">
              <ItemIcon type="organic" size={24} />
            </div>
            <div className="aspect-square rounded-lg border border-border bg-card flex items-center justify-center text-foreground">
              <ItemIcon type="symmetric" size={24} />
            </div>
            <motion.div 
              className="aspect-square rounded-lg border-2 border-cyan-500 bg-cyan-500/30 flex items-center justify-center text-foreground"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <ItemIcon type="hierarchical" size={24} />
            </motion.div>
            <div className="aspect-square rounded-lg border border-border bg-card flex items-center justify-center text-foreground">
              <ItemIcon type="geometric" size={24} />
            </div>
          </div>
          
          <motion.p 
            className="text-xs text-cyan-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            ✓ Tap all matching patterns — 2 found!
          </motion.p>
          
          <motion.button
            className="w-full py-4 bg-cyan-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('scanning')}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const progress = timeLeft / DURATION;
  const targetLabel = targetType.charAt(0).toUpperCase() + targetType.slice(1);

  return (
    <div className="min-h-[400px] bg-background flex flex-col p-4">
      {/* Header with target */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-sm text-muted-foreground">Find all:</span>
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg">
            <span className="text-cyan-400">
              <ItemIcon type={targetType} size={24} />
            </span>
            <span className="text-cyan-400 font-medium">{targetLabel}</span>
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
          {Math.ceil(timeLeft / 1000)}s • Selected: {selectedItems.size}
        </p>
      </div>
      
      {/* Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-3 max-w-[320px]">
          {items.map((item) => {
            const isSelected = selectedItems.has(item.id);
            
            return (
              <motion.button
                key={item.id}
                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-cyan-500/30 border-2 border-cyan-500'
                    : 'bg-card border border-border hover:border-cyan-500/50'
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleItemClick(item.id)}
              >
                <span className="text-foreground">
                  <ItemIcon type={item.type} size={28} />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FocusSlowBlindspotPatternExtraction;