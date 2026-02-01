import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, duration + 500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#0a0b0f" }}
    >
      <svg
        width={80}
        height={80}
        viewBox="0 0 24 24"
        fill="none"
        className="text-white animate-pulse"
      >
        <path
          d="M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="18.4" cy="5.6" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}

