import { useState } from "react";
import { Battery, Brain, Lightbulb, Moon, Clock } from "lucide-react";
import { RechargingMode, RECHARGING_MODES } from "@/lib/recharging";
import { cn } from "@/lib/utils";

export type RechargingIntensity = 5 | 10 | 15;

interface RechargingModeSelectProps {
  onSelect: (mode: RechargingMode, intensity: RechargingIntensity) => void;
}

const MODE_ICONS: Record<RechargingMode, React.ReactNode> = {
  overloaded: <Battery className="w-5 h-5" />,
  ruminating: <Brain className="w-5 h-5" />,
  "pre-decision": <Lightbulb className="w-5 h-5" />,
  "end-of-day": <Moon className="w-5 h-5" />,
};

// Updated helper text per spec
const MODE_HELPERS: Record<RechargingMode, string> = {
  overloaded: "For moments of cognitive saturation.",
  ruminating: "To interrupt repetitive thinking.",
  "pre-decision": "Before important choices.",
  "end-of-day": "To mentally close the day.",
};

const INTENSITIES: { value: RechargingIntensity; label: string }[] = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
];

export function RechargingModeSelect({ onSelect }: RechargingModeSelectProps) {
  const [selectedMode, setSelectedMode] = useState<RechargingMode>("overloaded");
  const [selectedIntensity, setSelectedIntensity] = useState<RechargingIntensity>(10);

  const handleContinue = () => {
    onSelect(selectedMode, selectedIntensity);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-[#06070A]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            Choose your program
          </h2>
        </div>

        {/* Mode Options */}
        <div className="space-y-2.5 mb-8">
          {(Object.keys(RECHARGING_MODES) as RechargingMode[]).map((modeId) => {
            const mode = RECHARGING_MODES[modeId];
            const isSelected = selectedMode === modeId;

            return (
              <button
                key={modeId}
                onClick={() => setSelectedMode(modeId)}
                className={cn(
                  "w-full p-3.5 rounded-xl border text-left transition-all duration-200",
                  isSelected
                    ? "bg-white/10 border-white/30"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "transition-colors",
                    isSelected ? "text-white" : "text-white/40"
                  )}>
                    {MODE_ICONS[modeId]}
                  </div>
                  <div className="flex-1">
                    <span className={cn(
                      "text-sm font-medium transition-colors",
                      isSelected ? "text-white" : "text-white/70"
                    )}>
                      {mode.label}
                    </span>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {MODE_HELPERS[modeId]}
                    </p>
                  </div>
                  {/* Radio indicator */}
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected ? "border-white" : "border-white/30"
                  )}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Intensity Selection */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/60">Session length</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map((intensity) => {
              const isSelected = selectedIntensity === intensity.value;
              return (
                <button
                  key={intensity.value}
                  onClick={() => setSelectedIntensity(intensity.value)}
                  className={cn(
                    "py-3 px-4 rounded-xl border text-center transition-all duration-200",
                    isSelected
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  )}
                >
                  <span className="text-sm font-medium">{intensity.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue */}
        <button
          onClick={handleContinue}
          className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm tracking-wide border border-white/10 hover:bg-white/15 transition-colors active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
