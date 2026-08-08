import {
  AttentionalEfficiencyMark,
  CriticalThinkingMark,
  InsightMark,
  RapidAssociationMark,
} from "@/components/icons/SubSkillIcons";
import { SystemOneMark, SystemTwoMark } from "@/components/icons/ThinkingSystemIcons";

export type ProductMarkName =
  | "system-fast"
  | "system-slow"
  | "attention"
  | "association"
  | "critical-thinking"
  | "insight";

interface ProductMarkProps {
  name: ProductMarkName;
  className?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

const PRODUCT_MARKS = {
  "system-fast": SystemOneMark,
  "system-slow": SystemTwoMark,
  attention: AttentionalEfficiencyMark,
  association: RapidAssociationMark,
  "critical-thinking": CriticalThinkingMark,
  insight: InsightMark,
} satisfies Record<ProductMarkName, React.ElementType>;

/**
 * Canonical LOOMA mark for cognitive systems and domains.
 * Lucide remains reserved for universal controls and explicit UI states.
 */
export function ProductMark({
  name,
  className,
  color = "currentColor",
  size = 20,
  strokeWidth = 1.25,
}: ProductMarkProps) {
  const Mark = PRODUCT_MARKS[name];

  return (
    <Mark
      className={className}
      color={color}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
