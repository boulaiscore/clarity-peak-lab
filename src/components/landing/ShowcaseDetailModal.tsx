import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ShowcaseSlide {
  detailScreenshot: string;
  detailHeadline: string;
  detailDescription: string;
  testimonial?: string;
  testimonialAuthor?: string;
}

interface ShowcaseDetailModalProps {
  isOpen: boolean;
  slide: ShowcaseSlide | null;
  onClose: () => void;
}

export function ShowcaseDetailModal({
  isOpen,
  slide,
  onClose,
}: ShowcaseDetailModalProps) {
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  if (!slide) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet - Mobile: scrollable, stacked layout */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white md:bg-[#0a0a0a] rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-black/20 md:bg-white/20 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 md:bg-white/10 hover:bg-black/20 md:hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 text-black md:text-white" />
            </button>

            {/* Mobile Layout - stacked like WHOOP reference */}
            <div className="md:hidden px-6 pb-8">
              {/* iPhone Mockup centered */}
              <div className="flex justify-center mb-6">
                <div className="relative w-56 aspect-[9/16] bg-[#1a1a1a] rounded-[2rem] border-[3px] border-[#2a2a2a] shadow-2xl overflow-hidden">
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
                  
                  {/* Screen content */}
                  <div className="absolute inset-[3px] rounded-[1.8rem] overflow-hidden bg-[#0d1117]">
                    <img
                      src={slide.detailScreenshot}
                      alt={slide.detailHeadline}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  
                  {/* Screen reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[2rem]" />
                </div>
              </div>

              {/* Text content below - left aligned like WHOOP */}
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-2xl font-bold text-black mb-4 tracking-tight leading-tight"
              >
                {slide.detailHeadline}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-black/70 text-base leading-relaxed mb-6"
              >
                {slide.detailDescription}
              </motion.p>

              {/* Testimonial on mobile */}
              {slide.testimonial && slide.testimonialAuthor && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="bg-primary/10 rounded-xl p-4"
                >
                  <p className="text-black/50 text-xs uppercase tracking-wider mb-2">
                    What our members say
                  </p>
                  <p className="text-black text-base italic leading-relaxed mb-3">
                    "{slide.testimonial}"
                  </p>
                  <p className="text-black font-semibold text-sm">{slide.testimonialAuthor}</p>
                </motion.div>
              )}
            </div>

            {/* Desktop Layout - side by side */}
            <div className="hidden md:flex flex-row items-start justify-center gap-16 px-12 pb-10 pt-4 max-w-6xl mx-auto">
              {/* iPhone Mockup - larger */}
              <div className="relative flex-shrink-0">
                <div className="relative w-96 aspect-[9/16] bg-[#1a1a1a] rounded-[3rem] border-[4px] border-[#2a2a2a] shadow-2xl overflow-hidden">
                  {/* Dynamic Island */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-10" />
                  
                  {/* Screen content */}
                  <div className="absolute inset-[4px] rounded-[2.7rem] overflow-hidden bg-[#0d1117]">
                    <img
                      src={slide.detailScreenshot}
                      alt={slide.detailHeadline}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  
                  {/* Screen reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[3rem]" />
                </div>
              </div>

              {/* Text content - right side */}
              <div className="max-w-md pt-8">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-3xl lg:text-4xl font-bold text-white mb-6 tracking-tight leading-tight"
                >
                  {slide.detailHeadline}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-white/70 text-lg leading-relaxed mb-8"
                >
                  {slide.detailDescription}
                </motion.p>

                {/* Testimonial on desktop */}
                {slide.testimonial && slide.testimonialAuthor && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="bg-white/10 rounded-xl p-5"
                  >
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                      What our members say
                    </p>
                    <p className="text-white text-base italic leading-relaxed mb-3">
                      "{slide.testimonial}"
                    </p>
                    <p className="text-white font-semibold text-sm">{slide.testimonialAuthor}</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
