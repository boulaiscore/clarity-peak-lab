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
      {/* Abstract broken ring - neural loop symbol */}
      {/* Main arc - 270 degrees */}
      <path
        d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Neural spark/accent at the gap - suggesting neural activity */}
      <circle cx="19" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}
