import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from '../DrillCompletionScreen';

interface ChaosFocusDrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (results: { score: number; accuracy: number; avgReactionTime: number }) => void;
}

const DIFFICULTY_CONFIG = {
  easy: { duration: 45000, chaosItems: 15, targetChance: 0.15, spawnRate: 300 },
  medium: { duration: 50000, chaosItems: 25, targetChance: 0.1, spawnRate: 250 },
  hard: { duration: 55000, chaosItems: 35, targetChance: 0.07, spawnRate: 200 },
};

interface ChaosItem {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  isTarget: boolean;
  rotation: number;
  shape: 'circle' | 'square' | 'triangle';
}

const CHAOS_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
];

export const ChaosFocusDrill: React.FC<ChaosFocusDrillProps> = ({ difficulty, onComplete }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<'instruction' | 'playing' | 'results'>('instruction');
  const [chaosItems, setChaosItems] = useState<ChaosItem[]>([]);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [feedback, setFeedback] = useState<{ x: number; y: number; success: boolean } | null>(null);
  const targetShownTime = useRef<Map<number, number>>(new Map());

  const spawnChaosItem = useCallback(() => {
    const isTarget = Math.random() < config.targetChance;
    const shapes: ChaosItem['shape'][] = ['circle', 'square', 'triangle'];
    
    const newItem: ChaosItem = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15,
      size: isTarget ? 40 : Math.random() * 20 + 15,
      color: isTarget ? '#22c55e' : CHAOS_COLORS[Math.floor(Math.random() * CHAOS_COLORS.length)],
      isTarget,
      rotation: Math.random() * 360,
      shape: isTarget ? 'circle' : shapes[Math.floor(Math.random() * shapes.length)],
    };
    
    if (isTarget) {
      targetShownTime.current.set(newItem.id, Date.now());
    }
    
    setChaosItems(prev => {
      const updated = [...prev, newItem];
      // Keep chaos manageable
      if (updated.length > config.chaosItems + 5) {
        const toRemove = updated[0];
        if (toRemove.isTarget && targetShownTime.current.has(toRemove.id)) {
          setLiveStats(s => ({ ...s, misses: s.misses + 1 }));
          targetShownTime.current.delete(toRemove.id);
        }
        return updated.slice(1);
      }
      return updated;
    });
    
    // Auto-expire targets
    if (isTarget) {
      setTimeout(() => {
        setChaosItems(prev => {
          const found = prev.find(i => i.id === newItem.id);
          if (found && targetShownTime.current.has(newItem.id)) {
            setLiveStats(s => ({ ...s, misses: s.misses + 1 }));
            targetShownTime.current.delete(newItem.id);
          }
          return prev.filter(i => i.id !== newItem.id);
        });
      }, 3000);
    }
  }, [config.targetChance, config.chaosItems]);

  useEffect(() => {
    if (phase !== 'playing') return;
    
    // Initial chaos burst
    for (let i = 0; i < config.chaosItems; i++) {
      setTimeout(spawnChaosItem, i * 50);
    }
    
    const interval = setInterval(spawnChaosItem, config.spawnRate);
    return () => clearInterval(interval);
  }, [phase, spawnChaosItem, config.chaosItems, config.spawnRate]);

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

  const handleTap = useCallback((item: ChaosItem, e: React.MouseEvent) => {
    if (phase !== 'playing') return;
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    if (item.isTarget) {
      const rt = Date.now() - (targetShownTime.current.get(item.id) || Date.now());
      setReactionTimes(prev => [...prev, rt]);
      setLiveStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      targetShownTime.current.delete(item.id);
      setFeedback({ x: rect.left, y: rect.top, success: true });
    } else {
      setLiveStats(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1 }));
      setFeedback({ x: rect.left, y: rect.top, success: false });
    }
    
    setChaosItems(prev => prev.filter(i => i.id !== item.id));
    setTimeout(() => setFeedback(null), 300);
  }, [phase]);

  const renderShape = (item: ChaosItem) => {
    if (item.shape === 'circle') {
      return (
        <div
          style={{
            width: item.size,
            height: item.size,
            borderRadius: '50%',
            backgroundColor: item.color,
          }}
        />
      );
    }
    if (item.shape === 'square') {
      return (
        <div
          style={{
            width: item.size,
            height: item.size,
            backgroundColor: item.color,
            transform: `rotate(${item.rotation}deg)`,
          }}
        />
      );
    }
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${item.size / 2}px solid transparent`,
          borderRight: `${item.size / 2}px solid transparent`,
          borderBottom: `${item.size}px solid ${item.color}`,
          transform: `rotate(${item.rotation}deg)`,
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
        <h2 className="text-2xl font-bold text-foreground mb-4">Chaos Focus</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Find the rare GREEN CIRCLES among the visual chaos. 
          They appear rarely - stay hyper-focused!
        </p>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">← Find these</span>
        </div>
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
    const score = total > 0 ? Math.round((liveStats.hits / Math.max(1, liveStats.hits + liveStats.misses)) * 100) : 0;
    const avgRT = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    return (
      <DrillCompletionScreen
        title="Chaos Focus"
        score={score}
        stats={[
          { label: 'Found', value: liveStats.hits },
          { label: 'Missed', value: liveStats.misses },
          { label: 'False', value: liveStats.falseAlarms },
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
          <span className="text-red-500 ml-1">{liveStats.misses}</span>
        </div>
        <div className="text-lg font-mono text-foreground">
          {Math.ceil(timeLeft / 1000)}s
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">target</span>
        </div>
      </div>

      {/* Chaos Area */}
      <div className="relative w-full h-80 bg-muted/5 rounded-xl overflow-hidden border border-muted/20">
        <AnimatePresence>
          {chaosItems.map((item) => (
            <motion.button
              key={item.id}
              className={`absolute flex items-center justify-center ${
                item.isTarget ? 'z-10' : 'z-0'
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: item.isTarget ? 1 : 0.7,
                rotate: item.isTarget ? 0 : item.rotation,
              }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.8 }}
              onClick={(e) => handleTap(item, e)}
            >
              {renderShape(item)}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Feedback flash */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              className={`fixed w-8 h-8 rounded-full ${
                feedback.success ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ left: feedback.x, top: feedback.y }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Find the GREEN CIRCLES in the chaos
      </p>
    </div>
  );
};
