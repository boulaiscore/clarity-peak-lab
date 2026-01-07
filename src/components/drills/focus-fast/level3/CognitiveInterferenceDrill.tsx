import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from '../DrillCompletionScreen';

interface CognitiveInterferenceDrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (results: { score: number; accuracy: number; avgReactionTime: number }) => void;
}

const DIFFICULTY_CONFIG = {
  easy: { duration: 45000, mathDifficulty: 1, targetRate: 2500 },
  medium: { duration: 50000, mathDifficulty: 2, targetRate: 2000 },
  hard: { duration: 55000, mathDifficulty: 3, targetRate: 1500 },
};

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

export const CognitiveInterferenceDrill: React.FC<CognitiveInterferenceDrillProps> = ({ difficulty, onComplete }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [phase, setPhase] = useState<'instruction' | 'playing' | 'results'>('instruction');
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [targetVisible, setTargetVisible] = useState(false);
  const [targetSide, setTargetSide] = useState<'left' | 'right'>('left');
  const [liveStats, setLiveStats] = useState({ 
    targetHits: 0, 
    targetMisses: 0, 
    mathCorrect: 0, 
    mathWrong: 0 
  });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [targetFeedback, setTargetFeedback] = useState<boolean | null>(null);
  const targetShownTime = useRef(0);

  const generateMathProblem = useCallback((): MathProblem => {
    let a: number, b: number, answer: number, question: string;
    
    if (config.mathDifficulty === 1) {
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a + b;
      question = `${a} + ${b}`;
    } else if (config.mathDifficulty === 2) {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      if (Math.random() > 0.5) {
        answer = a * b;
        question = `${a} × ${b}`;
      } else {
        answer = a + b;
        question = `${a} + ${b}`;
      }
    } else {
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * 10) + 1;
      const c = Math.floor(Math.random() * 10) + 1;
      answer = a + b - c;
      question = `${a} + ${b} - ${c}`;
    }
    
    const options = [answer];
    while (options.length < 4) {
      const wrong = answer + (Math.floor(Math.random() * 10) - 5);
      if (!options.includes(wrong) && wrong > 0) {
        options.push(wrong);
      }
    }
    
    return { question, answer, options: options.sort(() => Math.random() - 0.5) };
  }, [config.mathDifficulty]);

  const spawnTarget = useCallback(() => {
    setTargetSide(Math.random() > 0.5 ? 'left' : 'right');
    setTargetVisible(true);
    targetShownTime.current = Date.now();
    
    // Target disappears after a while if not tapped
    setTimeout(() => {
      setTargetVisible(prev => {
        if (prev) {
          setLiveStats(s => ({ ...s, targetMisses: s.targetMisses + 1 }));
        }
        return false;
      });
    }, 1500);
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      setCurrentProblem(generateMathProblem());
    }
  }, [phase, generateMathProblem]);

  useEffect(() => {
    if (phase !== 'playing') return;
    
    const targetInterval = setInterval(() => {
      if (Math.random() > 0.4) { // 60% chance to spawn
        spawnTarget();
      }
    }, config.targetRate);
    
    return () => clearInterval(targetInterval);
  }, [phase, spawnTarget, config.targetRate]);

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

  const handleTargetTap = useCallback(() => {
    if (!targetVisible) return;
    
    const rt = Date.now() - targetShownTime.current;
    setReactionTimes(prev => [...prev, rt]);
    setLiveStats(prev => ({ ...prev, targetHits: prev.targetHits + 1 }));
    setTargetVisible(false);
    setTargetFeedback(true);
    setTimeout(() => setTargetFeedback(null), 300);
  }, [targetVisible]);

  const handleMathAnswer = useCallback((answer: number) => {
    if (!currentProblem) return;
    
    if (answer === currentProblem.answer) {
      setLiveStats(prev => ({ ...prev, mathCorrect: prev.mathCorrect + 1 }));
    } else {
      setLiveStats(prev => ({ ...prev, mathWrong: prev.mathWrong + 1 }));
    }
    
    setCurrentProblem(generateMathProblem());
  }, [currentProblem, generateMathProblem]);

  if (phase === 'instruction') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Cognitive Interference</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Solve math problems while watching for targets on the sides.
          Tap targets immediately when they appear, but keep solving math!
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
    const targetTotal = liveStats.targetHits + liveStats.targetMisses;
    const mathTotal = liveStats.mathCorrect + liveStats.mathWrong;
    const targetScore = targetTotal > 0 ? Math.round((liveStats.targetHits / targetTotal) * 100) : 0;
    const mathScore = mathTotal > 0 ? Math.round((liveStats.mathCorrect / mathTotal) * 100) : 0;
    const overallScore = Math.round((targetScore + mathScore) / 2);
    const avgRT = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    return (
      <DrillCompletionScreen
        title="Cognitive Interference"
        score={overallScore}
        stats={[
          { label: 'Targets', value: `${liveStats.targetHits}/${targetTotal}` },
          { label: 'Math', value: `${liveStats.mathCorrect}/${mathTotal}` },
          { label: 'Avg RT', value: `${avgRT}ms` },
        ]}
        onContinue={() => onComplete({ score: overallScore, accuracy: overallScore, avgReactionTime: avgRT })}
      />
    );
  }

  return (
    <div className="flex flex-col items-center p-4 min-h-[500px]">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="text-xs text-muted-foreground">
          🎯 <span className="text-green-500">{liveStats.targetHits}</span>
          {' '}🧮 <span className="text-blue-500">{liveStats.mathCorrect}</span>
        </div>
        <div className="text-lg font-mono text-foreground">
          {Math.ceil(timeLeft / 1000)}s
        </div>
      </div>

      {/* Main Area */}
      <div className="relative w-full flex items-center justify-center h-80">
        {/* Left Target Zone */}
        <motion.button
          className={`absolute left-2 w-16 h-24 rounded-lg border-2 ${
            targetVisible && targetSide === 'left'
              ? 'border-primary bg-primary/20'
              : 'border-muted/30'
          } ${targetFeedback === true ? 'bg-green-500/30' : ''}`}
          onClick={handleTargetTap}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence>
            {targetVisible && targetSide === 'left' && (
              <motion.div
                className="w-10 h-10 rounded-full bg-primary mx-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* Math Problem */}
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold text-foreground mb-6">
            {currentProblem?.question} = ?
          </div>
          <div className="grid grid-cols-2 gap-3">
            {currentProblem?.options.map((opt, i) => (
              <motion.button
                key={i}
                className="w-16 h-12 rounded-lg bg-muted/30 text-foreground font-medium"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMathAnswer(opt)}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right Target Zone */}
        <motion.button
          className={`absolute right-2 w-16 h-24 rounded-lg border-2 ${
            targetVisible && targetSide === 'right'
              ? 'border-primary bg-primary/20'
              : 'border-muted/30'
          } ${targetFeedback === true ? 'bg-green-500/30' : ''}`}
          onClick={handleTargetTap}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence>
            {targetVisible && targetSide === 'right' && (
              <motion.div
                className="w-10 h-10 rounded-full bg-primary mx-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Tap targets on the sides while solving math
      </p>
    </div>
  );
};
