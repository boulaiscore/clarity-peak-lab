// Color-Word Snap - Level 1 Reactive Focus
// Tap only when ink color matches the word
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface ColorWordSnapDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const COLORS = [
  { name: 'RED', hsl: 'hsl(0, 85%, 55%)' },
  { name: 'BLUE', hsl: 'hsl(210, 100%, 55%)' },
  { name: 'GREEN', hsl: 'hsl(140, 70%, 45%)' },
  { name: 'YELLOW', hsl: 'hsl(45, 100%, 50%)' },
];

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { displayTime: 3500, matchRate: 0.5 },
  medium: { displayTime: 2500, matchRate: 0.4 },
  hard: { displayTime: 1800, matchRate: 0.3 },
};

export const ColorWordSnapDrill: React.FC<ColorWordSnapDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [currentWord, setCurrentWord] = useState<{ text: string; color: string; isMatch: boolean } | null>(null);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | 'miss' | null>(null);
  const [canTap, setCanTap] = useState(true);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, reactionTimes: [] as number[], wordStartTime: 0 });
  const startTimeRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const generateWord = useCallback(() => {
    const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const isMatch = Math.random() < config.matchRate;
    const inkColor = isMatch 
      ? wordColor 
      : COLORS.filter(c => c.name !== wordColor.name)[Math.floor(Math.random() * 3)];
    
    return { text: wordColor.name, color: inkColor.hsl, isMatch };
  }, [config.matchRate]);

  const nextWord = useCallback(() => {
    const word = generateWord();
    setCurrentWord(word);
    setCanTap(true);
    statsRef.current.wordStartTime = Date.now();
    
    // Auto-advance after display time
    setTimeout(() => {
      setCurrentWord(curr => {
        if (curr === word) {
          if (word.isMatch && canTap) {
            statsRef.current.misses++;
            setLiveStats(ls => ({ ...ls, misses: ls.misses + 1 }));
            setShowFeedback('miss');
            setTimeout(() => setShowFeedback(null), 300);
          }
          return null;
        }
        return curr;
      });
    }, config.displayTime);
  }, [generateWord, config.displayTime, canTap]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    nextWord();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('complete');
      }
    }, 100);
    
    const wordInterval = setInterval(() => {
      if (!currentWord) nextWord();
    }, config.displayTime + 300);
    
    return () => {
      clearInterval(timer);
      clearInterval(wordInterval);
    };
  }, [phase, nextWord, config.displayTime]);

  const handleTap = useCallback(() => {
    if (!currentWord || !canTap) return;
    
    const rt = Date.now() - statsRef.current.wordStartTime;
    statsRef.current.reactionTimes.push(rt);
    setCanTap(false);
    
    if (currentWord.isMatch) {
      statsRef.current.hits++;
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setShowFeedback('correct');
    } else {
      statsRef.current.falseAlarms++;
      setLiveStats(ls => ({ ...ls, falseAlarms: ls.falseAlarms + 1 }));
      setShowFeedback('wrong');
    }
    
    setTimeout(() => {
      setShowFeedback(null);
      setCurrentWord(null);
      nextWord();
    }, 400);
  }, [currentWord, canTap, nextWord]);

  useEffect(() => {
    if (phase === 'complete') {
      const { hits, misses, falseAlarms, reactionTimes } = statsRef.current;
      const total = hits + misses;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 70 + Math.max(0, 30 - avgRT / 60) - falseAlarms * 5
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
        <div className="mb-4">
          <span className="text-2xl font-bold" style={{ color: COLORS[0].hsl }}>RED</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Color–Word Snap</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 1 • Reactive Focus</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Tap only when the ink color matches the word. Ignore mismatches.
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
      {/* Progress */}
      <div className="p-4 bg-background/90">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Tap on match only</span>
          <span>{Math.ceil(timeLeft / 1000)}s</span>
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

      {/* Word display */}
      <div className="flex-1 flex items-center justify-center relative">
        {currentWord && (
          <motion.div
            key={currentWord.text + currentWord.color}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="text-5xl font-black tracking-wider"
            style={{ color: currentWord.color }}
          >
            {currentWord.text}
          </motion.div>
        )}
        
        {showFeedback && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={`text-6xl ${
              showFeedback === 'correct' ? 'text-green-500' : 
              showFeedback === 'wrong' ? 'text-red-500' : 
              'text-yellow-500'
            }`}>
              {showFeedback === 'correct' ? '✓' : showFeedback === 'wrong' ? '✗' : '−'}
            </div>
          </motion.div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Tap anywhere when color = word</p>
      </div>
    </motion.div>
  );
};

export default ColorWordSnapDrill;
