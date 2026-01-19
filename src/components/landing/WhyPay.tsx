import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function WhyPay() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-black py-32 lg:py-48 relative overflow-hidden" ref={ref}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-white/[0.02] to-black" />
      
      <div className="container px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Large Statement */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
            Your brain is your
            <br />
            <span className="text-primary">competitive advantage.</span>
          </h2>
          
          <p className="text-xl sm:text-2xl text-white/50 font-light max-w-2xl mx-auto mb-16">
            Train it like one.
          </p>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-16 border-t border-white/10"
          >
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">5min</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Daily</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">12wk</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Program</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">∞</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Returns</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
