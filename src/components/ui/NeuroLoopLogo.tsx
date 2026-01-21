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
      {/* WHOOP-style bold N - solid filled shape */}
      <path
        d="M4 20V4H8L16 14V4H20V20H16L8 10V20H4Z"
        fill="currentColor"
      />
    </svg>
  );
}
