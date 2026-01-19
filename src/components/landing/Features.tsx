import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    label: "CLARITY",
    title: "Think Clearly Under Pressure",
    description: "Structured protocols cut through cognitive noise when stakes are highest. Train the mental discipline that separates elite performers.",
    stat: "27%",
    statLabel: "Faster decisions",
  },
  {
    label: "SPEED",
    title: "Accelerate Your Reasoning",
    description: "Train faster, more accurate analysis without sacrificing quality. Build the pattern recognition that drives intuitive excellence.",
    stat: "3.2x",
    statLabel: "Processing speed",
  },
  {
    label: "FITNESS",
    title: "Build Cognitive Longevity",
    description: "Consistent practice compounds into long-term mental sharpness. Protect your most valuable asset: your mind.",
    stat: "89%",
    statLabel: "Retention rate",
  },
];

function FeatureSection({ feature, index }: { feature: typeof features[0], index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isReversed = index % 2 === 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-24 lg:py-32 ${
        isReversed ? "lg:flex-row-reverse" : ""
      }`}
    >
      {/* Text Content */}
      <div className={`${isReversed ? "lg:order-2" : ""}`}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-medium mb-4">
          {feature.label}
        </p>
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
          {feature.title}
        </h3>
        <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
          {feature.description}
        </p>
        
        {/* Stat */}
        <div className="flex items-baseline gap-3">
          <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
            {feature.stat}
          </span>
          <span className="text-sm text-white/50 uppercase tracking-wider">
            {feature.statLabel}
          </span>
        </div>
      </div>

      {/* Visual - Circular Metric (WHOOP-style orb) with blue accent */}
      <div className={`flex justify-center ${isReversed ? "lg:order-1" : ""}`}>
        <div className="relative w-64 h-64 sm:w-80 sm:h-80">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20" />
          
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary/10"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={isInView ? { strokeDashoffset: 283 * (1 - (index + 1) * 0.25) } : {}}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
              {feature.stat}
            </span>
            <span className="text-xs text-primary/70 uppercase tracking-wider mt-2">
              {feature.statLabel}
            </span>
          </div>
          
          {/* Subtle glow */}
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl -z-10" />
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section className="bg-black relative">
      <div className="container px-6">
        {features.map((feature, index) => (
          <FeatureSection key={feature.label} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
