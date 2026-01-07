// Rapid Tracking - Level 2 Selective Pressure
// Mentally track an object among many - attentional tracking
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { DrillCompletionScreen } from './DrillCompletionScreen';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface RapidTrackingDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTarget: boolean;
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { ballCount: 5, targetCount: 1, speed: 1.5, trackTime: 4000 },
  medium: { ballCount: 7, targetCount: 2, speed: 2, trackTime: 3500 },
  hard: { ballCount: 9, targetCount: 3, speed: 2.5, trackTime: 3000 },
};

export const RapidTrackingDrill: React.FC<RapidTrackingDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [gamePhase, setGamePhase] = useState<'highlight' | 'track' | 'select'>('highlight');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(0);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, wrong: 0 });
  const [finalResults, setFinalResults] = useState({ score: 0, avgRT: 0 });
  const [showResults, setShowResults] = useState(false);
  
  const statsRef = useRef({ hits: 0, misses: 0, wrong: 0, reactionTimes: [] as number[], selectStartTime: 0 });
  const startTimeRef = useRef(0);
  const animationRef = useRef<number>();
  const config = DIFFICULTY_CONFIG[difficulty];

  const initializeBalls = useCallback(() => {
    const newBalls: Ball[] = [];
    const targetIndices = new Set<number>();
    while (targetIndices.size < config.targetCount) {
      targetIndices.add(Math.floor(Math.random() * config.ballCount));
    }
    
    for (let i = 0; i < config.ballCount; i++) {
      newBalls.push({
        id: i,
        x: 15 + Math.random() * 70,
        y: 20 + Math.random() * 60,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        isTarget: targetIndices.has(i),
      });
    }
    
    setBalls(newBalls);
    setSelectedIds(new Set());
    setGamePhase('highlight');
    
    // Show targets for 2 seconds
    setTimeout(() => {
      setGamePhase('track');
      
      // Track for configured time
      setTimeout(() => {
        setGamePhase('select');
        statsRef.current.selectStartTime = Date.now();
      }, config.trackTime);
    }, 2000);
  }, [config]);

  const animateBalls = useCallback(() => {
    if (gamePhase !== 'track') return;
    
    setBalls(prev => prev.map(ball => {
      let newX = ball.x + ball.vx;
      let newY = ball.y + ball.vy;
      let newVx = ball.vx;
      let newVy = ball.vy;
      
      if (newX < 5 || newX > 95) newVx = -newVx;
      if (newY < 10 || newY > 90) newVy = -newVy;
      
      return {
        ...ball,
        x: Math.max(5, Math.min(95, newX)),
        y: Math.max(10, Math.min(90, newY)),
        vx: newVx,
        vy: newVy,
      };
    }));
    
    animationRef.current = requestAnimationFrame(animateBalls);
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase === 'track') {
      animationRef.current = requestAnimationFrame(animateBalls);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gamePhase, animateBalls]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    initializeBalls();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('results');
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [phase, initializeBalls]);

  const handleBallClick = useCallback((ball: Ball) => {
    if (gamePhase !== 'select') return;
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ball.id)) {
        newSet.delete(ball.id);
      } else if (newSet.size < config.targetCount) {
        newSet.add(ball.id);
      }
      return newSet;
    });
  }, [gamePhase, config.targetCount]);

  const handleConfirm = useCallback(() => {
    if (gamePhase !== 'select') return;
    
    const rt = Date.now() - statsRef.current.selectStartTime;
    statsRef.current.reactionTimes.push(rt);
    
    let correct = 0;
    let wrong = 0;
    
    selectedIds.forEach(id => {
      const ball = balls.find(b => b.id === id);
      if (ball?.isTarget) correct++;
      else wrong++;
    });
    
    const missed = config.targetCount - correct;
    
    statsRef.current.hits += correct;
    statsRef.current.wrong += wrong;
    statsRef.current.misses += missed;
    
    setLiveStats(ls => ({
      hits: ls.hits + correct,
      wrong: ls.wrong + wrong,
      misses: ls.misses + missed,
    }));
    
    setShowResults(true);
    
    setTimeout(() => {
      setShowResults(false);
      setRound(r => r + 1);
      initializeBalls();
    }, 1500);
  }, [gamePhase, selectedIds, balls, config.targetCount, initializeBalls]);

  useEffect(() => {
    if (phase === 'results') {
      const { hits, misses, wrong, reactionTimes } = statsRef.current;
      const total = hits + misses;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 80 + Math.max(0, 20 - avgRT / 100) - wrong * 5
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
        title="Rapid Tracking"
        score={finalResults.score}
        stats={{
          hits: liveStats.hits,
          misses: liveStats.misses,
          falseAlarms: liveStats.wrong,
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
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-primary" />
          <div className="absolute top-4 right-2 w-8 h-8 rounded-full bg-muted-foreground/40" />
          <div className="absolute bottom-0 left-6 w-8 h-8 rounded-full bg-muted-foreground/40" />
          <div className="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-muted-foreground/40" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Rapid Tracking</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 2 • Attentional Tracking</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Watch the <span className="text-primary font-medium">highlighted balls</span>, track them as they move, then select them.
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 bg-background/90">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>
            {gamePhase === 'highlight' ? '👀 Remember these!' : 
             gamePhase === 'track' ? '👁️ Track them...' : 
             '👆 Select the targets'}
          </span>
          <span>{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="text-green-400">✓ {liveStats.hits}</span>
          <span className="text-amber-400">○ {liveStats.misses}</span>
          <span className="text-red-400">✗ {liveStats.wrong}</span>
        </div>
      </div>

      <div className="flex-1 relative">
        {balls.map(ball => (
          <motion.div
            key={ball.id}
            className={`absolute w-12 h-12 rounded-full cursor-pointer transition-colors ${
              showResults ? (ball.isTarget ? 'bg-green-500' : 'bg-muted-foreground/40') :
              gamePhase === 'highlight' && ball.isTarget ? 'bg-primary ring-4 ring-primary/30' :
              selectedIds.has(ball.id) ? 'bg-primary ring-2 ring-primary/50' :
              'bg-muted-foreground/40'
            }`}
            style={{ 
              left: `${ball.x}%`, 
              top: `${ball.y}%`, 
              transform: 'translate(-50%, -50%)' 
            }}
            animate={{ 
              left: `${ball.x}%`, 
              top: `${ball.y}%` 
            }}
            transition={{ duration: 0.05 }}
            onClick={() => handleBallClick(ball)}
          />
        ))}
      </div>

      {gamePhase === 'select' && !showResults && (
        <div className="p-4">
          <motion.button
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={selectedIds.size !== config.targetCount}
          >
            Confirm ({selectedIds.size}/{config.targetCount})
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default RapidTrackingDrill;
