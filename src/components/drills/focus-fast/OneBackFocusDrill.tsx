// One-Back Focus - Level 1 Reactive Focus
// Respond if stimulus matches the previous one
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface OneBackFocusDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const SHAPES = ['●', '■', '▲', '◆', '★'];
const DURATION = 45000;

const DIFFICULTY_CONFIG = {
  easy: { displayTime: 2000, matchRate: 0.35 },
  medium: { displayTime: 1500, matchRate: 0.30 },
  hard: { displayTime: 1000, matchRate: 0.25 },
};

export const OneBackFocusDrill: React.FC<OneBackFocusDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [currentShape, setCurrentShape] = useState<string | null>(null);
  const [previousShape, setPreviousShape] = useState<string | null>(null);
  const [isMatch, setIsMatch] = useState(false);
  const [responded, setResponded] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejects: 0, reactionTimes: [] as number[], stimulusTime: 0 });
  const startTimeRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const nextStimulus = useCallback(() => {
    const prev = currentShape;
    setPreviousShape(prev);
    
    const shouldMatch = prev && Math.random() < config.matchRate;
    const newShape = shouldMatch ? prev : SHAPES[Math.floor(Math.random() * SHAPES.length)];
    
    setCurrentShape(newShape);
    setIsMatch(prev === newShape);
    setResponded(false);
    statsRef.current.stimulusTime = Date.now();
  }, [currentShape, config.matchRate]);

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
        setPhase('complete');
      }
    }, 100);
    
    const stimulusInterval = setInterval(() => {
      // Check for miss
      if (isMatch && !responded) {
        statsRef.current.misses++;
      } else if (!isMatch && !responded) {
        statsRef.current.correctRejects++;
      }
      nextStimulus();
    }, config.displayTime);
    
    return () => {
      clearInterval(timer);
      clearInterval(stimulusInterval);
    };
  }, [phase, nextStimulus, config.displayTime, isMatch, responded]);

  const handleTap = useCallback(() => {
    if (responded) return;
    
    const rt = Date.now() - statsRef.current.stimulusTime;
    statsRef.current.reactionTimes.push(rt);
    setResponded(true);
    
    if (isMatch) {
      statsRef.current.hits++;
      setFeedback('correct');
    } else {
      statsRef.current.falseAlarms++;
      setFeedback('wrong');
    }
    
    setTimeout(() => setFeedback(null), 300);
  }, [isMatch, responded]);

  useEffect(() => {
    if (phase === 'complete') {
      const { hits, misses, falseAlarms, reactionTimes } = statsRef.current;
      const totalMatches = hits + misses;
      const accuracy = totalMatches > 0 ? hits / totalMatches : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 70 + Math.max(0, 30 - avgRT / 50) - falseAlarms * 3
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
        <div className="flex gap-4 mb-4">
          <span className="text-3xl text-muted-foreground">●</span>
          <span className="text-3xl text-primary">●</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">One-Back Focus</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 1 • Reactive Focus</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Tap when the current shape matches the previous one. Train your working memory.
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
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Tap if same as previous</span>
          <span>{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Previous indicator */}
      <div className="p-4 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
          <span className="text-xs text-muted-foreground">Previous:</span>
          <span className="text-xl text-muted-foreground">{previousShape || '–'}</span>
        </div>
      </div>

      {/* Current stimulus */}
      <div className="flex-1 flex items-center justify-center relative">
        <motion.div
          key={currentShape}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-8xl text-primary"
        >
          {currentShape}
        </motion.div>
        
        {feedback && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className={`text-6xl ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? '✓' : '✗'}
            </span>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">Matches found: {statsRef.current.hits}</p>
      </div>
    </motion.div>
  );
};

export default OneBackFocusDrill;
