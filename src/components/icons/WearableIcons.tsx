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

// Smartwatch with heart icon (wearable health tracker)
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
    {/* Watch band top */}
    <rect x="9" y="2" width="6" height="4" rx="1" />
    {/* Watch band bottom */}
    <rect x="9" y="18" width="6" height="4" rx="1" />
    {/* Watch case (circle) */}
    <circle cx="12" cy="12" r="6.5" />
    {/* Side button/crown */}
    <path d="M18.5 11v2" strokeWidth="2" />
    {/* Heart icon inside */}
    <path d="M12 15.5C12 15.5 8.5 13 8.5 10.8C8.5 9.5 9.5 8.8 10.5 8.8C11.3 8.8 12 9.4 12 9.4C12 9.4 12.7 8.8 13.5 8.8C14.5 8.8 15.5 9.5 15.5 10.8C15.5 13 12 15.5 12 15.5Z" />
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
