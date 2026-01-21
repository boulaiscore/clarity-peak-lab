import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useCallback } from "react";

interface ShowcaseSlide {
  detailScreenshot: string;
  detailHeadline: string;
  detailDescription: string;
}

interface ShowcaseDetailModalProps {
  isOpen: boolean;
  slideIndex: number;
  slides: ShowcaseSlide[];
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ShowcaseDetailModal({
  isOpen,
  slideIndex,
  slides,
  onClose,
  onNavigate,
}: ShowcaseDetailModalProps) {
  const currentSlide = slides[slideIndex];
  const totalSlides = slides.length;

  const handlePrev = useCallback(() => {
    onNavigate(slideIndex === 0 ? totalSlides - 1 : slideIndex - 1);
  }, [slideIndex, totalSlides, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate(slideIndex === totalSlides - 1 ? 0 : slideIndex + 1);
  }, [slideIndex, totalSlides, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!currentSlide) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Navigation arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* Content container */}
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-16 py-12 max-w-5xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iPhone Mockup */}
            <div className="relative flex-shrink-0">
              {/* iPhone frame */}
              <div className="relative w-56 sm:w-64 aspect-[9/19.5] bg-[#1a1a1a] rounded-[2.5rem] sm:rounded-[3rem] border-[3px] border-[#2a2a2a] shadow-2xl overflow-hidden">
                {/* Dynamic Island */}
                <div className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-5 sm:h-6 bg-black rounded-full z-10" />
                
                {/* Screen content */}
                <div className="absolute inset-[3px] rounded-[2.2rem] sm:rounded-[2.7rem] overflow-hidden bg-black">
                  <img
                    src={currentSlide.detailScreenshot}
                    alt={currentSlide.detailHeadline}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                
                {/* Screen reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[2.5rem] sm:rounded-[3rem]" />
              </div>
            </div>

            {/* Text content */}
            <div className="max-w-md text-center md:text-left">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 tracking-tight"
              >
                {currentSlide.detailHeadline}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-white/70 text-base sm:text-lg leading-relaxed"
              >
                {currentSlide.detailDescription}
              </motion.p>

              {/* Slide indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex justify-center md:justify-start gap-2 mt-6 sm:mt-8"
              >
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onNavigate(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === slideIndex
                        ? "bg-white w-6"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
