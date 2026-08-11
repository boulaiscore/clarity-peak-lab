import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getRecoveryColor } from "@/lib/recovery/display";

const SEGMENTS = 20;

interface RecoveryScaleProps {
  value: number;
  isLoading?: boolean;
  size?: "compact" | "hero";
  className?: string;
}

export function RecoveryScale({
  value,
  isLoading = false,
  size = "compact",
  className,
}: RecoveryScaleProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const filled = isLoading ? 0 : Math.round((normalized / 100) * SEGMENTS);
  const color = getRecoveryColor(normalized);
  const isHero = size === "hero";

  return (
    <div
      className={cn("space-y-2", className)}
      role="img"
      aria-label={isLoading ? "Recovery loading" : `Recovery ${Math.round(normalized)} out of 100`}
    >
      <div className={cn("flex items-end", isHero ? "h-4 gap-0.5" : "h-2.5 gap-px")}>
        {Array.from({ length: SEGMENTS }).map((_, index) => {
          const active = index < filled;

          return (
            <motion.div
              key={index}
              initial={{ scaleY: 0.4, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.05 + index * 0.018, ease: "easeOut" }}
              className="flex-1 rounded-[2px] origin-bottom"
              style={{
                height: active ? "100%" : "50%",
                backgroundColor: active ? color : "hsl(var(--muted) / 0.35)",
                boxShadow: active ? `0 0 6px ${color}40` : "none",
              }}
            />
          );
        })}
      </div>

      <div
        className={cn(
          "flex justify-between font-medium uppercase text-muted-foreground/50",
          isHero ? "text-[9px] tracking-[0.17em]" : "text-[8px] tracking-[0.15em]",
        )}
      >
        <span>Depleted</span>
        <span>Partial</span>
        <span>Optimal</span>
      </div>
    </div>
  );
}

interface RecoveryScoreBarProps {
  value: number;
  status: string;
  isLoading?: boolean;
  note?: string;
}

export function RecoveryScoreBar({
  value,
  status,
  isLoading = false,
  note,
}: RecoveryScoreBarProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const color = getRecoveryColor(normalized);

  return (
    <section className="rounded-xl border border-border/40 bg-card/40 px-5 py-5">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground/75">
            Cognitive Recovery
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-normal leading-none tracking-tight text-foreground tabular-nums">
              {isLoading ? "—" : Math.round(normalized)}
            </span>
            {!isLoading && <span className="text-lg text-muted-foreground/55">%</span>}
          </div>
        </div>

        <span
          className="pb-1 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: isLoading ? "hsl(var(--muted-foreground))" : color }}
        >
          {isLoading ? "Loading" : status}
        </span>
      </div>

      <RecoveryScale value={normalized} isLoading={isLoading} size="hero" />

      {note && !isLoading && (
        <p className="mt-4 text-[10px] text-muted-foreground/60">{note}</p>
      )}
    </section>
  );
}
