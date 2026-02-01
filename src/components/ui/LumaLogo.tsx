interface LumaLogoProps {
  size?: number;
  className?: string;
}

export function LumaLogo({ size = 24, className }: LumaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Open circle / loop logo - elegant thin stroke */}
      <path
        d="M12 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Neural node at the opening */}
      <circle cx="18.4" cy="5.6" r="1.5" fill="currentColor" />
    </svg>
  );
}
