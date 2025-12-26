import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Sparkles } from "lucide-react";

interface XPCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

export function XPCelebration({ show, onComplete }: XPCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Particle effects */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: "50vw",
                  y: "50vh",
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5],
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
                className="absolute w-3 h-3"
              >
                <Star className="w-full h-full text-amber-400 fill-amber-400" />
              </motion.div>
            ))}
          </div>

          {/* Main celebration content */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="relative z-10 flex flex-col items-center gap-4 p-8"
          >
            {/* Trophy icon with glow */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-amber-400/30 blur-2xl rounded-full scale-150" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-1">
                Weekly Goal Achieved!
              </h2>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <p className="text-amber-400 font-medium">
                  You've reached your XP target
                </p>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
            </motion.div>

            {/* Sub text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground text-center max-w-[280px]"
            >
              Keep training to unlock even more cognitive gains
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
