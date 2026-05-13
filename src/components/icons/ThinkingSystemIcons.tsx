/**
 * Custom premium thinking-system marks.
 * Designed in-house for LOOMA — minimal, geometric, WHOOP/Oura-grade.
 *
 * SystemOneMark — "Fast / Intuitive"
 *   A focal node with two outward arcs: an instant pulse, a signal already
 *   travelling outward before deliberation begins.
 *
 * SystemTwoMark — "Slow / Deliberate"
 *   A precise ring traversed by a single node on a methodical horizon:
 *   sustained attention along a chosen path.
 */

type Props = {
  className?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export function SystemOneMark({
  className,
  color = "currentColor",
  size = 24,
  strokeWidth = 1.25,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Focal node — origin of the impulse */}
      <circle cx="7.5" cy="12" r="1.6" fill={color} stroke="none" />
      {/* Inner arc — first pulse */}
      <path d="M11 8.5 A 5 5 0 0 1 11 15.5" />
      {/* Outer arc — propagation */}
      <path d="M14.5 6.5 A 8.5 8.5 0 0 1 14.5 17.5" opacity="0.55" />
      {/* Far arc — fading echo */}
      <path d="M18 5 A 12 12 0 0 1 18 19" opacity="0.25" />
    </svg>
  );
}

export function SystemTwoMark({
  className,
  color = "currentColor",
  size = 24,
  strokeWidth = 1.25,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Outer ring — the deliberate orbit */}
      <circle cx="12" cy="12" r="8.25" />
      {/* Horizon — precise reference axis */}
      <line x1="3" y1="12" x2="21" y2="12" opacity="0.35" />
      {/* Inner mark — tight focal core */}
      <circle cx="12" cy="12" r="1.4" fill={color} stroke="none" />
      {/* Traversing node on the orbit — sustained attention */}
      <circle cx="20.25" cy="12" r="1.15" fill={color} stroke="none" />
    </svg>
  );
}
