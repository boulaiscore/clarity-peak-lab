import { motion } from "framer-motion";
import { ChevronRight, Check, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MonitorCardsRowProps {
  sharpness: number;
  readiness: number;
  recovery: number;
  rq: number;
  isLoading?: boolean;
}

/**
 * WHOOP-inspired pair of monitor cards under the rings.
 * - Cognitive Monitor: how many of the 4 metrics are within healthy range.
 * - Recovery Monitor: short status + recovery debt indicator.
 */
export function MonitorCardsRow({
  sharpness,
  readiness,
  recovery,
  rq,
  isLoading,
}: MonitorCardsRowProps) {
  const navigate = useNavigate();

  const metrics = [sharpness, readiness, recovery, rq];
  const inRange = metrics.filter((v) => v >= 55).length;
  const allInRange = inRange === 4;

  // Recovery monitor: derive a status label
  let recLabel = "Steady";
  let recValue = `${Math.round(recovery)}%`;
  if (recovery < 35) recLabel = "Critical";
  else if (recovery < 55) recLabel = "Low";
  else if (recovery < 75) recLabel = "Steady";
  else recLabel = "Optimal";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 }}
      className="grid grid-cols-2 gap-2 mb-3"
    >
      {/* Cognitive Monitor */}
      <button
        onClick={() => navigate("/app/dashboard")}
        className={cn(
          "group flex flex-col items-start text-left p-2.5 rounded-xl",
          "bg-card/40 border border-border/40 hover:bg-card/60 hover:border-border/60",
          "transition-colors active:scale-[0.99]",
        )}
      >
        <div className="flex items-center justify-between w-full mb-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
            Cognitive Monitor
          </span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/60 group-hover:text-foreground/80 transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-4 h-4 rounded-md flex items-center justify-center",
              allInRange ? "bg-emerald-500/15" : "bg-amber-500/15",
            )}
          >
            {allInRange ? (
              <Check className="w-2.5 h-2.5 text-emerald-400" />
            ) : (
              <span className="text-[8px] font-bold text-amber-400 leading-none">{inRange}</span>
            )}
          </span>
          <div className="flex flex-col leading-tight">
            <span
              className={cn(
                "text-[11px] font-semibold tracking-wide",
                allInRange ? "text-emerald-400" : "text-amber-400",
              )}
            >
              {isLoading ? "—" : allInRange ? "Within Range" : "Needs attention"}
            </span>
            <span className="text-[9px] text-muted-foreground/70">{inRange}/4 Metrics</span>
          </div>
        </div>
      </button>

      {/* Recovery Monitor */}
      <button
        onClick={() => navigate("/app/dashboard")}
        className={cn(
          "group flex flex-col items-start text-left p-2.5 rounded-xl",
          "bg-card/40 border border-border/40 hover:bg-card/60 hover:border-border/60",
          "transition-colors active:scale-[0.99]",
        )}
      >
        <div className="flex items-center justify-between w-full mb-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
            Recovery Monitor
          </span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/60 group-hover:text-foreground/80 transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-foreground/[0.06] flex items-center justify-center">
            <Activity className="w-2.5 h-2.5 text-foreground/70" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold text-foreground/90 tracking-wide">
              {isLoading ? "—" : recLabel}
            </span>
            <span className="text-[9px] text-muted-foreground/70">{recValue} battery</span>
          </div>
        </div>
      </button>
    </motion.section>
  );
}
