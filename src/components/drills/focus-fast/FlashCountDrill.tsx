// Flash Count - Level 1 Reactive Focus
// Count mental appearances of a rapid target, tap final count
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { DrillCompletionScreen } from './DrillCompletionScreen';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface FlashCountDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const DIFFICULTY_CONFIG = {
  easy: { flashDuration: 600, minFlashes: 2, maxFlashes: 4, rounds: 6 },
  medium: { flashDuration: 450, minFlashes: 3, maxFlashes: 6, rounds: 8 },
  hard: { flashDuration: 300, minFlashes: 4, maxFlashes: 8, rounds: 10 },
};

export const FlashCountDrill: React.FC<FlashCountDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'flashing' | 'answer' | 'feedback' | 'complete' | 'results'>('intro');
  const [round, setRound] = useState(0);
  const [flashCount, setFlashCount] = useState(0);
  const [actualCount, setActualCount] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finalResults, setFinalResults] = useState({ score: 0, avgRT: 0 });
  
  const statsRef = useRef({ correct: 0, total: 0, startTime: 0, reactionTimes: [] as number[] });
  const config = DIFFICULTY_CONFIG[difficulty];

  const startRound = useCallback(() => {
    const count = config.minFlashes + Math.floor(Math.random() * (config.maxFlashes - config.minFlashes + 1));
    setActualCount(count);
    setFlashCount(0);
    setPhase('flashing');
    
    let currentFlash = 0;
    const flashInterval = setInterval(() => {
      if (currentFlash < count) {
        setShowFlash(true);
        setFlashCount(f => f + 1);
        setTimeout(() => setShowFlash(false), config.flashDuration);
        currentFlash++;
      } else {
        clearInterval(flashInterval);
        // Short pause before showing answer choices
        setTimeout(() => {
          statsRef.current.startTime = Date.now();
          setPhase('answer');
        }, 500);
      }
    }, config.flashDuration + 600);
    
    return () => clearInterval(flashInterval);
  }, [config]);

  useEffect(() => {
    if (phase === 'intro') return;
    if (phase === 'flashing' && round === 0) {
      startRound();
    }
  }, [phase, round, startRound]);

  const handleAnswer = (answer: number) => {
    const rt = Date.now() - statsRef.current.startTime;
    statsRef.current.reactionTimes.push(rt);
    statsRef.current.total++;
    
    const correct = answer === actualCount;
    if (correct) statsRef.current.correct++;
    
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setPhase('feedback');
    
    setTimeout(() => {
      if (round + 1 >= config.rounds) {
        setPhase('results');
      } else {
        setRound(r => r + 1);
        setSelectedAnswer(null);
        startRound();
      }
    }, 800);
  };

  useEffect(() => {
    if (phase === 'results') {
      const { correct, total, reactionTimes } = statsRef.current;
      const accuracy = total > 0 ? correct / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(accuracy * 100);
      setFinalResults({ score, avgRT: Math.round(avgRT) });
    }
  }, [phase]);

  const handleContinue = () => {
    const { correct, reactionTimes } = statsRef.current;
    const avgRT = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;
    onComplete({ score: finalResults.score, correct, avgReactionTime: avgRT });
  };

  if (phase === 'results') {
    return (
      <DrillCompletionScreen
        title="Flash Count"
        score={finalResults.score}
        stats={{
          hits: statsRef.current.correct,
          misses: statsRef.current.total - statsRef.current.correct,
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
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Flash Count</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 1 • Reactive Focus</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Count how many times the circle flashes, then select the correct number.
        </p>
        <motion.button
          className="w-full max-w-xs py-3.5 bg-primary text-primary-foreground rounded-xl font-medium"
          whileTap={{ scale: 0.98 }}
          onClick={() => { setPhase('flashing'); startRound(); }}
        >
          Start
        </motion.button>
      </motion.div>
    );
  }

  const options = Array.from({ length: 6 }, (_, i) => config.minFlashes + i);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="p-4 bg-background/90">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Round {round + 1}/{config.rounds}</span>
          <span>{statsRef.current.correct} correct</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary" 
            animate={{ width: `${((round + 1) / config.rounds) * 100}%` }} 
          />
        </div>
      </div>

      {/* Flash area */}
      <div className="flex-1 flex items-center justify-center">
        {phase === 'flashing' && (
          <motion.div
            className={`w-24 h-24 rounded-full ${showFlash ? 'bg-primary' : 'bg-muted/20'}`}
            animate={{ scale: showFlash ? 1.2 : 1, opacity: showFlash ? 1 : 0.3 }}
            transition={{ duration: 0.1 }}
          />
        )}
        
        {phase === 'answer' && (
          <div className="text-center">
            <p className="text-lg font-medium text-foreground mb-6">How many flashes?</p>
            <div className="grid grid-cols-3 gap-3 px-6">
              {options.map(num => (
                <motion.button
                  key={num}
                  className="py-4 bg-card border border-border rounded-xl text-lg font-semibold text-foreground"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(num)}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>
        )}
        
        {phase === 'feedback' && (
          <motion.div
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <span className="text-3xl">{isCorrect ? '✓' : '✗'}</span>
            </div>
            <p className="text-muted-foreground">
              {isCorrect ? 'Correct!' : `It was ${actualCount}`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FlashCountDrill;
