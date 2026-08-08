/**
 * BaselineStatusCard - Shows calibration CTA when baseline is estimated (skipped)
 * Only renders when calibration is needed - disappears once calibrated
 */

import { Link } from "react-router-dom";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { MonitorPanel } from "./MonitorUI";

export function BaselineStatusCard() {
  const { calibrationStatus, isLoading, AE0_eff } = useBaselineStatus();
  
  // Don't render if loading or no baseline data
  if (isLoading || AE0_eff === null) return null;
  
  // Don't render if already calibrated - no need to show anything
  if (calibrationStatus === "completed") return null;
  
  // Show CTA for skipped or not_started
  return (
    <Link to="/app/calibration" className="block group">
      <MonitorPanel className="flex items-center gap-3 p-3 transition-colors group-hover:bg-card/55">
        <span className="rounded-md border border-border/40 bg-muted/30 px-2 py-1 text-[9px] font-semibold tracking-wider text-muted-foreground">
          BASE
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-foreground">Estimated baseline</p>
          <p className="mt-0.5 text-[9px] text-muted-foreground">Calibrate to improve personal comparisons</p>
        </div>
        <span className="text-[10px] font-medium text-foreground/75 group-hover:text-foreground">Calibrate</span>
      </MonitorPanel>
    </Link>
  );
}
