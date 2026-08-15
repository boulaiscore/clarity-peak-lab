import type { ReactNode } from "react";
import { LineChart } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function MetricDetailNavigation({
  onBack,
  backHref = "/app",
  trendHref = "/app/dashboard?tab=training&subtab=trends",
}: {
  onBack?: () => void;
  backHref?: string;
  trendHref?: string;
}) {
  const backClass =
    "px-4 py-1.5 rounded-full bg-muted/40 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/80 hover:bg-muted/60 transition-colors active:scale-[0.97]";

  return (
    <div className="flex items-center justify-between px-2">
      {onBack ? (
        <button type="button" onClick={onBack} className={backClass}>
          ← Today
        </button>
      ) : (
        <Link to={backHref} className={backClass}>
          ← Today
        </Link>
      )}
      <Link
        to={trendHref}
        className="p-2 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors active:scale-[0.97]"
        aria-label="View metric trends"
        title="View trends"
      >
        <LineChart className="w-4 h-4 text-foreground/70" />
      </Link>
    </div>
  );
}

export function MetricDetailHeader({
  title,
  description,
  context,
}: {
  title: string;
  description: string;
  context: string;
}) {
  return (
    <div className="text-center space-y-2 pt-2">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
        {context}
      </p>
    </div>
  );
}

export function MetricScoreRing({
  value,
  status,
  color,
  isLoading = false,
  note,
  rings,
}: {
  value: number | null;
  status: string;
  color: string;
  isLoading?: boolean;
  note?: string;
  /** Optional concentric sub-rings rendered inside the main ring (e.g. S1 / S2). */
  rings?: { label: string; value: number | null; color: string }[];
}) {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedValue = value == null ? 0 : Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;
  const displayValue = isLoading ? "—" : value == null ? "—" : Math.round(value).toString();

  const subRings = (rings ?? []).map((ring, index) => {
    const subStroke = 6;
    const subRadius = radius - strokeWidth / 2 - 10 - index * (subStroke + 6);
    const subCircumference = subRadius * 2 * Math.PI;
    const subValue = ring.value == null ? 0 : Math.max(0, Math.min(100, ring.value));
    return {
      ...ring,
      subStroke,
      subRadius,
      subCircumference,
      subOffset: subCircumference - (subValue / 100) * subCircumference,
    };
  });

  return (
    <div className="flex flex-col items-center py-4">
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={value == null ? `${status}, no score available` : `${Math.round(value)} out of 100, ${status}`}
      >
        <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted)/0.25)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          {subRings.map((ring) => (
            <g key={ring.label}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ring.subRadius}
                fill="none"
                stroke="hsl(var(--muted)/0.18)"
                strokeWidth={ring.subStroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={ring.subRadius}
                fill="none"
                stroke={ring.color}
                strokeWidth={ring.subStroke}
                strokeLinecap="round"
                strokeDasharray={ring.subCircumference}
                strokeDashoffset={ring.subOffset}
                className="transition-all duration-1000 ease-out"
              />
            </g>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${subRings.length > 0 ? "text-5xl" : "text-6xl"} font-bold tabular-nums text-foreground`}>
            {displayValue}
          </span>
          <span className="text-xs text-muted-foreground/75 mt-1">{isLoading ? "Loading" : status}</span>
          <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/40 mt-1">0–100</span>
        </div>
      </div>
      {subRings.length > 0 && !isLoading && (
        <div className="mt-3 flex items-center gap-5">
          {subRings.map((ring) => (
            <div key={ring.label} className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ring.color }}
                aria-hidden="true"
              />
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                {ring.label}
              </span>
              <span className="text-[11px] tabular-nums text-foreground/80">
                {ring.value == null ? "—" : Math.round(ring.value)}
              </span>
            </div>
          ))}
        </div>
      )}
      {note && !isLoading && (
        <p className="mt-3 text-[10px] text-muted-foreground/60">{note}</p>
      )}
    </div>
  );
}

export function MetricInterpretationNote({
  changeDrivers,
}: {
  changeDrivers: string;
}) {
  return (
    <aside className="rounded-xl border border-border/30 bg-card/35 px-4 py-3">
      <p className="text-[11px] font-medium text-foreground/85">
        Your signal, not a label.
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/75">
        This reflects current conditions inside LOOMA, not intelligence or a comparison with other people.
        It can change with {changeDrivers}.
      </p>
    </aside>
  );
}

export function MetricFactorsSection({
  title = "What makes up this score",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3" aria-labelledby="metric-factors-heading">
      <h3
        id="metric-factors-heading"
        className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground px-1"
      >
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

interface MetricFactorCardProps {
  code: string;
  name: string;
  description: string;
  value: number | string | null;
  weight: string;
  contribution: number | string | null;
  window: string;
  estimated?: boolean;
  contributionTone?: "default" | "negative" | "muted";
  onClick?: () => void;
}

function formatValue(value: number | string | null): string {
  if (value == null) return "—";
  return typeof value === "number" ? Math.round(value).toString() : value;
}

function formatContribution(value: number | string | null): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (Math.abs(value) < 0.05) return "0.0";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

export function MetricFactorCard({
  code,
  name,
  description,
  value,
  weight,
  contribution,
  window,
  estimated = false,
  contributionTone = "default",
  onClick,
}: MetricFactorCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="min-w-12 rounded-md border border-border/50 bg-background/45 px-2 py-1 text-center text-[10px] font-semibold tracking-[0.1em] text-foreground/80">
            {code}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-medium text-foreground">{name}</h4>
              {estimated && (
                <span className="rounded-full border border-border/50 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                  Estimated
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">{description}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/45">Value</div>
          <div className="mt-0.5 text-base font-semibold tabular-nums text-foreground">{formatValue(value)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[0.8fr_0.8fr_1.4fr] gap-3 border-t border-border/25 pt-3">
        <FactorDatum label="Weight" value={weight} />
        <FactorDatum
          label="Impact"
          value={formatContribution(contribution)}
          valueClassName={cn(
            contributionTone === "default" && "text-primary/85",
            contributionTone === "negative" && "text-amber-500",
            contributionTone === "muted" && "text-muted-foreground",
          )}
        />
        <FactorDatum label="Window" value={window} />
      </div>
    </>
  );

  const className = cn(
    "w-full rounded-xl border border-border/30 bg-card/50 p-4 text-left",
    onClick && "transition-colors hover:bg-card/80 active:bg-card",
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function FactorDatum({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground/45">{label}</div>
      <div className={cn("mt-1 text-[10px] leading-snug text-muted-foreground tabular-nums", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
