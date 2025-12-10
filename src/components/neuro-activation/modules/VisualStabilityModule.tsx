import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { DriftField } from "../DriftField";
import { StepIndicator } from "../StepContainer";

interface VisualStabilityModuleProps {
  duration: number;
  onComplete: (stability: number) => void;
}

interface PeripheralSymbol {
  id: number;
  angle: number; // Position around center (in degrees)
  symbol: string;
  luminance: number; // 0.3 to 0.7
  isChanged: boolean;
}

const SYMBOLS = ["◆", "■", "▲", "●", "◇", "□"];
const SYMBOL_COUNT = 6;

export function VisualStabilityModule({ duration, onComplete }: VisualStabilityModuleProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [peripherals, setPeripherals] = useState<PeripheralSymbol[]>([]);
  const [changedSymbolId, setChangedSymbolId] = useState<number | null>(null);
  const [correctDetections, setCorrectDetections] = useState(0);
  const [missedChanges, setMissedChanges] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [totalChanges, setTotalChanges] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'miss' | 'false' | null>(null);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef(false);

  // Initialize peripheral symbols
  useEffect(() => {
    const symbols: PeripheralSymbol[] = [];
    for (let i = 0; i < SYMBOL_COUNT; i++) {
      symbols.push({
        id: i,
        angle: (360 / SYMBOL_COUNT) * i,
        symbol: SYMBOLS[i % SYMBOLS.length],
        luminance: 0.4,
        isChanged: false,
      });
    }
    setPeripherals(symbols);
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isCompletedRef.current) {
            isCompletedRef.current = true;
            // Calculate final score
            const accuracy = totalChanges > 0 
              ? Math.round((correctDetections / totalChanges) * 100)
              : 100;
            const penalizedScore = Math.max(0, accuracy - (falseAlarms * 5));
            onComplete(penalizedScore);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onComplete, correctDetections, missedChanges, falseAlarms, totalChanges]);

  // Generate random changes every 2-4 seconds
  useEffect(() => {
    const scheduleNextChange = () => {
      const delay = 2000 + Math.random() * 2000; // 2-4 seconds
      
      changeTimeoutRef.current = setTimeout(() => {
        if (timeLeft <= 1 || isCompletedRef.current) return;
        
        // Pick random symbol to change
        const symbolIndex = Math.floor(Math.random() * SYMBOL_COUNT);
        
        setPeripherals(prev => prev.map((p, i) => {
          if (i === symbolIndex) {
            // Change either luminance or symbol
            const changeType = Math.random() > 0.5 ? 'luminance' : 'symbol';
            if (changeType === 'luminance') {
              return { 
                ...p, 
                luminance: p.luminance < 0.5 ? 0.7 : 0.3, 
                isChanged: true 
              };
            } else {
              const newSymbol = SYMBOLS.filter(s => s !== p.symbol)[Math.floor(Math.random() * (SYMBOLS.length - 1))];
              return { ...p, symbol: newSymbol, isChanged: true };
            }
          }
          return { ...p, isChanged: false };
        }));
        
        setChangedSymbolId(symbolIndex);
        setTotalChanges(prev => prev + 1);
        
        // Auto-reset after 1.5s if not detected (counts as miss)
        setTimeout(() => {
          if (changedSymbolId === symbolIndex) {
            setMissedChanges(prev => prev + 1);
            setShowFeedback('miss');
            setTimeout(() => setShowFeedback(null), 300);
          }
          setChangedSymbolId(null);
          setPeripherals(prev => prev.map(p => ({ ...p, isChanged: false })));
        }, 1500);
        
        scheduleNextChange();
      }, delay);
    };
    
    if (peripherals.length > 0 && timeLeft > 2) {
      scheduleNextChange();
    }
    
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, [peripherals.length, timeLeft]);

  // Handle user tap (detected change)
  const handleCenterTap = useCallback(() => {
    if (changedSymbolId !== null) {
      // Correct detection
      setCorrectDetections(prev => prev + 1);
      setShowFeedback('correct');
      setChangedSymbolId(null);
      setPeripherals(prev => prev.map(p => ({ ...p, isChanged: false })));
    } else {
      // False alarm
      setFalseAlarms(prev => prev + 1);
      setShowFeedback('false');
    }
    setTimeout(() => setShowFeedback(null), 300);
  }, [changedSymbolId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSymbolPosition = (angle: number, radius: number = 120) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  const accuracy = totalChanges > 0 
    ? Math.round((correctDetections / totalChanges) * 100)
    : 100;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-[#06070A]">
      <DriftField particleCount={10} />
      
      {/* Header */}
      <div className="absolute top-6 left-0 right-0 px-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
            Module 1 of 4
          </span>
          <span className="text-sm font-mono text-primary">{formatTime(timeLeft)}</span>
        </div>
        <StepIndicator totalSteps={4} currentStep={0} />
      </div>
      
      {/* Title */}
      <motion.div
        className="absolute top-24 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-1">Central Lock-In Focus</h2>
        <p className="text-xs text-muted-foreground/70 max-w-[260px] mx-auto">
          Fixate on center. Tap when you detect a peripheral change.
        </p>
      </motion.div>
      
      {/* Main focus area */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ width: 280, height: 280 }}
      >
        {/* Peripheral symbols */}
        {peripherals.map((p) => {
          const pos = getSymbolPosition(p.angle);
          return (
            <motion.div
              key={p.id}
              className="absolute text-2xl select-none transition-all duration-200"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                opacity: p.luminance,
                color: p.isChanged 
                  ? 'hsl(var(--primary))' 
                  : 'hsl(var(--muted-foreground))',
                textShadow: p.isChanged ? '0 0 8px hsl(var(--primary) / 0.5)' : 'none',
              }}
              animate={{
                scale: p.isChanged ? 1.15 : 1,
              }}
              transition={{ duration: 0.15 }}
            >
              {p.symbol}
            </motion.div>
          );
        })}
        
        {/* Central fixation point - tappable */}
        <motion.button
          onClick={handleCenterTap}
          className="relative w-24 h-24 rounded-full flex items-center justify-center focus:outline-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Outer ring */}
          <div 
            className="absolute w-20 h-20 rounded-full border border-primary/20"
          />
          
          {/* Central cross */}
          <span className="text-3xl font-light text-primary/80 select-none">
            ＋
          </span>
          
          {/* Feedback flash */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                className={`absolute inset-0 rounded-full ${
                  showFeedback === 'correct' 
                    ? 'bg-emerald-500/30' 
                    : showFeedback === 'miss'
                    ? 'bg-amber-500/30'
                    : 'bg-red-500/30'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
      
      {/* Instructions hint */}
      <motion.p
        className="absolute bottom-36 text-[10px] text-muted-foreground/50 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Keep eyes on ＋ • Tap when a symbol changes
      </motion.p>
      
      {/* Stats indicator */}
      <motion.div
        className="absolute bottom-20 w-full px-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 mb-2">
          <span>Detection Accuracy</span>
          <span>{accuracy}%</span>
        </div>
        <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-muted-foreground/40">
          <span>Detected: {correctDetections}</span>
          <span>Missed: {missedChanges}</span>
          <span>False: {falseAlarms}</span>
        </div>
      </motion.div>
    </div>
  );
}
