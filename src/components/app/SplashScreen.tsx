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

export function SplashScreen({ onComplete, duration = 6000 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "forming" | "hold" | "fadeout">("logo");
  const [isVisible, setIsVisible] = useState(true);

  const logoSize = 36;
  const letterHeight = "36px";
  const gap = 6;

  useEffect(() => {
    // Phase 1: Logo grows alone (0-1200ms)
    const formingTimer = setTimeout(() => {
      setPhase("forming");
    }, 1200);

    // Phase 2: Letters form around the logo (~1500ms animation)
    // After animation completes, hold for 3 seconds
    const holdTimer = setTimeout(() => {
      setPhase("hold");
    }, 2700); // 1200 + 1500

    // Phase 3: Start fade after 3s hold
    const fadeTimer = setTimeout(() => {
      setPhase("fadeout");
    }, 5700); // 2700 + 3000

    // Phase 4: Complete and hide
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration);

    return () => {
      clearTimeout(formingTimer);
      clearTimeout(holdTimer);
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
    fontWeight: 300,
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: "#0a0b0f" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "fadeout" ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Phase 1: Logo only, centered and growing */}
        {phase === "logo" && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 1.1, 
              ease: [0.16, 1, 0.3, 1] as const
            }}
          >
            <LoomaLogoIcon size={logoSize} />
          </motion.div>
        )}

        {/* Phase 2: Letters come towards the stationary first O logo */}
        {phase === "forming" && (
          <div className="flex items-center" style={{ gap: `${gap}px` }}>
            {/* L - comes from far left */}
            <motion.span
              initial={{ opacity: 0, x: -80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
              className="text-white"
              style={letterStyle}
            >
              L
            </motion.span>

            {/* First O - The original logo, stays in place (no animation) */}
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center"
            >
              <LoomaLogoIcon size={logoSize} />
            </motion.div>

            {/* Second O - comes from right */}
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <LoomaLogoIcon size={logoSize} />
            </motion.div>

            {/* M - comes from right */}
            <motion.span
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              className="text-white"
              style={letterStyle}
            >
              M
            </motion.span>

            {/* A - comes from far right */}
            <motion.span
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
              className="text-white"
              style={letterStyle}
            >
              A
            </motion.span>
          </div>
        )}

        {/* Phase 3 & 4: Hold and fadeout - static display */}
        {(phase === "hold" || phase === "fadeout") && (
          <div className="flex items-center" style={{ gap: `${gap}px` }}>
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
      </motion.div>
    </AnimatePresence>
  );
}
