// Rule Switch Focus - Level 2 Selective Pressure
// Rule changes mid-session - cognitive flexibility training
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrillCompletionScreen } from './DrillCompletionScreen';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
}

interface RuleSwitchFocusDrillProps {
  onComplete: (result: DrillResult) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

type Rule = 'color' | 'shape';
type Shape = 'circle' | 'square' | 'triangle';
type Color = 'red' | 'blue' | 'green';

interface Stimulus {
  id: string;
  shape: Shape;
  color: Color;
  isTarget: boolean;
}

const DURATION = 45000;
const DIFFICULTY_CONFIG = {
  easy: { displayTime: 2200, switchCount: 1 },
  medium: { displayTime: 1800, switchCount: 2 },
  hard: { displayTime: 1400, switchCount: 4 },
};

const SHAPES: Shape[] = ['circle', 'square', 'triangle'];
const COLORS: Color[] = ['red', 'blue', 'green'];
const COLOR_VALUES = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e' };

export const RuleSwitchFocusDrill: React.FC<RuleSwitchFocusDrillProps> = ({ 
  onComplete, 
  difficulty = 'medium' 
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'results'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [currentRule, setCurrentRule] = useState<Rule>('color');
  const [targetValue, setTargetValue] = useState<string>('red');
  const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'switch' | null>(null);
  const [liveStats, setLiveStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [finalResults, setFinalResults] = useState({ score: 0, avgRT: 0 });
  const [showRuleChange, setShowRuleChange] = useState(false);
  
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, reactionTimes: [] as number[], stimulusTime: 0 });
  const startTimeRef = useRef(0);
  const idRef = useRef(0);
  const switchCountRef = useRef(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  const generateStimulus = useCallback(() => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    let isTarget = false;
    if (currentRule === 'color') {
      isTarget = color === targetValue;
    } else {
      isTarget = shape === targetValue;
    }
    
    return {
      id: `stim-${idRef.current++}`,
      shape,
      color,
      isTarget,
    };
  }, [currentRule, targetValue]);

  const switchRule = useCallback(() => {
    setShowRuleChange(true);
    if (currentRule === 'color') {
      setCurrentRule('shape');
      setTargetValue(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    } else {
      setCurrentRule('color');
      setTargetValue(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    setTimeout(() => setShowRuleChange(false), 1500);
  }, [currentRule]);

  const nextStimulus = useCallback(() => {
    if (showRuleChange) return;
    
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
  }, [generateStimulus, config.displayTime, showRuleChange]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    switchCountRef.current = 0;
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
      if (!showRuleChange) nextStimulus();
    }, config.displayTime + 400);
    
    // Schedule rule switches
    const switchInterval = DURATION / (config.switchCount + 1);
    const switchTimers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= config.switchCount; i++) {
      const timeout = setTimeout(() => {
        if (switchCountRef.current < config.switchCount) {
          switchRule();
          switchCountRef.current++;
        }
      }, switchInterval * i);
      switchTimers.push(timeout);
    }
    
    return () => {
      clearInterval(timer);
      clearInterval(stimulusInterval);
      switchTimers.forEach(t => clearTimeout(t));
    };
  }, [phase, nextStimulus, config, switchRule, showRuleChange]);

  const handleTap = useCallback(() => {
    if (!currentStimulus || showRuleChange) return;
    
    const rt = Date.now() - statsRef.current.stimulusTime;
    statsRef.current.reactionTimes.push(rt);
    
    if (currentStimulus.isTarget) {
      statsRef.current.hits++;
      setLiveStats(ls => ({ ...ls, hits: ls.hits + 1 }));
      setFeedback('correct');
    } else {
      statsRef.current.falseAlarms++;
      setLiveStats(ls => ({ ...ls, falseAlarms: ls.falseAlarms + 1 }));
      setFeedback('wrong');
    }
    
    setCurrentStimulus(null);
    setTimeout(() => setFeedback(null), 200);
  }, [currentStimulus, showRuleChange]);

  useEffect(() => {
    if (phase === 'results') {
      const { hits, misses, falseAlarms, reactionTimes } = statsRef.current;
      const total = hits + misses;
      const accuracy = total > 0 ? hits / total : 0;
      const avgRT = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, 
        accuracy * 70 + Math.max(0, 30 - avgRT / 50) - falseAlarms * 4
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

  const renderShape = (shape: Shape, color: Color, size: number) => {
    const fill = COLOR_VALUES[color];
    switch (shape) {
      case 'circle':
        return <circle cx={size/2} cy={size/2} r={size/2 - 4} fill={fill} />;
      case 'square':
        return <rect x="4" y="4" width={size - 8} height={size - 8} fill={fill} />;
      case 'triangle':
        return <polygon points={`${size/2},4 ${size-4},${size-4} 4,${size-4}`} fill={fill} />;
    }
  };

  if (phase === 'results') {
    return (
      <DrillCompletionScreen
        title="Rule Switch"
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
        <div className="flex gap-2 mb-4">
          <svg width="40" height="40" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="#ef4444" />
          </svg>
          <span className="text-2xl">↔</span>
          <svg width="40" height="40" viewBox="0 0 48 48">
            <rect x="4" y="4" width="40" height="40" fill="#3b82f6" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Rule Switch</h2>
        <p className="text-xs text-muted-foreground mb-4">Level 2 • Cognitive Flexibility</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
          The rule will change during the game! Switch between matching <span className="text-primary font-medium">color</span> or <span className="text-primary font-medium">shape</span>.
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
        showRuleChange ? 'bg-amber-500/10' :
        feedback === 'correct' ? 'bg-green-500/5' : 
        feedback === 'wrong' ? 'bg-red-500/10' : ''
      }`}
      onClick={handleTap}
    >
      <div className="p-4 bg-background/90">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">MATCH:</span>
            <span className="text-sm font-medium text-primary">
              {currentRule === 'color' ? `Color: ${targetValue}` : `Shape: ${targetValue}`}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{Math.ceil(timeLeft / 1000)}s</span>
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

      <div className="flex-1 flex items-center justify-center relative">
        {showRuleChange ? (
          <motion.div
            className="text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-4xl mb-2">🔄</div>
            <p className="text-lg font-bold text-amber-400">RULE CHANGE!</p>
            <p className="text-sm text-foreground mt-2">
              Now match: <span className="font-bold text-primary">{currentRule === 'color' ? targetValue : targetValue}</span>
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {currentStimulus && (
              <motion.div
                key={currentStimulus.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <svg width="96" height="96" viewBox="0 0 48 48">
                  {renderShape(currentStimulus.shape, currentStimulus.color, 48)}
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Tap anywhere when stimulus matches current rule</p>
      </div>
    </motion.div>
  );
};

export default RuleSwitchFocusDrill;
