import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from '../DrillCompletionScreen';

interface TemporalGateDrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (results: { score: number; accuracy: number; avgReactionTime: number }) => void;
}

const DIFFICULTY_CONFIG = {
  easy: { duration: 45000, gateWindow: 800, cycleDuration: 3000 },
  medium: { duration: 50000, gateWindow: 500, cycleDuration: 2500 },
  hard: { duration: 55000, gateWindow: 300, cycleDuration: 2000 },
};

export const TemporalGateDrill: React.FC<TemporalGateDrillProps> = ({ difficulty, onComplete }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<'instruction' | 'playing' | 'results'>('instruction');
  const [gateOpen, setGateOpen] = useState(false);
  const [targetVisible, setTargetVisible] = useState(false);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | 'early' | null>(null);
  const targetShownTime = useRef(0);
  const cycleRef = useRef<NodeJS.Timeout | null>(null);

  const runCycle = useCallback(() => {
    // Gate opens
    setGateOpen(true);
    setTargetVisible(true);
    targetShownTime.current = Date.now();
    
    // Gate closes after window
    setTimeout(() => {
      setGateOpen(false);
      
      // If target still visible, it was missed
      setTargetVisible(prev => {
        if (prev) {
          setLiveStats(s => ({ ...s, misses: s.misses + 1 }));
          setFeedback('miss');
          setTimeout(() => setFeedback(null), 500);
        }
        return false;
      });
    }, config.gateWindow);
  }, [config.gateWindow]);

  useEffect(() => {
    if (phase !== 'playing') return;
    
    // Initial delay before first cycle
    const initialDelay = setTimeout(() => {
      runCycle();
      cycleRef.current = setInterval(runCycle, config.cycleDuration);
    }, 1000);
    
    return () => {
      clearTimeout(initialDelay);
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [phase, runCycle, config.cycleDuration]);

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

  const handleTap = useCallback(() => {
    if (phase !== 'playing') return;
    
    if (gateOpen && targetVisible) {
      const rt = Date.now() - targetShownTime.current;
      setReactionTimes(prev => [...prev, rt]);
      setLiveStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      setTargetVisible(false);
      setFeedback('hit');
      setTimeout(() => setFeedback(null), 300);
    } else {
      setLiveStats(prev => ({ ...prev, falseAlarms: prev.falseAlarms + 1 }));
      setFeedback('early');
      setTimeout(() => setFeedback(null), 300);
    }
  }, [phase, gateOpen, targetVisible]);

  if (phase === 'instruction') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Temporal Gate</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Tap the target ONLY when the gate is open (green ring). 
          Tapping outside the time window costs you points!
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
        title="Temporal Gate"
        score={score}
        stats={[
          { label: 'Hits', value: liveStats.hits },
          { label: 'Missed', value: liveStats.misses },
          { label: 'Early', value: liveStats.falseAlarms },
          { label: 'Avg RT', value: `${avgRT}ms` },
        ]}
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
          <span className="text-red-500 ml-1">{liveStats.misses}</span> /
          <span className="text-amber-500 ml-1">{liveStats.falseAlarms}</span>
        </div>
        <div className="text-lg font-mono text-foreground">
          {Math.ceil(timeLeft / 1000)}s
        </div>
      </div>

      {/* Gate Indicator */}
      <div className="text-sm text-muted-foreground mb-8">
        {gateOpen ? (
          <span className="text-green-500 font-medium">GATE OPEN - TAP NOW!</span>
        ) : (
          <span>Wait for the gate...</span>
        )}
      </div>

      {/* Target Area */}
      <motion.button
        className="relative w-48 h-48 rounded-full flex items-center justify-center"
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
      >
        {/* Gate Ring */}
        <motion.div
          className={`absolute inset-0 rounded-full border-4 ${
            gateOpen ? 'border-green-500' : 'border-muted/30'
          }`}
          animate={{
            scale: gateOpen ? [1, 1.05, 1] : 1,
            opacity: gateOpen ? 1 : 0.5,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Target */}
        <AnimatePresence>
          {targetVisible && (
            <motion.div
              className="w-20 h-20 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              className={`absolute inset-0 rounded-full ${
                feedback === 'hit'
                  ? 'bg-green-500/30'
                  : feedback === 'miss'
                  ? 'bg-red-500/30'
                  : 'bg-amber-500/30'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Timing Hint */}
      <motion.div
        className="mt-8 h-2 w-48 bg-muted/20 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-primary/50"
          animate={{
            width: gateOpen ? '100%' : '0%',
          }}
          transition={{ duration: config.gateWindow / 1000, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
};
