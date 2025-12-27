import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import heroReading from "@/assets/hero-video.mp4";
import heroTraining from "@/assets/hero-training.mp4";
import heroYoga from "@/assets/hero-yoga.mp4";

const heroVideos = [heroReading, heroTraining, heroYoga];

export function Hero() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Cycle through videos every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.video
            key={currentVideoIndex}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full object-cover"
          >
            <source src={heroVideos[currentVideoIndex]} type="video/mp4" />
          </motion.video>
        </AnimatePresence>
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
      </div>

      {/* Subtle animated accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px] animate-pulse" />

      {/* Content */}
      <div className="container relative z-10 px-6 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Elite Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-12 backdrop-blur-sm"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-white/80 tracking-widest uppercase">
              Cognitive Performance Platform
            </span>
          </motion.div>

          {/* Main Headline - Bold, Premium */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 leading-[0.95] text-white"
          >
            Train Your Mind. <span className="text-primary">Unlock Elite Reasoning.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-14 leading-relaxed font-light"
          >
            The cognitive training system for executives, founders, and high performers 
            who refuse to leave their mental edge to chance.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button asChild size="xl" className="min-h-[60px] px-10 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/auth">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="min-h-[60px] px-10 text-lg font-semibold bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
              onClick={() => {
                const element = document.getElementById('how-it-works');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <Play className="w-5 h-5 mr-2" />
              See How It Works
            </Button>
          </motion.div>

          {/* Video indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex justify-center gap-2 mt-10"
          >
            {heroVideos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentVideoIndex 
                    ? "w-8 bg-primary" 
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </motion.div>

          {/* Elite Stats/Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-16 pt-10 border-t border-white/10"
          >
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">2M+</p>
                <p className="text-sm text-white/50 uppercase tracking-wider">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">23%</p>
                <p className="text-sm text-white/50 uppercase tracking-wider">Avg. Improvement</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">Elite</p>
                <p className="text-sm text-white/50 uppercase tracking-wider">Level Protocol</p>
              </div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
            >
              <div className="w-1 h-2 rounded-full bg-white/50" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
