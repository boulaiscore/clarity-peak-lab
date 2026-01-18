/**
 * BaselineStatusCard - Shows baseline type (estimated vs calibrated) 
 * and offers calibration if skipped
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FlaskConical, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBaselineStatus } from "@/hooks/useBaselineStatus";
import { cn } from "@/lib/utils";

export function BaselineStatusCard() {
  const { isEstimated, calibrationStatus, isLoading, AE0_eff } = useBaselineStatus();
  
  if (isLoading || AE0_eff === null) return null;
  
  const isCalibrated = calibrationStatus === "completed";
  
  if (isCalibrated) {
    // Calibrated - show compact confirmation
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-foreground">
              Calibrated Baseline
            </p>
            <p className="text-[9px] text-muted-foreground">
              Your cognitive profile is personalized
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Not calibrated - show CTA to complete calibration
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 overflow-hidden relative"
    >
      {/* Ambient glow */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <FlaskConical className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] font-semibold text-foreground">
                Estimated Baseline
              </p>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30">
                Demo
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
              Your profile is based on demographics. Complete calibration for a personalized baseline.
            </p>
          </div>
        </div>
        
        {/* CTA */}
        <Link to="/quick-calibration">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "w-full h-9 text-[11px] font-medium gap-2",
              "border-primary/30 hover:border-primary/50",
              "bg-primary/5 hover:bg-primary/10",
              "text-primary"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Complete Calibration
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
