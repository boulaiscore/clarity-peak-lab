/**
 * Custom SVG icons for game categories
 * Premium thin-line style inspired by WHOOP
 */

import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

/**
 * S1-AE: Attentional Efficiency
 * Crosshair with centered dot - precision & focus
 */
export function AttentionalEfficiencyIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={cn("w-4 h-4", className)}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="8" />
      {/* Crosshair lines */}
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * S1-RA: Rapid Association
 * Three connected nodes - intuitive links
 */
export function RapidAssociationIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={cn("w-4 h-4", className)}
    >
      {/* Connection lines */}
      <line x1="6" y1="6" x2="12" y2="12" />
      <line x1="12" y1="12" x2="18" y2="6" />
      <line x1="12" y1="12" x2="12" y2="19" />
      {/* Nodes */}
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="19" r="2.5" />
      {/* Center node */}
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * S2-CT: Critical Thinking
 * Prism with light refraction - analysis & decomposition
 */
export function CriticalThinkingIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4", className)}
    >
      {/* Prism triangle */}
      <polygon points="12,3 4,19 20,19" fill="none" />
      {/* Light beam entering */}
      <line x1="2" y1="10" x2="8" y2="12" />
      {/* Refracted rays exiting */}
      <line x1="16" y1="11" x2="22" y2="7" />
      <line x1="17" y1="13" x2="22" y2="13" />
      <line x1="16" y1="15" x2="22" y2="19" />
    </svg>
  );
}

/**
 * S2-IN: Insight
 * Rising arc with spark - moment of clarity
 */
export function InsightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={cn("w-4 h-4", className)}
    >
      {/* Rising arc */}
      <path d="M4 18 Q 12 4, 20 12" />
      {/* Spark at peak */}
      <circle cx="18" cy="8" r="2" fill="currentColor" stroke="none" />
      {/* Radiating lines from spark */}
      <line x1="18" y1="4" x2="18" y2="2" />
      <line x1="21" y1="6" x2="23" y2="5" />
      <line x1="22" y1="10" x2="24" y2="11" />
    </svg>
  );
}

/**
 * S1 System Icon - Fast/Intuitive
 * Single quick pulse
 */
export function System1Icon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4", className)}
    >
      {/* Single sharp pulse */}
      <polyline points="2,12 8,12 10,6 14,18 16,12 22,12" />
    </svg>
  );
}

/**
 * S2 System Icon - Slow/Deliberate
 * Smooth wave pattern
 */
export function System2Icon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={cn("w-4 h-4", className)}
    >
      {/* Smooth sine wave */}
      <path d="M2 12 Q 6 6, 12 12 T 22 12" />
    </svg>
  );
}
