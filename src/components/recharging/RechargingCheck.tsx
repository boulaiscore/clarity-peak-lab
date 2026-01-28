import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { RechargingCheckValues } from "@/lib/recharging";

interface RechargingCheckProps {
  type: "pre" | "post";
  initialValues?: RechargingCheckValues;
  onComplete: (values: RechargingCheckValues) => void;
}

const CHECK_ITEMS = [
  { key: "mentalNoise" as const, label: "Mental noise" },
  { key: "cognitiveFatigue" as const, label: "Cognitive fatigue" },
  { key: "readinessToClear" as const, label: "Readiness to think clearly" },
];

export function RechargingCheck({ type, initialValues, onComplete }: RechargingCheckProps) {
  const [values, setValues] = useState<RechargingCheckValues>(
    initialValues || {
      mentalNoise: 50,
      cognitiveFatigue: 50,
      readinessToClear: 50,
    }
  );

  const handleValueChange = (key: keyof RechargingCheckValues, value: number[]) => {
    setValues(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleSubmit = () => {
    onComplete(values);
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
        <div className="text-center mb-10">
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">
            {type === "pre" ? "Before Session" : "After Session"}
          </p>
          <h2 className="text-lg font-semibold text-white">
            Quick Cognitive Check
          </h2>
        </div>

        {/* Sliders */}
        <div className="space-y-8 mb-12">
          {CHECK_ITEMS.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">{item.label}</span>
                <span className="text-sm font-mono text-white/50 tabular-nums w-8 text-right">
                  {values[item.key]}
                </span>
              </div>
              <Slider
                value={[values[item.key]]}
                onValueChange={(v) => handleValueChange(item.key, v)}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-white/30">
                <span>Low</span>
                <span>High</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit */}
        <motion.button
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-sm tracking-wide border border-white/10 hover:bg-white/15 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      </motion.div>
    </div>
  );
}
