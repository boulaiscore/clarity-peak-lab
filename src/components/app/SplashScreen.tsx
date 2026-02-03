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

export function SplashScreen({ onComplete, duration = 5000 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "hold" | "fadeout">("logo");
  const [isVisible, setIsVisible] = useState(true);

  const logoSize = 36;
  const letterHeight = "36px";

  useEffect(() => {
    // Phase 1: Logo grows (0-1200ms)
    const textTimer = setTimeout(() => {
      setPhase("text");
    }, 1200);

    // Phase 2: Letters animate in (~1300ms), then hold for 2s
    const holdTimer = setTimeout(() => {
      setPhase("hold");
    }, 2500);

    // Phase 3: Start fade after 2s hold (2500 + 2000 = 4500ms)
    const fadeTimer = setTimeout(() => {
      setPhase("fadeout");
    }, 4500);

    // Phase 4: Complete and hide
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration);

    return () => {
      clearTimeout(textTimer);
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
        <div className="flex items-center justify-center">
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

          {/* Phase 2: Letters slowly come together to form LOOMA */}
          {phase === "text" && (
            <div className="flex items-center" style={{ gap: "6px" }}>
              {/* L - comes from far left */}
              <motion.span
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
                className="text-white"
                style={letterStyle}
              >
                L
              </motion.span>

              {/* First O - The logo icon, scales down */}
              <motion.div
                initial={{ scale: 1.4, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                <LoomaLogoIcon size={logoSize} />
              </motion.div>

              {/* Second O - Also the logo icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                <LoomaLogoIcon size={logoSize} />
              </motion.div>

              {/* M - comes from right */}
              <motion.span
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
                className="text-white"
                style={letterStyle}
              >
                M
              </motion.span>

              {/* A - comes from far right */}
              <motion.span
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
                className="text-white"
                style={letterStyle}
              >
                A
              </motion.span>
            </div>
          )}

          {/* Phase 3 & 4: Hold and fadeout - static display */}
          {(phase === "hold" || phase === "fadeout") && (
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
