import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

// WHOOP-style band icon (minimalist fitness band)
export const WhoopIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("", className)}
  >
    {/* Band strap */}
    <path d="M8 4v16" />
    <path d="M16 4v16" />
    {/* Main module (rectangular) */}
    <rect x="8" y="7" width="8" height="10" rx="2" />
    {/* Inner sensor dots */}
    <circle cx="10.5" cy="12" r="0.5" fill="currentColor" />
    <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    <circle cx="13.5" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

// Oura Ring icon (minimalist ring shape)
export const OuraIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("", className)}
  >
    {/* Outer ring */}
    <ellipse cx="12" cy="12" rx="8" ry="6" />
    {/* Inner ring (hole) */}
    <ellipse cx="12" cy="12" rx="5" ry="3.5" />
    {/* Subtle sensor indicator on top */}
    <path d="M9 7.5a3 3 0 0 1 6 0" strokeWidth="2" />
  </svg>
);

// Garmin-style sports watch icon
export const GarminIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("", className)}
  >
    {/* Watch straps */}
    <path d="M12 4V2" />
    <path d="M12 22v-2" />
    {/* Rugged watch case */}
    <rect x="6" y="5" width="12" height="14" rx="3" />
    {/* Screen bezel */}
    <rect x="8" y="7" width="8" height="10" rx="1.5" />
    {/* Simple data display lines */}
    <path d="M10 10h4" />
    <path d="M10 12.5h4" />
    <path d="M10 15h2" />
    {/* Side buttons */}
    <path d="M18 9h1" />
    <path d="M18 12h1" />
  </svg>
);

// Generic wearable icon
export const OtherWearableIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("", className)}
  >
    {/* Generic device */}
    <rect x="7" y="6" width="10" height="12" rx="2" />
    {/* Screen */}
    <rect x="9" y="8" width="6" height="6" rx="1" />
    {/* Bottom indicator */}
    <circle cx="12" cy="16" r="1" />
    {/* Connection indicator */}
    <path d="M10 3l2 2 2-2" />
    <path d="M10 21l2-2 2 2" />
  </svg>
);

// Apple Health icon (heart + activity)
export const AppleHealthIcon = ({ className, size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("", className)}
  >
    {/* Heart shape */}
    <path d="M12 21C12 21 4 14.5 4 9.5C4 6.5 6.5 4 9.5 4C11.04 4 12 5 12 5C12 5 12.96 4 14.5 4C17.5 4 20 6.5 20 9.5C20 14.5 12 21 12 21Z" />
    {/* Pulse line inside heart */}
    <path d="M7 12h2l1.5-2 2 4 1.5-2h3" strokeWidth="1.5" />
  </svg>
);
