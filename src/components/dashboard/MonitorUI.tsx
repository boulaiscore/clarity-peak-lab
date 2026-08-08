import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppPanel } from "@/components/app/AppUI";

interface MonitorSegmentOption<T extends string> {
  value: T;
  label: string;
}

interface MonitorSegmentedControlProps<T extends string> {
  ariaLabel: string;
  value: T;
  options: readonly MonitorSegmentOption<T>[];
  onChange: (value: T) => void;
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
        "grid gap-1 rounded-xl border border-border/30 bg-muted/25 p-1",
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
              "min-h-9 rounded-lg px-2 text-[11px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/30"
                : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
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
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">
            {eyebrow}
          </p>
        )}
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
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
  return <AppPanel className={className}>{children}</AppPanel>;
}
