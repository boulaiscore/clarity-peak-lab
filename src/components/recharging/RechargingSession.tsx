import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Headphones, Volume2 } from "lucide-react";
import { RechargingMode, RECHARGING_MODES } from "@/lib/recharging";

interface RechargingSessionProps {
  mode: RechargingMode;
  durationMinutes: number;
  onComplete: (durationSeconds: number) => void;
}

// Guidance cues at percentage intervals of session
const GUIDANCE_CUES = [
  { pct: 0, message: "Focus on the center. Allow stillness." },
  { pct: 10, message: "Let your attention settle naturally." },
  { pct: 25, message: "Notice any lingering thoughts without engaging." },
  { pct: 45, message: "Allow mental noise to pass through." },
  { pct: 65, message: "Observe your cognitive state with detachment." },
  { pct: 85, message: "Clarity emerges from stillness." },
  { pct: 95, message: "Your reasoning capacity is restoring." },
];

export function RechargingSession({ mode, durationMinutes, onComplete }: RechargingSessionProps) {
  const [elapsed, setElapsed] = useState(0);
  const [currentCue, setCurrentCue] = useState<string | null>(GUIDANCE_CUES[0].message);
  const [showHeadphonesHint, setShowHeadphonesHint] = useState(true);
  const shownCuesRef = useRef<Set<number>>(new Set([0])); // 0% already shown
  
  const duration = durationMinutes * 60; // Convert to seconds
  const progress = Math.min((elapsed / duration) * 100, 100);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= duration) {
          clearInterval(timer);
          onComplete(next);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  // Guidance cue display based on percentage
  useEffect(() => {
    const currentPct = (elapsed / duration) * 100;
    
    for (const cue of GUIDANCE_CUES) {
      if (currentPct >= cue.pct && !shownCuesRef.current.has(cue.pct)) {
        shownCuesRef.current.add(cue.pct);
        setCurrentCue(cue.message);
        // Auto-hide after 8 seconds (longer for reading comfort)
        setTimeout(() => setCurrentCue(null), 8000);
        break;
      }
    }
  }, [elapsed, duration]);

  // Hide headphones hint after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHeadphonesHint(false), 10000);
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
      {/* Headphones hint */}
      {showHeadphonesHint && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
        >
          <Headphones className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/40">Headphones recommended</span>
        </motion.div>
      )}

      {/* Central focal area */}
      <div className="relative flex flex-col items-center">
        {/* Ambient ring - very slow pulse */}
        <motion.div
          className="absolute w-48 h-48 rounded-full"
          style={{
            border: "1px solid rgba(255,255,255,0.05)",
          }}
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner calm indicator */}
        <motion.div
          className="w-6 h-6 rounded-full bg-white/10"
          animate={{
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Audio cue display */}
      <div className="h-16 flex items-center justify-center mt-16 px-6">
        {currentCue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4 text-white/30" />
            <p className="text-sm text-white/50 text-center max-w-xs">
              {currentCue}
            </p>
          </motion.div>
        )}
      </div>

      {/* Progress and time */}
      <div className="fixed bottom-12 left-0 right-0 flex flex-col items-center gap-4 px-8">
        {/* Progress bar */}
        <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white/30 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Time remaining */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-mono text-white/60 tabular-nums">
            {formatTime(remaining)}
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest">
            remaining
          </span>
        </div>

        {/* Mode indicator */}
        <span className="text-[10px] text-white/20 uppercase tracking-widest">
          {RECHARGING_MODES[mode].label}
        </span>
      </div>
    </div>
  );
}
