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
      {/* N letter - left vertical stroke */}
      <path
        d="M5 19V5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* N letter - diagonal stroke */}
      <path
        d="M5 5L19 19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* N letter - right vertical stroke */}
      <path
        d="M19 5V19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Neural node - small accent dot */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
