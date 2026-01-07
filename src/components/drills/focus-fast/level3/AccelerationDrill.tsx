import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from '../DrillCompletionScreen';

interface AccelerationDrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (results: { score: number; accuracy: number; avgReactionTime: number }) => void;
}

const DIFFICULTY_CONFIG = {
  easy: { duration: 45000, startInterval: 2000, minInterval: 600, acceleration: 0.92 },
  medium: { duration: 50000, startInterval: 1800, minInterval: 450, acceleration: 0.88 },
  hard: { duration: 55000, startInterval: 1500, minInterval: 350, acceleration: 0.85 },
};

interface Target {
  id: number;
  x: number;
  y: number;
  isTarget: boolean;
}

export const AccelerationDrill: React.FC<AccelerationDrillProps> = ({ difficulty, onComplete }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<'instruction' | 'playing' | 'results'>('instruction');
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentInterval, setCurrentInterval] = useState(config.startInterval);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [speedLevel, setSpeedLevel] = useState(1);
  const targetShownTime = useRef(Date.now());
  const spawnRef = useRef<NodeJS.Timeout | null>(null);

  const spawnTarget = useCallback(() => {
    const isTarget = Math.random() > 0.25; // 75% targets
    const newTarget: Target = {
      id: Date.now(),
      x: Math.random() * 70 + 15,
      y: Math.random() * 60 + 20,
      isTarget,
    };
    
    setTargets([newTarget]);
    targetShownTime.current = Date.now();
    
    // Auto-miss after lifetime
    const lifetime = Math.max(currentInterval * 0.8, 400);
    setTimeout(() => {
      setTargets(prev => {
        const found = prev.find(t => t.id === newTarget.id);
        if (found && found.isTarget) {
          setLiveStats(s => ({ ...s, misses: s.misses + 1 }));
        }
        return prev.filter(t => t.id !== newTarget.id);
      });
    }, lifetime);
    
    // Accelerate
    setCurrentInterval(prev => {
      const newInterval = Math.max(prev * config.acceleration, config.minInterval);
      const level = Math.floor((config.startInterval - newInterval) / 200) + 1;
      setSpeedLevel(level);
      return newInterval;
    });
  }, [currentInterval, config.acceleration, config.minInterval, config.startInterval]);

  useEffect(() => {
    if (phase !== 'playing') return;
    
    const scheduleNext = () => {
      spawnRef.current = setTimeout(() => {
        spawnTarget();
        scheduleNext();
      }, currentInterval);
    };
    
    spawnTarget();
    scheduleNext();
    
    return () => {
      if (spawnRef.current) clearTimeout(spawnRef.current);
    };
  }, [phase]); // Only re-run when phase changes

  useEffect(() => {
    if (phase !== 'playing') return;
    
    // Update spawn interval dynamically
    if (spawnRef.current) {
      clearTimeout(spawnRef.current);
      spawnRef.current = setTimeout(() => {
        spawnTarget();
      }, currentInterval);
    }
  }, [currentInterval]);

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

  const handleTap = useCallback((target: Target) => {
    if (phase !== 'playing') return;
    
    const rt = Date.now() - targetShownTime.current;
    setTargets(prev => prev.filter(t => t.id !== target.id));
    
    if (target.isTarget) {
      setReactionTimes(prev => [...prev, rt]);
      setLiveStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    } else {
      setLiveStats(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1 }));
    }
  }, [phase]);

  if (phase === 'instruction') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Acceleration</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Tap the green circles as fast as possible. 
          The speed increases progressively - how long can you keep up?
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
        title="Acceleration"
        score={score}
        stats={{
          hits: liveStats.hits,
          misses: liveStats.misses,
          falseAlarms: liveStats.falseAlarms,
          avgReactionTime: avgRT,
        }}
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
        <div className="text-sm text-amber-500 font-medium">
          Speed Lv{speedLevel}
        </div>
      </div>

      {/* Speed Indicator */}
      <div className="w-full h-2 bg-muted/20 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
          animate={{
            width: `${Math.min(100, ((config.startInterval - currentInterval) / (config.startInterval - config.minInterval)) * 100)}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Play Area */}
      <div className="relative w-full h-72 bg-muted/10 rounded-xl overflow-hidden">
        <AnimatePresence>
          {targets.map((target) => (
            <motion.button
              key={target.id}
              className={`absolute w-14 h-14 rounded-full ${
                target.isTarget ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleTap(target)}
            />
          ))}
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Tap green, avoid red • Speed increases!
      </p>
    </div>
  );
};
