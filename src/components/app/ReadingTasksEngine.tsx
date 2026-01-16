/**
 * Reading Tasks Engine Component
 * 
 * A cognitive permissioning system for books and articles.
 * NOT a content catalog - shows max 2 reading items per day based on cognitive state.
 * 
 * Categories:
 * - RECOVERY_SAFE: Narrative/literary reading for decompression (S1-leaning)
 * - NON_FICTION: Articles/essays requiring concept retention (S2)
 * - BOOK: Long-form chapters requiring continuity (highest S2 load)
 * 
 * Copy rules:
 * - "Enabled today" / "Withheld due to cognitive load" - NOT "recommended" or "suggested"
 * 
 * Override system:
 * - Withheld tasks can be overridden (if S1Buffer >= 40)
 * - Max 1 override/day, 3/week
 * - Temporary S2 penalty after override
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  FileText,
  ExternalLink, 
  AlertCircle,
  Battery,
  BrainCircuit,
  Zap,
  Clock,
  Leaf,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReadingPermissioning, ReadingEligibility } from "@/hooks/useReadingPermissioning";
import { useTaskOverride } from "@/hooks/useTaskOverride";
import { TaskOverrideModal, PostOverrideNotice } from "@/components/app/TaskOverrideModal";
import { 
  Reading,
  ReadingType,
  ReadingDemand,
  getReadingTypeCopy,
  getWhenToUse,
  READING_THRESHOLDS,
  GLOBAL_READING_OVERRIDES,
} from "@/data/readings";
import { cn } from "@/lib/utils";

// Demand badge colors - muted palette (same as podcasts)
const DEMAND_STYLES: Record<ReadingDemand, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  MEDIUM: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  HIGH: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  VERY_HIGH: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" },
};

// Reading type styles
const TYPE_STYLES: Record<ReadingType, { icon: typeof BookOpen; color: string }> = {
  RECOVERY_SAFE: { icon: Leaf, color: "text-emerald-500" },
  NON_FICTION: { icon: FileText, color: "text-blue-500" },
  BOOK: { icon: BookOpen, color: "text-primary" },
};

function DemandBadge({ demand }: { demand: ReadingDemand }) {
  const styles = DEMAND_STYLES[demand];
  return (
    <span className={cn(
      "text-[9px] font-medium px-1.5 py-0.5 rounded border",
      styles.bg, styles.text, styles.border
    )}>
      {demand.replace("_", " ")}
    </span>
  );
}

function TypeBadge({ type }: { type: ReadingType }) {
  const copy = getReadingTypeCopy(type);
  const typeStyle = TYPE_STYLES[type];
  
  return (
    <span className={cn(
      "text-[9px] font-medium px-1.5 py-0.5 rounded border bg-muted/30 border-border/40",
      "text-muted-foreground"
    )}>
      {copy.categoryLabel}
    </span>
  );
}

interface ReadingCardProps {
  eligibility: ReadingEligibility;
  s2Capacity: number;
  s1Buffer: number;
  onOpenDetails: () => void;
}

function EnabledReadingCard({ eligibility, s2Capacity, s1Buffer, onOpenDetails }: ReadingCardProps) {
  const { reading } = eligibility;
  const typeStyle = TYPE_STYLES[reading.readingType];
  const Icon = typeStyle.icon;
  const copy = getReadingTypeCopy(reading.readingType);
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpenDetails}
      className="w-full text-left p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-card/80 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          reading.readingType === "RECOVERY_SAFE" ? "bg-emerald-500/10" :
          reading.readingType === "NON_FICTION" ? "bg-blue-500/10" : "bg-primary/10"
        )}>
          <Icon className={cn("w-5 h-5", typeStyle.color)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-medium truncate">{reading.title}</h4>
            <TypeBadge type={reading.readingType} />
            <DemandBadge demand={reading.demand} />
          </div>
          
          {/* v1.3: Status line - ENABLED TODAY */}
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
            Enabled today
          </p>
          
          {/* Duration + Author */}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {reading.durationMinutes} min
            </span>
            {reading.author && (
              <span className="truncate">• {reading.author}</span>
            )}
          </div>
        </div>
        
        {/* Arrow indicator */}
        <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

interface WithheldCardProps {
  eligibility: ReadingEligibility;
  onTap: () => void;
  canOverride: boolean;
}

function WithheldReadingCard({ eligibility, onTap, canOverride }: WithheldCardProps) {
  const { reading, withheldReason } = eligibility;
  const typeStyle = TYPE_STYLES[reading.readingType];
  const Icon = typeStyle.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onTap}
      className={cn(
        "w-full text-left p-3 rounded-xl border border-border/20 bg-muted/20 opacity-60 transition-all",
        canOverride && "hover:opacity-80 hover:border-border/40 cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground/50" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-medium text-muted-foreground truncate">{reading.title}</h4>
            <TypeBadge type={reading.readingType} />
            <DemandBadge demand={reading.demand} />
          </div>
          
          {/* v1.3: Status line - WITHHELD */}
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">
            Withheld
          </p>
        </div>
        
        {/* Override hint - more visible */}
        {canOverride && (
          <div className="flex items-center gap-1 text-[10px] text-amber-500 shrink-0 self-center">
            <span className="font-medium">Tap to override</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </motion.button>
  );
}

function RecoveryModeCard({ s1Buffer }: { s1Buffer: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Battery className="w-5 h-5 text-amber-500" />
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wide">
            System Protection
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Recovery is low. Even structured reading would add invisible load today.
          </p>
          
          {/* Override unavailable explanation */}
          <div className="mt-2 pt-2 border-t border-amber-500/10">
            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              Override unavailable — S1 Buffer ({s1Buffer}) must be ≥40
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReadingDetailsDialog({
  eligibility,
  s2Capacity,
  s1Buffer,
  open,
  onClose,
}: {
  eligibility: ReadingEligibility | null;
  s2Capacity: number;
  s1Buffer: number;
  open: boolean;
  onClose: () => void;
}) {
  if (!eligibility) return null;
  
  const { reading } = eligibility;
  const typeStyle = TYPE_STYLES[reading.readingType];
  const Icon = typeStyle.icon;
  const copy = getReadingTypeCopy(reading.readingType);
  const whenToUse = getWhenToUse(reading.demand, reading.readingType);
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", typeStyle.color)} />
            {reading.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {reading.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Metadata */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {reading.author && (
              <span>{reading.author}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {reading.durationMinutes} min
            </span>
            {reading.source && (
              <span className="text-xs">{reading.source}</span>
            )}
          </div>
          
          {/* Why enabled today */}
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Why enabled today
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Your cognitive state (S2={s2Capacity}, S1={s1Buffer}) supports {copy.categoryLabel} with {reading.demand} demand.
            </p>
          </div>
          
          {/* When to use */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">When to use</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {whenToUse}
            </p>
          </div>
          
          {/* Action - if URL available */}
          {reading.url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              asChild
            >
              <a href={reading.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Open Reading
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricsBar({ 
  s2Capacity, 
  s1Buffer, 
  sharpness,
  readiness,
  globalMode 
}: { 
  s2Capacity: number; 
  s1Buffer: number; 
  sharpness: number;
  readiness: number;
  globalMode: string;
}) {
  const modeLabel = globalMode === "RECOVERY_MODE" 
    ? "Recovery Mode" 
    : globalMode === "LOW_BANDWIDTH_MODE" 
      ? "Low Bandwidth" 
      : "Full Capacity";
  
  const modeColor = globalMode === "RECOVERY_MODE"
    ? "text-amber-500"
    : globalMode === "LOW_BANDWIDTH_MODE"
      ? "text-blue-500"
      : "text-emerald-500";
  
  return (
    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3 px-1">
      <div className="flex items-center gap-3">
        <span>S2: <span className="font-medium text-foreground">{s2Capacity}</span></span>
        <span>S1: <span className="font-medium text-foreground">{s1Buffer}</span></span>
      </div>
      <span className={cn("font-medium", modeColor)}>{modeLabel}</span>
    </div>
  );
}

interface ReadingTasksEngineProps {
  type: "book" | "article";
}

export function ReadingTasksEngine({ type }: ReadingTasksEngineProps) {
  const {
    s2Capacity,
    s1Buffer,
    sharpness,
    readiness,
    globalMode,
    enabledReadings,
    withheldReadings,
    isRecoveryMode,
    isLoading,
  } = useReadingPermissioning();
  
  // Override management
  const {
    canOverride,
    overrideDisabledReason,
    remainingDailyOverrides,
    remainingWeeklyOverrides,
    s2Penalty,
    adjustedS2Capacity,
    recordOverride,
    wasOverriddenToday,
  } = useTaskOverride(s1Buffer, s2Capacity);
  
  const [selectedReading, setSelectedReading] = useState<ReadingEligibility | null>(null);
  const [overrideReading, setOverrideReading] = useState<ReadingEligibility | null>(null);
  const [showWithheld, setShowWithheld] = useState(false);
  
  // Filter based on type prop
  const filteredEnabled = enabledReadings.filter(e => {
    if (type === "book") {
      return e.reading.readingType === "BOOK";
    } else {
      // "article" shows both NON_FICTION and RECOVERY_SAFE
      return e.reading.readingType === "NON_FICTION" || e.reading.readingType === "RECOVERY_SAFE";
    }
  });
  
  const filteredWithheld = withheldReadings.filter(e => {
    if (type === "book") {
      return e.reading.readingType === "BOOK";
    } else {
      return e.reading.readingType === "NON_FICTION" || e.reading.readingType === "RECOVERY_SAFE";
    }
  });
  
  // Handle override confirmation
  const handleOverrideConfirm = () => {
    if (overrideReading) {
      const taskType = overrideReading.reading.readingType === "BOOK" ? "book" : "reading";
      recordOverride(overrideReading.reading.id, taskType);
      // After override, open the details dialog
      setSelectedReading(overrideReading);
      setOverrideReading(null);
    }
  };
  
  // Get thresholds for override modal
  const getThresholdsForReading = (eligibility: ReadingEligibility) => {
    const { reading } = eligibility;
    
    if (reading.readingType === "RECOVERY_SAFE") {
      return { requiredS1Buffer: 50 };
    }
    
    if (reading.readingType === "NON_FICTION") {
      const thresholds = READING_THRESHOLDS.NON_FICTION[reading.demand as keyof typeof READING_THRESHOLDS.NON_FICTION];
      return {
        requiredS2Capacity: thresholds?.s2Capacity,
        requiredS1Buffer: thresholds?.s1Buffer,
        requiredSharpness: Math.max(thresholds?.sharpness || 0, GLOBAL_READING_OVERRIDES.NON_FICTION_MIN_SHARPNESS),
      };
    }
    
    if (reading.readingType === "BOOK") {
      const thresholds = READING_THRESHOLDS.BOOK[reading.demand as keyof typeof READING_THRESHOLDS.BOOK];
      return {
        requiredS2Capacity: thresholds?.s2Capacity,
        requiredS1Buffer: thresholds?.s1Buffer,
        requiredSharpness: Math.max(thresholds?.sharpness || 0, GLOBAL_READING_OVERRIDES.BOOK_MIN_SHARPNESS),
        requiredReadiness: GLOBAL_READING_OVERRIDES.BOOK_MIN_READINESS,
      };
    }
    
    return {};
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  // Check if any override was used today
  const hasOverrideToday = s2Penalty > 0;
  
  return (
    <div className="space-y-3">
      {/* Post-override notice */}
      {hasOverrideToday && <PostOverrideNotice />}
      
      {/* Metrics bar */}
      <MetricsBar 
        s2Capacity={hasOverrideToday ? adjustedS2Capacity : s2Capacity} 
        s1Buffer={s1Buffer} 
        sharpness={sharpness}
        readiness={readiness}
        globalMode={globalMode}
      />
      
      {/* Recovery mode - single card */}
      {isRecoveryMode ? (
        <RecoveryModeCard s1Buffer={s1Buffer} />
      ) : (
        <>
          {/* Enabled readings */}
          {filteredEnabled.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredEnabled.map((eligibility) => (
                  <EnabledReadingCard
                    key={eligibility.reading.id}
                    eligibility={eligibility}
                    s2Capacity={s2Capacity}
                    s1Buffer={s1Buffer}
                    onOpenDetails={() => setSelectedReading(eligibility)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* No enabled readings - show withheld message */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-border/30 bg-muted/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    No {type === "book" ? "books" : "readings"} enabled today
                  </h4>
                  <p className="text-[11px] text-muted-foreground/70">
                    Current cognitive capacity (S2={s2Capacity}, S1={s1Buffer}) does not support available {type === "book" ? "book" : "reading"} loads.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Toggle withheld view */}
          {filteredWithheld.length > 0 && (
            <button
              onClick={() => setShowWithheld(!showWithheld)}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2.5 px-4 rounded-lg border border-dashed border-border/50 hover:border-border hover:bg-muted/30 transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                {showWithheld ? "Hide" : "View"} {filteredWithheld.length} withheld {filteredWithheld.length === 1 ? "item" : "items"}
              </span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showWithheld && "rotate-180")} />
            </button>
          )}
          
          {/* Withheld readings */}
          <AnimatePresence>
            {showWithheld && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {filteredWithheld.map((eligibility) => (
                  <WithheldReadingCard 
                    key={eligibility.reading.id} 
                    eligibility={eligibility}
                    onTap={() => setOverrideReading(eligibility)}
                    canOverride={canOverride && !wasOverriddenToday(eligibility.reading.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      
      {/* Details dialog */}
      <ReadingDetailsDialog
        eligibility={selectedReading}
        s2Capacity={s2Capacity}
        s1Buffer={s1Buffer}
        open={!!selectedReading}
        onClose={() => setSelectedReading(null)}
      />
      
      {/* Override modal */}
      {overrideReading && (
        <TaskOverrideModal
          open={!!overrideReading}
          onClose={() => setOverrideReading(null)}
          taskTitle={overrideReading.reading.title}
          taskType={overrideReading.reading.readingType === "BOOK" ? "book" : "reading"}
          demandLevel={overrideReading.reading.demand}
          sharpness={sharpness}
          readiness={readiness}
          recovery={s1Buffer}
          s2Capacity={s2Capacity}
          s1Buffer={s1Buffer}
          {...getThresholdsForReading(overrideReading)}
          canOverride={canOverride}
          overrideDisabledReason={overrideDisabledReason}
          remainingDailyOverrides={remainingDailyOverrides}
          remainingWeeklyOverrides={remainingWeeklyOverrides}
          onOverrideConfirm={handleOverrideConfirm}
        />
      )}
    </div>
  );
}
