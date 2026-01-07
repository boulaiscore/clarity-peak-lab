import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from '../DrillCompletionScreen';

interface ErrorRecoveryDrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (results: { score: number; accuracy: number; avgReactionTime: number }) => void;
}

const DIFFICULTY_CONFIG = {
  easy: { duration: 45000, spawnRate: 2000, penaltyTime: 1500, lifetime: 1800 },
  medium: { duration: 50000, spawnRate: 1600, penaltyTime: 2000, lifetime: 1500 },
  hard: { duration: 55000, spawnRate: 1300, penaltyTime: 2500, lifetime: 1200 },
};

interface Target {
  id: number;
  x: number;
  y: number;
  isTarget: boolean;
}

export const ErrorRecoveryDrill: React.FC<ErrorRecoveryDrillProps> = ({ difficulty, onComplete }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<'instruction' | 'playing' | 'penalty' | 'results'>('instruction');
  const [targets, setTargets] = useState<Target[]>([]);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, errors: 0, recoveries: 0 });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [penaltyTimeLeft, setPenaltyTimeLeft] = useState(0);
  const targetShownTime = useRef(Date.now());

  const spawnTarget = useCallback(() => {
    const isTarget = Math.random() > 0.3; // 70% targets
    const newTarget: Target = {
      id: Date.now(),
      x: Math.random() * 70 + 15,
      y: Math.random() * 60 + 20,
      isTarget,
    };
    
    setTargets(prev => [...prev, newTarget]);
    targetShownTime.current = Date.now();
    
    // Auto-expire
    setTimeout(() => {
      setTargets(prev => {
        const found = prev.find(t => t.id === newTarget.id);
        if (found && found.isTarget) {
          setLiveStats(s => ({ ...s, misses: s.misses + 1 }));
        }
        return prev.filter(t => t.id !== newTarget.id);
      });
    }, config.lifetime);
  }, [config.lifetime]);

  useEffect(() => {
    if (phase !== 'playing') return;
    
    const interval = setInterval(spawnTarget, config.spawnRate);
    return () => clearInterval(interval);
  }, [phase, spawnTarget, config.spawnRate]);

  useEffect(() => {
    if (phase === 'penalty') {
      setPenaltyTimeLeft(config.penaltyTime);
      
      const penaltyInterval = setInterval(() => {
        setPenaltyTimeLeft(prev => {
          if (prev <= 100) {
            setPhase('playing');
            setLiveStats(s => ({ ...s, recoveries: s.recoveries + 1 }));
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      
      return () => clearInterval(penaltyInterval);
    }
  }, [phase, config.penaltyTime]);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'penalty') return;
    
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
      // Error! Start penalty
      setLiveStats(prev => ({ ...prev, errors: prev.errors + 1 }));
      setTargets([]);
      setPhase('penalty');
    }
  }, [phase]);

  if (phase === 'instruction') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Error Recovery</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Tap the green circles, avoid the red ones. 
          Mistakes trigger a penalty timeout - stay focused and recover quickly!
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
    const total = liveStats.hits + liveStats.misses + liveStats.errors;
    const score = total > 0 ? Math.round((liveStats.hits / total) * 100) : 0;
    const avgRT = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    return (
      <DrillCompletionScreen
        title="Error Recovery"
        score={score}
        stats={[
          { label: 'Hits', value: liveStats.hits },
          { label: 'Errors', value: liveStats.errors },
          { label: 'Recoveries', value: liveStats.recoveries },
          { label: 'Avg RT', value: `${avgRT}ms` },
        ]}
        onContinue={() => onComplete({ score, accuracy: score, avgReactionTime: avgRT })}
      />
    );
  }

  if (phase === 'penalty') {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[500px]">
        <motion.div
          className="w-full h-2 bg-muted/20 rounded-full mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-red-500 rounded-full"
            animate={{ width: `${(penaltyTimeLeft / config.penaltyTime) * 100}%` }}
          />
        </motion.div>
        
        <motion.div
          className="text-6xl mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          ⚠️
        </motion.div>
        
        <h3 className="text-xl font-bold text-red-500 mb-2">PENALTY</h3>
        <p className="text-muted-foreground">
          Wait {Math.ceil(penaltyTimeLeft / 1000)}s to recover...
        </p>
        
        <p className="text-xs text-muted-foreground mt-8">
          Time still counting: {Math.ceil(timeLeft / 1000)}s left
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 min-h-[500px]">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          <span className="text-green-500">{liveStats.hits}</span> / 
          <span className="text-red-500 ml-1">{liveStats.errors}</span>
        </div>
        <div className="text-lg font-mono text-foreground">
          {Math.ceil(timeLeft / 1000)}s
        </div>
        <div className="text-sm text-amber-500">
          ↺ {liveStats.recoveries}
        </div>
      </div>

      {/* Play Area */}
      <div className="relative w-full h-72 bg-muted/10 rounded-xl overflow-hidden">
        <AnimatePresence>
          {targets.map((target) => (
            <motion.button
              key={target.id}
              className={`absolute w-12 h-12 rounded-full ${
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
        Tap green • Avoid red (causes penalty timeout)
      </p>
    </div>
  );
};
