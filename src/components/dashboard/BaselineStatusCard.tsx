/**
 * BaselineStatusCard - Shows calibration CTA when baseline is estimated (skipped)
 * Only renders when calibration is needed - disappears once calibrated
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FlaskConical, ChevronRight } from "lucide-react";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { cn } from "@/lib/utils";

export function BaselineStatusCard() {
  const { calibrationStatus, isLoading, AE0_eff } = useBaselineStatus();
  
  // Don't render if loading or no baseline data
  if (isLoading || AE0_eff === null) return null;
  
  // Don't render if already calibrated - no need to show anything
  if (calibrationStatus === "completed") return null;
  
  // Show CTA for skipped or not_started
  return (
    <Link to="/app/calibration">
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2.5 rounded-lg",
          "bg-gradient-to-r from-amber-500/10 to-amber-500/5",
          "border border-amber-500/20",
          "hover:border-amber-500/40 hover:bg-amber-500/15",
          "transition-all cursor-pointer group"
        )}
      >
        <div className="p-1.5 rounded-md bg-amber-500/20">
          <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-foreground">
            Estimated Baseline
          </p>
          <p className="text-[9px] text-muted-foreground">
            Tap to calibrate for personalized metrics
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
      </motion.div>
    </Link>
  );
}
