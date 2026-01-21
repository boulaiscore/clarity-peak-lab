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
      {/* Premium N with neural curve - elegant thin strokes */}
      {/* Left vertical */}
      <path
        d="M6 19V5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Flowing neural curve connecting the strokes */}
      <path
        d="M6 5C6 5 9 8 12 12C15 16 18 19 18 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Right vertical */}
      <path
        d="M18 5V19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Small neural node accent */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
