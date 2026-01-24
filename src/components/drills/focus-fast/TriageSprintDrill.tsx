import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { TriageSprintResults } from './TriageSprintResults';
import { Check, X } from 'lucide-react';
import { GameExitButton } from "@/components/games/GameExitButton";

// ============ TYPES ============
interface TriageCard {
  id: number;
  source: 'Verified' | 'Unverified';
  signal: 'Green' | 'Yellow' | 'Red';
  urgent: boolean;
  load: number;
  isTarget: boolean;
  isLure: boolean;
}

interface TrialResult {
  cardId: number;
  roundIndex: number;
  action: 'approve' | 'reject' | 'timeout';
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
  onExit?: () => void;
}

// ============ CONFIGURATION ============
// 3 rounds with progression
const TOTAL_ROUNDS = 3;
const ROUND_TRANSITION_MS = 2000;

// Round-specific configs
const ROUND_CONFIG = {
  1: { durationMs: 20000, label: 'LOCK THE RULE', urgentMultiplier: 0.5, lureMultiplier: 0.5, paceMultiplier: 1.0 },
  2: { durationMs: 25000, label: 'IGNORE THE NOISE', urgentMultiplier: 1.2, lureMultiplier: 1.0, paceMultiplier: 0.95 },
  3: { durationMs: 30000, label: 'DECIDE UNDER PRESSURE', urgentMultiplier: 1.5, lureMultiplier: 1.2, paceMultiplier: 0.90, rushFinal: true },
} as const;

// v1.5: XP imported from centralized config
import { GAME_XP_BY_DIFFICULTY, calculateGameXP } from "@/lib/trainingPlans";

const DIFFICULTY_CONFIG = {
  easy: {
    cardPaceMs: 1500,
    responseWindowMs: 2000,
    lureRate: 0.15,
    urgentRate: 0.25,
    targetPrevalence: 0.30,
  },
  medium: {
    cardPaceMs: 1200,
    responseWindowMs: 1500,
    lureRate: 0.22,
    urgentRate: 0.35,
    targetPrevalence: 0.25,
  },
  hard: {
    cardPaceMs: 900,
    responseWindowMs: 1200,
    lureRate: 0.30,
    urgentRate: 0.45,
    targetPrevalence: 0.20,
  },
};

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
export const TriageSprintDrill: React.FC<TriageSprintDrillProps> = ({ difficulty, onComplete, onExit }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Phase management
  const [phase, setPhase] = useState<'instruction' | 'playing' | 'round_complete' | 'transition' | 'results'>('instruction');
  const [currentRound, setCurrentRound] = useState(1);
  
  // Card state
  const [currentCard, setCurrentCard] = useState<TriageCard | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [canRespond, setCanRespond] = useState(true);
  const [feedback, setFeedback] = useState<'hit' | 'reject' | 'miss' | 'false' | null>(null);
  
  // Round timing
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(0);
  const [isRushPhase, setIsRushPhase] = useState(false);
  
  // Stats
  const [allRoundStats, setAllRoundStats] = useState<RoundStats[]>([]);
  const currentRoundStats = useRef<RoundStats>({
    hits: 0, correctRejects: 0, misses: 0, falseAlarms: 0, noResponses: 0,
    streak: 0, maxStreak: 0, score: 0, trials: []
  });
  
  // Timing refs
  const cardShownTime = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTime = useRef(0);
  const cardCounter = useRef(0);

  // Get current round config
  const roundConfig = ROUND_CONFIG[currentRound as 1 | 2 | 3];

  // ============ CARD GENERATION ============
  const generateCard = useCallback((): TriageCard => {
    const rand = Math.random();
    const lureRate = config.lureRate * roundConfig.lureMultiplier;
    const urgentRate = config.urgentRate * roundConfig.urgentMultiplier;
    
    // In rush phase (final 8-10s of round 3), slightly reduce target prevalence
    const targetPrevalence = isRushPhase ? config.targetPrevalence * 0.8 : config.targetPrevalence;
    
    const isTarget = rand < targetPrevalence;
    const isLure = !isTarget && rand < targetPrevalence + lureRate;
    
    let source: 'Verified' | 'Unverified';
    let signal: 'Green' | 'Yellow' | 'Red';
    
    if (isTarget) {
      source = 'Verified';
      signal = 'Green';
    } else if (isLure) {
      if (Math.random() > 0.5) {
        source = 'Verified';
        signal = 'Yellow';
      } else {
        source = 'Unverified';
        signal = 'Green';
      }
    } else {
      source = Math.random() > 0.5 ? 'Verified' : 'Unverified';
      signal = Math.random() > 0.5 ? 'Yellow' : 'Red';
    }
    
    cardCounter.current++;
    
    return {
      id: cardCounter.current,
      source,
      signal,
      urgent: Math.random() < Math.min(urgentRate, 0.6),
      load: Math.floor(Math.random() * 100),
      isTarget,
      isLure,
    };
  }, [config, roundConfig, isRushPhase]);

  // ============ PACE CALCULATION ============
  const getCurrentPace = useCallback(() => {
    let pace = config.cardPaceMs * roundConfig.paceMultiplier;
    
    // Rush phase in round 3 - 15% faster
    if (isRushPhase && currentRound === 3) {
      pace *= 0.85;
    }
    
    return Math.max(400, pace); // Minimum 400ms
  }, [config.cardPaceMs, roundConfig.paceMultiplier, isRushPhase, currentRound]);

  // ============ ROUND TIMER ============
  useEffect(() => {
    if (phase !== 'playing') return;
    
    const duration = roundConfig.durationMs;
    roundStartTime.current = Date.now();
    setRoundTimeRemaining(duration);
    setIsRushPhase(false);
    
    // Update timer every 100ms
    const interval = setInterval(() => {
      const elapsed = Date.now() - roundStartTime.current;
      const remaining = Math.max(0, duration - elapsed);
      setRoundTimeRemaining(remaining);
      
      // Check for rush phase (last 8-10s of round 3)
      if (currentRound === 3 && remaining < 10000 && !isRushPhase) {
        setIsRushPhase(true);
      }
      
      // Round complete
      if (remaining <= 0) {
        clearInterval(interval);
        endRound();
      }
    }, 100);
    
    roundTimerRef.current = interval as unknown as NodeJS.Timeout;
    
    return () => {
      clearInterval(interval);
    };
  }, [phase, currentRound, roundConfig.durationMs]);

  // ============ END ROUND ============
  const endRound = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Save round stats
    const stats = { ...currentRoundStats.current };
    
    // Stability bonus for round 3 if no degradation
    if (currentRound === 3 && allRoundStats.length >= 1) {
      const round1Accuracy = allRoundStats[0].trials.filter(t => t.correct).length / Math.max(1, allRoundStats[0].trials.length);
      const round3Accuracy = stats.trials.filter(t => t.correct).length / Math.max(1, stats.trials.length);
      if (round3Accuracy >= round1Accuracy * 0.9) {
        stats.score += STABILITY_BONUS;
      }
    }
    
    setAllRoundStats(prev => [...prev, stats]);
    setCurrentCard(null);
    setPhase('round_complete');
  }, [currentRound, allRoundStats]);

  // ============ NEXT ROUND / RESULTS ============
  const proceedFromRoundComplete = useCallback(() => {
    if (currentRound < TOTAL_ROUNDS) {
      setPhase('transition');
      setTimeout(() => {
        setCurrentRound(r => r + 1);
        setCardIndex(0);
        currentRoundStats.current = {
          hits: 0, correctRejects: 0, misses: 0, falseAlarms: 0, noResponses: 0,
          streak: 0, maxStreak: 0, score: 0, trials: []
        };
        setPhase('playing');
      }, ROUND_TRANSITION_MS);
    } else {
      setPhase('results');
    }
  }, [currentRound]);

  // Auto-proceed from round_complete after showing message
  useEffect(() => {
    if (phase === 'round_complete') {
      const timer = setTimeout(proceedFromRoundComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, proceedFromRoundComplete]);

  // ============ SHOW NEXT CARD ============
  const showNextCard = useCallback(() => {
    // Check if round time has ended
    if (roundTimeRemaining <= 0) return;
    
    const card = generateCard();
    setCurrentCard(card);
    setCanRespond(true);
    setFeedback(null);
    cardShownTime.current = Date.now();
    setCardIndex(i => i + 1);
    
    // Set timeout for no response
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const responseWindow = config.responseWindowMs * roundConfig.paceMultiplier;
    timeoutRef.current = setTimeout(() => {
      handleTimeout(card);
    }, responseWindow);
  }, [generateCard, config.responseWindowMs, roundConfig.paceMultiplier, roundTimeRemaining]);

  const handleTimeout = useCallback((card: TriageCard) => {
    if (!canRespond) return;
    setCanRespond(false);
    
    const stats = currentRoundStats.current;
    if (card.isTarget) {
      // Missing a target is always penalized
      stats.misses++;
      stats.score += SCORE_MISS;
      stats.streak = 0;
      setFeedback('miss');
    } else {
      // Non-target timeout: no penalty in Round 1, light penalty in Round 2-3
      stats.noResponses++;
      const timeoutPenalty = currentRound === 1 ? 0 : -2;
      stats.score += timeoutPenalty;
      // Don't break streak for non-target timeout, don't show negative feedback
    }
    
    stats.trials.push({
      cardId: card.id,
      roundIndex: currentRound,
      action: 'timeout',
      correct: !card.isTarget,
      rtMs: config.responseWindowMs,
      isLure: card.isLure,
      isTarget: card.isTarget,
    });
    
    setTimeout(() => {
      setFeedback(null);
      if (roundTimeRemaining > 0) {
        showNextCard();
      }
    }, 150);
  }, [canRespond, config.responseWindowMs, currentRound, roundTimeRemaining, showNextCard]);

  // ============ USER ACTIONS ============
  const handleAction = useCallback((action: 'approve' | 'reject') => {
    if (!currentCard || !canRespond) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCanRespond(false);
    
    const rt = Date.now() - cardShownTime.current;
    const stats = currentRoundStats.current;
    
    const isApprove = action === 'approve';
    const isCorrect = isApprove === currentCard.isTarget;
    
    if (isApprove && currentCard.isTarget) {
      stats.hits++;
      stats.score += SCORE_HIT;
      stats.streak++;
      if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
      if (stats.streak % STREAK_BONUS_INTERVAL === 0) {
        stats.score += STREAK_BONUS;
      }
      setFeedback('hit');
    } else if (!isApprove && !currentCard.isTarget) {
      stats.correctRejects++;
      stats.score += SCORE_CORRECT_REJECT;
      stats.streak++;
      if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
      if (stats.streak % STREAK_BONUS_INTERVAL === 0) {
        stats.score += STREAK_BONUS;
      }
      setFeedback('reject');
    } else if (!isApprove && currentCard.isTarget) {
      stats.misses++;
      stats.score += SCORE_MISS;
      stats.streak = 0;
      setFeedback('miss');
    } else {
      stats.falseAlarms++;
      stats.score += SCORE_FALSE_ALARM;
      stats.streak = 0;
      setFeedback('false');
    }
    
    stats.trials.push({
      cardId: currentCard.id,
      roundIndex: currentRound,
      action,
      correct: isCorrect,
      rtMs: rt,
      isLure: currentCard.isLure,
      isTarget: currentCard.isTarget,
    });
    
    setTimeout(() => {
      setFeedback(null);
      if (roundTimeRemaining > 0) {
        showNextCard();
      }
    }, getCurrentPace() * 0.25);
  }, [currentCard, canRespond, currentRound, roundTimeRemaining, showNextCard, getCurrentPace]);

  // ============ SWIPE HANDLING ============
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
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
      setTimeout(() => showNextCard(), 300);
    }
  }, [phase, cardIndex, currentCard, showNextCard]);

  // ============ CLEANUP ============
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current as unknown as number);
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
    const validRTs = allTrials.filter(t => t.action !== 'timeout').map(t => t.rtMs);
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
    
    // Degradation slope (Round 1 vs Round 3)
    const round1Trials = allRoundStats[0]?.trials || [];
    const round3Trials = allRoundStats[2]?.trials || [];
    const round1Accuracy = round1Trials.filter(t => t.correct).length / Math.max(1, round1Trials.length);
    const round3Accuracy = round3Trials.filter(t => t.correct).length / Math.max(1, round3Trials.length);
    const degradationSlope = round1Accuracy - round3Accuracy;
    
    // XP calculation - v1.5: Using centralized XP
    const isPerfect = falseAlarmRate <= 0.05 && hitRate >= 0.85;
    const xpAwarded = calculateGameXP(difficulty, isPerfect);
    
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
  }, [phase, allRoundStats, difficulty]);

  // ============ RENDER: INSTRUCTION ============
  if (phase === 'instruction') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-3">Triage Sprint</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          3 rounds of rapid decisions. <strong>Swipe right to APPROVE</strong> only when: 
        </p>
        
        <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-border/50">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Source = Verified</p>
              <p className="text-sm text-muted-foreground">AND Signal = Green</p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Ignore the <span className="text-amber-500 font-medium">URGENT</span> badge — it's a distractor!
        </p>
        
        <div className="flex gap-6 text-xs text-muted-foreground mb-6">
          <span>← <span className="text-red-400">Reject</span></span>
          <span><span className="text-green-400">Approve</span> →</span>
        </div>
        
        {/* Round preview */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((r) => (
            <div key={r} className="w-16 h-1.5 rounded-full bg-muted/30" />
          ))}
        </div>
        
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

  // ============ RENDER: ROUND COMPLETE ============
  if (phase === 'round_complete') {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[500px]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="text-center"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          <p className="text-xl font-bold text-primary mb-2">ROUND COMPLETE</p>
          <p className="text-muted-foreground text-sm">
            {currentRound < 3 ? 'Get ready for the next round...' : 'Calculating results...'}
          </p>
        </motion.div>
        
        {/* Progress bar */}
        <div className="flex gap-2 mt-8">
          {[1, 2, 3].map((r) => (
            <motion.div 
              key={r} 
              className={`w-16 h-2 rounded-full ${r <= currentRound ? 'bg-primary' : 'bg-muted/30'}`}
              initial={r === currentRound ? { scaleX: 0 } : {}}
              animate={r === currentRound ? { scaleX: 1 } : {}}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // ============ RENDER: TRANSITION ============
  if (phase === 'transition') {
    const nextRound = currentRound + 1;
    const nextLabel = ROUND_CONFIG[nextRound as 1 | 2 | 3]?.label || '';
    
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[500px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
          {nextRound === 3 ? 'FINAL ROUND' : `ROUND ${nextRound} / 3`}
        </p>
        <p className="text-2xl font-bold text-foreground mb-4">{nextLabel}</p>
        
        {/* Progress bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((r) => (
            <div 
              key={r} 
              className={`w-16 h-2 rounded-full ${r < nextRound ? 'bg-primary' : 'bg-muted/30'}`}
            />
          ))}
        </div>
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
  const timeProgress = 1 - (roundTimeRemaining / roundConfig.durationMs);
  
  return (
    <div className="flex flex-col items-center p-4 min-h-[550px] relative">
      {/* Exit button */}
      {onExit && <GameExitButton onExit={onExit} />}
      {/* Header */}
      <div className="w-full mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {currentRound === 3 ? 'FINAL ROUND' : `ROUND ${currentRound} / 3`}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {roundConfig.label}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-500 font-medium">{currentRoundStats.current.hits}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-500 font-medium">{currentRoundStats.current.falseAlarms}</span>
          </div>
        </div>
        
        {/* Round progress bar */}
        <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${isRushPhase ? 'bg-amber-500' : 'bg-primary'}`}
            style={{ width: `${timeProgress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        {/* Rush indicator */}
        {isRushPhase && (
          <motion.p 
            className="text-xs text-amber-500 text-center mt-1 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            RUSH MODE
          </motion.p>
        )}
      </div>
      
      {/* Round progress dots */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((r) => (
          <div 
            key={r} 
            className={`w-3 h-3 rounded-full ${
              r < currentRound ? 'bg-primary' : 
              r === currentRound ? 'bg-primary/50 ring-2 ring-primary/30' : 
              'bg-muted/30'
            }`}
          />
        ))}
      </div>
      
      {/* Card Area */}
      <div className="relative w-full max-w-xs h-72 flex items-center justify-center">
        {/* Swipe indicators */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 opacity-30">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 opacity-30">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        
        {/* Card */}
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id}
              className={`
                w-full h-56 rounded-2xl p-5 cursor-grab active:cursor-grabbing
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
                
                {/* Load number (noise) */}
                <div className="text-right">
                  <span className="font-mono text-xs text-muted-foreground/40">
                    #{currentCard.load.toString().padStart(3, '0')}
                  </span>
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
      
      {/* Action buttons */}
      <div className="flex gap-8 mt-6">
        <motion.button
          className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAction('reject')}
          disabled={!canRespond}
        >
          <X className="w-6 h-6 text-red-400" />
        </motion.button>
        
        <motion.button
          className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAction('approve')}
          disabled={!canRespond}
        >
          <Check className="w-6 h-6 text-green-400" />
        </motion.button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-4">
        Verified + Green = Approve
      </p>
    </div>
  );
};
