import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap, Brain, Plus } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { ShowcaseDetailModal } from "./ShowcaseDetailModal";

import focusWorkImage from "@/assets/landing-focus-work.jpg";
import meditationImage from "@/assets/landing-meditation-calm.jpg";
import bookReadingImage from "@/assets/landing-book-reading.jpg";
import phoneThinkingImage from "@/assets/landing-phone-thinking.jpg";
import outdoorWalkImage from "@/assets/landing-outdoor-walk.jpg";
import podcastListeningImage from "@/assets/landing-podcast-listening.jpg";
import criticalReasoningImage from "@/assets/landing-critical-reasoning.jpg";

// Detail screenshots for modal
import detailCognitiveAge from "@/assets/landing/detail-cognitive-age.png";
import detailRecovery from "@/assets/landing/detail-recovery.png";
import detailLibrary from "@/assets/landing/detail-library.png";
import detailTraining from "@/assets/landing/detail-training.png";
import detailDualProcess from "@/assets/landing/detail-dual-process.png";
import detailPodcast from "@/assets/landing/detail-podcast.png";
import detailReasoningQuality from "@/assets/landing/detail-reasoning-quality.png";

const showcaseSlides = [
  {
    image: focusWorkImage,
    headline: "Measure your cognitive performance",
    metricType: "cognitiveAge" as const,
    metricValue: "38.2",
    metricLabel: "COGNITIVE AGE",
    metricSubtext: "4.1 years younger",
    detailScreenshot: detailCognitiveAge,
    detailHeadline: "Measure your brain's biological age",
    detailDescription: "Cognitive Age translates your cognitive performance into a biological brain age. A value lower than your chronological age indicates a sharper, more reactive brain built through consistent training.",
  },
  {
    image: meditationImage,
    headline: "Recover with targeted protocols",
    metricType: "recovery" as const,
    metricValue: "87%",
    metricLabel: "RECOVERY",
    metricSubtext: "Optimal readiness",
    detailScreenshot: detailRecovery,
    detailHeadline: "Optimize your mental recovery",
    detailDescription: "The Recovery section monitors your cognitive rest and guides you with targeted protocols like Digital Detox and Walking to maximize your mental readiness for peak performance.",
  },
  {
    image: bookReadingImage,
    headline: "Sharpen your mind through curated reading",
    metricType: "reasoning" as const,
    metricValue: "92",
    metricLabel: "REASONING QUALITY",
    metricSubtext: "+12% this month",
    detailScreenshot: detailLibrary,
    detailHeadline: "Sharpen reasoning through curated content",
    detailDescription: "The Library offers selected books and articles that stimulate critical thinking and analytical reasoning, contributing to your Reasoning Quality score with every piece you complete.",
  },
  {
    image: phoneThinkingImage,
    headline: "Boost your intuition",
    metricType: "sharpness" as const,
    metricValue: "76",
    metricLabel: "SHARPNESS",
    metricSubtext: "High clarity",
    detailScreenshot: detailTraining,
    detailHeadline: "Train your rapid intuition",
    detailDescription: "Through System 1 games like Flash Connect and Constellation Snap, you train fast, accurate decision-making to improve cognitive Sharpness and intuitive response times.",
  },
  {
    image: outdoorWalkImage,
    headline: "Balance your cognitive systems",
    metricType: "dualProcess" as const,
    metricValue: "52%",
    metricLabel: "DUAL PROCESS",
    metricSubtext: "Balanced",
    detailScreenshot: detailDualProcess,
    detailHeadline: "Balance fast and reflective thinking",
    detailDescription: "The Dual Process Index shows the equilibrium between your System 1 (intuitive) and System 2 (analytical) thinking. Optimal balance is the key to effective decisions under any circumstances.",
  },
  {
    image: podcastListeningImage,
    headline: "Learn while you listen",
    metricType: "reasoning" as const,
    metricValue: "85",
    metricLabel: "KNOWLEDGE ABSORPTION",
    metricSubtext: "+8% this week",
    detailScreenshot: detailPodcast,
    detailHeadline: "Absorb insights through curated podcasts",
    detailDescription: "The podcast section lets you absorb curated content during daily activities, contributing to your cognitive growth without taking extra time from your schedule.",
  },
  {
    image: criticalReasoningImage,
    headline: "Train your critical thinking",
    metricType: "sharpness" as const,
    metricValue: "88",
    metricLabel: "CRITICAL REASONING",
    metricSubtext: "Top 15%",
    detailScreenshot: detailReasoningQuality,
    detailHeadline: "Build deliberate reasoning capacity",
    detailDescription: "Games like Causal Ledger challenge you to evaluate cause-effect relationships and resist cognitive biases, building a more analytical and disciplined mind over time.",
  },
];

// Cognitive Age - Circular orb with particles
function CognitiveAgeMetric({ value, subtext }: { value: string; subtext: string }) {
  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 blur-lg" />
      <div className="absolute inset-0 rounded-full border border-primary/40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="absolute inset-1 rounded-full overflow-hidden">
          <svg className="w-full h-full opacity-30" viewBox="0 0 100 100">
            {[...Array(12)].map((_, i) => (
              <motion.circle
                key={i}
                cx={50 + Math.cos(i * 0.5) * 35}
                cy={50 + Math.sin(i * 0.5) * 35}
                r={1 + Math.random() * 1.5}
                fill="currentColor"
                className="text-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </svg>
        </div>
        <span className="text-2xl sm:text-3xl font-bold text-white">{value}</span>
        <span className="text-[8px] uppercase tracking-wider text-white/50">Cognitive Age</span>
        <span className="text-[8px] text-primary mt-0.5">{subtext}</span>
      </div>
    </div>
  );
}

// Recovery - Progress bar style
function RecoveryMetric({ value, subtext }: { value: string; subtext: string }) {
  const percentage = parseInt(value);
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-white/10 w-32 sm:w-36">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-[9px] uppercase tracking-wider text-white/50">Recovery</span>
      </div>
      <span className="text-2xl font-bold text-white block mb-2">{value}</span>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </div>
      <span className="text-[8px] text-white/40 mt-1 block">{subtext}</span>
    </div>
  );
}

// Reasoning Quality - Mini chart
function ReasoningMetric({ value, subtext }: { value: string; subtext: string }) {
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-white/10 w-32 sm:w-36">
      <span className="text-[9px] uppercase tracking-wider text-white/50 block mb-1">Reasoning</span>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-[9px] text-primary">{subtext}</span>
      </div>
      <div className="flex items-end gap-0.5 h-8">
        {[65, 72, 78, 74, 82, 85, 92].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-primary/60 rounded-sm"
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            viewport={{ once: true }}
          />
        ))}
      </div>
    </div>
  );
}

// Sharpness - Circular with Zap icon (like app)
function SharpnessMetric({ value, subtext }: { value: string; subtext: string }) {
  const percentage = parseInt(value);
  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28">
      <svg className="w-full h-full -rotate-90">
        <circle cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
        <motion.circle
          cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          className="text-blue-400"
          strokeDasharray={264}
          initial={{ strokeDashoffset: 264 }}
          whileInView={{ strokeDashoffset: 264 * (1 - percentage / 100) }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full m-1">
        <Zap className="w-4 h-4 text-blue-400 mb-0.5" />
        <span className="text-xl font-bold text-white">{value}</span>
        <span className="text-[7px] uppercase tracking-wider text-white/50">Sharpness</span>
        <span className="text-[7px] text-blue-400">{subtext}</span>
      </div>
    </div>
  );
}

// Dual Process - Split indicator (S1/S2)
function DualProcessMetric({ value, subtext }: { value: string; subtext: string }) {
  const s1Pct = parseInt(value);
  const s2Pct = 100 - s1Pct;
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-white/10 w-32 sm:w-36">
      <span className="text-[9px] uppercase tracking-wider text-white/50 block mb-2">Dual Process</span>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-sm font-semibold text-white">{s1Pct}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="text-sm font-semibold text-white">{s2Pct}%</span>
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
        <motion.div
          className="h-full bg-amber-400"
          initial={{ width: 0 }}
          whileInView={{ width: `${s1Pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
        />
        <motion.div
          className="h-full bg-purple-400"
          initial={{ width: 0 }}
          whileInView={{ width: `${s2Pct}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[7px] text-amber-400/70">S1 Fast</span>
        <span className="text-[7px] text-purple-400/70">S2 Slow</span>
      </div>
      <span className="text-[8px] text-white/40 block text-center mt-1">{subtext}</span>
    </div>
  );
}

function MetricRenderer({ type, value, subtext }: { type: string; value: string; subtext: string }) {
  switch (type) {
    case "cognitiveAge": return <CognitiveAgeMetric value={value} subtext={subtext} />;
    case "recovery": return <RecoveryMetric value={value} subtext={subtext} />;
    case "reasoning": return <ReasoningMetric value={value} subtext={subtext} />;
    case "sharpness": return <SharpnessMetric value={value} subtext={subtext} />;
    case "dualProcess": return <DualProcessMetric value={value} subtext={subtext} />;
    default: return null;
  }
}

function ShowcaseCard({ slide, onOpenDetail }: { slide: typeof showcaseSlides[0]; onOpenDetail: () => void }) {
  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
      {/* Background image */}
      <img
        src={slide.image}
        alt={slide.headline}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40" />
      
      {/* Headline at top */}
      <div className="absolute top-4 left-4 right-4">
        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
          {slide.headline}
        </h3>
      </div>
      
      {/* Metric at bottom-left */}
      <div className="absolute bottom-4 left-4">
        <MetricRenderer 
          type={slide.metricType} 
          value={slide.metricValue} 
          subtext={slide.metricSubtext} 
        />
      </div>
      
      {/* Plus button at bottom-right */}
      <button 
        onClick={onOpenDetail}
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 hover:scale-110 transition-all shadow-lg backdrop-blur-sm"
      >
        <Plus className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}

export function ProductShowcase() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section className="bg-primary/5 py-12 sm:py-20">
      <div className="container px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            WHY NEUROLOOP
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Your cognitive advantage
          </h2>
        </div>

        {/* Carousel - 3 cards visible with uniform spacing */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-6">
              {showcaseSlides.map((slide, index) => (
                <div 
                  key={index} 
                  className="flex-[0_0_calc(29%-1.5rem)] min-w-[242px] pl-6"
                >
                  <ShowcaseCard 
                    slide={slide} 
                    onOpenDetail={() => setSelectedSlideIndex(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-foreground shadow-lg flex items-center justify-center hover:bg-foreground/90 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5 text-background" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-foreground shadow-lg flex items-center justify-center hover:bg-foreground/90 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5 text-background" />
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
                  ? "bg-foreground" 
                  : "bg-foreground/20 hover:bg-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <ShowcaseDetailModal
        isOpen={selectedSlideIndex !== null}
        slide={selectedSlideIndex !== null ? showcaseSlides[selectedSlideIndex] : null}
        onClose={() => setSelectedSlideIndex(null)}
      />
    </section>
  );
}
