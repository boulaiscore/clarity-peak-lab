import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from '../DrillCompletionScreen';

interface HiddenRuleDrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (results: { score: number; accuracy: number; avgReactionTime: number }) => void;
}

type Shape = 'circle' | 'square' | 'triangle';
type Color = 'red' | 'blue' | 'green' | 'yellow';

interface Item {
  id: number;
  shape: Shape;
  color: Color;
  size: 'small' | 'large';
}

type Rule = 'shape' | 'color' | 'size';

const DIFFICULTY_CONFIG = {
  easy: { duration: 45000, ruleComplexity: 1, feedbackDelay: 800 },
  medium: { duration: 50000, ruleComplexity: 2, feedbackDelay: 500 },
  hard: { duration: 55000, ruleComplexity: 3, feedbackDelay: 300 },
};

const SHAPES: Shape[] = ['circle', 'square', 'triangle'];
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

export const HiddenRuleDrill: React.FC<HiddenRuleDrillProps> = ({ difficulty, onComplete }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<'instruction' | 'playing' | 'results'>('instruction');
  const [items, setItems] = useState<Item[]>([]);
  const [hiddenRule, setHiddenRule] = useState<{ type: Rule; value: string } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, streak: 0 });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const lastItemTime = useRef(Date.now());

  const generateRule = useCallback(() => {
    const rules: Rule[] = ['shape', 'color', 'size'];
    const ruleType = rules[Math.floor(Math.random() * rules.length)];
    let value: string;
    
    if (ruleType === 'shape') {
      value = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    } else if (ruleType === 'color') {
      value = COLORS[Math.floor(Math.random() * COLORS.length)];
    } else {
      value = Math.random() > 0.5 ? 'small' : 'large';
    }
    
    return { type: ruleType, value };
  }, []);

  const generateItems = useCallback(() => {
    const newItems: Item[] = [];
    for (let i = 0; i < 4; i++) {
      newItems.push({
        id: i,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() > 0.5 ? 'small' : 'large',
      });
    }
    return newItems;
  }, []);

  const isCorrect = useCallback((item: Item) => {
    if (!hiddenRule) return false;
    if (hiddenRule.type === 'shape') return item.shape === hiddenRule.value;
    if (hiddenRule.type === 'color') return item.color === hiddenRule.value;
    return item.size === hiddenRule.value;
  }, [hiddenRule]);

  const handleTap = useCallback((item: Item) => {
    if (phase !== 'playing' || feedback) return;
    
    const rt = Date.now() - lastItemTime.current;
    setReactionTimes(prev => [...prev, rt]);
    
    const correct = isCorrect(item);
    setFeedback(correct ? 'correct' : 'wrong');
    
    if (correct) {
      setLiveStats(prev => ({ ...prev, hits: prev.hits + 1, streak: prev.streak + 1 }));
    } else {
      setLiveStats(prev => ({ ...prev, misses: prev.misses + 1, streak: 0 }));
    }
    
    setTimeout(() => {
      setFeedback(null);
      setItems(generateItems());
      lastItemTime.current = Date.now();
    }, config.feedbackDelay);
  }, [phase, feedback, isCorrect, generateItems, config.feedbackDelay]);

  useEffect(() => {
    if (phase === 'playing') {
      setHiddenRule(generateRule());
      setItems(generateItems());
      lastItemTime.current = Date.now();
    }
  }, [phase, generateRule, generateItems]);

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

  const getShapeElement = (item: Item) => {
    const size = item.size === 'small' ? 40 : 60;
    const colorMap = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
    };
    
    if (item.shape === 'circle') {
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: colorMap[item.color],
          }}
        />
      );
    }
    if (item.shape === 'square') {
      return (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: colorMap[item.color],
          }}
        />
      );
    }
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${colorMap[item.color]}`,
        }}
      />
    );
  };

  if (phase === 'instruction') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Hidden Rule</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Deduce the hidden rule by observing feedback. Tap the item that follows the pattern.
          Learn from your mistakes to discover what's correct!
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
    const total = liveStats.hits + liveStats.misses;
    const score = total > 0 ? Math.round((liveStats.hits / total) * 100) : 0;
    const avgRT = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    return (
      <DrillCompletionScreen
        title="Hidden Rule"
        score={score}
        stats={{
          hits: liveStats.hits,
          misses: liveStats.misses,
          avgReactionTime: avgRT,
        }}
        onContinue={() => onComplete({ score, accuracy: score, avgReactionTime: avgRT })}
      />
    );
  }

  return (
    <div className="flex flex-col items-center p-4 min-h-[500px]">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          <span className="text-green-500">{liveStats.hits}</span> / 
          <span className="text-red-500 ml-1">{liveStats.misses}</span>
        </div>
        <div className="text-lg font-mono text-foreground">
          {Math.ceil(timeLeft / 1000)}s
        </div>
        <div className="text-sm text-amber-500">
          🔥 {liveStats.streak}
        </div>
      </div>

      {/* Hint */}
      <div className="text-sm text-muted-foreground mb-6">
        Find the hidden pattern...
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-6">
        <AnimatePresence mode="wait">
          {items.map((item) => (
            <motion.button
              key={`${item.id}-${Date.now()}`}
              className={`w-24 h-24 rounded-xl flex items-center justify-center transition-colors ${
                feedback === 'correct' && isCorrect(item)
                  ? 'bg-green-500/20 ring-2 ring-green-500'
                  : feedback === 'wrong' && isCorrect(item)
                  ? 'bg-amber-500/20 ring-2 ring-amber-500'
                  : 'bg-muted/30'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTap(item)}
              disabled={!!feedback}
            >
              {getShapeElement(item)}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className={`mt-6 text-lg font-medium ${
              feedback === 'correct' ? 'text-green-500' : 'text-red-500'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {feedback === 'correct' ? '✓ Correct!' : '✗ Try again'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
