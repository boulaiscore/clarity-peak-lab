import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { RechargingAudioMode } from "@/lib/recharging";

interface RechargingVoiceModeSelectProps {
  onSelect: (mode: RechargingAudioMode) => void;
}

const STORAGE_KEY = "recharging_audio_mode";

/**
 * Voice Mode Selection for Fast Charge
 * 
 * Allows user to choose between:
 * - Voice + Sound: Background soundscape with voice cues at fixed intervals
 * - Sound only: Background soundscape only, no voice
 * 
 * Persists choice to localStorage for future sessions.
 */
export function RechargingVoiceModeSelect({ onSelect }: RechargingVoiceModeSelectProps) {
  const [selected, setSelected] = useState<RechargingAudioMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === "voice" || stored === "sound_only") ? stored : "sound_only";
  });

  const handleContinue = () => {
    localStorage.setItem(STORAGE_KEY, selected);
    onSelect(selected);
  };

  const options: { value: RechargingAudioMode; label: string; helper: string; icon: typeof Volume2 }[] = [
    {
      value: "voice",
      label: "Voice + Sound",
      helper: "Short neutral voice cues during the session.",
      icon: Volume2,
    },
    {
      value: "sound_only",
      label: "Sound only",
      helper: "Background sound only, no voice.",
      icon: VolumeX,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#06070A] px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Title */}
        <h1 className="text-2xl font-medium text-white text-center mb-2">
          Recharging mode
        </h1>
        <p className="text-sm text-white/50 text-center mb-8">
          Choose your audio experience
        </p>

        {/* Options */}
        <div className="space-y-3 mb-10">
          {options.map((option) => {
            const isSelected = selected === option.value;
            const Icon = option.icon;
            
            return (
              <button
                key={option.value}
                onClick={() => setSelected(option.value)}
                className={`w-full p-4 rounded-xl border transition-all duration-200 text-left ${
                  isSelected
                    ? "border-white/30 bg-white/5"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Radio indicator */}
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-white" : "border-white/30"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full bg-white"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-white/50"}`} />
                      <span className={`font-medium ${isSelected ? "text-white" : "text-white/70"}`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-sm text-white/40">
                      {option.helper}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
