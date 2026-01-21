import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ShowcaseSlide {
  detailScreenshot: string;
  detailHeadline: string;
  detailDescription: string;
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

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] rounded-t-3xl max-h-[90vh] overflow-hidden"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Content container */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 px-6 pb-10 pt-4 max-w-4xl mx-auto">
              {/* iPhone Mockup */}
              <div className="relative flex-shrink-0">
                {/* iPhone frame */}
                <div className="relative w-48 sm:w-56 aspect-[9/19.5] bg-[#1a1a1a] rounded-[2rem] sm:rounded-[2.5rem] border-[3px] border-[#2a2a2a] shadow-2xl overflow-hidden">
                  {/* Dynamic Island */}
                  <div className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 bg-black rounded-full z-10" />
                  
                  {/* Screen content - using object-contain to show full screenshot */}
                  <div className="absolute inset-[3px] rounded-[1.8rem] sm:rounded-[2.2rem] overflow-hidden bg-[#0d1117]">
                    <img
                      src={slide.detailScreenshot}
                      alt={slide.detailHeadline}
                      className="w-full h-full object-contain object-center"
                    />
                  </div>
                  
                  {/* Screen reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[2rem] sm:rounded-[2.5rem]" />
                </div>
              </div>

              {/* Text content */}
              <div className="max-w-sm text-center md:text-left">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 tracking-tight"
                >
                  {slide.detailHeadline}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-white/70 text-sm sm:text-base leading-relaxed"
                >
                  {slide.detailDescription}
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
