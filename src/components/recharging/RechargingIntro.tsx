import { motion } from "framer-motion";
import { Headphones } from "lucide-react";
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title */}
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
          Fast Charge
        </h1>
        
        {/* Subtitle */}
        <p className="text-sm text-white/50 leading-relaxed mb-10">
          Restore reasoning clarity after cognitive overload.
        </p>
        
        {/* Headphones recommendation */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 mb-8">
          <Headphones className="w-4 h-4 text-white/50" />
          <span className="text-xs text-white/50">For best results, use headphones</span>
        </div>
        
        {/* Duration indicator */}
        <div className="flex items-center gap-2 text-xs text-white/40 mb-8">
          <span className="px-2 py-1 rounded bg-white/5 text-white/60 font-medium">5-15 MIN</span>
          <span>•</span>
          <span>Audio only</span>
        </div>
        
        {/* Steps overview */}
        <div className="w-full space-y-2 mb-10">
          {[
            { num: 1, label: "Select program & duration" },
            { num: 2, label: "Quick cognitive check" },
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
        </div>
        
        {/* Begin button */}
        <motion.button
          onClick={onBegin}
          className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm tracking-wide border border-white/10 hover:bg-white/15 transition-colors"
          whileTap={{ scale: 0.98 }}
        >
          Start Recharging
        </motion.button>
        
        {/* Footer note */}
        <p className="mt-6 text-[10px] text-white/20 uppercase tracking-widest">
          Short-term cognitive recovery
        </p>
      </motion.div>
    </div>
  );
}
