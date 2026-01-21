interface NeuroLoopLogoProps {
  size?: number;
  className?: string;
}

export function NeuroLoopLogo({ size = 24, className }: NeuroLoopLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Simplified N with single flowing loop */}
      {/* Left vertical stroke */}
      <path
        d="M5 18V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Single diagonal loop curve */}
      <path
        d="M5 6C8 6 12 12 12 12C12 12 16 18 19 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right vertical stroke */}
      <path
        d="M19 6V18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Neural node at center */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
