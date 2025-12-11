import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
  metadata?: Record<string, any>;
}

interface FocusFastDynamicAttentionSplitProps {
  onComplete: (result: DrillResult) => void;
}

type Shape = 'triangle' | 'circle' | 'square' | 'diamond';
type Color = 'blue' | 'red' | 'green' | 'yellow';

interface Symbol {
  id: string;
  shape: Shape;
  color: Color;
  lane: 'left' | 'right';
  y: number;
  isTarget: boolean;
}

interface Rule {
  lane: 'left' | 'right';
  color: Color;
  shape: Shape;
}

const SHAPES: Shape[] = ['triangle', 'circle', 'square', 'diamond'];
const COLORS: Color[] = ['blue', 'red', 'green', 'yellow'];
const DURATION = 20000; // 20 seconds for assessment
const RULE_CHANGE_INTERVAL = 10000; // 10 seconds

const COLOR_MAP: Record<Color, string> = {
  blue: 'hsl(210, 100%, 60%)',
  red: 'hsl(0, 85%, 60%)',
  green: 'hsl(140, 70%, 50%)',
  yellow: 'hsl(45, 100%, 55%)',
};

const ShapeIcon: React.FC<{ shape: Shape; color: Color; size?: number }> = ({ shape, color, size = 40 }) => {
  const fill = COLOR_MAP[color];
  
  switch (shape) {
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <polygon points="20,5 35,35 5,35" fill={fill} />
        </svg>
      );
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="15" fill={fill} />
        </svg>
      );
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <rect x="7" y="7" width="26" height="26" fill={fill} />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <polygon points="20,5 35,20 20,35 5,20" fill={fill} />
        </svg>
      );
  }
};

export const FocusFastDynamicAttentionSplit: React.FC<FocusFastDynamicAttentionSplitProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'intro' | 'demo' | 'active' | 'complete'>('intro');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [ruleFlash, setRuleFlash] = useState(false);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const statsRef = useRef({
    correctHits: 0,
    falseHits: 0,
    misses: 0,
    reactionTimes: [] as number[],
    lastTargetTime: 0,
  });
  
  const symbolIdRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentRuleRef = useRef<Rule | null>(null);

  const generateRule = useCallback((): Rule => {
    return {
      lane: Math.random() > 0.5 ? 'left' : 'right',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    };
  }, []);

  const generateSymbol = useCallback((lane: 'left' | 'right', rule: Rule): Symbol => {
    const isTarget = lane === rule.lane && Math.random() > 0.7;
    const shape = isTarget ? rule.shape : SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = isTarget ? rule.color : COLORS[Math.floor(Math.random() * COLORS.length)];
    
    return {
      id: `sym-${symbolIdRef.current++}`,
      shape,
      color,
      lane,
      y: -50,
      isTarget: lane === rule.lane && shape === rule.shape && color === rule.color,
    };
  }, []);

  const handleTap = useCallback((symbol: Symbol, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    setRipples(prev => [...prev, { id: Date.now(), x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== Date.now())), 500);
    
    if (symbol.isTarget) {
      const reactionTime = Date.now() - statsRef.current.lastTargetTime;
      if (reactionTime < 3000) {
        statsRef.current.reactionTimes.push(reactionTime);
      }
      statsRef.current.correctHits++;
    } else {
      statsRef.current.falseHits++;
    }
    
    setSymbols(prev => prev.filter(s => s.id !== symbol.id));
  }, []);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    const rule = generateRule();
    setCurrentRule(rule);
    currentRuleRef.current = rule;
    
    // Timer
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timerInterval);
        setPhase('complete');
      }
    }, 100);
    
    // Rule change
    const ruleInterval = setInterval(() => {
      const newRule = generateRule();
      setCurrentRule(newRule);
      currentRuleRef.current = newRule;
      setRuleFlash(true);
      setTimeout(() => setRuleFlash(false), 500);
    }, RULE_CHANGE_INTERVAL);
    
    // Symbol generation - use ref to avoid stale closure
    const symbolInterval = setInterval(() => {
      const ruleNow = currentRuleRef.current;
      if (ruleNow) {
        const leftSymbol = generateSymbol('left', ruleNow);
        const rightSymbol = generateSymbol('right', ruleNow);
        
        if (leftSymbol.isTarget || rightSymbol.isTarget) {
          statsRef.current.lastTargetTime = Date.now();
        }
        
        setSymbols(prev => [...prev, leftSymbol, rightSymbol].slice(-20));
      }
    }, 800);
    
    return () => {
      clearInterval(timerInterval);
      clearInterval(ruleInterval);
      clearInterval(symbolInterval);
    };
  }, [phase, generateRule, generateSymbol]);

  // Move symbols down
  useEffect(() => {
    if (phase !== 'active') return;
    
    const moveInterval = setInterval(() => {
      setSymbols(prev => {
        const updated = prev.map(s => ({ ...s, y: s.y + 8 }));
        const visible = updated.filter(s => s.y < window.innerHeight);
        
        // Count misses
        const missed = updated.filter(s => s.y >= window.innerHeight && s.isTarget);
        statsRef.current.misses += missed.length;
        
        return visible;
      });
    }, 50);
    
    return () => clearInterval(moveInterval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'complete') {
      const { correctHits, falseHits, misses, reactionTimes } = statsRef.current;
      const totalTargets = correctHits + misses;
      const accuracy = totalTargets > 0 ? correctHits / totalTargets : 0;
      const falseRate = (correctHits + falseHits) > 0 ? falseHits / (correctHits + falseHits) : 0;
      
      const avgReactionTime = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;
      
      const accuracyScore = accuracy * 70;
      const speedBonus = avgReactionTime > 0 ? Math.max(0, 30 - (avgReactionTime / 50)) : 0;
      const falseHitPenalty = falseRate * 20;
      
      const score = Math.round(Math.max(0, Math.min(100, accuracyScore + speedBonus - falseHitPenalty)));
      
      onComplete({
        score,
        correct: correctHits,
        avgReactionTime: Math.round(avgReactionTime),
        metadata: { falseHits, misses, totalTargets },
      });
    }
  }, [phase, onComplete]);

  if (phase === 'intro') {
    return (
      <motion.div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary rounded-lg" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Attention Split</h2>
          <p className="text-muted-foreground mb-2 text-sm">Focus Arena • Fast Thinking</p>
          <p className="text-sm text-muted-foreground mb-8">
            Symbols stream down two lanes. The rule bar shows which shape+color to tap and in which lane. 
            Tap only matching targets. The rule changes mid-exercise.
          </p>
          <motion.button
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('demo')}
          >
            See Example
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  if (phase === 'demo') {
    return (
      <motion.div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h3 className="text-lg font-medium text-foreground mb-4">Example</h3>
          
          {/* Demo rule */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-sm text-muted-foreground">TAP:</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
              <svg width="24" height="24" viewBox="0 0 40 40">
                <rect x="7" y="7" width="26" height="26" fill="hsl(0, 85%, 60%)" />
              </svg>
              <span className="text-foreground font-medium">Red Squares in RIGHT</span>
            </div>
          </div>
          
          {/* Demo lanes */}
          <div className="flex border border-border rounded-xl overflow-hidden mb-6 h-48 relative">
            <div className="flex-1 border-r border-border/30 flex flex-col items-center pt-4">
              <span className="text-xs text-muted-foreground mb-4">LEFT</span>
              {/* Wrong target - blue circle */}
              <motion.div
                className="mb-4 opacity-50"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="15" fill="hsl(210, 100%, 60%)" />
                </svg>
              </motion.div>
              <p className="text-xs text-muted-foreground/60 px-2">Don't tap</p>
            </div>
            <div className="flex-1 flex flex-col items-center pt-4">
              <span className="text-xs text-muted-foreground mb-4">RIGHT</span>
              {/* Correct target - red square */}
              <motion.div
                className="mb-2"
                initial={{ y: -20, scale: 1 }}
                animate={{ y: 0, scale: [1, 1.1, 1] }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <rect x="7" y="7" width="26" height="26" fill="hsl(0, 85%, 60%)" />
                </svg>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center gap-1"
              >
                <span className="text-xs text-green-400">✓ Tap this!</span>
              </motion.div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-6">
            Only tap shapes that match the rule exactly (color + shape + lane).
          </p>
          
          <motion.button
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('active')}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const progress = timeLeft / DURATION;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      
      {/* Rule bar */}
      <motion.div
        className={`absolute top-0 left-0 right-0 z-20 p-4 ${ruleFlash ? 'bg-primary/20' : 'bg-background/80'}`}
        animate={{ backgroundColor: ruleFlash ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--background) / 0.8)' }}
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">TAP:</span>
          {currentRule && (
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
              <ShapeIcon shape={currentRule.shape} color={currentRule.color} size={24} />
              <span className="text-foreground font-medium capitalize">
                {currentRule.color} {currentRule.shape}s in {currentRule.lane.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Timer */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '100%' }}
            animate={{ width: `${progress * 100}%` }}
          />
        </div>
      </motion.div>
      
      {/* Lanes */}
      <div className="absolute inset-0 pt-24 flex">
        {/* Left lane */}
        <div className="flex-1 border-r border-border/30 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/50 py-2">
            LEFT
          </div>
          <AnimatePresence>
            {symbols.filter(s => s.lane === 'left').map(symbol => (
              <motion.div
                key={symbol.id}
                className="absolute left-1/2 -translate-x-1/2 cursor-pointer"
                style={{ top: symbol.y }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={(e) => handleTap(symbol, e)}
                onTouchStart={(e) => handleTap(symbol, e)}
                whileTap={{ scale: 0.8 }}
              >
                <ShapeIcon shape={symbol.shape} color={symbol.color} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Right lane */}
        <div className="flex-1 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/50 py-2">
            RIGHT
          </div>
          <AnimatePresence>
            {symbols.filter(s => s.lane === 'right').map(symbol => (
              <motion.div
                key={symbol.id}
                className="absolute left-1/2 -translate-x-1/2 cursor-pointer"
                style={{ top: symbol.y }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={(e) => handleTap(symbol, e)}
                onTouchStart={(e) => handleTap(symbol, e)}
                whileTap={{ scale: 0.8 }}
              >
                <ShapeIcon shape={symbol.shape} color={symbol.color} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Ripples */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="fixed pointer-events-none rounded-full border-2 border-primary/50"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ width: 100, height: 100, x: -50, y: -50, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FocusFastDynamicAttentionSplit;
