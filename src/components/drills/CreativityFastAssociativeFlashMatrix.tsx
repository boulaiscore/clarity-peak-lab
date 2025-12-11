import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
  metadata?: Record<string, any>;
}

interface CreativityFastAssociativeFlashMatrixProps {
  onComplete: (result: DrillResult) => void;
}

interface Trial {
  concept: string;
  icons: number[];
  correctIndex: number;
}

// Unique concepts with distinct symbols
const CONCEPT_DATA: { concept: string; symbol: JSX.Element; description: string }[] = [
  {
    concept: 'growth',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M20,35 L20,10" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M20,10 L12,20" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M20,10 L28,20" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="12" cy="22" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="28" cy="22" r="3" fill="currentColor" opacity="0.6" />
        <path d="M20,5 L17,10 L23,10 Z" fill="currentColor" />
      </svg>
    ),
    description: 'Upward branching tree'
  },
  {
    concept: 'tension',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M8,20 L16,20" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M24,20 L32,20" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M5,20 L10,17 L10,23 Z" fill="currentColor" />
        <path d="M35,20 L30,17 L30,23 Z" fill="currentColor" />
        <circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2,2" />
      </svg>
    ),
    description: 'Opposing forces'
  },
  {
    concept: 'harmony',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
      </svg>
    ),
    description: 'Concentric circles'
  },
  {
    concept: 'chaos',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M10,10 L18,25 L8,18 L22,12 L15,30 L30,15 L25,28 L32,22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <circle cx="12" cy="28" r="2" fill="currentColor" />
        <circle cx="30" cy="10" r="2" fill="currentColor" />
      </svg>
    ),
    description: 'Jagged zigzag'
  },
  {
    concept: 'flow',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M5,20 Q15,10 20,20 Q25,30 35,20" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M32,17 L35,20 L32,23" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    description: 'Flowing wave with arrow'
  },
  {
    concept: 'balance',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M20,8 L20,32" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8,14 L32,14" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <circle cx="8" cy="14" r="4" fill="currentColor" opacity="0.7" />
        <circle cx="32" cy="14" r="4" fill="currentColor" opacity="0.7" />
        <path d="M16,32 L24,32" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>
    ),
    description: 'Scale balance'
  },
  {
    concept: 'explosion',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="5" fill="currentColor" />
        <path d="M20,20 L20,5" stroke="currentColor" strokeWidth="2" />
        <path d="M20,20 L35,20" stroke="currentColor" strokeWidth="2" />
        <path d="M20,20 L20,35" stroke="currentColor" strokeWidth="2" />
        <path d="M20,20 L5,20" stroke="currentColor" strokeWidth="2" />
        <path d="M20,20 L30,10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20,20 L10,30" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20,20 L30,30" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20,20 L10,10" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    description: 'Radial burst'
  },
  {
    concept: 'connection',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="10" cy="10" r="4" fill="currentColor" />
        <circle cx="30" cy="10" r="4" fill="currentColor" />
        <circle cx="20" cy="30" r="4" fill="currentColor" />
        <path d="M12,12 L18,28" stroke="currentColor" strokeWidth="2" />
        <path d="M28,12 L22,28" stroke="currentColor" strokeWidth="2" />
        <path d="M14,10 L26,10" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    description: 'Connected nodes'
  },
  {
    concept: 'cycle',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M26,8 L32,12 L28,16" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    description: 'Circular arrow'
  },
  {
    concept: 'stability',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path d="M20,8 L32,32 L8,32 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="20" cy="24" r="3" fill="currentColor" />
      </svg>
    ),
    description: 'Grounded triangle'
  },
  {
    concept: 'transformation',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="6" y="14" width="10" height="10" fill="currentColor" opacity="0.5" />
        <path d="M18,19 L24,19" stroke="currentColor" strokeWidth="2" />
        <path d="M22,16 L25,19 L22,22" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="30" cy="19" r="5" fill="currentColor" />
      </svg>
    ),
    description: 'Square to circle'
  },
  {
    concept: 'isolation',
    symbol: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="6" fill="currentColor" />
        <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,3" />
      </svg>
    ),
    description: 'Dotted boundary'
  },
];

const DURATION = 30000; // 30 seconds total
const TIME_PER_TRIAL = 7000; // 7 seconds per question

const SymbolDisplay: React.FC<{ index: number; size?: number }> = ({ index, size = 40 }) => (
  <div style={{ width: size, height: size }}>
    {CONCEPT_DATA[index % CONCEPT_DATA.length].symbol}
  </div>
);

export const CreativityFastAssociativeFlashMatrix: React.FC<CreativityFastAssociativeFlashMatrixProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'intro' | 'demo' | 'active' | 'complete'>('intro');
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_TRIAL);
  const [totalTimeLeft, setTotalTimeLeft] = useState(DURATION);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  
  const statsRef = useRef({
    correct: 0,
    total: 0,
    reactionTimes: [] as number[],
  });
  
  const trialStartRef = useRef(0);
  const startTimeRef = useRef(0);

  const generateTrial = useCallback((): Trial => {
    const conceptIndex = Math.floor(Math.random() * CONCEPT_DATA.length);
    const concept = CONCEPT_DATA[conceptIndex].concept;
    
    // Generate 6 unique symbol indices with the correct one included (smaller grid)
    const icons: number[] = [];
    const correctPosition = Math.floor(Math.random() * 6);
    
    for (let i = 0; i < 6; i++) {
      if (i === correctPosition) {
        icons.push(conceptIndex);
      } else {
        let randomIcon;
        do {
          randomIcon = Math.floor(Math.random() * CONCEPT_DATA.length);
        } while (icons.includes(randomIcon) || randomIcon === conceptIndex);
        icons.push(randomIcon);
      }
    }
    
    return { concept, icons, correctIndex: correctPosition };
  }, []);

  const handleSelect = useCallback((index: number, e: React.MouseEvent) => {
    if (selectedIndex !== null) return;
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setRipple({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setTimeout(() => setRipple(null), 500);
    
    const reactionTime = Date.now() - trialStartRef.current;
    statsRef.current.reactionTimes.push(reactionTime);
    
    if (index === currentTrial?.correctIndex) {
      statsRef.current.correct++;
    }
    statsRef.current.total++;
    
    setSelectedIndex(index);
    
    setTimeout(() => {
      if (totalTimeLeft > 0) {
        const newTrial = generateTrial();
        setCurrentTrial(newTrial);
        setTrialIndex(prev => prev + 1);
        setSelectedIndex(null);
        setTimeLeft(TIME_PER_TRIAL);
        trialStartRef.current = Date.now();
      } else {
        setPhase('complete');
      }
    }, 300);
  }, [selectedIndex, currentTrial, totalTimeLeft, generateTrial]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    trialStartRef.current = Date.now();
    setCurrentTrial(generateTrial());
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTotalTimeLeft(remaining);
      
      const trialElapsed = Date.now() - trialStartRef.current;
      const trialRemaining = Math.max(0, TIME_PER_TRIAL - trialElapsed);
      setTimeLeft(trialRemaining);
      
      if (remaining <= 0) {
        setPhase('complete');
      } else if (trialRemaining <= 0 && selectedIndex === null) {
        statsRef.current.total++;
        const newTrial = generateTrial();
        setCurrentTrial(newTrial);
        setTrialIndex(prev => prev + 1);
        setTimeLeft(TIME_PER_TRIAL);
        trialStartRef.current = Date.now();
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [phase, selectedIndex, generateTrial]);

  useEffect(() => {
    if (phase === 'complete') {
      const { correct, total, reactionTimes } = statsRef.current;
      const accuracy = total > 0 ? correct / total : 0;
      const avgReactionTime = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;
      
      const accuracyScore = accuracy * 80;
      const speedBonus = avgReactionTime > 0 ? Math.max(0, 20 - (avgReactionTime / 100)) : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, accuracyScore + speedBonus)));
      
      onComplete({
        score,
        correct,
        avgReactionTime: Math.round(avgReactionTime),
        metadata: { total, trials: trialIndex + 1 },
      });
    }
  }, [phase, onComplete, trialIndex]);

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
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <SymbolDisplay index={0} size={32} />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Symbol Matching</h2>
          <p className="text-muted-foreground mb-2 text-sm">Creativity Hub • Fast Thinking</p>
          <p className="text-sm text-muted-foreground mb-8">
            A concept word will appear. Tap the symbol that best represents it.
            Trust your intuition — you have 7 seconds per word.
          </p>
          <motion.button
            className="w-full py-4 bg-purple-500 text-white rounded-xl font-medium"
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
          
          {/* Demo concept */}
          <div className="inline-block px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl mb-6">
            <h2 className="text-2xl font-semibold text-purple-400 uppercase tracking-wider">
              GROWTH
            </h2>
          </div>
          
          {/* Demo grid - 2x3 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <SymbolDisplay index={2} size={36} />
            </div>
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <SymbolDisplay index={5} size={36} />
            </div>
            <motion.div 
              className="aspect-square rounded-xl border-2 border-green-500 bg-green-500/20 flex items-center justify-center text-green-400"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <SymbolDisplay index={0} size={36} />
            </motion.div>
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <SymbolDisplay index={3} size={36} />
            </div>
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <SymbolDisplay index={8} size={36} />
            </div>
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <SymbolDisplay index={4} size={36} />
            </div>
          </div>
          
          <motion.p 
            className="text-xs text-green-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            ✓ The branching tree represents "growth" — upward expansion!
          </motion.p>
          
          <motion.button
            className="w-full py-4 bg-purple-500 text-white rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('active')}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const progress = timeLeft / TIME_PER_TRIAL;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Trial {trialIndex + 1}</span>
          <span className="text-sm text-muted-foreground">{Math.ceil(timeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={trialIndex}
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Concept word */}
            <div className="text-center mb-8">
              <motion.div
                className="inline-block px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl"
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(168, 85, 247, 0.1)',
                    '0 0 40px rgba(168, 85, 247, 0.2)',
                    '0 0 20px rgba(168, 85, 247, 0.1)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <h2 className="text-2xl font-semibold text-purple-400 uppercase tracking-wider">
                  {currentTrial?.concept}
                </h2>
              </motion.div>
              
              {/* Timer indicator */}
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden max-w-[200px] mx-auto">
                <motion.div
                  className="h-full bg-purple-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
            
            {/* 2x3 Grid */}
            <div className="grid grid-cols-3 gap-4">
              {currentTrial?.icons.map((iconIndex, i) => {
                const isSelected = selectedIndex === i;
                const isCorrect = i === currentTrial.correctIndex;
                
                return (
                  <motion.button
                    key={`${trialIndex}-${i}`}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-colors ${
                      selectedIndex !== null
                        ? isCorrect
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : isSelected
                            ? 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-border bg-card text-muted-foreground'
                        : 'border-border bg-card text-foreground hover:border-purple-500/50 hover:bg-purple-500/10'
                    }`}
                    whileHover={{ scale: selectedIndex === null ? 1.05 : 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleSelect(i, e)}
                    disabled={selectedIndex !== null}
                  >
                    <SymbolDisplay index={iconIndex} size={42} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Ripple effect */}
      <AnimatePresence>
        {ripple && (
          <motion.div
            className="fixed pointer-events-none rounded-full border-2 border-purple-500/50"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ width: 80, height: 80, x: -40, y: -40, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreativityFastAssociativeFlashMatrix;
