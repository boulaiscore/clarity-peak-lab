// Peripheral Alert - Level 1 Reactive Focus
// React to stimuli at screen edges
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface PeripheralAlertDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

type EdgePosition = 'top' | 'bottom' | 'left' | 'right';

interface Alert {
  id: string;
  edge: EdgePosition;
  position: number;
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { spawnRate: 1800, lifetime: 2000 },
  medium: { spawnRate: 1400, lifetime: 1500 },
  hard: { spawnRate: 1000, lifetime: 1000 },
};

export const PeripheralAlertDrill: React.FC<PeripheralAlertDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [feedback, setFeedback] = useState<{ x: number; y: number; correct: boolean } | null>(null);
  
  const statsRef = useRef({ hits: 0, misses: 0, reactionTimes: [] as number[], spawnTimes: new Map<string, number>() });
  const startTimeRef = useRef(0);
  const idRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const spawnAlert = useCallback(() => {
    const edges: EdgePosition[] = ['top', 'bottom', 'left', 'right'];
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const position = 15 + Math.random() * 70;
    const id = `alert-${idRef.current++}`;
    
    statsRef.current.spawnTimes.set(id, Date.now());
    
    return { id, edge, position };
  }, []);

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
    
    const spawner = setInterval(() => {
      const newAlert = spawnAlert();
      setAlerts(prev => [...prev, newAlert]);
      
      setTimeout(() => {
        setAlerts(prev => {
          const alert = prev.find(a => a.id === newAlert.id);
          if (alert) statsRef.current.misses++;
          return prev.filter(a => a.id !== newAlert.id);
        });
      }, config.lifetime);
    }, config.spawnRate);
    
    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [phase, spawnAlert, config]);

  const handleTap = useCallback((alert: Alert, e: React.MouseEvent) => {
    const spawnTime = statsRef.current.spawnTimes.get(alert.id);
    if (spawnTime) {
      const rt = Date.now() - spawnTime;
      statsRef.current.reactionTimes.push(rt);
    }
    statsRef.current.hits++;
    
    setFeedback({ x: e.clientX, y: e.clientY, correct: true });
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
    setTimeout(() => setFeedback(null), 300);
  }, []);

  useEffect(() => {
    if (phase === 'complete') {
      const { hits, misses, reactionTimes } = statsRef.current;
      const total = hits + misses;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, accuracy * 80 + Math.max(0, 20 - avgRT / 100))));
      onComplete({ score, correct: hits, avgReactionTime: Math.round(avgRT) });
    }
  }, [phase, onComplete]);

  if (phase === 'intro') {
    return (
      <motion.div 
        className="flex-1 bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center relative">
          <div className="absolute w-3 h-3 bg-primary rounded-full animate-pulse -top-1 -right-1" />
          <div className="w-6 h-6 border-2 border-primary rounded" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Peripheral Alert</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 1 • Reactive Focus</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          Tap the dots appearing at the edges of your screen as fast as possible.
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

  const getAlertStyle = (alert: Alert): React.CSSProperties => {
    switch (alert.edge) {
      case 'top': return { top: 8, left: `${alert.position}%` };
      case 'bottom': return { bottom: 8, left: `${alert.position}%` };
      case 'left': return { left: 8, top: `${alert.position}%` };
      case 'right': return { right: 8, top: `${alert.position}%` };
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Progress */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-background/90">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Peripheral Alert</span>
          <span>{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Center focus point */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-muted-foreground/30 rounded-full" />
        <p className="absolute mt-12 text-xs text-muted-foreground">Keep your eyes here</p>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.map(alert => (
          <motion.div
            key={alert.id}
            className="absolute w-12 h-12 cursor-pointer"
            style={getAlertStyle(alert)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={(e) => handleTap(alert, e)}
          >
            <motion.div 
              className="w-full h-full rounded-full bg-primary"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="fixed pointer-events-none"
            style={{ left: feedback.x, top: feedback.y }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-green-500 text-xl">✓</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PeripheralAlertDrill;
