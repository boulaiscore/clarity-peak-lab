/**
 * Podcast Tasks Engine Component
 * 
 * A cognitive permissioning system for podcast content.
 * NOT a content catalog - shows max 3 enabled podcasts per day based on cognitive state.
 * 
 * Copy rules:
 * - "Enabled today" / "Withheld due to cognitive load" - NOT "recommended" or "suggested"
 * - Each card shows status with 1-line motivation
 * 
 * Override system:
 * - Withheld tasks can be overridden (if S1Buffer >= 40)
 * - Max 1 override/day, 3/week
 * - Temporary S2 penalty after override
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Headphones, 
  ExternalLink, 
  AlertCircle,
  Battery,
  BrainCircuit,
  Zap,
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
import { usePodcastPermissioning, PodcastEligibility } from "@/hooks/usePodcastPermissioning";
import { useTaskOverride } from "@/hooks/useTaskOverride";
import { TaskOverrideModal, PostOverrideNotice } from "@/components/app/TaskOverrideModal";
import { 
  getApplePodcastUrl, 
  getSpotifySearchUrl, 
  getWhenToUse,
  PodcastDemand,
  DEMAND_THRESHOLDS 
} from "@/data/podcasts";
import { cn } from "@/lib/utils";

// Demand badge colors - muted palette
const DEMAND_STYLES: Record<PodcastDemand, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  MEDIUM: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  HIGH: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  VERY_HIGH: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" },
};

function DemandBadge({ demand }: { demand: PodcastDemand }) {
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

interface PodcastCardProps {
  eligibility: PodcastEligibility;
  s2Capacity: number;
  s1Buffer: number;
  onOpenDetails: () => void;
}

function EnabledPodcastCard({ eligibility, s2Capacity, s1Buffer, onOpenDetails }: PodcastCardProps) {
  const { podcast } = eligibility;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpenDetails}
      className="w-full text-left p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-card/80 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Headphones className="w-5 h-5 text-primary" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{podcast.title}</h4>
            <DemandBadge demand={podcast.demand} />
          </div>
          
          {/* v1.3: Status line - ENABLED TODAY (not "recommended") */}
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
            Enabled today
          </p>
          
          {/* Intent */}
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
            {podcast.intent}
          </p>
        </div>
        
        {/* Arrow indicator */}
        <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

interface WithheldCardProps {
  eligibility: PodcastEligibility;
  onTap: () => void;
  canOverride: boolean;
}

function WithheldPodcastCard({ eligibility, onTap, canOverride }: WithheldCardProps) {
  const { podcast, withheldReason } = eligibility;
  
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
          <Headphones className="w-5 h-5 text-muted-foreground/50" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-muted-foreground truncate">{podcast.title}</h4>
            <DemandBadge demand={podcast.demand} />
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
      className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/8 flex items-center justify-center shrink-0">
          <Battery className="w-5 h-5 text-amber-400/70" />
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-500/80 mb-1 uppercase tracking-wide">
            System Prioritizing Recovery
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Recovery is currently low. The system limits cognitive input to protect clarity.
          </p>
          
          {/* Recovery CTA */}
          <div className="mt-2 pt-2 border-t border-amber-500/10">
            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3 h-3" />
              Content requires recovery to be effective.
            </p>
            <Link 
              to="/neuro-lab?tab=detox" 
              className="inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-400/70 hover:text-amber-400 transition-colors"
            >
              Build recovery through Detox or Walk →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PodcastDetailsDialog({
  eligibility,
  s2Capacity,
  s1Buffer,
  open,
  onClose,
}: {
  eligibility: PodcastEligibility | null;
  s2Capacity: number;
  s1Buffer: number;
  open: boolean;
  onClose: () => void;
}) {
  if (!eligibility) return null;
  
  const { podcast } = eligibility;
  const appleUrl = getApplePodcastUrl(podcast.applePodcastId);
  const spotifyUrl = getSpotifySearchUrl(podcast.spotifyQuery);
  const whenToUse = getWhenToUse(podcast.demand);
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            {podcast.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {podcast.intent}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Why enabled today */}
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Why enabled today
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Your cognitive state (S2={s2Capacity}, S1={s1Buffer}) supports {podcast.demand} cognitive load.
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
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              asChild
            >
              <a href={appleUrl} target="_blank" rel="noopener noreferrer">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
                Apple Podcasts
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              asChild
            >
              <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Spotify
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricsBar({ 
  s2Capacity, 
  s1Buffer, 
  sharpness,
  globalMode 
}: { 
  s2Capacity: number; 
  s1Buffer: number; 
  sharpness: number;
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
        <span>Deep work capacity: <span className="font-medium text-foreground">{s2Capacity >= 55 ? "Available" : "Limited"}</span></span>
        <span>Recovery: <span className="font-medium text-foreground">{s1Buffer >= 50 ? "Good" : s1Buffer >= 30 ? "Low" : "Very low"}</span></span>
      </div>
      <span className={cn("font-medium", modeColor)}>{modeLabel}</span>
    </div>
  );
}

export function PodcastTasksEngine() {
  const {
    s2Capacity,
    s1Buffer,
    sharpness,
    globalMode,
    enabledPodcasts,
    withheldPodcasts,
    isRecoveryMode,
    isLoading,
  } = usePodcastPermissioning();
  
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
  
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastEligibility | null>(null);
  const [overridePodcast, setOverridePodcast] = useState<PodcastEligibility | null>(null);
  const [showWithheld, setShowWithheld] = useState(false);
  
  // Handle override confirmation
  const handleOverrideConfirm = () => {
    if (overridePodcast) {
      recordOverride(overridePodcast.podcast.id, "podcast");
      // After override, open the details dialog
      setSelectedPodcast(overridePodcast);
      setOverridePodcast(null);
    }
  };
  
  // Get thresholds for override modal
  const getThresholdsForPodcast = (podcast: PodcastEligibility) => {
    const thresholds = DEMAND_THRESHOLDS[podcast.podcast.demand];
    return {
      requiredS2Capacity: thresholds.s2Capacity,
      requiredS1Buffer: thresholds.s1Buffer,
      requiredSharpness: thresholds.sharpness,
    };
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
        globalMode={globalMode}
      />
      
      {/* Recovery mode - single card */}
      {isRecoveryMode ? (
        <RecoveryModeCard s1Buffer={s1Buffer} />
      ) : (
        <>
          {/* Enabled podcasts (max 3) */}
          {enabledPodcasts.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {enabledPodcasts.map((eligibility) => (
                  <EnabledPodcastCard
                    key={eligibility.podcast.id}
                    eligibility={eligibility}
                    s2Capacity={s2Capacity}
                    s1Buffer={s1Buffer}
                    onOpenDetails={() => setSelectedPodcast(eligibility)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* No enabled podcasts - show withheld message */
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
                    No inputs enabled today
                  </h4>
                  <p className="text-[11px] text-muted-foreground/70">
                    Current cognitive capacity (S2={s2Capacity}, S1={s1Buffer}) does not support available content loads.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Toggle withheld view */}
          {withheldPodcasts.length > 0 && (
            <button
              onClick={() => setShowWithheld(!showWithheld)}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2.5 px-4 rounded-lg border border-dashed border-border/50 hover:border-border hover:bg-muted/30 transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                {showWithheld ? "Hide" : "View"} {withheldPodcasts.length} withheld {withheldPodcasts.length === 1 ? "input" : "inputs"}
              </span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showWithheld && "rotate-180")} />
            </button>
          )}
          
          {/* Withheld podcasts */}
          <AnimatePresence>
            {showWithheld && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {withheldPodcasts.map((eligibility) => (
                  <WithheldPodcastCard 
                    key={eligibility.podcast.id} 
                    eligibility={eligibility}
                    onTap={() => setOverridePodcast(eligibility)}
                    canOverride={canOverride && !wasOverriddenToday(eligibility.podcast.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      
      {/* Details dialog */}
      <PodcastDetailsDialog
        eligibility={selectedPodcast}
        s2Capacity={s2Capacity}
        s1Buffer={s1Buffer}
        open={!!selectedPodcast}
        onClose={() => setSelectedPodcast(null)}
      />
      
      {/* Override modal */}
      {overridePodcast && (
        <TaskOverrideModal
          open={!!overridePodcast}
          onClose={() => setOverridePodcast(null)}
          taskTitle={overridePodcast.podcast.title}
          taskType="podcast"
          demandLevel={overridePodcast.podcast.demand}
          sharpness={sharpness}
          readiness={Math.round((s2Capacity - 0.6 * sharpness) / 0.4)} // Derive readiness
          recovery={s1Buffer}
          s2Capacity={s2Capacity}
          s1Buffer={s1Buffer}
          {...getThresholdsForPodcast(overridePodcast)}
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
