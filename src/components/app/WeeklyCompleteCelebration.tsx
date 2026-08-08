import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, FileText, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WeeklyCompleteCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

export function WeeklyCompleteCelebration({ show, onComplete }: WeeklyCompleteCelebrationProps) {
  const [phase, setPhase] = useState<"celebration" | "report">("celebration");
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setPhase("celebration");
      
      // After celebration, show report popup
      const reportTimer = setTimeout(() => {
        setPhase("report");
      }, 2500);
      
      return () => clearTimeout(reportTimer);
    }
  }, [show]);

  const handleDismiss = () => {
    setIsVisible(false);
    onComplete?.();
  };

  const handleViewReport = () => {
    setIsVisible(false);
    onComplete?.();
    navigate("/app/report");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={phase === "report" ? handleDismiss : undefined}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Restrained signal particles - only during celebration phase */}
          <AnimatePresence>
            {phase === "celebration" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(14)].map((_, i) => (
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
                      duration: 2.5,
                      delay: i * 0.03,
                      ease: "easeOut",
                    }}
                    className="absolute h-1.5 w-1.5 rounded-full bg-primary/70"
                  >
                    <span className="sr-only">Progress signal</span>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Celebration Content */}
          <AnimatePresence mode="wait">
            {phase === "celebration" && (
              <motion.div
                key="celebration"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="relative z-10 flex flex-col items-center gap-4 p-8 pointer-events-none"
              >
                {/* Completion state */}
                <motion.div
                  animate={{
                    scale: [1, 1.04, 1],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                  <div className="relative w-20 h-20 rounded-full border border-primary/40 bg-background/90 flex items-center justify-center shadow-2xl">
                    <Check className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  </div>
                </motion.div>

                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <h2 className="text-3xl font-bold text-white mb-2">
                    This Week's Goal Complete!
                  </h2>
                  <div className="flex items-center justify-center">
                    <p className="text-lg text-primary font-medium">
                      Same plan, same rhythm. See you next week.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {phase === "report" && (
              <motion.div
                key="report"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="relative z-10 w-[90%] max-w-sm mx-4 p-6 rounded-2xl bg-card border border-border/50 shadow-2xl"
              >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-amber-500/20 to-primary/20 rounded-2xl blur-xl opacity-50" />
                
                <div className="relative space-y-5">
                  {/* Icon */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
                  >
                    <FileText className="w-8 h-8 text-primary" />
                  </motion.div>

                  {/* Title */}
                  <div className="text-center space-y-1">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="text-xl font-bold">Report Ready!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your Cognitive Intelligence Report is now available
                      </p>
                    </motion.div>
                  </div>

                  {/* Features */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-4 text-xs text-muted-foreground"
                  >
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      <span>PDF Export</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <div className="flex items-center gap-1">
                      <span>Full Analysis</span>
                    </div>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col gap-2"
                  >
                    <Button 
                      variant="premium" 
                      className="w-full gap-2"
                      onClick={handleViewReport}
                    >
                      View Report
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full text-muted-foreground"
                      onClick={handleDismiss}
                    >
                      Maybe Later
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
