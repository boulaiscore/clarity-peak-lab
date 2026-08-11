import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MonitorSegmentOption<T extends string> {
  value: T;
  label: string;
}

interface MonitorSegmentedControlProps<T extends string> {
  ariaLabel: string;
  value: T;
  options: readonly MonitorSegmentOption<NoInfer<T>>[];
  onChange: (value: NoInfer<T>) => void;
  className?: string;
}

export function MonitorSegmentedControl<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
  className,
}: MonitorSegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "grid gap-0.5 rounded-[11px] border border-white/[0.055] bg-black/20 p-[3px]",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-8 rounded-[8px] px-2 text-[10px] font-semibold uppercase tracking-[0.11em] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive
                ? "bg-white/[0.075] text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)]"
                : "text-muted-foreground/65 hover:bg-white/[0.035] hover:text-foreground/85",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface MonitorSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function MonitorSectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: MonitorSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        align === "center" && "text-center",
        className,
      )}
    >
      <div className={cn("min-w-0", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/55">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 max-w-sm text-[10px] leading-relaxed text-muted-foreground/75">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface MonitorPanelProps {
  children: ReactNode;
  className?: string;
}

export function MonitorPanel({ children, className }: MonitorPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-white/[0.055] bg-gradient-to-b from-white/[0.045] to-white/[0.018] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
