/**
 * MeditationIcon - Custom SVG icon for meditation/zen
 * Adapts to theme using currentColor
 */

interface MeditationIconProps {
  className?: string;
}

export function MeditationIcon({ className = "w-4 h-4" }: MeditationIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head */}
      <circle cx="12" cy="4" r="2.5" />
      {/* Body */}
      <path d="M12 6.5v4" />
      {/* Arms in prayer position */}
      <path d="M9 9c-1.5 0.5-2 2-2 3" />
      <path d="M15 9c1.5 0.5 2 2 2 3" />
      {/* Hands together */}
      <path d="M10 11.5c0 1 1 2 2 2s2-1 2-2" />
      {/* Crossed legs */}
      <path d="M7 18c1-2 3-3 5-3s4 1 5 3" />
      <path d="M6 20c2-1 4-1.5 6-1.5s4 0.5 6 1.5" />
      <path d="M8 17c1.5 1 2.5 2 4 2s2.5-1 4-2" />
    </svg>
  );
}
