// Distractor Burst - Level 2 Selective Pressure
// Bursts of distractors before real target - attentional resistance
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from './DrillCompletionScreen';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface DistractorBurstDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Stimulus {
  id: string;
  isTarget: boolean;
  x: number;
  y: number;
  isBurst: boolean;
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { burstSize: 3, burstSpeed: 150, burstFreq: 4000 },
  medium: { burstSize: 5, burstSpeed: 100, burstFreq: 3000 },
  hard: { burstSize: 8, burstSpeed: 70, burstFreq: 2500 },
};

export const DistractorBurstDrill: React.FC<DistractorBurstDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [stimuli, setStimuli] = useState<Stimulus[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [finalResults, setFinalResults] = useState({ score: 0, avgRT: 0 });
  const [burstActive, setBurstActive] = useState(false);
  
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, reactionTimes: [] as number[], targetSpawnTime: 0 });
  const startTimeRef = useRef(0);
  const idRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const spawnBurst = useCallback(() => {
    setBurstActive(true);
    let burstCount = 0;
    
    const burstInterval = setInterval(() => {
      if (burstCount >= config.burstSize) {
        clearInterval(burstInterval);
        
        // Spawn real target after burst
        setTimeout(() => {
          const targetId = `target-${idRef.current++}`;
          statsRef.current.targetSpawnTime = Date.now();
          setStimuli(prev => [...prev, {
            id: targetId,
            isTarget: true,
            x: 15 + Math.random() * 70,
            y: 20 + Math.random() * 60,
            isBurst: false,
          }]);
          
          // Remove target after timeout
          setTimeout(() => {
            setStimuli(prev => {
              const target = prev.find(s => s.id === targetId);
              if (target) {
                statsRef.current.misses++;
                setLiveStats(ls => ({ ...ls, misses: ls.misses + 1 }));
              }
              return prev.filter(s => s.id !== targetId);
            });
          }, 2500);
          
          setBurstActive(false);
        }, 300);
        
        return;
      }
      
      const burstId = `burst-${idRef.current++}`;
      setStimuli(prev => [...prev, {
        id: burstId,
        isTarget: false,
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 70,
        isBurst: true,
      }]);
      
      // Remove burst item quickly
      setTimeout(() => {
        setStimuli(prev => prev.filter(s => s.id !== burstId));
      }, 400);
      
      burstCount++;
    }, config.burstSpeed);
  }, [config]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    spawnBurst();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('results');
      }
    }, 100);
    
    const burstSpawner = setInterval(() => {
      if (!burstActive) spawnBurst();
    }, config.burstFreq);
    
    return () => {
      clearInterval(timer);
      clearInterval(burstSpawner);
    };
  }, [phase, spawnBurst, config.burstFreq, burstActive]);

  const handleTap = useCallback((stimulus: Stimulus) => {
    if (stimulus.isTarget) {
      const rt = Date.now() - statsRef.current.targetSpawnTime;
      statsRef.current.reactionTimes.push(rt);
      statsRef.current.hits++;
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setFeedback('correct');
    } else {
      statsRef.current.falseAlarms++;
      setLiveStats(ls => ({ ...ls, falseAlarms: ls.falseAlarms + 1 }));
      setFeedback('wrong');
    }
    
    setStimuli(prev => prev.filter(s => s.id !== stimulus.id));
    setTimeout(() => setFeedback(null), 200);
  }, []);

  useEffect(() => {
    if (phase === 'results') {
      const { hits, misses, falseAlarms, reactionTimes } = statsRef.current;
      const total = hits + misses;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 70 + Math.max(0, 30 - avgRT / 50) - falseAlarms * 6
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
        title="Distractor Burst"
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
        <div className="relative mb-4">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-muted-foreground/30" />
            ))}
          </div>
          <motion.div 
            className="absolute -right-3 -bottom-3 w-10 h-10 rounded-full bg-primary"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Distractor Burst</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 2 • Attentional Resistance</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Resist the burst of distractors! Wait for the <span className="text-primary font-medium">real target</span> that appears after.
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
    <div className={`min-h-screen bg-background relative overflow-hidden ${
      burstActive ? 'bg-amber-500/5' :
      feedback === 'correct' ? 'bg-green-500/5' : 
      feedback === 'wrong' ? 'bg-red-500/10' : ''
    }`}>
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-background/90 backdrop-blur-sm">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>{burstActive ? '⚡ BURST - Wait!' : 'Tap the target'}</span>
          <span>{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="text-green-400">✓ {liveStats.hits}</span>
          <span className="text-amber-400">○ {liveStats.misses}</span>
          <span className="text-red-400">✗ {liveStats.falseAlarms}</span>
        </div>
      </div>

      <div className="absolute inset-0 pt-24">
        <AnimatePresence>
          {stimuli.map(stim => (
            <motion.div
              key={stim.id}
              className={`absolute w-12 h-12 rounded-full cursor-pointer ${
                stim.isTarget ? 'bg-primary' : 'bg-muted-foreground/40'
              }`}
              style={{ left: `${stim.x}%`, top: `${stim.y}%`, transform: 'translate(-50%, -50%)' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleTap(stim)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DistractorBurstDrill;
