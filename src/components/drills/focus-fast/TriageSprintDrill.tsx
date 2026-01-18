import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { TriageSprintResults } from './TriageSprintResults';
import { Check, X, Pause, ChevronRight, AlertTriangle } from 'lucide-react';

// ============ TYPES ============
interface TriageCard {
  id: number;
  source: 'Verified' | 'Unverified';
  signal: 'Green' | 'Yellow' | 'Red';
  confidence: 'Low' | 'Medium' | 'High';
  urgent: boolean;
  load: number;
  isTarget: boolean;
  isLure: boolean;
}

interface TrialResult {
  cardId: number;
  action: 'approve' | 'reject' | 'hold' | 'timeout';
  correct: boolean;
  rtMs: number;
  isLure: boolean;
  isTarget: boolean;
}

interface RoundStats {
  hits: number;
  correctRejects: number;
  misses: number;
  falseAlarms: number;
  noResponses: number;
  streak: number;
  maxStreak: number;
  score: number;
  trials: TrialResult[];
}

interface TriageSprintDrillProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onComplete: (results: {
    score: number;
    hits: number;
    xpAwarded: number;
    hitRate: number;
    falseAlarmRate: number;
    lureErrorRate: number;
    rtMean: number;
    rtP50: number;
    rtP90: number;
    degradationSlope: number;
    isPerfect: boolean;
  }) => void;
}

// ============ CONFIGURATION ============
const DIFFICULTY_CONFIG = {
  easy: {
    cardsPerRound: 10,
    cardPaceMs: 1500,
    responseWindowMs: 1800,
    lureRate: 0.15,
    urgentRate: 0.25,
    targetPrevalence: 0.18,
    rushSpike: false,
    holdEnabled: false,
    xpPerRound: 3,
  },
  medium: {
    cardsPerRound: 12,
    cardPaceMs: 1100,
    responseWindowMs: 1300,
    lureRate: 0.22,
    urgentRate: 0.35,
    targetPrevalence: 0.14,
    rushSpike: true,
    rushSpeedMultiplier: 0.85,
    holdEnabled: false,
    xpPerRound: 5,
  },
  hard: {
    cardsPerRound: 14,
    cardPaceMs: 850,
    responseWindowMs: 1000,
    lureRate: 0.30,
    urgentRate: 0.45,
    targetPrevalence: 0.10,
    rushSpike: true,
    rushSpeedMultiplier: 0.85,
    holdEnabled: true,
    xpPerRound: 8,
  },
};

const TOTAL_ROUNDS = 5;
const ROUND_TRANSITION_MS = 1000;

// ============ SCORING ============
const SCORE_HIT = 10;
const SCORE_CORRECT_REJECT = 2;
const SCORE_MISS = -6;
const SCORE_FALSE_ALARM = -12;
const SCORE_NO_RESPONSE = -4;
const STREAK_BONUS_INTERVAL = 5;
const STREAK_BONUS = 5;
const STABILITY_BONUS = 10;
const PERFECT_XP_BONUS = 10;

// ============ COMPONENT ============
export const TriageSprintDrill: React.FC<TriageSprintDrillProps> = ({ difficulty, onComplete }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Phase management
  const [phase, setPhase] = useState<'tutorial' | 'instruction' | 'playing' | 'transition' | 'results'>('tutorial');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  
  // Card state
  const [currentCard, setCurrentCard] = useState<TriageCard | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [canRespond, setCanRespond] = useState(true);
  const [feedback, setFeedback] = useState<'hit' | 'reject' | 'miss' | 'false' | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdsUsedThisRound, setHoldsUsedThisRound] = useState(0);
  
  // Stats
  const [allRoundStats, setAllRoundStats] = useState<RoundStats[]>([]);
  const currentRoundStats = useRef<RoundStats>({
    hits: 0, correctRejects: 0, misses: 0, falseAlarms: 0, noResponses: 0,
    streak: 0, maxStreak: 0, score: 0, trials: []
  });
  
  // Timing
  const cardShownTime = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimeRef = useRef(0);
  const roundStartTime = useRef(0);

  // ============ CARD GENERATION ============
  const generateCard = useCallback((index: number): TriageCard => {
    const rand = Math.random();
    
    // Determine if target (Verified + Green)
    const isTarget = rand < config.targetPrevalence;
    
    // Determine if lure
    const isLure = !isTarget && rand < config.targetPrevalence + config.lureRate;
    
    let source: 'Verified' | 'Unverified';
    let signal: 'Green' | 'Yellow' | 'Red';
    
    if (isTarget) {
      source = 'Verified';
      signal = 'Green';
    } else if (isLure) {
      // Lure: Almost-approve cases
      if (Math.random() > 0.5) {
        source = 'Verified';
        signal = 'Yellow'; // Verified + Yellow (almost but not green)
      } else {
        source = 'Unverified';
        signal = 'Green'; // Green but unverified
      }
    } else {
      // Non-target, non-lure - never Green+Verified
      source = Math.random() > 0.5 ? 'Verified' : 'Unverified';
      // Only Yellow or Red for non-targets
      signal = Math.random() > 0.5 ? 'Yellow' : 'Red';
    }
    
    return {
      id: index,
      source,
      signal,
      confidence: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High',
      urgent: Math.random() < config.urgentRate,
      load: Math.floor(Math.random() * 100),
      isTarget,
      isLure,
    };
  }, [config]);

  // ============ ROUND MANAGEMENT ============
  const getCurrentPace = useCallback(() => {
    if (!config.rushSpike) return config.cardPaceMs;
    
    const elapsed = Date.now() - roundStartTime.current;
    const roundDuration = config.cardsPerRound * config.cardPaceMs;
    const remainingTime = roundDuration - elapsed;
    
    // Rush spike in last 5 seconds
    if (remainingTime < 5000 && 'rushSpeedMultiplier' in config) {
      return config.cardPaceMs * (config.rushSpeedMultiplier as number);
    }
    return config.cardPaceMs;
  }, [config]);

  const showNextCard = useCallback(() => {
    if (cardIndex >= config.cardsPerRound) {
      // Round complete
      setAllRoundStats(prev => [...prev, { ...currentRoundStats.current }]);
      
      if (currentRound < TOTAL_ROUNDS) {
        setPhase('transition');
        setCurrentCard(null);
        setTimeout(() => {
          setCurrentRound(r => r + 1);
          setCardIndex(0);
          setHoldsUsedThisRound(0);
          currentRoundStats.current = {
            hits: 0, correctRejects: 0, misses: 0, falseAlarms: 0, noResponses: 0,
            streak: 0, maxStreak: 0, score: 0, trials: []
          };
          roundStartTime.current = Date.now();
          setPhase('playing');
        }, ROUND_TRANSITION_MS);
      } else {
        setPhase('results');
      }
      return;
    }
    
    const card = generateCard(cardIndex);
    setCurrentCard(card);
    setCanRespond(true);
    setFeedback(null);
    cardShownTime.current = Date.now();
    
    // Set timeout for no response
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (canRespond) {
        handleTimeout(card);
      }
    }, config.responseWindowMs);
    
    setCardIndex(i => i + 1);
  }, [cardIndex, config, currentRound, generateCard, canRespond]);

  const handleTimeout = useCallback((card: TriageCard) => {
    setCanRespond(false);
    
    const stats = currentRoundStats.current;
    if (card.isTarget) {
      stats.misses++;
      stats.score += SCORE_MISS;
      setFeedback('miss');
    } else {
      stats.noResponses++;
      stats.score += SCORE_NO_RESPONSE;
    }
    stats.streak = 0;
    
    stats.trials.push({
      cardId: card.id,
      action: 'timeout',
      correct: !card.isTarget,
      rtMs: config.responseWindowMs,
      isLure: card.isLure,
      isTarget: card.isTarget,
    });
    
    setTimeout(() => {
      setFeedback(null);
      showNextCard();
    }, 200);
  }, [config.responseWindowMs, showNextCard]);

  // ============ USER ACTIONS ============
  const handleAction = useCallback((action: 'approve' | 'reject' | 'hold') => {
    if (!currentCard || !canRespond) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCanRespond(false);
    
    const rt = Date.now() - cardShownTime.current;
    const stats = currentRoundStats.current;
    
    // Handle HOLD (Hard mode only)
    if (action === 'hold') {
      if (!config.holdEnabled || holdsUsedThisRound >= 1) return;
      
      setIsHolding(true);
      setHoldsUsedThisRound(h => h + 1);
      
      stats.trials.push({
        cardId: currentCard.id,
        action: 'hold',
        correct: true, // Hold is always neutral
        rtMs: rt,
        isLure: currentCard.isLure,
        isTarget: currentCard.isTarget,
      });
      
      // Pause for 900ms then resume
      setTimeout(() => {
        setIsHolding(false);
        showNextCard();
      }, 900);
      return;
    }
    
    const isApprove = action === 'approve';
    const isCorrect = isApprove === currentCard.isTarget;
    
    if (isApprove && currentCard.isTarget) {
      // Hit
      stats.hits++;
      stats.score += SCORE_HIT;
      stats.streak++;
      if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
      if (stats.streak % STREAK_BONUS_INTERVAL === 0) {
        stats.score += STREAK_BONUS;
      }
      setFeedback('hit');
    } else if (!isApprove && !currentCard.isTarget) {
      // Correct reject
      stats.correctRejects++;
      stats.score += SCORE_CORRECT_REJECT;
      stats.streak++;
      if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
      if (stats.streak % STREAK_BONUS_INTERVAL === 0) {
        stats.score += STREAK_BONUS;
      }
      setFeedback('reject');
    } else if (!isApprove && currentCard.isTarget) {
      // Miss
      stats.misses++;
      stats.score += SCORE_MISS;
      stats.streak = 0;
      setFeedback('miss');
    } else {
      // False alarm
      stats.falseAlarms++;
      stats.score += SCORE_FALSE_ALARM;
      stats.streak = 0;
      setFeedback('false');
    }
    
    stats.trials.push({
      cardId: currentCard.id,
      action,
      correct: isCorrect,
      rtMs: rt,
      isLure: currentCard.isLure,
      isTarget: currentCard.isTarget,
    });
    
    setTimeout(() => {
      setFeedback(null);
      showNextCard();
    }, getCurrentPace() * 0.3);
  }, [currentCard, canRespond, config.holdEnabled, holdsUsedThisRound, showNextCard, getCurrentPace]);

  // ============ SWIPE HANDLING ============
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      handleAction('approve');
    } else if (info.offset.x < -threshold) {
      handleAction('reject');
    }
  }, [handleAction]);

  // ============ GAME START ============
  useEffect(() => {
    if (phase === 'playing' && cardIndex === 0 && currentCard === null) {
      roundStartTime.current = Date.now();
      showNextCard();
    }
  }, [phase, cardIndex, currentCard, showNextCard]);

  // ============ CLEANUP ============
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ============ RESULTS CALCULATION ============
  const finalResults = useMemo(() => {
    if (phase !== 'results') return null;
    
    const allTrials = allRoundStats.flatMap(r => r.trials);
    const totalHits = allRoundStats.reduce((s, r) => s + r.hits, 0);
    const totalMisses = allRoundStats.reduce((s, r) => s + r.misses, 0);
    const totalFalseAlarms = allRoundStats.reduce((s, r) => s + r.falseAlarms, 0);
    const totalCorrectRejects = allRoundStats.reduce((s, r) => s + r.correctRejects, 0);
    const totalScore = allRoundStats.reduce((s, r) => s + r.score, 0);
    
    // RT calculations
    const validRTs = allTrials.filter(t => t.action !== 'timeout' && t.action !== 'hold').map(t => t.rtMs);
    const sortedRTs = [...validRTs].sort((a, b) => a - b);
    const rtMean = validRTs.length > 0 ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length : 0;
    const rtP50 = sortedRTs.length > 0 ? sortedRTs[Math.floor(sortedRTs.length * 0.5)] : 0;
    const rtP90 = sortedRTs.length > 0 ? sortedRTs[Math.floor(sortedRTs.length * 0.9)] : 0;
    
    // Rates
    const totalTargets = allTrials.filter(t => t.isTarget).length;
    const totalNonTargets = allTrials.filter(t => !t.isTarget).length;
    const hitRate = totalTargets > 0 ? totalHits / totalTargets : 0;
    const falseAlarmRate = totalNonTargets > 0 ? totalFalseAlarms / totalNonTargets : 0;
    
    // Lure error rate
    const lureTrials = allTrials.filter(t => t.isLure);
    const lureErrors = lureTrials.filter(t => t.action === 'approve' && !t.isTarget).length;
    const lureErrorRate = lureTrials.length > 0 ? lureErrors / lureTrials.length : 0;
    
    // Degradation slope (first half vs second half performance)
    const halfIndex = Math.floor(allTrials.length / 2);
    const firstHalf = allTrials.slice(0, halfIndex);
    const secondHalf = allTrials.slice(halfIndex);
    const firstHalfAccuracy = firstHalf.filter(t => t.correct).length / Math.max(1, firstHalf.length);
    const secondHalfAccuracy = secondHalf.filter(t => t.correct).length / Math.max(1, secondHalf.length);
    const degradationSlope = firstHalfAccuracy - secondHalfAccuracy;
    
    // XP calculation
    const baseXp = TOTAL_ROUNDS * config.xpPerRound;
    const isPerfect = falseAlarmRate <= 0.05 && hitRate >= 0.85;
    const xpAwarded = baseXp + (isPerfect ? PERFECT_XP_BONUS : 0);
    
    return {
      score: totalScore,
      hits: totalHits,
      misses: totalMisses,
      falseAlarms: totalFalseAlarms,
      correctRejects: totalCorrectRejects,
      xpAwarded,
      hitRate,
      falseAlarmRate,
      lureErrorRate,
      rtMean: Math.round(rtMean),
      rtP50: Math.round(rtP50),
      rtP90: Math.round(rtP90),
      degradationSlope,
      isPerfect,
    };
  }, [phase, allRoundStats, config.xpPerRound]);

  // ============ TUTORIAL STEPS ============
  const tutorialSteps = [
    {
      title: "Il Tuo Obiettivo",
      content: "Valuta rapidamente le carte in arrivo. Devi decidere: APPROVA o RIFIUTA.",
      visual: (
        <div className="flex gap-8 items-center justify-center my-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
              <Check className="w-7 h-7 text-green-400" />
            </div>
            <span className="text-xs text-green-400">Approva →</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
              <X className="w-7 h-7 text-red-400" />
            </div>
            <span className="text-xs text-red-400">← Rifiuta</span>
          </div>
        </div>
      ),
    },
    {
      title: "La Regola d'Oro",
      content: "APPROVA solo se ENTRAMBE le condizioni sono vere:",
      visual: (
        <div className="bg-muted/30 rounded-xl p-5 my-6 border border-green-500/30">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">1</div>
              <div className="text-left">
                <p className="font-medium text-foreground">Source = <span className="text-green-400">Verified</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">2</div>
              <div className="text-left">
                <p className="font-medium text-foreground">Signal = <span className="text-green-400">Green</span></p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-sm text-muted-foreground">Tutto il resto → <span className="text-red-400 font-medium">RIFIUTA</span></p>
          </div>
        </div>
      ),
    },
    {
      title: "Esempi Pratici",
      content: "Vediamo alcuni esempi:",
      visual: (
        <div className="space-y-3 my-6">
          {/* Example 1: Approve */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-green-400 text-sm">✓ Verified</span>
              <span className="text-muted-foreground">+</span>
              <span className="px-2 py-0.5 rounded bg-green-500/30 text-green-400 text-sm">Green</span>
            </div>
            <Check className="w-5 h-5 text-green-400" />
          </div>
          {/* Example 2: Reject */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Unverified</span>
              <span className="text-muted-foreground">+</span>
              <span className="px-2 py-0.5 rounded bg-green-500/30 text-green-400 text-sm">Green</span>
            </div>
            <X className="w-5 h-5 text-red-400" />
          </div>
          {/* Example 3: Reject */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-green-400 text-sm">✓ Verified</span>
              <span className="text-muted-foreground">+</span>
              <span className="px-2 py-0.5 rounded bg-yellow-500/30 text-yellow-400 text-sm">Yellow</span>
            </div>
            <X className="w-5 h-5 text-red-400" />
          </div>
        </div>
      ),
    },
    {
      title: "Attenzione ai Distrattori!",
      content: "Il badge URGENT è una trappola. Ignoralo completamente!",
      visual: (
        <div className="my-6 space-y-4">
          <motion.div 
            className="inline-flex px-4 py-2 rounded-full bg-amber-500 text-amber-950 font-bold"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            URGENT
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Questo badge appare per distrarti.<br />
            <span className="text-foreground font-medium">Segui SOLO la regola: Verified + Green</span>
          </p>
        </div>
      ),
    },
    {
      title: "Come Giocare",
      content: "Scorri le carte o usa i pulsanti:",
      visual: (
        <div className="my-6 space-y-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <motion.div 
                className="w-16 h-24 rounded-xl bg-card border-2 border-border/50 flex items-center justify-center"
                animate={{ x: [-30, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
              >
                <X className="w-6 h-6 text-red-400" />
              </motion.div>
              <span className="text-xs text-muted-foreground">← Swipe Left</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <motion.div 
                className="w-16 h-24 rounded-xl bg-card border-2 border-border/50 flex items-center justify-center"
                animate={{ x: [0, 30] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
              >
                <Check className="w-6 h-6 text-green-400" />
              </motion.div>
              <span className="text-xs text-muted-foreground">Swipe Right →</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Oppure usa i pulsanti in basso
          </p>
        </div>
      ),
    },
  ];

  // ============ RENDER: TUTORIAL ============
  if (phase === 'tutorial') {
    const currentStep = tutorialSteps[tutorialStep];
    const isLastStep = tutorialStep === tutorialSteps.length - 1;
    
    return (
      <motion.div
        className="flex flex-col items-center justify-between min-h-[550px] p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Progress dots */}
        <div className="flex gap-2 mb-4">
          {tutorialSteps.map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === tutorialStep ? 'bg-primary' : 'bg-muted/50'
              }`}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={tutorialStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm"
            >
              <h2 className="text-2xl font-bold text-foreground mb-3">{currentStep.title}</h2>
              <p className="text-muted-foreground">{currentStep.content}</p>
              {currentStep.visual}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <div className="flex gap-4 w-full max-w-xs">
          {tutorialStep > 0 && (
            <motion.button
              className="flex-1 py-3 px-6 rounded-full border border-border/50 text-muted-foreground font-medium"
              whileTap={{ scale: 0.95 }}
              onClick={() => setTutorialStep(s => s - 1)}
            >
              Indietro
            </motion.button>
          )}
          <motion.button
            className={`flex-1 py-3 px-6 rounded-full font-semibold flex items-center justify-center gap-2 ${
              isLastStep 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/30 text-foreground border border-border/50'
            }`}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isLastStep) {
                setPhase('playing');
              } else {
                setTutorialStep(s => s + 1);
              }
            }}
          >
            {isLastStep ? 'Inizia!' : 'Avanti'}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
        
        {/* Skip option */}
        <button 
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setPhase('playing')}
        >
          Salta tutorial
        </button>
      </motion.div>
    );
  }

  // ============ RENDER: INSTRUCTION (kept as fallback) ============
  if (phase === 'instruction') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.button
          className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg"
          whileTap={{ scale: 0.95 }}
          onClick={() => setPhase('playing')}
        >
          Start Sprint
        </motion.button>
      </motion.div>
    );
  }

  // ============ RENDER: TRANSITION ============
  if (phase === 'transition') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[500px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <p className="text-3xl font-bold text-foreground">
          Round {currentRound + 1} / {TOTAL_ROUNDS}
        </p>
      </motion.div>
    );
  }

  // ============ RENDER: RESULTS ============
  if (phase === 'results' && finalResults) {
    return (
      <TriageSprintResults
        results={finalResults}
        difficulty={difficulty}
        onContinue={() => onComplete(finalResults)}
      />
    );
  }

  // ============ RENDER: PLAYING ============
  return (
    <div className="flex flex-col items-center p-4 min-h-[550px]">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4">
        <div className="text-sm font-medium">
          <span className="text-primary">Round {currentRound}</span>
          <span className="text-muted-foreground">/{TOTAL_ROUNDS}</span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-500">{currentRoundStats.current.hits} ✓</span>
          <span className="text-red-500">{currentRoundStats.current.falseAlarms} ✗</span>
        </div>
        
        {config.holdEnabled && (
          <div className="flex items-center gap-1 text-sm">
            <Pause className="w-3 h-3" />
            <span className={holdsUsedThisRound > 0 ? 'text-muted-foreground' : 'text-primary'}>
              {1 - holdsUsedThisRound}
            </span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted/30 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(cardIndex / config.cardsPerRound) * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
      
      {/* Card Area */}
      <div className="relative w-full max-w-xs h-80 flex items-center justify-center">
        {/* Hold overlay */}
        <AnimatePresence>
          {isHolding && (
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded-2xl flex items-center justify-center z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Pause className="w-12 h-12 text-primary animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Swipe indicators */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 opacity-30">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 opacity-30">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        
        {/* Card */}
        <AnimatePresence mode="wait">
          {currentCard && !isHolding && (
            <motion.div
              key={currentCard.id}
              className={`
                w-full h-64 rounded-2xl p-5 cursor-grab active:cursor-grabbing
                bg-card/80 backdrop-blur-sm border-2 shadow-2xl
                ${feedback === 'hit' ? 'border-green-500 bg-green-500/10' :
                  feedback === 'reject' ? 'border-blue-500/50' :
                  feedback === 'miss' ? 'border-red-500 bg-red-500/10' :
                  feedback === 'false' ? 'border-red-500 bg-red-500/10' :
                  'border-border/50'}
              `}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.02 }}
            >
              {/* Urgent badge */}
              <AnimatePresence>
                {currentCard.urgent && (
                  <motion.div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500 text-amber-950 text-xs font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    URGENT
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Card content */}
              <div className="flex flex-col h-full justify-between">
                {/* Source */}
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    currentCard.source === 'Verified' ? 'bg-green-500' : 'bg-muted-foreground/50'
                  }`} />
                  <span className={`text-sm font-medium ${
                    currentCard.source === 'Verified' ? 'text-green-500' : 'text-muted-foreground'
                  }`}>
                    {currentCard.source}
                  </span>
                </div>
                
                {/* Signal - Large center element */}
                <div className="flex items-center justify-center">
                  <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center font-bold text-lg
                    ${currentCard.signal === 'Green' ? 'bg-green-500/20 text-green-400 border-2 border-green-500' :
                      currentCard.signal === 'Yellow' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500' :
                      'bg-red-500/20 text-red-400 border-2 border-red-500'}
                  `}>
                    {currentCard.signal}
                  </div>
                </div>
                
                {/* Bottom row: Confidence and Load */}
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Confidence: {currentCard.confidence}</span>
                  <span className="font-mono opacity-50">Load: {currentCard.load}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              className={`absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center ${
                feedback === 'hit' ? 'bg-green-500/30' :
                feedback === 'reject' ? 'bg-blue-500/20' :
                'bg-red-500/30'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {feedback === 'hit' && <Check className="w-16 h-16 text-green-500" />}
              {feedback === 'reject' && <Check className="w-12 h-12 text-blue-400" />}
              {(feedback === 'miss' || feedback === 'false') && <X className="w-16 h-16 text-red-500" />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Action buttons (for accessibility / non-swipe) */}
      <div className="flex gap-6 mt-8">
        <motion.button
          className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAction('reject')}
          disabled={!canRespond || isHolding}
        >
          <X className="w-6 h-6 text-red-400" />
        </motion.button>
        
        {config.holdEnabled && (
          <motion.button
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              holdsUsedThisRound > 0 
                ? 'bg-muted/20 border border-muted/30' 
                : 'bg-primary/20 border border-primary/50'
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleAction('hold')}
            disabled={!canRespond || holdsUsedThisRound > 0 || isHolding}
          >
            <Pause className={`w-5 h-5 ${holdsUsedThisRound > 0 ? 'text-muted-foreground' : 'text-primary'}`} />
          </motion.button>
        )}
        
        <motion.button
          className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAction('approve')}
          disabled={!canRespond || isHolding}
        >
          <Check className="w-6 h-6 text-green-400" />
        </motion.button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-6">
        Swipe or tap • Verified + Green = Approve
      </p>
    </div>
  );
};
