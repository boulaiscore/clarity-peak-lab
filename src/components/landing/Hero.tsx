import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import landingWorking from "@/assets/landing-working.mp4";
import landingReading from "@/assets/landing-reading.mp4";
import landingPodcast from "@/assets/landing-podcast.mp4";
import landingNatureWalk from "@/assets/landing-nature-walk.mp4";

const videos = [
  { src: landingWorking, label: "Deep Work with NeuroLoop" },
  { src: landingReading, label: "Reading with NeuroLoop" },
  { src: landingPodcast, label: "Learning with NeuroLoop" },
  { src: landingNatureWalk, label: "Recovery with NeuroLoop" },
];

export function Hero() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [nextVideo, setNextVideo] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Preload all videos on mount
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.load();
      }
    });
  }, []);

  // Handle transition to next video
  const transitionToNext = () => {
    if (isTransitioning) return;
    
    const next = (currentVideo + 1) % videos.length;
    setNextVideo(next);
    setIsTransitioning(true);
    
    // Start playing next video before transition
    const nextVideoEl = videoRefs.current[next];
    if (nextVideoEl) {
      nextVideoEl.currentTime = 0;
      nextVideoEl.play();
    }
    
    // Complete transition after fade
    setTimeout(() => {
      setCurrentVideo(next);
      setIsTransitioning(false);
    }, 1500);
  };

  // Listen for video end event
  useEffect(() => {
    const currentVideoEl = videoRefs.current[currentVideo];
    if (currentVideoEl) {
      currentVideoEl.addEventListener('ended', transitionToNext);
      return () => currentVideoEl.removeEventListener('ended', transitionToNext);
    }
  }, [currentVideo, isTransitioning]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Video Background - All videos stacked, opacity controlled */}
      <div className="absolute inset-0 z-0">
        {videos.map((video, index) => (
          <video
            key={index}
            ref={(el) => (videoRefs.current[index] = el)}
            autoPlay={index === 0}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1500 ease-in-out"
            style={{
              opacity: index === currentVideo 
                ? (isTransitioning ? 0 : 0.5)
                : index === nextVideo && isTransitioning 
                  ? 0.5 
                  : 0,
              zIndex: index === currentVideo ? 1 : index === nextVideo ? 2 : 0,
            }}
          >
            <source src={video.src} type="video/mp4" />
          </video>
        ))}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50 z-10" />
      </div>

      {/* NeuroLoop Badge - WHOOP style */}
      <motion.div
        key={currentVideo}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-36 sm:bottom-40 left-6 sm:left-10 z-20"
      >
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs sm:text-sm text-white/80 font-medium tracking-wide">
            {videos[currentVideo].label}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container relative z-20 px-6 pt-24 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Main Headline - Clean, elegant, no bold */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-[-0.02em] mb-6 leading-[1.1] text-white"
          >
            Master your
            <br />
            <span className="text-primary">mental edge.</span>
          </motion.h1>

          {/* Subheadline - light, simple */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-xl mx-auto mb-8 leading-relaxed font-light"
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
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-10 h-14 text-lg"
            >
              <Link to="/download">
                Start Training
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats - clean, minimal - moved inside content block */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 sm:mt-20"
          >
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">23%</p>
                <p className="text-xs text-white/50 uppercase tracking-[0.15em]">Avg. Improvement</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">2M+</p>
                <p className="text-xs text-white/50 uppercase tracking-[0.15em]">Sessions</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">Elite</p>
                <p className="text-xs text-white/50 uppercase tracking-[0.15em]">Protocol</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Video indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {videos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (index !== currentVideo) {
                setNextVideo(index);
                setIsTransitioning(true);
                const nextVideoEl = videoRefs.current[index];
                if (nextVideoEl) {
                  nextVideoEl.currentTime = 0;
                  nextVideoEl.play();
                }
                setTimeout(() => {
                  setCurrentVideo(index);
                  setIsTransitioning(false);
                }, 1500);
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentVideo ? "bg-primary w-6" : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
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
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
