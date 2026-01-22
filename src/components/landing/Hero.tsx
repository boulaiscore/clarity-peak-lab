import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import heroIllustration from "@/assets/hero-illustration.png";
import landingMetricsHero10s from "@/assets/landing-metrics-hero-10s.mp4";
import { useHeroVideoLifecycle } from "@/components/landing/useHeroVideoLifecycle";

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    showVideo,
    videoBlur,
    videoIntro,
    videoOutro,
    handleVideoTimeUpdate,
    handleVideoEnded,
  } = useHeroVideoLifecycle({
    prefersReducedMotion,
    videoRef,
    outroMs: 1500,
    introDelayMs: 2000,
    fadeMs: 1200,
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {/* Base image (always present) */}
        <img
          src={heroIllustration}
          alt="Neural network illustration"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            showVideo ? "opacity-0" : "opacity-40"
          }`}
        />

        {/* Video layer (fades in after 2s, fades out when ended) */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            showVideo && !videoOutro ? "opacity-40" : "opacity-0"
          }`}
          src={landingMetricsHero10s}
          playsInline
          preload="auto"
          loop={false}
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={handleVideoEnded}
          disablePictureInPicture
          controls={false}
          aria-hidden="true"
          style={{
            filter: showVideo ? (videoBlur ? "blur(10px)" : "blur(0px)") : "blur(0px)",
            transform: showVideo ? (videoIntro ? "scale(1.045)" : "scale(1)") : "scale(1)",
            transition: "filter 1200ms ease, transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Light overlay for text readability */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/40 z-10 transition-opacity duration-1000"
          style={{
            opacity: showVideo ? (videoIntro ? 0.78 : 1) : 1,
          }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-20 px-6 pt-24 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-[-0.02em] mb-4 sm:mb-6 leading-[1.05] text-black md:whitespace-nowrap"
          >
            Unlock <span className="text-primary">human intelligence.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-black/60 max-w-2xl mx-auto mb-6 sm:mb-8 font-light leading-relaxed px-4 sm:px-0"
          >
            The cognitive performance system that trains your reasoning, sharpens your decisions, and tracks your mental edge.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <Button 
              asChild 
              className="rounded-full bg-primary text-white hover:bg-primary/90 font-semibold px-6 sm:px-10 h-11 sm:h-14 text-base sm:text-lg"
            >
              <Link to="/download">
                Start Training
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 sm:mt-28 lg:mt-36"
          >
            <div className="grid grid-cols-3 gap-4 sm:gap-16 max-w-4xl mx-auto text-center px-2 sm:px-0">
              <div>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-black tracking-tight mb-0.5 sm:mb-1">↑ 23%</p>
                <p className="text-[8px] sm:text-[10px] text-black/40 uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-0.5">Mental Sharpness</p>
                <p className="text-[7px] sm:text-[9px] text-black/30 leading-tight">avg. improvement<br className="sm:hidden" /> over 4 weeks</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-black tracking-tight mb-0.5 sm:mb-1">100k+</p>
                <p className="text-[8px] sm:text-[10px] text-black/40 uppercase tracking-[0.1em] sm:tracking-[0.15em]">Training Sessions</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-black tracking-tight mb-0.5 sm:mb-1">Elite</p>
                <p className="text-[8px] sm:text-[10px] text-black/40 uppercase tracking-[0.1em] sm:tracking-[0.15em]">Protocol</p>
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
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 sm:w-6 sm:h-10 rounded-full border-2 border-black/20 flex items-start justify-center p-1.5 sm:p-2"
        >
          <div className="w-1 h-1.5 sm:h-2 rounded-full bg-black/30" />
        </motion.div>
      </motion.div>
    </section>
  );
}