import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Brain, Gamepad2, Smartphone, BookOpen } from "lucide-react";

const systems = [
  {
    icon: Zap,
    number: "01",
    title: "System 1",
    subtitle: "INTUITIVE",
    description: "Train rapid pattern recognition and automatic processing. Build faster judgment under pressure.",
  },
  {
    icon: Brain,
    number: "02", 
    title: "System 2",
    subtitle: "DELIBERATE",
    description: "Develop deep analytical reasoning. Strengthen critical thinking and strategic clarity.",
  },
];

const pillars = [
  {
    icon: Gamepad2,
    title: "Cognitive Games",
    description: "Science-backed drills across 3 domains that adapt to your performance.",
  },
  {
    icon: BookOpen,
    title: "Deep Content",
    description: "Curated podcasts, articles, and readings that prime strategic thinking.",
  },
  {
    icon: Smartphone,
    title: "Digital Detox",
    description: "Structured breaks from distracting apps. Earn XP for focused offline time.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="bg-black py-24 lg:py-32 relative">
      <div className="container px-6" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-medium mb-4">
            THE TECHNOLOGY
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            Dual-Process Training
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Based on Nobel Prize-winning cognitive science. Train both thinking systems for complete mental performance.
          </p>
        </motion.div>

        {/* Two Systems - Large Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-24">
          {systems.map((system, index) => (
            <motion.div
              key={system.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="relative p-8 lg:p-12 rounded-2xl bg-white/[0.02] border border-white/10 group hover:border-white/20 transition-colors"
            >
              {/* Number */}
              <span className="absolute top-8 right-8 text-6xl lg:text-7xl font-bold text-white/5">
                {system.number}
              </span>
              
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                  <system.icon className="w-7 h-7 text-white" />
                </div>
                
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-medium mb-2">
                  {system.subtitle}
                </p>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                  {system.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {system.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Training Pillars - Horizontal Strip */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-medium mb-8 text-center">
            WEEKLY TRAINING SYSTEM
          </p>
          
          <div className="grid sm:grid-cols-3 gap-4 lg:gap-6">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="p-6 lg:p-8 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <pillar.icon className="w-6 h-6 text-white/80" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{pillar.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
