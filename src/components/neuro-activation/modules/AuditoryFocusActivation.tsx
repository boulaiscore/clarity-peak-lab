import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditoryFocusActivationProps {
  onComplete: (result: { score: number; correct: number; avgReactionTime: number }) => void;
}

const TOTAL_DURATION = 60000; // 60 seconds
const TONE_INTERVAL_MIN = 2500;
const TONE_INTERVAL_MAX = 3000;
const DEVIANT_PROBABILITY = 0.10;
const REGULAR_FREQ = 440; // Hz
const DEVIANT_FREQ = 520; // Hz (higher pitch)
const REGULAR_DURATION = 150; // ms
const DEVIANT_DURATION = 80; // ms (shorter)
const REACTION_WINDOW = 1500; // ms to respond to deviant

const AuditoryFocusActivation: React.FC<AuditoryFocusActivationProps> = ({ onComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_DURATION);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastDeviantTimeRef = useRef<number | null>(null);
  const toneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Scoring refs
  const totalDeviantsRef = useRef(0);
  const correctDetectionsRef = useRef(0);
  const missesRef = useRef(0);
  const falseAlarmsRef = useRef(0);
  const reactionTimesRef = useRef<number[]>([]);
  const awaitingResponseRef = useRef(false);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play tone using Web Audio API
  const playTone = useCallback((frequency: number, duration: number) => {
    const ctx = initAudio();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Soft envelope for premium feel
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000 + 0.05);
  }, [initAudio]);

  // Schedule next tone
  const scheduleNextTone = useCallback(() => {
    if (!isRunning) return;
    
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= TOTAL_DURATION) {
      return;
    }

    const interval = TONE_INTERVAL_MIN + Math.random() * (TONE_INTERVAL_MAX - TONE_INTERVAL_MIN);
    
    toneTimeoutRef.current = setTimeout(() => {
      if (!isRunning) return;
      
      // Check if previous deviant was missed
      if (awaitingResponseRef.current && lastDeviantTimeRef.current) {
        const timeSinceDeviant = Date.now() - lastDeviantTimeRef.current;
        if (timeSinceDeviant > REACTION_WINDOW) {
          missesRef.current++;
          awaitingResponseRef.current = false;
          lastDeviantTimeRef.current = null;
        }
      }
      
      const isDeviant = Math.random() < DEVIANT_PROBABILITY;
      
      if (isDeviant) {
        // Play deviant tone (higher pitch OR shorter duration randomly)
        const useHigherPitch = Math.random() > 0.5;
        if (useHigherPitch) {
          playTone(DEVIANT_FREQ, REGULAR_DURATION);
        } else {
          playTone(REGULAR_FREQ, DEVIANT_DURATION);
        }
        totalDeviantsRef.current++;
        lastDeviantTimeRef.current = Date.now();
        awaitingResponseRef.current = true;
      } else {
        playTone(REGULAR_FREQ, REGULAR_DURATION);
      }
      
      scheduleNextTone();
    }, interval);
  }, [isRunning, playTone]);

  // Handle tap
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isRunning) {
      // First tap starts the exercise
      setIsRunning(true);
      startTimeRef.current = Date.now();
      return;
    }

    // Get tap position for ripple
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || rect.width / 2;
      clientY = e.touches[0]?.clientY || rect.height / 2;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setRipplePosition({ x: clientX - rect.left, y: clientY - rect.top });
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);

    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    const now = Date.now();
    
    if (awaitingResponseRef.current && lastDeviantTimeRef.current) {
      const reactionTime = now - lastDeviantTimeRef.current;
      if (reactionTime <= REACTION_WINDOW) {
        // Correct detection
        correctDetectionsRef.current++;
        reactionTimesRef.current.push(reactionTime);
        awaitingResponseRef.current = false;
        lastDeviantTimeRef.current = null;
      } else {
        // Too late, count as false alarm
        falseAlarmsRef.current++;
      }
    } else {
      // No deviant pending, false alarm
      falseAlarmsRef.current++;
    }
  }, [isRunning]);

  // Start exercise
  useEffect(() => {
    if (isRunning) {
      scheduleNextTone();
      
      // Timer countdown
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, TOTAL_DURATION - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setIsRunning(false);
        }
      }, 100);
    }
    
    return () => {
      if (toneTimeoutRef.current) clearTimeout(toneTimeoutRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning, scheduleNextTone]);

  // Complete exercise
  useEffect(() => {
    if (!isRunning && startTimeRef.current > 0 && timeRemaining <= 0) {
      // Check for final missed deviant
      if (awaitingResponseRef.current) {
        missesRef.current++;
      }
      
      // Calculate final score
      const totalDeviants = totalDeviantsRef.current;
      const correctDetections = correctDetectionsRef.current;
      const falseAlarms = falseAlarmsRef.current;
      const reactionTimes = reactionTimesRef.current;
      
      // Accuracy (0-1)
      const accuracy = totalDeviants > 0 ? correctDetections / totalDeviants : 0;
      
      // False alarm penalty (0-1, where 0 = many false alarms)
      const maxExpectedTaps = totalDeviants + 5; // Allow some margin
      const falseAlarmRatio = Math.min(1, falseAlarms / maxExpectedTaps);
      const falseAlarmFactor = 1 - falseAlarmRatio * 0.5;
      
      // Reaction time factor (0-1, faster = better)
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
        : REACTION_WINDOW;
      const reactionFactor = Math.max(0, 1 - (avgReactionTime / REACTION_WINDOW));
      
      // Final score: 60% accuracy, 20% false alarm avoidance, 20% reaction speed
      const score = Math.round(
        (accuracy * 0.6 + falseAlarmFactor * 0.2 + reactionFactor * 0.2) * 100
      );
      
      onComplete({
        score: Math.max(0, Math.min(100, score)),
        correct: correctDetections,
        avgReactionTime: Math.round(avgReactionTime),
      });
    }
  }, [isRunning, timeRemaining, onComplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const progress = 1 - timeRemaining / TOTAL_DURATION;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      className="fixed inset-0 bg-[#06070A] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
      onClick={handleTap}
      onTouchStart={handleTap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Subtle pulsing background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(108,92,231,0.03) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(77,85,255,0.02) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      {/* Tap ripple effect */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: ripplePosition.x,
              top: ripplePosition.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div 
              className="w-24 h-24 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(108,92,231,0.4) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {!isRunning && startTimeRef.current === 0 ? (
          <>
            <motion.h2
              className="text-xl font-semibold text-white/90 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Auditory Focus Activation
            </motion.h2>
            <motion.p
              className="text-sm text-white/50 mb-8 max-w-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Tap only when you hear the deviant tone.
              <br />
              <span className="text-white/30 text-xs">You don't need to look at the screen.</span>
            </motion.p>
            
            <motion.div
              className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C5CE7]/20 to-[#4D55FF]/20 border border-white/5"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            
            <motion.p
              className="text-xs text-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Tap anywhere to begin
            </motion.p>
          </>
        ) : (
          <>
            <motion.h2
              className="text-lg font-medium text-white/70 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Auditory Focus Activation
            </motion.h2>
            <motion.p
              className="text-xs text-white/40 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Tap when you detect the deviant tone
            </motion.p>
            
            {/* Circular timer */}
            <motion.div
              className="relative w-28 h-28 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="2"
                />
                {/* Progress ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#timerGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(108,92,231,0.3))',
                  }}
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6C5CE7" />
                    <stop offset="100%" stopColor="#4D55FF" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-light text-white/80 tabular-nums">
                  {Math.ceil(timeRemaining / 1000)}
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">sec</span>
              </div>
              
              {/* Pulsing glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(108,92,231,0.1) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            
            <motion.p
              className="text-[10px] text-white/20 uppercase tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Listening...
            </motion.p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AuditoryFocusActivation;
