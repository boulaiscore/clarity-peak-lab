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
      {/* N with infinity loop integrated */}
      {/* Left vertical stroke */}
      <path
        d="M5 18V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Infinity loop forming the diagonal - figure 8 shape */}
      <path
        d="M5 6C7 6 9 9 12 12C15 15 17 18 19 18C17 18 15 15 12 12C9 9 7 6 5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right vertical stroke */}
      <path
        d="M19 6V18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Neural node at center intersection */}
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}
