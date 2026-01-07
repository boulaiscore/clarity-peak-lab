import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from '../DrillCompletionScreen';

interface MultiFeatureLockDrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (results: { score: number; accuracy: number; avgReactionTime: number }) => void;
}

type Shape = 'circle' | 'square' | 'triangle';
type Color = 'red' | 'blue' | 'green';
type Size = 'small' | 'large';

interface Item {
  id: number;
  shape: Shape;
  color: Color;
  size: Size;
  x: number;
  y: number;
}

interface TargetCriteria {
  shape?: Shape;
  color?: Color;
  size?: Size;
}

const DIFFICULTY_CONFIG = {
  easy: { duration: 45000, features: 2, itemCount: 4, displayTime: 3000 },
  medium: { duration: 50000, features: 2, itemCount: 5, displayTime: 2500 },
  hard: { duration: 55000, features: 3, itemCount: 6, displayTime: 2000 },
};

const SHAPES: Shape[] = ['circle', 'square', 'triangle'];
const COLORS: Color[] = ['red', 'blue', 'green'];
const SIZES: Size[] = ['small', 'large'];

export const MultiFeatureLockDrill: React.FC<MultiFeatureLockDrillProps> = ({ difficulty, onComplete }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<'instruction' | 'playing' | 'results'>('instruction');
  const [items, setItems] = useState<Item[]>([]);
  const [criteria, setCriteria] = useState<TargetCriteria>({});
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [feedback, setFeedback] = useState<{ id: number; correct: boolean } | null>(null);
  const roundStartTime = useRef(Date.now());

  const generateCriteria = useCallback((): TargetCriteria => {
    const newCriteria: TargetCriteria = {};
    const features = ['shape', 'color', 'size'];
    const selectedFeatures = features.sort(() => Math.random() - 0.5).slice(0, config.features);
    
    selectedFeatures.forEach(f => {
      if (f === 'shape') newCriteria.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      if (f === 'color') newCriteria.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      if (f === 'size') newCriteria.size = SIZES[Math.floor(Math.random() * SIZES.length)];
    });
    
    return newCriteria;
  }, [config.features]);

  const generateItems = useCallback((targetCriteria: TargetCriteria): Item[] => {
    const newItems: Item[] = [];
    
    // Ensure at least one valid target
    const validTarget: Item = {
      id: 0,
      shape: targetCriteria.shape || SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: targetCriteria.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      size: targetCriteria.size || SIZES[Math.floor(Math.random() * SIZES.length)],
      x: Math.random() * 70 + 15,
      y: Math.random() * 60 + 20,
    };
    newItems.push(validTarget);
    
    // Add distractors
    for (let i = 1; i < config.itemCount; i++) {
      newItems.push({
        id: i,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: SIZES[Math.floor(Math.random() * SIZES.length)],
        x: Math.random() * 70 + 15,
        y: Math.random() * 60 + 20,
      });
    }
    
    return newItems.sort(() => Math.random() - 0.5);
  }, [config.itemCount]);

  const isMatch = useCallback((item: Item, target: TargetCriteria): boolean => {
    if (target.shape && item.shape !== target.shape) return false;
    if (target.color && item.color !== target.color) return false;
    if (target.size && item.size !== target.size) return false;
    return true;
  }, []);

  const startNewRound = useCallback(() => {
    const newCriteria = generateCriteria();
    setCriteria(newCriteria);
    setItems(generateItems(newCriteria));
    roundStartTime.current = Date.now();
  }, [generateCriteria, generateItems]);

  useEffect(() => {
    if (phase === 'playing') {
      startNewRound();
    }
  }, [phase, startNewRound]);

  useEffect(() => {
    if (phase !== 'playing') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          setPhase('results');
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [phase]);

  const handleTap = useCallback((item: Item) => {
    if (phase !== 'playing' || feedback) return;
    
    const rt = Date.now() - roundStartTime.current;
    const correct = isMatch(item, criteria);
    
    setReactionTimes(prev => [...prev, rt]);
    setFeedback({ id: item.id, correct });
    
    if (correct) {
      setLiveStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    } else {
      setLiveStats(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1 }));
    }
    
    setTimeout(() => {
      setFeedback(null);
      startNewRound();
    }, 600);
  }, [phase, feedback, isMatch, criteria, startNewRound]);

  const getCriteriaText = () => {
    const parts: string[] = [];
    if (criteria.size) parts.push(criteria.size);
    if (criteria.color) parts.push(criteria.color);
    if (criteria.shape) parts.push(criteria.shape);
    return parts.join(' ');
  };

  const getShapeElement = (item: Item) => {
    const size = item.size === 'small' ? 30 : 50;
    const colorMap = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e' };
    
    if (item.shape === 'circle') {
      return <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: colorMap[item.color] }} />;
    }
    if (item.shape === 'square') {
      return <div style={{ width: size, height: size, backgroundColor: colorMap[item.color] }} />;
    }
    return (
      <div style={{
        width: 0, height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${colorMap[item.color]}`,
      }} />
    );
  };

  if (phase === 'instruction') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Multi-Feature Lock</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Find the item that matches ALL the criteria shown. 
          The target must match every feature specified!
        </p>
        <motion.button
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium"
          whileTap={{ scale: 0.95 }}
          onClick={() => setPhase('playing')}
        >
          Start
        </motion.button>
      </motion.div>
    );
  }

  if (phase === 'results') {
    const total = liveStats.hits + liveStats.misses + liveStats.falseAlarms;
    const score = total > 0 ? Math.round((liveStats.hits / total) * 100) : 0;
    const avgRT = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    return (
      <DrillCompletionScreen
        title="Multi-Feature Lock"
        score={score}
        stats={[
          { label: 'Correct', value: liveStats.hits },
          { label: 'Wrong', value: liveStats.falseAlarms },
          { label: 'Avg RT', value: `${avgRT}ms` },
        ]}
        onContinue={() => onComplete({ score, accuracy: score, avgReactionTime: avgRT })}
      />
    );
  }

  return (
    <div className="flex flex-col items-center p-4 min-h-[500px]">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          <span className="text-green-500">{liveStats.hits}</span> / 
          <span className="text-red-500 ml-1">{liveStats.falseAlarms}</span>
        </div>
        <div className="text-lg font-mono text-foreground">
          {Math.ceil(timeLeft / 1000)}s
        </div>
      </div>

      {/* Target Criteria */}
      <div className="bg-primary/10 px-4 py-2 rounded-full mb-6">
        <span className="text-primary font-medium">Find: {getCriteriaText()}</span>
      </div>

      {/* Play Area */}
      <div className="relative w-full h-80 bg-muted/10 rounded-xl overflow-hidden">
        <AnimatePresence mode="wait">
          {items.map((item) => (
            <motion.button
              key={item.id}
              className={`absolute flex items-center justify-center p-2 rounded-lg ${
                feedback?.id === item.id
                  ? feedback.correct
                    ? 'ring-2 ring-green-500 bg-green-500/20'
                    : 'ring-2 ring-red-500 bg-red-500/20'
                  : 'hover:bg-muted/20'
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTap(item)}
            >
              {getShapeElement(item)}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
