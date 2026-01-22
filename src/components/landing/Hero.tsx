import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeroAnimatedBackground } from "./HeroAnimatedBackground";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Animated Background with Videos, Metrics & App Cards */}
      <HeroAnimatedBackground />

      {/* Content */}
      <div className="container relative z-20 px-6 pt-24 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Main Headline - Clean, elegant, single line */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-[-0.02em] mb-6 leading-[1.1] text-black"
          >
            Master your <span className="text-primary whitespace-nowrap">mental edge.</span>
          </motion.h1>

          {/* Subheadline - single line */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-base sm:text-lg md:text-xl text-black/50 max-w-2xl mx-auto mb-8 font-light"
          >
            The cognitive performance system for elite professionals.
          </motion.p>

          {/* Single CTA - pill shaped, with primary accent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <Button 
              asChild 
              className="rounded-full bg-primary text-white hover:bg-primary/90 font-semibold px-10 h-14 text-lg"
            >
              <Link to="/download">
                Start Training
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats - clean, minimal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 sm:mt-20"
          >
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-1">23%</p>
                <p className="text-xs text-black/40 uppercase tracking-[0.15em]">Avg. Improvement</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-1">2M+</p>
                <p className="text-xs text-black/40 uppercase tracking-[0.15em]">Sessions</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-1">Elite</p>
                <p className="text-xs text-black/40 uppercase tracking-[0.15em]">Protocol</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-black/20 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 rounded-full bg-black/30" />
        </motion.div>
      </motion.div>
    </section>
  );
}