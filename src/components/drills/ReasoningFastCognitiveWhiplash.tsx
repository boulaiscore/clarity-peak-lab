import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrillResult {
  score: number;
  correct: number;
  avgReactionTime: number;
  metadata?: Record<string, any>;
}

interface ReasoningFastCognitiveWhiplashProps {
  onComplete: (result: DrillResult) => void;
}

type Classification = 'causal' | 'correlational' | 'noise';

interface Scenario {
  text: string;
  correct: Classification;
  difficulty: number;
}

const SCENARIOS: Scenario[] = [
  { text: "Sales increased 40% after we doubled our ad spend.", correct: 'causal', difficulty: 1 },
  { text: "Website crashes correlate with high user traffic.", correct: 'correlational', difficulty: 1 },
  { text: "One customer complained about the font size.", correct: 'noise', difficulty: 1 },
  { text: "Removing the checkout step reduced cart abandonment by 25%.", correct: 'causal', difficulty: 2 },
  { text: "Our best month coincided with a competitor's outage.", correct: 'correlational', difficulty: 3 },
  { text: "Two users from the same country signed up yesterday.", correct: 'noise', difficulty: 2 },
  { text: "Reducing prices by 10% drove a 30% increase in volume.", correct: 'causal', difficulty: 2 },
  { text: "Users who complete onboarding have 5x higher retention.", correct: 'correlational', difficulty: 3 },
  { text: "A single server error occurred at 3am.", correct: 'noise', difficulty: 1 },
  { text: "Implementing caching reduced load times by 60%.", correct: 'causal', difficulty: 2 },
];

const DURATION = 25000; // 25 seconds total
const TIME_PER_ITEM = 10000; // 10 seconds per question

export const ReasoningFastCognitiveWhiplash: React.FC<ReasoningFastCognitiveWhiplashProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'intro' | 'demo' | 'active' | 'complete'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemTimeLeft, setItemTimeLeft] = useState(TIME_PER_ITEM);
  const [totalTimeLeft, setTotalTimeLeft] = useState(DURATION);
  const [selectedAnswer, setSelectedAnswer] = useState<Classification | null>(null);
  const [shuffledScenarios, setShuffledScenarios] = useState<Scenario[]>([]);
  
  const statsRef = useRef({
    correct: 0,
    total: 0,
    reactionTimes: [] as number[],
  });
  
  const itemStartRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const shuffled = [...SCENARIOS].sort(() => Math.random() - 0.5);
    setShuffledScenarios(shuffled);
  }, []);

  const handleSelect = useCallback((answer: Classification) => {
    if (selectedAnswer !== null) return;
    
    const reactionTime = Date.now() - itemStartRef.current;
    statsRef.current.reactionTimes.push(reactionTime);
    
    const currentScenario = shuffledScenarios[currentIndex];
    if (answer === currentScenario.correct) {
      statsRef.current.correct++;
    }
    statsRef.current.total++;
    
    setSelectedAnswer(answer);
    
    setTimeout(() => {
      if (currentIndex < shuffledScenarios.length - 1 && totalTimeLeft > 0) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setItemTimeLeft(TIME_PER_ITEM);
        itemStartRef.current = Date.now();
      } else {
        setPhase('complete');
      }
    }, 300);
  }, [selectedAnswer, currentIndex, shuffledScenarios, totalTimeLeft]);

  useEffect(() => {
    if (phase !== 'active') return;
    
    startTimeRef.current = Date.now();
    itemStartRef.current = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTotalTimeLeft(remaining);
      
      const itemElapsed = Date.now() - itemStartRef.current;
      const itemRemaining = Math.max(0, TIME_PER_ITEM - itemElapsed);
      setItemTimeLeft(itemRemaining);
      
      if (remaining <= 0) {
        setPhase('complete');
      } else if (itemRemaining <= 0 && selectedAnswer === null) {
        // Timeout - count as wrong
        statsRef.current.total++;
        
        if (currentIndex < shuffledScenarios.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setItemTimeLeft(TIME_PER_ITEM);
          itemStartRef.current = Date.now();
        } else {
          setPhase('complete');
        }
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [phase, currentIndex, selectedAnswer, shuffledScenarios.length]);

  useEffect(() => {
    if (phase === 'complete') {
      const { correct, total, reactionTimes } = statsRef.current;
      const accuracy = total > 0 ? correct / total : 0;
      const avgReactionTime = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;
      
      const accuracyScore = accuracy * 85;
      const speedBonus = avgReactionTime > 0 ? Math.max(0, 15 - (avgReactionTime / 200)) : 0;
      
      const score = Math.round(Math.max(0, Math.min(100, accuracyScore + speedBonus)));
      
      onComplete({
        score,
        correct,
        avgReactionTime: Math.round(avgReactionTime),
        metadata: { total, accuracy: Math.round(accuracy * 100) },
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
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">Causal Classification</h2>
          <p className="text-muted-foreground mb-2 text-sm">Critical Reasoning • Fast Thinking</p>
          <p className="text-sm text-muted-foreground mb-8">
            Read each scenario and classify it as: <strong>Causal</strong> (direct cause), <strong>Correlational</strong> (linked but not causal), or <strong>Noise</strong> (irrelevant).
            You have 6 seconds per question.
          </p>
          <motion.button
            className="w-full py-4 bg-amber-500 text-black rounded-xl font-medium"
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
          
          {/* Demo scenario */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <p className="text-foreground leading-relaxed">
              "Adding a checkout button reduced cart abandonment by 30%."
            </p>
          </div>
          
          {/* Demo options */}
          <div className="space-y-3 mb-6">
            <motion.div
              className="w-full py-3 px-4 rounded-xl bg-green-500/20 text-green-400 border border-green-500/50 flex items-center justify-between"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span>CAUSAL</span>
              <span className="text-xs">✓ Direct cause and effect</span>
            </motion.div>
            <div className="w-full py-3 px-4 rounded-xl bg-muted/50 text-muted-foreground border border-transparent">
              CORRELATIONAL
            </div>
            <div className="w-full py-3 px-4 rounded-xl bg-muted/50 text-muted-foreground border border-transparent">
              NOISE / INSUFFICIENT
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-6">
            <strong>CAUSAL</strong> = direct cause → effect. <strong>CORRELATIONAL</strong> = linked but not proven cause. <strong>NOISE</strong> = irrelevant data.
          </p>
          
          <motion.button
            className="w-full py-4 bg-amber-500 text-black rounded-xl font-medium"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPhase('active')}
          >
            Start Exercise
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const currentScenario = shuffledScenarios[currentIndex];
  const itemProgress = itemTimeLeft / TIME_PER_ITEM;
  const totalProgress = totalTimeLeft / DURATION;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {shuffledScenarios.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.ceil(itemTimeLeft / 1000)}s
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            style={{ width: `${itemProgress * 100}%` }}
          />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Scenario card with timer ring */}
            <div className="relative mb-8">
              <div className="absolute -inset-4 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="95"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="95"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 95}
                    strokeDashoffset={2 * Math.PI * 95 * (1 - itemProgress)}
                    transform="rotate(-90 100 100)"
                  />
                </svg>
              </div>
              
              <div className="relative bg-card border border-border rounded-2xl p-6 min-h-[120px] flex items-center justify-center">
                <p className="text-lg text-foreground text-center leading-relaxed">
                  "{currentScenario?.text}"
                </p>
              </div>
            </div>
            
            {/* Options */}
            <div className="space-y-3">
              {(['causal', 'correlational', 'noise'] as Classification[]).map((option) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = currentScenario?.correct === option;
                
                return (
                  <motion.button
                    key={option}
                    className={`w-full py-4 px-6 rounded-xl font-medium transition-colors ${
                      selectedAnswer !== null
                        ? isCorrect
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : isSelected
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                            : 'bg-muted/50 text-muted-foreground border border-transparent'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(option)}
                    disabled={selectedAnswer !== null}
                  >
                    {option === 'causal' && 'CAUSAL'}
                    {option === 'correlational' && 'CORRELATIONAL'}
                    {option === 'noise' && 'NOISE / INSUFFICIENT'}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReasoningFastCognitiveWhiplash;
