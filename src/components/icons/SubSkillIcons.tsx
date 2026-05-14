/**
 * Sub-skill marks — WHOOP-grade.
 * Thin-line, geometric, monochrome. Designed to read at 24–32px on a dark
 * surface with a subtle accent tint. No fills except small focal nodes.
 *
 *  AE — Attentional Efficiency  → concentric reticle, single focal node
 *  RA — Rapid Association       → three nodes, one in-flight signal
 *  CT — Critical Thinking       → balanced fulcrum, split evidence
 *  IN — Insight                  → ascending arc to a single emergent point
 */

type Props = {
  className?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
};

const base = (extra?: string) =>
  ["transition-colors", extra].filter(Boolean).join(" ");

export function AttentionalEfficiencyMark({
  className,
  color = "currentColor",
  size = 28,
  strokeWidth = 1.1,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      aria-hidden="true"
    >
      {/* Outer reticle */}
      <circle cx="16" cy="16" r="11" opacity="0.35" />
      {/* Inner reticle */}
      <circle cx="16" cy="16" r="6.5" opacity="0.7" />
      {/* Cardinal ticks */}
      <line x1="16" y1="2.5" x2="16" y2="5.5" />
      <line x1="16" y1="26.5" x2="16" y2="29.5" />
      <line x1="2.5" y1="16" x2="5.5" y2="16" />
      <line x1="26.5" y1="16" x2="29.5" y2="16" />
      {/* Focal node */}
      <circle cx="16" cy="16" r="1.6" fill={color} stroke="none" />
    </svg>
  );
}

export function RapidAssociationMark({
  className,
  color = "currentColor",
  size = 28,
  strokeWidth = 1.1,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      aria-hidden="true"
    >
      {/* Triangulated link lines */}
      <line x1="7" y1="9" x2="24" y2="11" opacity="0.55" />
      <line x1="24" y1="11" x2="13" y2="24" opacity="0.55" />
      <line x1="13" y1="24" x2="7" y2="9" opacity="0.25" />
      {/* In-flight signal dot — caught mid-association */}
      <circle cx="18.5" cy="10.3" r="1.1" fill={color} stroke="none" />
      {/* Three semantic nodes */}
      <circle cx="7" cy="9" r="2.2" />
      <circle cx="24" cy="11" r="2.2" />
      <circle cx="13" cy="24" r="2.2" />
      {/* Focal (origin) */}
      <circle cx="7" cy="9" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}

export function CriticalThinkingMark({
  className,
  color = "currentColor",
  size = 28,
  strokeWidth = 1.1,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      aria-hidden="true"
    >
      {/* Vertical axis — the chosen frame */}
      <line x1="16" y1="5" x2="16" y2="27" opacity="0.45" />
      {/* Balance beam */}
      <line x1="6" y1="11" x2="26" y2="11" />
      {/* Suspension lines */}
      <line x1="9" y1="11" x2="9" y2="17" opacity="0.55" />
      <line x1="23" y1="11" x2="23" y2="17" opacity="0.55" />
      {/* Evidence pans */}
      <path d="M5.5 17 L12.5 17 L11 21 L7 21 Z" opacity="0.85" />
      <path d="M19.5 17 L26.5 17 L25 21 L21 21 Z" opacity="0.85" />
      {/* Fulcrum node */}
      <circle cx="16" cy="11" r="1.6" fill={color} stroke="none" />
    </svg>
  );
}

export function InsightMark({
  className,
  color = "currentColor",
  size = 28,
  strokeWidth = 1.1,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      aria-hidden="true"
    >
      {/* Faint baselines — the search space */}
      <line x1="4" y1="25" x2="28" y2="25" opacity="0.2" />
      <line x1="4" y1="20" x2="28" y2="20" opacity="0.2" />
      {/* Ascending hypothesis arc */}
      <path d="M5 25 Q 12 24, 16 16 T 26 6" opacity="0.85" />
      {/* Faint earlier attempt */}
      <path d="M5 25 Q 11 23, 14 19" opacity="0.3" />
      {/* Emergent insight point */}
      <circle cx="26" cy="6" r="1.8" fill={color} stroke="none" />
      {/* Subtle radiance */}
      <line x1="26" y1="2.5" x2="26" y2="3.6" opacity="0.6" />
      <line x1="29.2" y1="6" x2="30.2" y2="6" opacity="0.6" />
      <line x1="28.4" y1="3.4" x2="29.2" y2="2.6" opacity="0.45" />
    </svg>
  );
}
