import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import executiveFocusImage from "@/assets/landing-executive-focus.jpg";
import founderMeditationImage from "@/assets/landing-founder-meditation.jpg";
import investorReadingImage from "@/assets/landing-investor-reading.jpg";

const showcaseSlides = [
  {
    image: executiveFocusImage,
    headline: "Misura e ottimizza le tue capacità cognitive",
    metricLabel: "COGNITIVE AGE",
    metricValue: "38.2",
    metricSubtext: "4.1 years younger",
    metricType: "age" as const,
  },
  {
    image: founderMeditationImage,
    headline: "Recupera mentalmente con protocolli mirati",
    metricLabel: "RECOVERY SCORE",
    metricValue: "87%",
    metricSubtext: "Optimal readiness",
    metricType: "recovery" as const,
  },
  {
    image: investorReadingImage,
    headline: "Affina il tuo ragionamento strategico",
    metricLabel: "REASONING QUALITY",
    metricValue: "92",
    metricSubtext: "+12% this month",
    metricType: "reasoning" as const,
  },
];

function CognitiveAgeMetric({ value, label, subtext }: { value: string; label: string; subtext: string }) {
  return (
    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 blur-xl" />
      
      {/* Main circle */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
        {/* Animated particle effect */}
        <div className="absolute inset-2 rounded-full overflow-hidden">
          <svg className="w-full h-full opacity-40" viewBox="0 0 100 100">
            {[...Array(20)].map((_, i) => (
              <motion.circle
                key={i}
                cx={50 + Math.cos(i * 0.5) * 35}
                cy={50 + Math.sin(i * 0.5) * 35}
                r={1 + Math.random() * 2}
                fill="currentColor"
                className="text-primary"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </svg>
        </div>
        
        {/* Content */}
        <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-[10px] uppercase tracking-widest text-white/60 mt-1">{label}</span>
        <span className="text-xs text-primary mt-1">{subtext}</span>
      </div>
    </div>
  );
}

function RecoveryMetric({ value, label, subtext }: { value: string; label: string; subtext: string }) {
  const percentage = parseInt(value);
  
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/10">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/60">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl sm:text-5xl font-bold text-white">{value}</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
      
      <span className="text-xs text-white/50 mt-2 block">{subtext}</span>
    </div>
  );
}

function ReasoningMetric({ value, label, subtext }: { value: string; label: string; subtext: string }) {
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/10">
      <span className="text-[10px] uppercase tracking-widest text-white/60 block mb-2">{label}</span>
      
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl sm:text-5xl font-bold text-white">{value}</span>
        <span className="text-sm text-primary">{subtext}</span>
      </div>
      
      {/* Mini chart visualization */}
      <div className="flex items-end gap-1 h-12">
        {[65, 72, 78, 74, 82, 85, 92].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-primary/60 rounded-sm"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Auto-advance
  useEffect(() => {
    if (!emblaApi) return;
    
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);
    
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="bg-muted/30 py-16 sm:py-24">
      <div className="container px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            PERCHÉ NEUROLOOP
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            Il tuo vantaggio cognitivo
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {showcaseSlides.map((slide, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0 px-2 sm:px-4">
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden">
                    {/* Background image */}
                    <img
                      src={slide.image}
                      alt={slide.headline}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full px-6 sm:px-12 lg:px-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        {/* Headline */}
                        <div className="max-w-md lg:max-w-lg">
                          <AnimatePresence mode="wait">
                            {selectedIndex === index && (
                              <motion.h3
                                key={slide.headline}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight"
                              >
                                {slide.headline}
                              </motion.h3>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Metric */}
                        <AnimatePresence mode="wait">
                          {selectedIndex === index && (
                            <motion.div
                              key={slide.metricLabel}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            >
                              {slide.metricType === "age" && (
                                <CognitiveAgeMetric
                                  value={slide.metricValue}
                                  label={slide.metricLabel}
                                  subtext={slide.metricSubtext}
                                />
                              )}
                              {slide.metricType === "recovery" && (
                                <RecoveryMetric
                                  value={slide.metricValue}
                                  label={slide.metricLabel}
                                  subtext={slide.metricSubtext}
                                />
                              )}
                              {slide.metricType === "reasoning" && (
                                <ReasoningMetric
                                  value={slide.metricValue}
                                  label={slide.metricLabel}
                                  subtext={slide.metricSubtext}
                                />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {showcaseSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                selectedIndex === index 
                  ? "bg-foreground w-6" 
                  : "bg-foreground/30 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
