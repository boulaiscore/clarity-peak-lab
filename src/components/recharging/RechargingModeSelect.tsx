import { useState } from "react";
import { motion } from "framer-motion";
import { Battery, Brain, Lightbulb, Moon } from "lucide-react";
import { RechargingMode, RECHARGING_MODES } from "@/lib/recharging";
import { cn } from "@/lib/utils";

interface RechargingModeSelectProps {
  suggestedMode: RechargingMode;
  onSelect: (mode: RechargingMode) => void;
}

const MODE_ICONS: Record<RechargingMode, React.ReactNode> = {
  overloaded: <Battery className="w-5 h-5" />,
  ruminating: <Brain className="w-5 h-5" />,
  "pre-decision": <Lightbulb className="w-5 h-5" />,
  "end-of-day": <Moon className="w-5 h-5" />,
};

export function RechargingModeSelect({ suggestedMode, onSelect }: RechargingModeSelectProps) {
  const [selected, setSelected] = useState<RechargingMode>(suggestedMode);

  const handleContinue = () => {
    onSelect(selected);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-[#06070A]">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">
            Choose your Recharging mode
          </h2>
        </div>

        {/* Mode Options */}
        <div className="space-y-3 mb-10">
          {(Object.keys(RECHARGING_MODES) as RechargingMode[]).map((modeId, index) => {
            const mode = RECHARGING_MODES[modeId];
            const isSelected = selected === modeId;
            const isSuggested = suggestedMode === modeId;

            return (
              <motion.button
                key={modeId}
                onClick={() => setSelected(modeId)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all duration-200",
                  isSelected
                    ? "bg-white/10 border-white/30"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 transition-colors",
                    isSelected ? "text-white" : "text-white/40"
                  )}>
                    {MODE_ICONS[modeId]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        isSelected ? "text-white" : "text-white/70"
                      )}>
                        {mode.label}
                      </span>
                      {isSuggested && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-medium">
                          Suggested
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      {mode.description}
                    </p>
                  </div>
                  {/* Radio indicator */}
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors",
                    isSelected ? "border-white" : "border-white/30"
                  )}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Continue */}
        <motion.button
          onClick={handleContinue}
          className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm tracking-wide border border-white/10 hover:bg-white/15 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Session
        </motion.button>
      </motion.div>
    </div>
  );
}
