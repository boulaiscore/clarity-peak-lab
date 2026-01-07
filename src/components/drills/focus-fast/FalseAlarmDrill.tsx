// False Alarm - Level 2 Selective Pressure
// Strong penalty for impulsive responses - inhibitory control training
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from './DrillCompletionScreen';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface FalseAlarmDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Stimulus {
  id: string;
  isTarget: boolean;
  color: string;
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { displayTime: 1800, targetRate: 0.3, penalty: 2 },
  medium: { displayTime: 1400, targetRate: 0.25, penalty: 3 },
  hard: { displayTime: 1000, targetRate: 0.2, penalty: 5 },
};

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];

export const FalseAlarmDrill: React.FC<FalseAlarmDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
  const [targetColor] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'penalty' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [finalResults, setFinalResults] = useState({ score: 0, avgRT: 0 });
  const [penaltyActive, setPenaltyActive] = useState(false);
  
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, reactionTimes: [] as number[], stimulusTime: 0 });
  const startTimeRef = useRef(0);
  const idRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const generateStimulus = useCallback(() => {
    const isTarget = Math.random() < config.targetRate;
    const color = isTarget ? targetColor : COLORS.filter(c => c !== targetColor)[Math.floor(Math.random() * (COLORS.length - 1))];
    
    return {
      id: `stim-${idRef.current++}`,
      isTarget,
      color,
    };
  }, [config.targetRate, targetColor]);

  const nextStimulus = useCallback(() => {
    if (penaltyActive) return;
    
    const stim = generateStimulus();
    setCurrentStimulus(stim);
    statsRef.current.stimulusTime = Date.now();
    
    setTimeout(() => {
      setCurrentStimulus(curr => {
        if (curr?.id === stim.id) {
          if (stim.isTarget) {
            statsRef.current.misses++;
            setLiveStats(ls => ({ ...ls, misses: ls.misses + 1 }));
          }
          return null;
        }
        return curr;
      });
    }, config.displayTime);
  }, [generateStimulus, config.displayTime, penaltyActive]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    nextStimulus();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('results');
      }
    }, 100);
    
    const stimulusInterval = setInterval(() => {
      if (!penaltyActive) nextStimulus();
    }, config.displayTime + 400);
    
    return () => {
      clearInterval(timer);
      clearInterval(stimulusInterval);
    };
  }, [phase, nextStimulus, config.displayTime, penaltyActive]);

  const handleTap = useCallback(() => {
    if (!currentStimulus || penaltyActive) return;
    
    const rt = Date.now() - statsRef.current.stimulusTime;
    
    if (currentStimulus.isTarget) {
      statsRef.current.hits++;
      statsRef.current.reactionTimes.push(rt);
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setFeedback('correct');
      setCurrentStimulus(null);
      setTimeout(() => setFeedback(null), 200);
    } else {
      statsRef.current.falseAlarms++;
      setLiveStats(ls => ({ ...ls, falseAlarms: ls.falseAlarms + 1 }));
      setFeedback('penalty');
      setPenaltyActive(true);
      setCurrentStimulus(null);
      
      // Penalty timeout
      setTimeout(() => {
        setPenaltyActive(false);
        setFeedback(null);
      }, config.penalty * 300);
    }
  }, [currentStimulus, penaltyActive, config.penalty]);

  useEffect(() => {
    if (phase === 'results') {
      const { hits, misses, falseAlarms, reactionTimes } = statsRef.current;
      const total = hits + misses;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 70 + Math.max(0, 30 - avgRT / 50) - falseAlarms * config.penalty * 3
      )));
      setFinalResults({ score, avgRT: Math.round(avgRT) });
    }
  }, [phase, config.penalty]);

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
        title="False Alarm"
        score={finalResults.score}
        stats={{
          hits: liveStats.hits,
          misses: liveStats.misses,
          falseAlarms: liveStats.falseAlarms,
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
        <div className="w-16 h-16 rounded-full mb-4" style={{ backgroundColor: targetColor }} />
        <h2 className="text-lg font-semibold text-foreground mb-1">False Alarm</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 2 • Inhibitory Control</p>
        <p className="text-sm text-muted-foreground text-center mb-2 max-w-xs">
          Tap only when you see this color. Wrong taps cause a <span className="text-red-400 font-medium">penalty timeout</span>.
        </p>
        <p className="text-xs text-red-400/80 text-center mb-6 max-w-xs">
          Control your impulses - false alarms are heavily penalized!
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
      className={`min-h-screen bg-background flex flex-col ${
        penaltyActive ? 'bg-red-500/20' : 
        feedback === 'correct' ? 'bg-green-500/5' : ''
      }`}
      onClick={handleTap}
    >
      <div className="p-4 bg-background/90">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">TARGET:</span>
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: targetColor }} />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="text-green-400">✓ {liveStats.hits}</span>
          <span className="text-amber-400">○ {liveStats.misses}</span>
          <span className="text-red-400">⚠ {liveStats.falseAlarms}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {penaltyActive ? (
          <motion.div
            className="text-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-red-400 font-medium">Penalty Timeout</p>
            <p className="text-xs text-muted-foreground mt-1">Wait for it to pass...</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {currentStimulus && (
              <motion.div
                key={currentStimulus.id}
                className="w-28 h-28 rounded-full"
                style={{ backgroundColor: currentStimulus.color }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              />
            )}
          </AnimatePresence>
        )}
        
        {feedback === 'correct' && (
          <motion.div
            className="absolute text-6xl text-green-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            ✓
          </motion.div>
        )}
      </div>

      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Tap anywhere for target color only</p>
      </div>
    </motion.div>
  );
};

export default FalseAlarmDrill;
