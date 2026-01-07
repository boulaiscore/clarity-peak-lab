// Dual Target - Level 2 Selective Pressure
// Two valid targets, one prioritary - tap prioritary first
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from './DrillCompletionScreen';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface DualTargetDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

type TargetType = 'primary' | 'secondary' | 'distractor';

interface Target {
  id: string;
  type: TargetType;
  x: number;
  y: number;
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { spawnRate: 2000, maxItems: 4, switchFreq: 0 },
  medium: { spawnRate: 1600, maxItems: 5, switchFreq: 15000 },
  hard: { spawnRate: 1200, maxItems: 6, switchFreq: 8000 },
};

export const DualTargetDrill: React.FC<DualTargetDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [targets, setTargets] = useState<Target[]>([]);
  const [primaryColor, setPrimaryColor] = useState<'blue' | 'green'>('blue');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'secondary' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, secondary: 0 });
  const [finalResults, setFinalResults] = useState({ score: 0, avgRT: 0 });
  
  const statsRef = useRef({ primaryHits: 0, secondaryHits: 0, misses: 0, falseAlarms: 0, reactionTimes: [] as number[], spawnTimes: new Map<string, number>() });
  const startTimeRef = useRef(0);
  const idRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const generateTarget = useCallback(() => {
    const rand = Math.random();
    let type: TargetType;
    if (rand < 0.35) type = 'primary';
    else if (rand < 0.6) type = 'secondary';
    else type = 'distractor';
    
    const id = `target-${idRef.current++}`;
    statsRef.current.spawnTimes.set(id, Date.now());
    
    return {
      id,
      type,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
    };
  }, []);

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
    
    const spawner = setInterval(() => {
      setTargets(prev => [...prev.slice(-config.maxItems + 1), generateTarget()]);
    }, config.spawnRate);
    
    // Rule switch
    let switcher: NodeJS.Timeout | null = null;
    if (config.switchFreq > 0) {
      switcher = setInterval(() => {
        setPrimaryColor(c => c === 'blue' ? 'green' : 'blue');
      }, config.switchFreq);
    }
    
    const cleaner = setInterval(() => {
      setTargets(prev => {
        const now = Date.now();
        return prev.filter(t => {
          const spawnTime = statsRef.current.spawnTimes.get(t.id) || now;
          const age = now - spawnTime;
          if (age > 3500) {
            if (t.type === 'primary') {
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
      clearInterval(spawner);
      clearInterval(cleaner);
      if (switcher) clearInterval(switcher);
    };
  }, [phase, generateTarget, config]);

  const handleTap = useCallback((target: Target) => {
    const spawnTime = statsRef.current.spawnTimes.get(target.id);
    if (spawnTime) {
      const rt = Date.now() - spawnTime;
      statsRef.current.reactionTimes.push(rt);
    }
    statsRef.current.spawnTimes.delete(target.id);
    
    if (target.type === 'primary') {
      statsRef.current.primaryHits++;
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setFeedback('correct');
    } else if (target.type === 'secondary') {
      statsRef.current.secondaryHits++;
      setLiveStats(ls => ({ ...ls, secondary: ls.secondary + 1 }));
      setFeedback('secondary');
    } else {
      statsRef.current.falseAlarms++;
      setFeedback('wrong');
    }
    
    setTargets(prev => prev.filter(t => t.id !== target.id));
    setTimeout(() => setFeedback(null), 200);
  }, []);

  useEffect(() => {
    if (phase === 'results') {
      const { primaryHits, secondaryHits, misses, falseAlarms, reactionTimes } = statsRef.current;
      const total = primaryHits + misses;
      const accuracy = total > 0 ? primaryHits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 60 + secondaryHits * 3 + Math.max(0, 25 - avgRT / 50) - falseAlarms * 5
      )));
      setFinalResults({ score, avgRT: Math.round(avgRT) });
    }
  }, [phase]);

  const handleContinue = () => {
    const { primaryHits, reactionTimes } = statsRef.current;
    const avgRT = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;
    onComplete({ score: finalResults.score, correct: primaryHits, avgReactionTime: avgRT });
  };

  if (phase === 'results') {
    return (
      <DrillCompletionScreen
        title="Dual Target"
        score={finalResults.score}
        stats={{
          hits: liveStats.hits,
          misses: liveStats.misses,
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
        <div className="flex gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500" />
          <div className="w-10 h-10 rounded-full bg-green-500 opacity-60" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Dual Target</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 2 • Selective Pressure</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Two targets are valid. Prioritize the <span className="text-blue-400 font-medium">primary</span> color. 
          Secondary targets give less points.
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
  const primaryColorValue = primaryColor === 'blue' ? 'bg-blue-500' : 'bg-green-500';
  const secondaryColorValue = primaryColor === 'blue' ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className={`min-h-screen bg-background relative overflow-hidden ${
      feedback === 'correct' ? 'bg-green-500/5' : 
      feedback === 'secondary' ? 'bg-blue-500/5' : 
      feedback === 'wrong' ? 'bg-red-500/10' : ''
    }`}>
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">PRIORITY:</span>
            <div className={`w-6 h-6 rounded-full ${primaryColorValue}`} />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="text-green-400">✓ {liveStats.hits}</span>
          <span className="text-blue-400">◐ {liveStats.secondary}</span>
          <span className="text-amber-400">○ {liveStats.misses}</span>
        </div>
      </div>

      <div className="absolute inset-0 pt-24">
        <AnimatePresence>
          {targets.map(target => (
            <motion.div
              key={target.id}
              className={`absolute w-12 h-12 rounded-full cursor-pointer ${
                target.type === 'primary' ? primaryColorValue :
                target.type === 'secondary' ? `${secondaryColorValue} opacity-60` :
                'bg-muted-foreground/30'
              }`}
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
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

export default DualTargetDrill;
