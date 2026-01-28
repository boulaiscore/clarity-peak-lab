import { motion } from "framer-motion";

interface RechargingIntroProps {
  onBegin: () => void;
}

/**
 * Fast Charge Intro
 * Entry point for audio-only cognitive reset
 */
export function RechargingIntro({ onBegin }: RechargingIntroProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-[#06070A]">
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Title */}
        <motion.h1 
          className="text-2xl font-semibold tracking-tight text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Fast Charge
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          className="text-sm text-white/50 leading-relaxed mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Restore reasoning clarity after cognitive overload.
        </motion.p>
        
        {/* Duration indicator */}
        <motion.div 
          className="flex items-center gap-2 text-xs text-white/40 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="px-2 py-1 rounded bg-white/5 text-white/60 font-medium">5-15 MIN</span>
          <span>•</span>
          <span>Audio only</span>
        </motion.div>
        
        {/* Steps overview */}
        <motion.div 
          className="w-full space-y-2 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {[
            { num: 1, label: "Quick cognitive check" },
            { num: 2, label: "Select program & duration" },
            { num: 3, label: "Audio session (screen off OK)" },
            { num: 4, label: "Post-session assessment" },
          ].map((step) => (
            <div key={step.num} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-[10px] text-white/40">{step.num}</span>
              </div>
              <span className="text-xs text-white/40">{step.label}</span>
            </div>
          ))}
        </motion.div>
        
        {/* Begin button */}
        <motion.button
          onClick={onBegin}
          className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm tracking-wide border border-white/10 hover:bg-white/15 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Recharging
        </motion.button>
        
        {/* Footer note */}
        <motion.p
          className="mt-6 text-[10px] text-white/20 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Short-term cognitive recovery
        </motion.p>
      </motion.div>
    </div>
  );
}
