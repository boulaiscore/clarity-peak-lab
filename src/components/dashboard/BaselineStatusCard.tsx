/**
 * BaselineStatusCard - Shows baseline type (estimated vs calibrated) 
 * and offers calibration if skipped - compact inline version
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FlaskConical, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { cn } from "@/lib/utils";

export function BaselineStatusCard() {
  const { calibrationStatus, isLoading, AE0_eff } = useBaselineStatus();
  
  if (isLoading || AE0_eff === null) return null;
  
  const isCalibrated = calibrationStatus === "completed";
  
  if (isCalibrated) {
    // Calibrated - minimal inline badge
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          Calibrated Baseline
        </span>
      </motion.div>
    );
  }
  
  // Not calibrated - compact CTA
  return (
    <Link to="/app/calibration">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
