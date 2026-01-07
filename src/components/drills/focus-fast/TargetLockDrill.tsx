// Target Lock - Level 1 Reactive Focus
// Tap only the target symbol among dynamic distractors
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface TargetLockDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

type SymbolType = 'circle' | 'square' | 'triangle' | 'diamond' | 'star';

interface Stimulus {
  id: string;
  type: SymbolType;
  x: number;
  y: number;
  isTarget: boolean;
}

const SYMBOLS: SymbolType[] = ['circle', 'square', 'triangle', 'diamond', 'star'];
const DURATION = 45000;

const DIFFICULTY_CONFIG = {
  easy: { spawnRate: 2000, maxItems: 3, lifetime: 4000 },
  medium: { spawnRate: 1500, maxItems: 5, lifetime: 3000 },
  hard: { spawnRate: 1000, maxItems: 7, lifetime: 2500 },
};

const SymbolShape: React.FC<{ type: SymbolType; size?: number; isTarget?: boolean }> = ({ 
  type, size = 48, isTarget 
}) => {
  const color = isTarget ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)';
  
  switch (type) {
    case 'circle':
      return <circle cx={size/2} cy={size/2} r={size/2 - 4} fill={color} />;
    case 'square':
      return <rect x="4" y="4" width={size - 8} height={size - 8} fill={color} />;
    case 'triangle':
      return <polygon points={`${size/2},4 ${size-4},${size-4} 4,${size-4}`} fill={color} />;
    case 'diamond':
      return <polygon points={`${size/2},4 ${size-4},${size/2} ${size/2},${size-4} 4,${size/2}`} fill={color} />;
    case 'star':
      const points = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? size/2 - 4 : size/4;
        const angle = (i * 36 - 90) * Math.PI / 180;
        points.push(`${size/2 + r * Math.cos(angle)},${size/2 + r * Math.sin(angle)}`);
      }
      return <polygon points={points.join(' ')} fill={color} />;
  }
};

export const TargetLockDrill: React.FC<TargetLockDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [target, setTarget] = useState<SymbolType>('circle');
  const [stimuli, setStimuli] = useState<Stimulus[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, reactionTimes: [] as number[], lastTargetTime: 0 });
  const startTimeRef = useRef(0);
  const stimuliTimestamps = useRef<Map<string, number>>(new Map());
  const idRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const generateStimulus = useCallback(() => {
    const isTarget = Math.random() > 0.6;
    const type = isTarget ? target : SYMBOLS.filter(s => s !== target)[Math.floor(Math.random() * 4)];
    
    return {
      id: `stim-${idRef.current++}`,
      type,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      isTarget,
    };
  }, [target]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    setTarget(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    stimuliTimestamps.current.clear();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('complete');
      }
    }, 100);
    
    const spawner = setInterval(() => {
      const newStim = generateStimulus();
      stimuliTimestamps.current.set(newStim.id, Date.now());
      if (newStim.isTarget) statsRef.current.lastTargetTime = Date.now();
      
      setStimuli(prev => {
        const updated = [...prev, newStim].slice(-config.maxItems);
        return updated;
      });
    }, config.spawnRate);
    
    const cleaner = setInterval(() => {
      const now = Date.now();
      setStimuli(prev => prev.filter(s => {
        const timestamp = stimuliTimestamps.current.get(s.id) || now;
        const age = now - timestamp;
        if (age > config.lifetime && s.isTarget) {
          statsRef.current.misses++;
          setLiveStats(ls => ({ ...ls, misses: ls.misses + 1 }));
          stimuliTimestamps.current.delete(s.id);
        }
        return age < config.lifetime;
      }));
    }, 500);
    
    return () => {
      clearInterval(timer);
      clearInterval(spawner);
      clearInterval(cleaner);
    };
  }, [phase, generateStimulus, config]);

  const handleTap = useCallback((stim: Stimulus) => {
    stimuliTimestamps.current.delete(stim.id);
    
    if (stim.isTarget) {
      const rt = Date.now() - statsRef.current.lastTargetTime;
      if (rt < 3000) statsRef.current.reactionTimes.push(rt);
      statsRef.current.hits++;
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setFeedback('correct');
    } else {
      statsRef.current.falseAlarms++;
      setLiveStats(ls => ({ ...ls, falseAlarms: ls.falseAlarms + 1 }));
      setFeedback('wrong');
    }
    
    setStimuli(prev => prev.filter(s => s.id !== stim.id));
    setTimeout(() => setFeedback(null), 300);
  }, []);

  useEffect(() => {
    if (phase === 'complete') {
      const { hits, misses, falseAlarms, reactionTimes } = statsRef.current;
      const total = hits + misses;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 70 + Math.max(0, 30 - avgRT / 50) - falseAlarms * 2
      )));
      
      onComplete({ score, correct: hits, avgReactionTime: Math.round(avgRT) });
    }
  }, [phase, onComplete]);

  if (phase === 'intro') {
    return (
      <motion.div 
        className="flex-1 bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 48 48">
            <SymbolShape type="circle" size={48} isTarget />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Target Lock</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 1 • Reactive Focus</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Tap only the highlighted target symbol. Ignore all distractors.
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
    <div className={`min-h-screen bg-background relative overflow-hidden ${feedback === 'correct' ? 'bg-green-500/5' : feedback === 'wrong' ? 'bg-red-500/10' : ''}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">TAP TARGET:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border">
            <svg width="24" height="24" viewBox="0 0 48 48">
              <SymbolShape type={target} size={48} isTarget />
            </svg>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        {/* Live Stats */}
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="text-green-400">✓ {liveStats.hits}</span>
          <span className="text-amber-400">○ {liveStats.misses}</span>
          <span className="text-red-400">✗ {liveStats.falseAlarms}</span>
        </div>
      </div>

      {/* Game area */}
      <div className="absolute inset-0 pt-20">
        <AnimatePresence>
          {stimuli.map(stim => (
            <motion.div
              key={stim.id}
              className="absolute cursor-pointer"
              style={{ left: `${stim.x}%`, top: `${stim.y}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleTap(stim)}
            >
              <svg width="48" height="48" viewBox="0 0 48 48">
                <SymbolShape type={stim.type} size={48} isTarget={stim.isTarget} />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TargetLockDrill;
