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
      {/* N with integrated infinity loop - premium cognitive symbol */}
      {/* Left vertical stroke of N */}
      <path
        d="M5 18V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Infinity loop flowing through the N diagonal */}
      <path
        d="M5 6C5 6 8 6 10 9C12 12 12 12 12 12C12 12 12 12 14 9C16 6 19 6 19 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5 18C5 18 8 18 10 15C12 12 12 12 12 12C12 12 12 12 14 15C16 18 19 18 19 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right vertical stroke of N */}
      <path
        d="M19 6V18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Neural node at the intersection */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
