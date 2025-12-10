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

type ItemType = 'symmetric' | 'hierarchical' | 'organic' | 'geometric' | 'chaotic' | 'minimal';
type Phase = 'intro' | 'exposure' | 'reflection' | 'application' | 'complete';

interface GridItem {
  id: string;
  type: ItemType;
  selected?: boolean;
  isSignal?: boolean;
}

const ITEM_TYPES: ItemType[] = ['symmetric', 'hierarchical', 'organic', 'geometric', 'chaotic', 'minimal'];

const PATTERN_DESCRIPTIONS: Record<ItemType, string> = {
  symmetric: 'balanced, symmetrical elements',
  hierarchical: 'structured, hierarchical patterns',
  organic: 'flowing, organic shapes',
  geometric: 'precise, geometric forms',
  chaotic: 'complex, chaotic arrangements',
  minimal: 'simple, minimal designs',
};

const ItemIcon: React.FC<{ type: ItemType; size?: number }> = ({ type, size = 32 }) => {
  const paths: Record<ItemType, JSX.Element> = {
    symmetric: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect x="4" y="4" width="10" height="10" fill="currentColor" opacity="0.6" />
        <rect x="18" y="4" width="10" height="10" fill="currentColor" opacity="0.6" />
        <rect x="4" y="18" width="10" height="10" fill="currentColor" opacity="0.6" />
        <rect x="18" y="18" width="10" height="10" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    hierarchical: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="6" r="4" fill="currentColor" />
        <circle cx="8" cy="18" r="3" fill="currentColor" opacity="0.7" />
        <circle cx="24" cy="18" r="3" fill="currentColor" opacity="0.7" />
        <circle cx="4" cy="28" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="12" cy="28" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="20" cy="28" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="28" cy="28" r="2" fill="currentColor" opacity="0.5" />
      </svg>
    ),
    organic: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M16,4 Q28,8 24,16 Q20,24 16,28 Q12,24 8,16 Q4,8 16,4" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    geometric: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <polygon points="16,2 30,26 2,26" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="18" r="5" fill="currentColor" opacity="0.5" />
      </svg>
    ),
    chaotic: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <line x1="4" y1="8" x2="28" y2="12" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="24" x2="20" y2="4" stroke="currentColor" strokeWidth="2" />
        <line x1="24" y1="28" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="20" r="4" fill="currentColor" opacity="0.4" />
      </svg>
    ),
    minimal: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    ),
  };
  
  return paths[type];
};

const generateGrid = (size: number, signalTypes?: ItemType[]): GridItem[] => {
  const items: GridItem[] = [];
  for (let i = 0; i < size * size; i++) {
    const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    items.push({
      id: `item-${i}`,
      type,
      isSignal: signalTypes?.includes(type),
    });
  }
  return items;
};

export const FocusSlowBlindspotPatternExtraction: React.FC<FocusSlowBlindspotPatternExtractionProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [exposureRound, setExposureRound] = useState(0);
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [detectedBias, setDetectedBias] = useState<ItemType | null>(null);
  const [signalTypes, setSignalTypes] = useState<ItemType[]>([]);
  
  const userSelectionsRef = useRef<Record<ItemType, number>>({
    symmetric: 0,
    hierarchical: 0,
    organic: 0,
    geometric: 0,
    chaotic: 0,
    minimal: 0,
  });
  
  const EXPOSURE_ROUNDS = 8;

  useEffect(() => {
    if (phase === 'exposure') {
      setGrid(generateGrid(6));
      
      const highlightInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * 36);
        const itemId = `item-${randomIndex}`;
        setHighlightedItem(itemId);
        
        setTimeout(() => setHighlightedItem(null), 800);
      }, 1500);
      
      return () => clearInterval(highlightInterval);
    }
  }, [phase, exposureRound]);

  const handleExposureSelect = useCallback((item: GridItem, label: 'relevant' | 'noise') => {
    if (label === 'relevant') {
      userSelectionsRef.current[item.type]++;
    }
    
    setHighlightedItem(null);
    
    if (exposureRound < EXPOSURE_ROUNDS - 1) {
      setExposureRound(prev => prev + 1);
    } else {
      // Analyze bias
      const selections = userSelectionsRef.current;
      const maxType = Object.entries(selections).reduce((a, b) => 
        b[1] > a[1] ? b : a
      )[0] as ItemType;
      
      setDetectedBias(maxType);
      
      // Set signal types (objective important items that might differ from bias)
      const objectiveSignals: ItemType[] = ['hierarchical', 'geometric'];
      setSignalTypes(objectiveSignals);
      
      setPhase('reflection');
    }
  }, [exposureRound]);

  const handleApplicationSelect = useCallback((itemId: string) => {
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

  const handleApplicationComplete = useCallback(() => {
    const correctSelections = grid.filter(item => 
      selectedItems.has(item.id) && item.isSignal
    ).length;
    
    const totalSignals = grid.filter(item => item.isSignal).length;
    const falsePositives = selectedItems.size - correctSelections;
    
    const accuracy = totalSignals > 0 ? correctSelections / totalSignals : 0;
    const precision = selectedItems.size > 0 ? correctSelections / selectedItems.size : 0;
    
    // Check if user overcame their bias
    const biasItems = grid.filter(item => item.type === detectedBias && selectedItems.has(item.id));
    const overcameBias = biasItems.length < selectedItems.size * 0.5;
    
    const score = Math.round(
      (accuracy * 40) + 
      (precision * 30) + 
      (overcameBias ? 30 : 0)
    );
    
    onComplete({
      score: Math.min(100, score),
      correct: correctSelections,
      avgReactionTime: 0,
      metadata: {
        detectedBias,
        totalSignals,
        falsePositives,
        overcameBias,
      },
    });
  }, [grid, selectedItems, detectedBias, onComplete]);

  if (phase === 'intro') {
    return (
      <motion.div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
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
          <h2 className="text-2xl font-semibold text-foreground mb-3">Blindspot Pattern Extraction</h2>
          <p className="text-muted-foreground mb-2">Focus Arena • Slow Thinking</p>
          <p className="text-sm text-muted-foreground mb-8">
            Discover hidden patterns in your attention. Label items as relevant or noise, 
            then apply insights to correct your perceptual biases.
          </p>
          <motion.button
            className="w-full py-4 bg-cyan-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('exposure')}
          >
            Begin
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  if (phase === 'exposure') {
    const highlightedGridItem = grid.find(item => item.id === highlightedItem);
    
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-foreground">Phase 1: Scan</h3>
          <p className="text-sm text-muted-foreground">Round {exposureRound + 1} of {EXPOSURE_ROUNDS}</p>
        </div>
        
        {/* Progress */}
        <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-cyan-500"
            style={{ width: `${((exposureRound + 1) / EXPOSURE_ROUNDS) * 100}%` }}
          />
        </div>
        
        {/* Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-6 gap-2 max-w-[320px]">
            {grid.map((item) => (
              <motion.div
                key={item.id}
                className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                  item.id === highlightedItem
                    ? 'bg-cyan-500/30 border-2 border-cyan-500 scale-110'
                    : 'bg-card border border-border'
                }`}
                animate={{ scale: item.id === highlightedItem ? 1.1 : 1 }}
              >
                <span className="text-foreground">
                  <ItemIcon type={item.type} size={24} />
                </span>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Selection buttons */}
        {highlightedItem && highlightedGridItem && (
          <motion.div
            className="mt-6 flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              className="flex-1 py-3 bg-green-500/20 text-green-400 border border-green-500/50 rounded-xl font-medium"
              onClick={() => handleExposureSelect(highlightedGridItem, 'relevant')}
            >
              Relevant
            </button>
            <button
              className="flex-1 py-3 bg-muted text-muted-foreground border border-border rounded-xl font-medium"
              onClick={() => handleExposureSelect(highlightedGridItem, 'noise')}
            >
              Noise
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  if (phase === 'reflection') {
    return (
      <motion.div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center max-w-sm">
          <h3 className="text-lg font-medium text-foreground mb-2">Phase 2: Reveal</h3>
          
          <motion.div
            className="bg-card border border-border rounded-2xl p-6 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ItemIcon type={detectedBias!} size={28} />
            </div>
            <p className="text-foreground mb-2">Your attention tends toward:</p>
            <p className="text-cyan-400 font-medium text-lg">
              {PATTERN_DESCRIPTIONS[detectedBias!]}
            </p>
          </motion.div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Now apply this insight: select items that are truly important for growth and focus, 
            not just those that match your default pattern.
          </p>
          
          <motion.button
            className="w-full py-4 bg-cyan-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setGrid(generateGrid(6, signalTypes));
              setPhase('application');
            }}
          >
            Continue to Application
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'application') {
    return (
      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-foreground">Phase 3: Apply</h3>
          <p className="text-sm text-muted-foreground">Select all items that represent true "signal" for growth</p>
        </div>
        
        {/* Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-6 gap-2 max-w-[320px]">
            {grid.map((item) => (
              <motion.button
                key={item.id}
                className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                  selectedItems.has(item.id)
                    ? 'bg-cyan-500/30 border-2 border-cyan-500'
                    : 'bg-card border border-border'
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleApplicationSelect(item.id)}
              >
                <span className="text-foreground">
                  <ItemIcon type={item.type} size={24} />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Selected: {selectedItems.size} items
          </p>
          <motion.button
            className="w-full py-4 bg-cyan-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={handleApplicationComplete}
          >
            Submit Selection
          </motion.button>
        </div>
      </div>
    );
  }

  return null;
};

export default FocusSlowBlindspotPatternExtraction;
