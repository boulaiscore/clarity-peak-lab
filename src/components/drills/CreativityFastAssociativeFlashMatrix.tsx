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

const CONCEPTS = [
  'tension', 'emergence', 'equilibrium', 'disruption', 'flow',
  'harmony', 'chaos', 'growth', 'decay', 'resonance',
  'convergence', 'divergence', 'entropy', 'synthesis', 'fragmentation'
];

// Abstract icon SVG paths
const ICON_PATHS = [
  // Upward lines
  'M20,35 L20,5 M15,15 L20,5 L25,15',
  // Spiral
  'M20,20 Q30,10 35,20 Q40,30 30,35 Q20,40 15,30',
  // Grid
  'M10,10 L30,10 M10,20 L30,20 M10,30 L30,30 M10,10 L10,30 M20,10 L20,30 M30,10 L30,30',
  // Wave
  'M5,20 Q12,10 20,20 Q28,30 35,20',
  // Circle burst
  'M20,20 m-12,0 a12,12 0 1,1 24,0 a12,12 0 1,1 -24,0 M20,5 L20,2 M20,35 L20,38 M5,20 L2,20 M35,20 L38,20',
  // Diamond
  'M20,5 L35,20 L20,35 L5,20 Z',
  // Branches
  'M20,35 L20,15 M20,15 L10,5 M20,15 L30,5',
  // Nested squares
  'M10,10 L30,10 L30,30 L10,30 Z M15,15 L25,15 L25,25 L15,25 Z',
  // Arrows out
  'M20,20 L10,10 M20,20 L30,10 M20,20 L30,30 M20,20 L10,30',
];

// Map concepts to their "correct" icon indices
const CONCEPT_ICON_MAP: Record<string, number> = {
  'tension': 0,
  'emergence': 1,
  'equilibrium': 2,
  'disruption': 8,
  'flow': 3,
  'harmony': 4,
  'chaos': 8,
  'growth': 6,
  'decay': 7,
  'resonance': 4,
  'convergence': 5,
  'divergence': 8,
  'entropy': 8,
  'synthesis': 7,
  'fragmentation': 8,
};

const DURATION = 25000; // 25 seconds total
const TIME_PER_TRIAL = 5000; // 5 seconds per question

const IconDisplay: React.FC<{ pathIndex: number; size?: number }> = ({ pathIndex, size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <path
      d={ICON_PATHS[pathIndex % ICON_PATHS.length]}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
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
    const concept = CONCEPTS[Math.floor(Math.random() * CONCEPTS.length)];
    const correctIconIndex = CONCEPT_ICON_MAP[concept] ?? Math.floor(Math.random() * ICON_PATHS.length);
    
    // Generate 9 unique icon indices with the correct one included
    const icons: number[] = [];
    const correctPosition = Math.floor(Math.random() * 9);
    
    for (let i = 0; i < 9; i++) {
      if (i === correctPosition) {
        icons.push(correctIconIndex);
      } else {
        let randomIcon;
        do {
          randomIcon = Math.floor(Math.random() * ICON_PATHS.length);
        } while (icons.includes(randomIcon) || randomIcon === correctIconIndex);
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
            <IconDisplay pathIndex={1} size={32} />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Symbol Matching</h2>
          <p className="text-muted-foreground mb-2 text-sm">Creativity Hub • Fast Thinking</p>
          <p className="text-sm text-muted-foreground mb-8">
            A concept word will appear. Tap the abstract symbol that best represents it.
            Trust your intuition — you have 5 seconds per word.
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
          
          {/* Demo grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <IconDisplay pathIndex={2} size={32} />
            </div>
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <IconDisplay pathIndex={5} size={32} />
            </div>
            <motion.div 
              className="aspect-square rounded-xl border-2 border-green-500 bg-green-500/20 flex items-center justify-center text-green-400"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <IconDisplay pathIndex={6} size={32} />
            </motion.div>
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <IconDisplay pathIndex={3} size={32} />
            </div>
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <IconDisplay pathIndex={8} size={32} />
            </div>
            <div className="aspect-square rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              <IconDisplay pathIndex={4} size={32} />
            </div>
          </div>
          
          <motion.p 
            className="text-xs text-green-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            ✓ The branching symbol represents "growth" — upward expansion!
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
          <span className="text-sm text-muted-foreground">{Math.ceil(totalTimeLeft / 1000)}s</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-500"
            style={{ width: `${(totalTimeLeft / DURATION) * 100}%` }}
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
              <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden max-w-[200px] mx-auto">
                <motion.div
                  className="h-full bg-purple-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
            
            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-3">
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
                    <IconDisplay pathIndex={iconIndex} size={36} />
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
