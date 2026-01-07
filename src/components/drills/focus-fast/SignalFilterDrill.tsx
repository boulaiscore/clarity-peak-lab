// Signal Filter - Level 1 Reactive Focus
// Identify micro-patterns in noisy stream
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface SignalFilterDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { noiseLevel: 3, patternLength: 3, speed: 1200 },
  medium: { noiseLevel: 5, patternLength: 3, speed: 900 },
  hard: { noiseLevel: 7, patternLength: 4, speed: 650 },
};

export const SignalFilterDrill: React.FC<SignalFilterDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [stream, setStream] = useState<{ id: number; value: string; isSignal: boolean }[]>([]);
  const [targetPattern, setTargetPattern] = useState<string[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, falseAlarms: 0 });
  
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, reactionTimes: [] as number[], patternStartTime: 0 });
  const startTimeRef = useRef(0);
  const idRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const SYMBOLS = ['◆', '◇', '○', '●', '△', '▲', '□', '■'];

  useEffect(() => {
    if (phase === 'intro') {
      // Generate target pattern
      const pattern = Array.from({ length: config.patternLength }, () => 
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      );
      setTargetPattern(pattern);
    }
  }, [phase, config.patternLength]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('complete');
      }
    }, 100);
    
    // Stream generator
    let patternIndex = 0;
    let inPattern = false;
    let patternCooldown = 0;
    
    const streamInterval = setInterval(() => {
      idRef.current++;
      
      // Decide if we should insert pattern symbol
      if (!inPattern && patternCooldown <= 0 && Math.random() < 0.15) {
        inPattern = true;
        patternIndex = 0;
        statsRef.current.patternStartTime = Date.now();
      }
      
      let newSymbol: string;
      let isSignal = false;
      
      if (inPattern && patternIndex < targetPattern.length) {
        newSymbol = targetPattern[patternIndex];
        isSignal = true;
        patternIndex++;
        if (patternIndex >= targetPattern.length) {
          inPattern = false;
          patternCooldown = 5;
        }
      } else {
        // Random noise
        newSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        patternCooldown--;
      }
      
      setStream(prev => [...prev.slice(-8), { id: idRef.current, value: newSymbol, isSignal }]);
    }, config.speed);
    
    return () => {
      clearInterval(timer);
      clearInterval(streamInterval);
    };
  }, [phase, targetPattern, config.speed]);

  const handleTap = useCallback(() => {
    // Check if we're in a pattern
    const recentSignals = stream.filter(s => s.isSignal).length;
    
    if (recentSignals >= config.patternLength - 1) {
      const rt = Date.now() - statsRef.current.patternStartTime;
      statsRef.current.reactionTimes.push(rt);
      statsRef.current.hits++;
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setFeedback('correct');
      setCurrentMatch(m => m + 1);
    } else {
      statsRef.current.falseAlarms++;
      setLiveStats(ls => ({ ...ls, falseAlarms: ls.falseAlarms + 1 }));
      setFeedback('wrong');
    }
    
    setTimeout(() => setFeedback(null), 300);
  }, [stream, config.patternLength]);

  useEffect(() => {
    if (phase === 'complete') {
      const { hits, falseAlarms, reactionTimes } = statsRef.current;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        hits * 15 - falseAlarms * 10 + Math.max(0, 20 - avgRT / 100)
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
        <div className="mb-4 flex gap-1">
          {targetPattern.map((s, i) => (
            <span key={i} className="text-2xl text-primary">{s}</span>
          ))}
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Signal Filter</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 1 • Reactive Focus</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Watch the stream. Tap when you see the target pattern appear in sequence.
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
    <motion.div 
      className="min-h-screen bg-background flex flex-col"
      onClick={handleTap}
    >
      {/* Header */}
      <div className="p-4 bg-background/90">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-1 items-center">
            <span className="text-xs text-muted-foreground mr-2">FIND:</span>
            {targetPattern.map((s, i) => (
              <span key={i} className="text-lg text-primary">{s}</span>
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground">{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        {/* Live Stats */}
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="text-green-400">✓ {liveStats.hits}</span>
          <span className="text-red-400">✗ {liveStats.falseAlarms}</span>
        </div>
      </div>

      {/* Stream */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="flex gap-4 items-center">
          <AnimatePresence mode="popLayout">
            {stream.map(item => (
              <motion.span
                key={item.id}
                className={`text-4xl ${item.isSignal ? 'text-primary' : 'text-muted-foreground/50'}`}
                initial={{ x: 50, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -50, opacity: 0, scale: 0.5 }}
              >
                {item.value}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        
        {feedback && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className={`text-6xl ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? '✓' : '✗'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Patterns found: {currentMatch}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Tap anywhere when you spot the pattern</p>
      </div>
    </motion.div>
  );
};

export default SignalFilterDrill;
