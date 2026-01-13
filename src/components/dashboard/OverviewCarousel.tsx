import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { CognitiveAgeSphere } from "./CognitiveAgeSphere";
import { NeuralGrowthAnimation } from "./NeuralGrowthAnimation";
import { FastSlowBrainMap } from "./FastSlowBrainMap";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Sparkles, ChevronLeft, ChevronRight, Info, Brain, Network, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SCIBreakdown {
  total: number;
  cognitivePerformance: {
    score: number;
    weighted: number;
    components: {
      reasoning: number;
      focus: number;
      decisionQuality: number;
      creativity: number;
      dualProcessBalance: number;
    };
  };
  behavioralEngagement: {
    score: number;
    weighted: number;
    components: {
      gamesEngagement: number;
      tasksEngagement: number;
      sessionConsistency: number;
    };
  };
  recoveryFactor: {
    score: number;
    weighted: number;
  };
}

interface OverviewCarouselProps {
  cognitiveAgeData: {
    cognitiveAge: number;
    delta: number;
    chronologicalAge?: number;
  };
  sci: SCIBreakdown | null;
  sciStatusText: string;
  thinkingScores: {
    fastScore: number;
    slowScore: number;
    fastDelta: number;
    slowDelta: number;
    baselineFast: number;
    baselineSlow: number;
  };
  isPremium: boolean;
}

const CARDS = ["cognitive-age", "cognitive-network", "dual-process"] as const;
type CardType = typeof CARDS[number];

const cardTitles: Record<CardType, string> = {
  "cognitive-age": "Cognitive Age",
  "cognitive-network": "Cognitive Network",
  "dual-process": "Dual-Process Integration"
};

export function OverviewCarousel({
  cognitiveAgeData,
  sci,
  sciStatusText,
  thinkingScores,
  isPremium
}: OverviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };
  
  const paginate = (newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < CARDS.length) {
      setCurrentIndex(newIndex);
    }
  };
  
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);
    
    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };
  
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="space-y-4">
      {/* Card indicators with info button */}
      <div className="flex items-center justify-center gap-2">
        {CARDS.map((card, index) => (
          <button
            key={card}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              currentIndex === index 
                ? "w-6 bg-primary" 
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to ${cardTitles[card]}`}
          />
        ))}
        
        {/* Info button */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="ml-2 p-1 rounded-full hover:bg-muted/50 transition-colors">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Cognitive Metrics Explained
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Cognitive Age</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your brain's functional age based on cognitive performance. Lower than chronological age indicates sharper cognitive abilities.
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium text-foreground">Cognitive Network (SCI)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Synthesized Cognitive Index measuring overall brain connectivity and performance across cognitive, behavioral, and recovery dimensions.
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="font-medium text-foreground">Dual-Process</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Balance between System 1 (fast, intuitive) and System 2 (slow, analytical) thinking. Optimal performance requires both systems working in harmony.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Carousel container */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ minHeight: "340px" }}
      >
        {/* Navigation arrows */}
        <button
          onClick={() => paginate(-1)}
          disabled={currentIndex === 0}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 shadow-lg transition-all",
            currentIndex === 0 
              ? "opacity-0 pointer-events-none" 
              : "opacity-100 hover:bg-card"
          )}
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <button
          onClick={() => paginate(1)}
          disabled={currentIndex === CARDS.length - 1}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 shadow-lg transition-all",
            currentIndex === CARDS.length - 1 
              ? "opacity-0 pointer-events-none" 
              : "opacity-100 hover:bg-card"
          )}
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <AnimatePresence initial={false} custom={currentIndex}>
          <motion.div
            key={currentIndex}
            custom={currentIndex}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing px-6"
          >
            {/* Card content based on current index */}
            {CARDS[currentIndex] === "cognitive-age" && (
              <CognitiveAgeSphere 
                cognitiveAge={cognitiveAgeData.cognitiveAge} 
                delta={cognitiveAgeData.delta}
                chronologicalAge={cognitiveAgeData.chronologicalAge}
              />
            )}
            
            {CARDS[currentIndex] === "cognitive-network" && (
              <NeuralGrowthAnimation
                cognitiveAgeDelta={-cognitiveAgeData.delta}
                overallCognitiveScore={sci?.total ?? 50}
                sciBreakdown={sci}
                statusText={sciStatusText}
              />
            )}
            
            {CARDS[currentIndex] === "dual-process" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold text-foreground">Dual-Process Integration</h2>
                  <Link to="/brain-science" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                    <BookOpen className="w-3 h-3" />
                    Learn more
                  </Link>
                </div>
                
                <FastSlowBrainMap
                  fastScore={thinkingScores.fastScore}
                  fastBaseline={thinkingScores.baselineFast}
                  fastDelta={thinkingScores.fastDelta}
                  slowScore={thinkingScores.slowScore}
                  slowBaseline={thinkingScores.baselineSlow}
                  slowDelta={thinkingScores.slowDelta}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      
      {/* Report CTA - Always visible at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="pt-2"
      >
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/8 to-primary/12 border border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-primary/15 rounded-full blur-xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/15">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-foreground">Cognitive Intelligence Report</h3>
                  {!isPremium && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  Professional analysis of your cognitive performance
                </p>
              </div>
            </div>
            
            <Link to="/app/report">
              <Button 
                variant={isPremium ? "premium" : "outline"} 
                className={cn(
                  "w-full h-10 text-[12px] gap-2",
                  !isPremium && "border-primary/30 hover:bg-primary/10"
                )}
              >
                {isPremium ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    View Report
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    Preview Report
                  </>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}