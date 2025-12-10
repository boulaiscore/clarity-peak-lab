import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { DriftField } from "../DriftField";
import { RippleTapArea } from "../RippleTapArea";
import { StepIndicator } from "../StepContainer";

interface MicroPatternModuleProps {
  duration: number;
  onComplete: (accuracy: number) => void;
}

interface Shape {
  id: number;
  type: "circle" | "square" | "scalene triangle" | "diamond" | "hexagon" | "trapezoid" | "kite";
  isSymmetric: boolean;
  x: number;
  y: number;
}

const SYMMETRIC_SHAPES = ["circle", "square", "diamond", "hexagon"];
const ASYMMETRIC_SHAPES = ["scalene triangle", "trapezoid", "kite"];

export function MicroPatternModule({ duration, onComplete }: MicroPatternModuleProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const generateShape = useCallback((): Shape => {
    const isSymmetric = Math.random() > 0.4; // 60% symmetric
    const shapes = isSymmetric ? SYMMETRIC_SHAPES : ASYMMETRIC_SHAPES;
    const type = shapes[Math.floor(Math.random() * shapes.length)] as Shape["type"];

    return {
      id: Date.now(),
      type,
      isSymmetric,
      x: Math.random() * 40 + 30,
      y: Math.random() * 20 + 40,
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
          onComplete(accuracy);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [duration, onComplete, score]);

  // Generate shapes periodically
  useEffect(() => {
    setCurrentShape(generateShape());

    const interval = setInterval(() => {
      setCurrentShape(generateShape());
      setFeedback(null);
    }, 1300);

    return () => clearInterval(interval);
  }, [generateShape]);

  const handleTap = useCallback(() => {
    if (!currentShape || feedback) return;

    if (currentShape.isSymmetric) {
      setScore((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      setFeedback("correct");
    } else {
      setScore((prev) => ({ ...prev, total: prev.total + 1 }));
      setFeedback("wrong");
    }

    setTimeout(() => setFeedback(null), 300);
  }, [currentShape, feedback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderShape = (shape: Shape) => {
    const size = 80;
    const color =
      feedback === "correct"
        ? "hsl(var(--primary))"
        : feedback === "wrong"
          ? "hsl(0, 70%, 50%)"
          : "hsl(var(--primary) / 0.8)";

    switch (shape.type) {
      case "circle":
        return (
          <div
            className="rounded-full border-2 transition-colors duration-200"
            style={{ width: size, height: size, borderColor: color }}
          />
        );
      case "square":
        return (
          <div
            className="border-2 transition-colors duration-200"
            style={{ width: size, height: size, borderColor: color }}
          />
        );
      case "diamond":
        return (
          <div
            className="border-2 rotate-45 transition-colors duration-200"
            style={{ width: size * 0.7, height: size * 0.7, borderColor: color }}
          />
        );
      case "hexagon":
        return (
          <svg width={size} height={size} viewBox="0 0 100 100">
            <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke={color} strokeWidth="3" />
          </svg>
        );
      case "scalene triangle":
        return (
          <svg width={size} height={size} viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" fill="none" stroke={color} strokeWidth="3" />
          </svg>
        );
      case "trapezoid":
        return (
          <svg width={size} height={size} viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" fill="none" stroke={color} strokeWidth="3" />
          </svg>
        );
      case "kite":
        return (
          <svg width={size} height={size} viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" fill="none" stroke={color} strokeWidth="3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center px-6 py-10 bg-[#06070A]">
      <DriftField particleCount={15} />

      {/* Header */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Module 3 of 4</span>
          <span className="text-sm font-mono text-primary">{formatTime(timeLeft)}</span>
        </div>
        <StepIndicator totalSteps={4} currentStep={2} />
      </div>

      {/* Title & Rule */}
      <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-semibold mb-2">Micro-Pattern Boost</h2>
        <div className="inline-block px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-primary font-medium">Rule: Tap only symmetric shapes</p>
        </div>
      </motion.div>

      {/* Shape Area */}
      <div className="flex-1 w-full flex items-center justify-center">
        <RippleTapArea
          onTap={handleTap}
          className="w-full h-64 rounded-2xl border border-border/20 bg-card/20 flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            {currentShape && (
              <motion.div
                key={currentShape.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {renderShape(currentShape)}
              </motion.div>
            )}
          </AnimatePresence>
        </RippleTapArea>
      </div>

      {/* Score Display */}
      <motion.div
        className="w-full max-w-sm mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground/70">
          <span>Responsiveness</span>
          <span className="font-mono">
            {score.correct}/{score.total} correct
          </span>
        </div>
        <div className="h-1 bg-muted/20 rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{
              width: score.total > 0 ? `${(score.correct / score.total) * 100}%` : "0%",
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground/40 text-center mt-6">
        Symmetric: circle, square, diamond, hexagon
      </p>
    </div>
  );
}
