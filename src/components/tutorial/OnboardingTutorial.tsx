import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Zap, Timer, Target, Leaf, Calendar, 
  ChevronRight, ChevronLeft, X, Sparkles, Activity, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingTutorialProps {
  show: boolean;
  onComplete: () => void;
}

interface TutorialSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  visual: React.ReactNode;
  accent: string;
}

// Animated visual components for each slide
const S1S2Visual = () => (
  <div className="flex items-center justify-center gap-6 py-4">
    <motion.div
      initial={{ scale: 0, x: 20 }}
      animate={{ scale: 1, x: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
        <Zap className="w-8 h-8 text-amber-400" />
      </div>
      <span className="text-xs font-medium text-amber-400">System 1</span>
      <span className="text-[10px] text-muted-foreground">Fast & Intuitive</span>
    </motion.div>
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-muted-foreground/40"
    >
      <ChevronRight className="w-6 h-6" />
    </motion.div>
    
    <motion.div
      initial={{ scale: 0, x: -20 }}
      animate={{ scale: 1, x: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
        <Timer className="w-8 h-8 text-violet-400" />
      </div>
      <span className="text-xs font-medium text-violet-400">System 2</span>
      <span className="text-[10px] text-muted-foreground">Slow & Reasoned</span>
    </motion.div>
  </div>
);

const WeeklyTargetVisual = () => (
  <div className="py-4 px-2">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-3"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">Rolling 7 days</span>
        <span className="text-[10px] font-medium text-primary">65 / 80 XP</span>
      </div>
      <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "81%" }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="flex items-center justify-center gap-1"
    >
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 + i * 0.05 }}
          className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-medium ${
            i < 5 ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
          }`}
        >
          {["M", "T", "W", "T", "F", "S", "S"][i]}
        </motion.div>
      ))}
    </motion.div>
    
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="text-[9px] text-center text-muted-foreground/60 mt-2"
    >
      Window shifts daily — no weekly resets
    </motion.p>
  </div>
);

const RecoveryBalanceVisual = () => (
  <div className="py-4 flex items-center justify-center gap-4">
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
        <Target className="w-7 h-7 text-primary" />
      </div>
      <span className="text-[10px] font-medium">Training</span>
      <span className="text-[9px] text-muted-foreground">Build capacity</span>
    </motion.div>
    
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring" }}
      className="flex flex-col items-center"
    >
      <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-4 h-4 text-muted-foreground/50" />
        </motion.div>
      </div>
      <span className="text-[8px] text-muted-foreground/50 mt-1">Balance</span>
    </motion.div>
    
    <motion.div
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="w-14 h-14 rounded-xl bg-teal-500/20 flex items-center justify-center">
        <Leaf className="w-7 h-7 text-teal-400" />
      </div>
      <span className="text-[10px] font-medium">Recovery</span>
      <span className="text-[9px] text-muted-foreground">Lock in gains</span>
    </motion.div>
  </div>
);

// Metrics visual - shows the four main metrics
const MetricsVisual = () => (
  <div className="py-3">
    <div className="grid grid-cols-2 gap-3">
      {/* Sharpness */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-semibold text-blue-400">Sharpness</span>
        </div>
        <p className="text-[8px] text-muted-foreground leading-tight">
          Your intuitive clarity today. High = fast pattern recognition.
        </p>
      </motion.div>
      
      {/* Readiness */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
      >
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-semibold text-indigo-400">Readiness</span>
        </div>
        <p className="text-[8px] text-muted-foreground leading-tight">
          Capacity for deliberate work. Train hard when high.
        </p>
      </motion.div>
      
      {/* Recovery */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20"
      >
        <div className="flex items-center gap-2 mb-1">
          <Leaf className="w-4 h-4 text-teal-400" />
          <span className="text-[10px] font-semibold text-teal-400">Recovery</span>
        </div>
        <p className="text-[8px] text-muted-foreground leading-tight">
          Attentional restoration. Low = rest more, train less.
        </p>
      </motion.div>
      
      {/* Cognitive Age */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
      >
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-semibold text-amber-400">Cognitive Age</span>
        </div>
        <p className="text-[8px] text-muted-foreground leading-tight">
          Your brain's functional age. Drops with consistent training.
        </p>
      </motion.div>
    </div>
  </div>
);

const GetStartedVisual = () => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.3, type: "spring" }}
    className="py-4 flex flex-col items-center"
  >
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
        <Brain className="w-10 h-10 text-white" />
      </div>
    </div>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="text-sm font-medium mt-4 text-center"
    >
      You're ready to train
    </motion.p>
  </motion.div>
);

const SLIDES: TutorialSlide[] = [
  {
    id: "s1s2",
    title: "Two Thinking Systems",
    subtitle: "The science behind NeuroLoop",
    description: "System 1 is fast, intuitive, automatic. System 2 is slow, deliberate, analytical. Training both creates cognitive balance.",
    icon: <Brain className="w-5 h-5" />,
    visual: <S1S2Visual />,
    accent: "from-amber-500/20 to-violet-500/20",
  },
  {
    id: "weekly",
    title: "Weekly Target",
    subtitle: "Rolling 7-day window",
    description: "Your progress is measured over the last 7 days—not calendar weeks. Train consistently and the window moves with you.",
    icon: <Calendar className="w-5 h-5" />,
    visual: <WeeklyTargetVisual />,
    accent: "from-primary/20 to-primary/5",
  },
  {
    id: "balance",
    title: "Training & Recovery",
    subtitle: "The balance equation",
    description: "Training builds capacity. Recovery locks in gains. Without balance, you overtrain and progress stalls.",
    icon: <Leaf className="w-5 h-5" />,
    visual: <RecoveryBalanceVisual />,
    accent: "from-teal-500/20 to-primary/20",
  },
  {
    id: "metrics",
    title: "Your Daily Metrics",
    subtitle: "What the numbers mean",
    description: "These four metrics show your cognitive state today. Use them to decide when to train hard and when to recover.",
    icon: <Activity className="w-5 h-5" />,
    visual: <MetricsVisual />,
    accent: "from-blue-500/20 to-teal-500/20",
  },
  {
    id: "start",
    title: "Let's Begin",
    subtitle: "Your cognitive journey starts now",
    description: "Complete your weekly target, maintain recovery, and watch your cognitive performance improve over time.",
    icon: <Sparkles className="w-5 h-5" />,
    visual: <GetStartedVisual />,
    accent: "from-primary/30 to-violet-500/20",
  },
];

export function OnboardingTutorial({ show, onComplete }: OnboardingTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;

  const goNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (!isFirstSlide) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Reset slide when shown
  useEffect(() => {
    if (show) {
      setCurrentSlide(0);
    }
  }, [show]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-sm bg-card border border-border/50 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              aria-label="Skip tutorial"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Gradient header */}
            <div className={`h-2 bg-gradient-to-r ${slide.accent}`} />

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={slide.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {/* Icon + Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      {slide.icon}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {slide.subtitle}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold mb-2">{slide.title}</h2>

                  {/* Visual */}
                  <div className="my-4 min-h-[120px] flex items-center justify-center">
                    {slide.visual}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {slide.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {SLIDES.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide 
                        ? "w-6 bg-primary" 
                        : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goPrev}
                  disabled={isFirstSlide}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={goNext}
                  className="flex-1"
                >
                  {isLastSlide ? "Start Training" : "Next"}
                  {!isLastSlide && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
