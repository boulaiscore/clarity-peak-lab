// Odd Precision - Level 2 Selective Pressure
// Identify the different element under pressure - rapid discrimination
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { DrillCompletionScreen } from './DrillCompletionScreen';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface OddPrecisionDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface GridItem {
  id: number;
  isOdd: boolean;
  value: number;
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { gridSize: 9, displayTime: 4000, similarity: 0.2 },
  medium: { gridSize: 12, displayTime: 3000, similarity: 0.1 },
  hard: { gridSize: 16, displayTime: 2000, similarity: 0.05 },
};

export const OddPrecisionDrill: React.FC<OddPrecisionDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, wrong: 0 });
  const [finalResults, setFinalResults] = useState({ score: 0, avgRT: 0 });
  
  const statsRef = useRef({ hits: 0, misses: 0, wrong: 0, reactionTimes: [] as number[], roundStartTime: 0 });
  const startTimeRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const generateGrid = useCallback(() => {
    const baseValue = Math.random();
    const oddIndex = Math.floor(Math.random() * config.gridSize);
    const oddDiff = (0.1 + Math.random() * 0.15) * (1 - config.similarity);
    
    const items: GridItem[] = [];
    for (let i = 0; i < config.gridSize; i++) {
      items.push({
        id: i,
        isOdd: i === oddIndex,
        value: i === oddIndex ? baseValue + oddDiff : baseValue,
      });
    }
    
    setGrid(items);
    statsRef.current.roundStartTime = Date.now();
  }, [config]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    generateGrid();
    
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
  }, [phase, generateGrid]);

  // Auto-advance after display time
  useEffect(() => {
    if (phase !== 'active' || grid.length === 0) return;
    
    const timeout = setTimeout(() => {
      statsRef.current.misses++;
      setLiveStats(ls => ({ ...ls, misses: ls.misses + 1 }));
      setRound(r => r + 1);
      generateGrid();
    }, config.displayTime);
    
    return () => clearTimeout(timeout);
  }, [phase, grid, round, config.displayTime, generateGrid]);

  const handleTap = useCallback((item: GridItem) => {
    const rt = Date.now() - statsRef.current.roundStartTime;
    statsRef.current.reactionTimes.push(rt);
    
    if (item.isOdd) {
      statsRef.current.hits++;
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setFeedback('correct');
    } else {
      statsRef.current.wrong++;
      setLiveStats(ls => ({ ...ls, wrong: ls.wrong + 1 }));
      setFeedback('wrong');
    }
    
    setTimeout(() => {
      setFeedback(null);
      setRound(r => r + 1);
      generateGrid();
    }, 400);
  }, [generateGrid]);

  useEffect(() => {
    if (phase === 'results') {
      const { hits, misses, wrong, reactionTimes } = statsRef.current;
      const total = hits + misses + wrong;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 80 + Math.max(0, 20 - avgRT / 80)
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
        title="Odd Precision"
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
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-lg ${i === 4 ? 'bg-primary' : 'bg-primary/60'}`}
            />
          ))}
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Odd Precision</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 2 • Rapid Discrimination</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Find the <span className="text-primary font-medium">slightly different</span> element in the grid. Be fast and precise!
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
  const cols = config.gridSize <= 9 ? 3 : 4;

  return (
    <div className={`min-h-screen bg-background flex flex-col ${
      feedback === 'correct' ? 'bg-green-500/5' : 
      feedback === 'wrong' ? 'bg-red-500/10' : ''
    }`}>
      <div className="p-4 bg-background/90">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Find the odd one</span>
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

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          key={round}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {grid.map(item => (
            <motion.button
              key={item.id}
              className="w-16 h-16 rounded-xl"
              style={{ 
                backgroundColor: `hsl(${200 + item.value * 60}, 70%, ${45 + item.value * 20}%)` 
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTap(item)}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default OddPrecisionDrill;
