/**
 * Task Override Modal Component
 * 
 * Shows when a withheld task is tapped. Provides:
 * - Why the task is withheld (with specific metrics)
 * - What actions would unlock it
 * - Override option (if available)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Zap, 
  Target, 
  Clock, 
  ArrowRight,
  Shield,
  CheckCircle,
  X,
  Brain,
  Battery,
  Sparkles
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  UnlockSuggestion, 
  MetricGap, 
  calculateMetricGaps,
  generateUnlockSuggestions,
  getUnlockWindow,
  formatMetricName,
} from "@/lib/unlockSuggestions";
import { cn } from "@/lib/utils";

interface TaskOverrideModalProps {
  open: boolean;
  onClose: () => void;
  
  // Task info
  taskTitle: string;
  taskType: "podcast" | "reading" | "book";
  demandLevel: string;
  
  // Current metrics
  sharpness: number;
  readiness: number;
  recovery: number;
  s2Capacity: number;
  s1Buffer: number;
  
  // Required thresholds (pass what's relevant)
  requiredS2Capacity?: number;
  requiredS1Buffer?: number;
  requiredSharpness?: number;
  requiredReadiness?: number;
  
  // Override state
  canOverride: boolean;
  overrideDisabledReason: string | null;
  remainingDailyOverrides: number;
  remainingWeeklyOverrides: number;
  
  // Callbacks
  onOverrideConfirm: () => void;
}

const METRIC_ICONS = {
  sharpness: Sparkles,
  readiness: Battery,
  recovery: Brain,
};

const METRIC_COLORS = {
  sharpness: "text-amber-500",
  readiness: "text-blue-500",
  recovery: "text-emerald-500",
};

function MetricGapRow({ gap }: { gap: MetricGap }) {
  const Icon = METRIC_ICONS[gap.metric];
  const color = METRIC_COLORS[gap.metric];
  
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-sm">{formatMetricName(gap.metric)}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-destructive font-medium">{gap.current}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground">required {gap.required}</span>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: UnlockSuggestion }) {
  const Icon = METRIC_ICONS[suggestion.targetMetric];
  const color = METRIC_COLORS[suggestion.targetMetric];
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        suggestion.actionType === "detox" ? "bg-emerald-500/10" :
        suggestion.actionType === "focus" ? "bg-amber-500/10" :
        suggestion.actionType === "rest" ? "bg-blue-500/10" : "bg-muted/50"
      )}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{suggestion.action}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {suggestion.estimatedTime}
          </span>
          <span>•</span>
          <span className={color}>+{suggestion.estimatedGain} {formatMetricName(suggestion.targetMetric)}</span>
        </div>
      </div>
    </div>
  );
}

export function TaskOverrideModal({
  open,
  onClose,
  taskTitle,
  taskType,
  demandLevel,
  sharpness,
  readiness,
  recovery,
  s2Capacity,
  s1Buffer,
  requiredS2Capacity,
  requiredS1Buffer,
  requiredSharpness,
  requiredReadiness,
  canOverride,
  overrideDisabledReason,
  remainingDailyOverrides,
  remainingWeeklyOverrides,
  onOverrideConfirm,
}: TaskOverrideModalProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Calculate gaps and suggestions
  const gaps = calculateMetricGaps(
    sharpness,
    readiness,
    recovery,
    requiredSharpness,
    requiredReadiness,
    undefined, // requiredRecovery (we use s1Buffer instead)
    requiredS2Capacity,
    requiredS1Buffer
  );
  
  const suggestions = generateUnlockSuggestions(gaps);
  const unlockWindow = getUnlockWindow(gaps);
  
  const handleOverrideClick = () => {
    setShowConfirmation(true);
  };
  
  const handleConfirm = () => {
    onOverrideConfirm();
    setShowConfirmation(false);
    onClose();
  };
  
  const handleCancel = () => {
    setShowConfirmation(false);
  };
  
  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Override
            </DialogTitle>
            <DialogDescription className="text-left">
              You can proceed, but this exceeds today's supported load.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-muted-foreground">
            <p>Do you want to continue anyway?</p>
            <p className="mt-2 text-[11px]">
              Notice: Proceeding may accumulate cognitive fatigue. The system will adjust.
            </p>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleConfirm}
              className="flex-1 gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            Task Withheld Today
          </DialogTitle>
          <DialogDescription className="text-left">
            "{taskTitle}" requires {demandLevel} cognitive load.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Section A: Why it is withheld */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Why it's withheld
            </h4>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <p className="text-sm text-muted-foreground mb-3">
                Today your system shows:
              </p>
              <div className="space-y-0.5">
                {gaps.map((gap) => (
                  <MetricGapRow key={gap.metric} gap={gap} />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-3">
                Proceeding now may accumulate fatigue.
              </p>
            </div>
          </div>
          
          {/* Section B: What would unlock it */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                What would unlock it
              </h4>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/70 text-center pt-1">
                {unlockWindow}
              </p>
            </div>
          )}
          
          {/* Override section */}
          <div className="pt-2 border-t border-border/30">
            {canOverride ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Override available</span>
                  <span>{remainingDailyOverrides} today / {remainingWeeklyOverrides} this week</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleOverrideClick}
                  className="w-full gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Override and proceed
                </Button>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {overrideDisabledReason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Post-override notice component
 * Shows after an override is used
 */
export function PostOverrideNotice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-3"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Override used. Notice if clarity drops later. The system will adjust.
        </p>
      </div>
    </motion.div>
  );
}
