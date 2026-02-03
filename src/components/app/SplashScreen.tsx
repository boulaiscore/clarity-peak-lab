import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

// Reusable logo SVG component
const LoomaLogoIcon = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
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
);

export function SplashScreen({ onComplete, duration = 4200 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "fadeout">("logo");
  const [isVisible, setIsVisible] = useState(true);

  const logoSize = 36;
  const letterHeight = "36px";

  useEffect(() => {
    // Phase 1: Logo grows (0-1600ms) - even slower
    const textTimer = setTimeout(() => {
      setPhase("text");
    }, 1600);

    // Phase 2: Show full text, then fade out
    const fadeTimer = setTimeout(() => {
      setPhase("fadeout");
    }, duration - 700);

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

  // Thin font weight to match the 1.5px stroke of the logo
  const letterStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: letterHeight,
    lineHeight: 1,
    fontWeight: 300, // Light weight for thin strokes
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: "#0a0b0f" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "fadeout" ? 0 : 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex items-center justify-center">
          {/* Phase 1: Logo only, centered and growing */}
          {phase === "logo" && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 1.4, 
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <LoomaLogoIcon size={logoSize} />
            </motion.div>
          )}

          {/* Phase 2: Logo transforms into first O of LOOMA */}
          {phase === "text" && (
            <div className="flex items-center" style={{ gap: "6px" }}>
              {/* L */}
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-white"
                style={letterStyle}
              >
                L
              </motion.span>

              {/* First O - The logo icon */}
              <motion.div
                initial={{ scale: 1.3, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center"
              >
                <LoomaLogoIcon size={logoSize} />
              </motion.div>

              {/* Second O - Also the logo icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center"
              >
                <LoomaLogoIcon size={logoSize} />
              </motion.div>

              {/* M */}
              <motion.span
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-white"
                style={letterStyle}
              >
                M
              </motion.span>

              {/* A */}
              <motion.span
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-white"
                style={letterStyle}
              >
                A
              </motion.span>
            </div>
          )}

          {/* Phase 3: Same as text but fading */}
          {phase === "fadeout" && (
            <div className="flex items-center" style={{ gap: "6px" }}>
              <span className="text-white" style={letterStyle}>L</span>
              <div className="flex items-center justify-center">
                <LoomaLogoIcon size={logoSize} />
              </div>
              <div className="flex items-center justify-center">
                <LoomaLogoIcon size={logoSize} />
              </div>
              <span className="text-white" style={letterStyle}>M</span>
              <span className="text-white" style={letterStyle}>A</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
