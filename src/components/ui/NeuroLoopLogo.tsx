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
      {/* Infinity/figure-8 loop representing neural feedback loop */}
      <path
        d="M8 12C8 9.5 6.5 8 4.5 8C2.5 8 1 9.5 1 12C1 14.5 2.5 16 4.5 16C6.5 16 8 14.5 8 12ZM8 12C8 9.5 9.5 7 12 7C14.5 7 16 9.5 16 12M16 12C16 14.5 17.5 16 19.5 16C21.5 16 23 14.5 23 12C23 9.5 21.5 8 19.5 8C17.5 8 16 9.5 16 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Central neural node at crossing point */}
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}
