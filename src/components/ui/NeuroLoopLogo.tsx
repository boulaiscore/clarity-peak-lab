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
      {/* Main arc - open at top right */}
      <path
        d="M18 4.5C16.5 3.5 14.5 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 10 20.5 8.2 19.5 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Neural nodes at gap ends - like synaptic terminals */}
      <circle cx="18" cy="4.5" r="1.8" fill="currentColor" />
      <circle cx="19.5" cy="6.5" r="1.8" fill="currentColor" />
      {/* Synaptic connection spark between nodes */}
      <path
        d="M18.3 5.2L19 6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
