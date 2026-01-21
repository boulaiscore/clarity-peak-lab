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
      {/* Minimalist N with integrated loop curve - Whoop/Oura inspired */}
      {/* Single continuous stroke forming N with flowing loop */}
      <path
        d="M6 18V6L18 18V6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Subtle loop accent - small arc suggesting continuity */}
      <path
        d="M6 6C6 4 8 3 10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}
