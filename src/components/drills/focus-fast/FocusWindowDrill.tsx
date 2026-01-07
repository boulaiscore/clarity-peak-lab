// Focus Window - Level 2 Selective Pressure
// Only one mobile zone is valid - dynamic spatial focus
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from './DrillCompletionScreen';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface FocusWindowDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Target {
  id: string;
  x: number;
  y: number;
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { windowSpeed: 3000, windowSize: 35, targetRate: 1800 },
  medium: { windowSpeed: 2000, windowSize: 28, targetRate: 1500 },
  hard: { windowSpeed: 1200, windowSize: 22, targetRate: 1200 },
};

export const FocusWindowDrill: React.FC<FocusWindowDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [windowPos, setWindowPos] = useState({ x: 50, y: 50 });
  const [targets, setTargets] = useState<Target[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'outside' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, outside: 0 });
  const [finalResults, setFinalResults] = useState({ score: 0, avgRT: 0 });
  
  const statsRef = useRef({ hits: 0, misses: 0, outsideTaps: 0, reactionTimes: [] as number[], spawnTimes: new Map<string, number>() });
  const startTimeRef = useRef(0);
  const idRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const moveWindow = useCallback(() => {
    setWindowPos({
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 60,
    });
  }, []);

  const generateTarget = useCallback(() => {
    const id = `target-${idRef.current++}`;
    statsRef.current.spawnTimes.set(id, Date.now());
    
    return {
      id,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
    };
  }, []);

  const isInsideWindow = useCallback((target: Target) => {
    const dx = target.x - windowPos.x;
    const dy = target.y - windowPos.y;
    return Math.sqrt(dx * dx + dy * dy) < config.windowSize / 2;
  }, [windowPos, config.windowSize]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('results');
      }
    }, 100);
    
    const windowMover = setInterval(moveWindow, config.windowSpeed);
    
    const targetSpawner = setInterval(() => {
      setTargets(prev => [...prev.slice(-4), generateTarget()]);
    }, config.targetRate);
    
    const cleaner = setInterval(() => {
      setTargets(prev => {
        const now = Date.now();
        return prev.filter(t => {
          const spawnTime = statsRef.current.spawnTimes.get(t.id) || now;
          const age = now - spawnTime;
          if (age > 3000) {
            if (isInsideWindow(t)) {
              statsRef.current.misses++;
              setLiveStats(ls => ({ ...ls, misses: ls.misses + 1 }));
            }
            statsRef.current.spawnTimes.delete(t.id);
            return false;
          }
          return true;
        });
      });
    }, 500);
    
    return () => {
      clearInterval(timer);
      clearInterval(windowMover);
      clearInterval(targetSpawner);
      clearInterval(cleaner);
    };
  }, [phase, moveWindow, generateTarget, config, isInsideWindow]);

  const handleTap = useCallback((target: Target) => {
    const spawnTime = statsRef.current.spawnTimes.get(target.id);
    if (spawnTime) {
      const rt = Date.now() - spawnTime;
      statsRef.current.reactionTimes.push(rt);
    }
    statsRef.current.spawnTimes.delete(target.id);
    
    if (isInsideWindow(target)) {
      statsRef.current.hits++;
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setFeedback('correct');
    } else {
      statsRef.current.outsideTaps++;
      setLiveStats(ls => ({ ...ls, outside: ls.outside + 1 }));
      setFeedback('outside');
    }
    
    setTargets(prev => prev.filter(t => t.id !== target.id));
    setTimeout(() => setFeedback(null), 200);
  }, [isInsideWindow]);

  useEffect(() => {
    if (phase === 'results') {
      const { hits, misses, outsideTaps, reactionTimes } = statsRef.current;
      const total = hits + misses;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 70 + Math.max(0, 30 - avgRT / 50) - outsideTaps * 5
      )));
      setFinalResults({ score, avgRT: Math.round(avgRT) });
    }
  }, [phase]);

  const handleContinue = () => {
    const { hits, reactionTimes } = statsRef.current;
    const avgRT = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;
    onComplete({ score: finalResults.score, correct: hits, avgReactionTime: avgRT });
  };

  if (phase === 'results') {
    return (
      <DrillCompletionScreen
        title="Focus Window"
        score={finalResults.score}
        stats={{
          hits: liveStats.hits,
          misses: liveStats.misses,
          falseAlarms: liveStats.outside,
          avgReactionTime: finalResults.avgRT,
        }}
        onContinue={handleContinue}
      />
    );
  }

  if (phase === 'intro') {
    return (
      <motion.div 
        className="flex-1 bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <div className="relative w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Focus Window</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 2 • Dynamic Spatial Focus</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Only tap targets <span className="text-primary font-medium">inside</span> the moving focus window. Ignore everything outside!
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
    <div className={`min-h-screen bg-background relative overflow-hidden ${
      feedback === 'correct' ? 'bg-green-500/5' : 
      feedback === 'outside' ? 'bg-red-500/10' : ''
    }`}>
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-background/90 backdrop-blur-sm">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Tap inside window only</span>
          <span>{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="text-green-400">✓ {liveStats.hits}</span>
          <span className="text-amber-400">○ {liveStats.misses}</span>
          <span className="text-red-400">⊘ {liveStats.outside}</span>
        </div>
      </div>

      <div className="absolute inset-0 pt-24">
        {/* Focus window */}
        <motion.div
          className="absolute rounded-full border-4 border-dashed border-primary/50 pointer-events-none"
          style={{
            width: `${config.windowSize}%`,
            height: `${config.windowSize}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            left: `${windowPos.x}%`,
            top: `${windowPos.y}%`,
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <div className="absolute inset-0 rounded-full bg-primary/5" />
        </motion.div>

        {/* Targets */}
        <AnimatePresence>
          {targets.map(target => (
            <motion.div
              key={target.id}
              className="absolute w-10 h-10 rounded-full bg-primary cursor-pointer"
              style={{ left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleTap(target)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FocusWindowDrill;
