import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2800 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "fadeout">("logo");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Phase 1: Logo grows (0-800ms)
    const textTimer = setTimeout(() => {
      setPhase("text");
    }, 800);

    // Phase 2: Show full text, then fade out (800-2300ms)
    const fadeTimer = setTimeout(() => {
      setPhase("fadeout");
    }, duration - 500);

    // Phase 3: Complete and hide
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: "#0a0b0f" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "fadeout" ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center justify-center">
          {/* Phase 1: Logo only, centered and growing */}
          {phase === "logo" && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.7, 
                ease: [0.16, 1, 0.3, 1] // Premium easeOutExpo
              }}
            >
              <svg
                width={48}
                height={48}
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="18.4" cy="5.6" r="1.5" fill="currentColor" />
              </svg>
            </motion.div>
          )}

          {/* Phase 2: Logo transforms into first O of LOOMA */}
          {phase === "text" && (
            <div className="flex items-center gap-0">
              {/* L */}
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-white text-3xl font-semibold tracking-tight"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                L
              </motion.span>

              {/* First O - The logo that was there */}
              <motion.div
                initial={{ scale: 1.2, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative mx-[-2px]"
              >
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                  style={{ marginBottom: "-2px" }}
                >
                  <path
                    d="M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="18.4" cy="5.6" r="1.5" fill="currentColor" />
                </svg>
              </motion.div>

              {/* OMA */}
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="text-white text-3xl font-semibold tracking-tight"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                OMA
              </motion.span>
            </div>
          )}

          {/* Phase 3: Same as text but fading */}
          {phase === "fadeout" && (
            <div className="flex items-center gap-0">
              <span
                className="text-white text-3xl font-semibold tracking-tight"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                L
              </span>
              <div className="relative mx-[-2px]">
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                  style={{ marginBottom: "-2px" }}
                >
                  <path
                    d="M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="18.4" cy="5.6" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span
                className="text-white text-3xl font-semibold tracking-tight"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                OMA
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
