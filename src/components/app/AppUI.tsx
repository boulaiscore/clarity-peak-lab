import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function AppPageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: AppPageHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/65">
          {eyebrow}
        </p>
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

interface AppPanelProps {
  children: ReactNode;
  className?: string;
}

export function AppPanel({ children, className }: AppPanelProps) {
  return (
    <div className={cn("rounded-2xl border border-border/30 bg-card/35", className)}>
      {children}
    </div>
  );
}
