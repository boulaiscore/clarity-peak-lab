import { NeuroLoopLogo } from "@/components/ui/NeuroLoopLogo";
import { cn } from "@/lib/utils";

interface NeuroLoopWordmarkProps {
  /** Controls the size of the logo mark (the N). */
  logoSize?: number;
  /**
   * If true, renders the wordmark in all caps (logo + "EUROLOOP").
   * If false, renders title case (logo + "euroLoop").
   */
  uppercase?: boolean;
  /** Optional text after the brand (e.g. " PRO"). */
  suffix?: string;
  className?: string;
  logoClassName?: string;
  textClassName?: string;
}

/**
 * NeuroLoop wordmark where the leading "N" is replaced by the NeuroLoop logo mark.
 * Example: [logo] + "euroLoop".
 */
export function NeuroLoopWordmark({
  logoSize = 22,
  uppercase = false,
  suffix,
  className,
  logoClassName,
  textClassName,
}: NeuroLoopWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <NeuroLoopLogo size={logoSize} className={logoClassName} />
      <span className={textClassName}>
        {uppercase ? "EUROLOOP" : "euroLoop"}
        {suffix ?? ""}
      </span>
    </span>
  );
}
