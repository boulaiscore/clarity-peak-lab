import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { RechargingMode, RechargingAudioMode, RechargingDuration, RECHARGING_MODES } from "@/lib/recharging";
import { useFastChargeAudio } from "@/hooks/useFastChargeAudio";
import { useVoiceCueAudio } from "@/hooks/useVoiceCueAudio";
import { Slider } from "@/components/ui/slider";

interface RechargingSessionProps {
  mode: RechargingMode;
  durationMinutes: number;
  audioMode: RechargingAudioMode;
  onComplete: (durationSeconds: number) => void;
}

/**
 * Fast Charge Session
 * 
 * Audio-only cognitive reset. Screen can turn off, no interaction required.
 * Shows "You can lock your phone now." at start (on-screen for sound_only, 
 * or via INTRO voice cue for voice mode).
 */
export function RechargingSession({ mode, durationMinutes, audioMode, onComplete }: RechargingSessionProps) {
  const [elapsed, setElapsed] = useState(0);
  const [showLockMessage, setShowLockMessage] = useState(true);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [volume, setVolumeState] = useState(70); // 0-100
  const startTimeRef = useRef<number>(Date.now());
  const { start: startAudio, stop: stopAudio, setVolume } = useFastChargeAudio();
  
  const duration = durationMinutes * 60; // Convert to seconds
  const progress = Math.min((elapsed / duration) * 100, 100);

  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolumeState(newVolume);
    setVolume(newVolume / 100); // Convert to 0-1 range
  }, [setVolume]);

  // Start background audio on mount
  useEffect(() => {
    startAudio(mode, durationMinutes);
    // Set initial volume
    setVolume(volume / 100);
    
    return () => {
      stopAudio();
    };
  }, [mode, durationMinutes, startAudio, stopAudio]);

  // Voice cues (only active if audioMode === "voice")
  useVoiceCueAudio({
    mode,
    durationMinutes: durationMinutes as RechargingDuration,
    audioMode,
    isActive: true,
  });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= duration) {
          clearInterval(timer);
          // Play end tone and complete
          setTimeout(() => {
            onComplete(next);
          }, 500);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  // Hide lock message after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowLockMessage(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remaining = duration - elapsed;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#06070A]">
      {/* Volume control button */}
      <button
        onClick={() => setShowVolumeControl(!showVolumeControl)}
        className="absolute top-4 left-4 z-40 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        aria-label="Volume"
      >
        {volume === 0 ? (
          <VolumeX className="w-5 h-5 text-white/60" />
        ) : (
          <Volume2 className="w-5 h-5 text-white/60" />
        )}
      </button>

      {/* Volume slider panel */}
      {showVolumeControl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-16 left-4 z-40 bg-white/10 backdrop-blur-md rounded-xl p-4 w-48"
        >
          <div className="flex items-center gap-3">
            <VolumeX className="w-4 h-4 text-white/40 flex-shrink-0" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1"
            />
            <Volume2 className="w-4 h-4 text-white/40 flex-shrink-0" />
          </div>
          <p className="text-[10px] text-white/30 text-center mt-2">
            {volume}%
          </p>
        </motion.div>
      )}

      {/* Lock message - only visible at start */}
      {showLockMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 px-6"
        >
          <p className="text-sm text-white/50 text-center">
            You can lock your phone now.
          </p>
        </motion.div>
      )}

      {/* Central minimal focal point */}
      <div className="relative flex flex-col items-center">
        {/* Subtle ambient ring - very slow pulse */}
        <motion.div
          className="absolute w-24 h-24 rounded-full"
          style={{
            border: "1px solid rgba(255,255,255,0.03)",
          }}
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner calm indicator */}
        <motion.div
          className="w-3 h-3 rounded-full bg-white/5"
          animate={{
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Progress and time - subtle, at bottom */}
      <div className="fixed bottom-12 left-0 right-0 flex flex-col items-center gap-4 px-8">
        {/* Progress bar */}
        <div className="w-full max-w-xs h-0.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white/20 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Time remaining */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl font-mono text-white/40 tabular-nums">
            {formatTime(remaining)}
          </span>
          <span className="text-[10px] text-white/20 uppercase tracking-widest">
            remaining
          </span>
        </div>

        {/* Mode indicator - very subtle */}
        <span className="text-[10px] text-white/10 uppercase tracking-widest">
          {RECHARGING_MODES[mode].label}
        </span>
      </div>
    </div>
  );
}
