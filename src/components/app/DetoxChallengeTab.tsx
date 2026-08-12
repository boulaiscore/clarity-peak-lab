import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Clock, Play, Pause, Check, Sparkles, Loader2, Bell, BellOff,
  Leaf, Footprints, ChevronDown, Zap, Brain, Target, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  useWeeklyDetoxXP, 
  useDailyDetoxProgress,
  useDailyDetoxSettings,
  useUpdateDailyDetoxSettings,
  DETOX_SLOT_OPTIONS,
  DETOX_XP_PER_MINUTE,
} from "@/hooks/useDetoxProgress";
import { useDetoxSession } from "@/hooks/useDetoxSession";
import { useAppBlocker } from "@/hooks/useAppBlocker";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { scheduleDetoxReminder, cancelDetoxReminder, getNotificationState, requestNotificationPermission } from "@/lib/notifications";
import { DETOX_COGNITIVE_MESSAGES } from "@/lib/cognitiveFeedback";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { REC_GAIN_COEFFICIENT } from "@/lib/decayConstants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LAB_MODE_CARD_AMBIENCE_CLASS, LAB_MODE_CARD_CLASS } from "@/components/lab/labModeCardStyles";

// Recovery impact based on the same gain formula used by Recovery v2:
// ΔREC = 0.12 × (detox_minutes + 0.5 × walk_minutes)
const getRecoveryImpact = (minutes: number, mode: "detox" | "walk"): number => {
  const effectiveMinutes = mode === "detox" ? minutes : minutes * 0.5;
  return Math.round(effectiveMinutes * REC_GAIN_COEFFICIENT);
};

type RecoveryMode = "detox" | "walk";

const RECOVERY_MODES = {
  detox: {
    id: "detox" as RecoveryMode,
    label: "Detox (Digital Off)",
    displayLabel: "Digital Detox",
    code: "OFF",
    description: "Complete stop from digital input. Rest, sit, or disengage.",
    impact: "High recovery impact",
    rate: "1.0×",
  },
  walk: {
    id: "walk" as RecoveryMode,
    label: "Walk (Active Recovery)",
    displayLabel: "Active Walk",
    code: "MOVE",
    description: "Light walking with minimal stimulation.",
    constraints: "No podcasts, no calls, no scrolling.",
    impact: "Moderate recovery impact",
    rate: "0.5×",
  },
};

function RecoveryModeVisual({ mode }: { mode: RecoveryMode }) {
  const reduceMotion = useReducedMotion();

  if (mode === "detox") {
    return (
      <div className="relative flex h-12 w-16 items-center justify-center" aria-hidden="true">
        {[0, 1].map((ring) => (
          <motion.span
            key={ring}
            className="absolute rounded-full border border-white/[0.14]"
            style={{ width: 30 + ring * 14, height: 30 + ring * 14 }}
            animate={reduceMotion ? undefined : { opacity: [0.12, 0.48, 0.12], scale: [0.88, 1.05, 0.88] }}
            transition={reduceMotion ? undefined : { duration: 3.4, repeat: Infinity, delay: ring * 0.5, ease: "easeInOut" }}
          />
        ))}
        <Leaf className="relative h-5 w-5 text-white/70" strokeWidth={1.35} />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-16 items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((step) => (
        <motion.span
          key={step}
          className="block h-3.5 w-2 rotate-[24deg] rounded-full border border-white/55 bg-white/[0.08]"
          animate={reduceMotion ? undefined : { opacity: [0.2, 0.85, 0.2], y: [3, -3, 3] }}
          transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, delay: step * 0.36, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function DetoxChallengeTab() {
  const navigate = useNavigate();
  const [selectedAppsToBlock, setSelectedAppsToBlock] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedMode, setSelectedMode] = useState<RecoveryMode>("detox");
  const [recoverySetupOpen, setRecoverySetupOpen] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const [lastSessionSeconds, setLastSessionSeconds] = useState(0);
  const [showTargetExceededDialog, setShowTargetExceededDialog] = useState(false);
  const [showNightTimeDialog, setShowNightTimeDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current time is in "sleep hours" (11 PM to 7 AM)
  const isNightTime = (): boolean => {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 7;
  };

  // Cloud-persisted session hook
  const { 
    activeSession, 
    isLoading: sessionLoading, 
    isActive, 
    startSession, 
    completeSession, 
    cancelSession,
    violationCount,
    timerResetAt,
    getElapsedSeconds,
  } = useDetoxSession();

  // Daily progress and settings
  const dailyProgress = useDailyDetoxProgress();
  const { data: dailySettings, isLoading: settingsLoading } = useDailyDetoxSettings();
  const updateSettings = useUpdateDailyDetoxSettings();

  // Weekly data
  const { data: weeklyData } = useWeeklyDetoxXP();
  const { isNative } = useAppBlocker();

  // Weekly target check
  const { detoxComplete } = useCappedWeeklyProgress();

  const weeklyDetoxMinutes = weeklyData?.totalMinutes || 0;
  const weeklyDetoxXP = weeklyData?.totalXP || 0;

  // Setup detox reminder when settings change
  useEffect(() => {
    if (dailySettings?.reminderEnabled && dailySettings?.reminderTime) {
      const notificationState = getNotificationState();
      if (notificationState.permission === "granted") {
        scheduleDetoxReminder(dailySettings.reminderTime, () => ({
          remaining: dailyProgress.remaining,
          dailyGoal: dailyProgress.dailyGoal,
          isComplete: dailyProgress.isComplete,
        }));
      }
    } else {
      cancelDetoxReminder();
    }
  }, [dailySettings?.reminderEnabled, dailySettings?.reminderTime, dailyProgress]);

  // Current session XP
  const currentSessionXP = Math.floor(displaySeconds / 60) * DETOX_XP_PER_MINUTE;

  // Sync display timer with active session (resets on violation)
  useEffect(() => {
    if (isActive && activeSession) {
      // If timer was reset due to violation, use that time
      const effectiveStart = timerResetAt 
        ? timerResetAt.getTime() 
        : new Date(activeSession.started_at).getTime();
      
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - effectiveStart) / 1000);
        setDisplaySeconds(elapsed);
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setDisplaySeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isActive, activeSession, timerResetAt]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStart = async () => {
    // Check if it's night time (11 PM - 7 AM)
    if (isNightTime()) {
      setRecoverySetupOpen(false);
      setShowNightTimeDialog(true);
      return;
    }
    
    // Check if detox target is already reached
    if (detoxComplete) {
      setRecoverySetupOpen(false);
      setShowTargetExceededDialog(true);
      return;
    }
    
    proceedWithStart();
  };

  const proceedWithStart = () => {
    setShowTargetExceededDialog(false);
    setRecoverySetupOpen(false);
    // Navigate to full-screen detox session page with mode
    navigate("/detox-session", { 
      state: { 
        duration: selectedDuration, 
        blockedApps: selectedAppsToBlock,
        mode: selectedMode,
      } 
    });
  };

  const handleComplete = async () => {
    const sessionMinutes = Math.floor(displaySeconds / 60);
    
    if (sessionMinutes < 30) {
      toast({
        title: "Session too short",
        description: "Minimum 30 minutes to record the session",
        variant: "destructive",
      });
      return;
    }

    setLastSessionSeconds(displaySeconds);
    const success = await completeSession();
    if (success) {
      setJustCompleted(true);
    }
  };

  const handleCancel = async () => {
    await cancelSession();
    setDisplaySeconds(0);
  };

  const handleNewSession = () => {
    setJustCompleted(false);
    setLastSessionSeconds(0);
  };

  const handleEnableReminder = async () => {
    const notificationState = getNotificationState();
    if (notificationState.permission !== "granted") {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
      toast({
          title: "Notifications not enabled",
          description: "Enable notifications in browser settings",
          variant: "destructive",
        });
        return;
      }
    }
    updateSettings.mutate({ reminderEnabled: true });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (sessionLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/65" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Session, Completed, or Start */}
      {isActive || justCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-6 rounded-2xl border text-center",
            justCompleted 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-card border-border"
          )}
        >
          {justCompleted ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-1">{DETOX_COGNITIVE_MESSAGES.completion.headline}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {DETOX_COGNITIVE_MESSAGES.completion.getDescription(Math.floor(lastSessionSeconds / 60))}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {DETOX_COGNITIVE_MESSAGES.completion.getBenefit(Math.floor(lastSessionSeconds / 60))}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Cognitive capacity restored
              </div>
              <Button 
                onClick={handleNewSession}
                variant="ghost"
                className="w-full mt-4"
              >
                New Session
              </Button>
            </>
          ) : (
            <>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/20"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative mb-2">
                    <Leaf className="h-6 w-6 text-foreground/70" />
                  </div>
                  <span className="text-2xl font-mono font-bold">{formatTime(displaySeconds)}</span>
                  <span className="text-xs font-medium text-foreground/75">{DETOX_COGNITIVE_MESSAGES.activeSession.status}</span>
                  {violationCount > 0 && (
                    <span className="text-[10px] text-amber-400 mt-1">
                      ⚠️ {violationCount} violation{violationCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-foreground mb-1">Recovering clarity...</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Minimum 30 min to complete recovery
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="flex-1 gap-2"
                  disabled={displaySeconds < 30 * 60}
                >
                  <Check className="w-4 h-4" />
                  Complete
                </Button>
              </div>
            </>
          )}
        </motion.div>
      ) : (
        <>


          {/* Recovery modes use the same card system as Quality Time. */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.values(RECOVERY_MODES) as typeof RECOVERY_MODES[RecoveryMode][]).map((mode) => {
              const projectedRecovery = getRecoveryImpact(selectedDuration, mode.id);
              const ModeIcon = mode.id === "detox" ? Leaf : Footprints;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    setRecoverySetupOpen(true);
                  }}
                  aria-haspopup="dialog"
                  className={LAB_MODE_CARD_CLASS}
                >
                  <div className={LAB_MODE_CARD_AMBIENCE_CLASS} />
                  <div className="relative flex h-full flex-col">
                    <div className="flex h-4 shrink-0 items-start justify-between">
                      <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.18em] text-foreground/60">
                        {mode.id === "detox" ? "Detox" : "Walk"}
                      </span>
                      <ModeIcon className="h-3.5 w-3.5 shrink-0 text-foreground/55" strokeWidth={1.4} />
                    </div>

                    <div className="flex min-h-0 flex-1 items-center justify-center">
                      <RecoveryModeVisual mode={mode.id} />
                    </div>

                    <div className="h-[52px] shrink-0 border-t border-border/35 pt-2.5">
                      <h4 className="truncate whitespace-nowrap text-[12px] font-semibold leading-none tracking-tight text-foreground">
                        {mode.displayLabel}
                      </h4>
                      <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                        <p className="min-w-0 truncate whitespace-nowrap text-[9px] leading-none text-foreground/50">
                          {mode.id === "detox" ? "No digital input" : "Light movement · no media"}
                        </p>
                        <span className="shrink-0 text-[10px] font-semibold leading-none tabular-nums text-foreground/75">
                          +{projectedRecovery} <span className="text-[8px] tracking-[0.1em] text-foreground/35">REC</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Dialog open={recoverySetupOpen} onOpenChange={setRecoverySetupOpen}>
            <DialogContent className="w-[calc(100%_-_24px)] max-w-sm gap-0 overflow-hidden rounded-[24px] border-white/[0.08] bg-[#0b0d10] p-0 text-foreground shadow-[0_30px_100px_rgba(0,0,0,0.72)]">
              <DialogHeader className="border-b border-white/[0.06] px-5 pb-4 pt-5 pr-12 text-left">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035]">
                    {selectedMode === "detox" ? (
                      <Leaf className="h-[18px] w-[18px] text-white/70" strokeWidth={1.35} />
                    ) : (
                      <Footprints className="h-[18px] w-[18px] text-white/70" strokeWidth={1.35} />
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      {RECOVERY_MODES[selectedMode].code} · Recover
                    </span>
                    <DialogTitle className="mt-1 text-[18px] font-semibold tracking-tight">
                      {RECOVERY_MODES[selectedMode].displayLabel}
                    </DialogTitle>
                  </div>
                </div>
                <DialogDescription className="text-[12px] leading-5 text-white/48">
                  {RECOVERY_MODES[selectedMode].description}
                  {selectedMode === "walk" ? " No podcasts, calls or scrolling." : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-5 py-5">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                      Duration
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {DETOX_SLOT_OPTIONS.map((slot) => {
                      const isSelected = selectedDuration === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setSelectedDuration(slot.value)}
                          aria-pressed={isSelected}
                          className={cn(
                            "h-10 rounded-xl border text-[12px] font-medium tabular-nums transition-colors",
                            isSelected
                              ? "border-white/30 bg-white text-black"
                              : "border-white/[0.08] bg-white/[0.035] text-white/55 hover:border-white/15 hover:text-white/80",
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between border-y border-white/[0.06] py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Estimated impact</p>
                    <p className="mt-1 text-[12px] text-white/55">
                      {RECOVERY_MODES[selectedMode].impact}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-semibold tabular-nums text-white">
                      +{getRecoveryImpact(selectedDuration, selectedMode)}
                    </span>
                    <span className="ml-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">REC</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStart}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[12px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white/90 active:scale-[0.99]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start · {selectedDuration} min
                </button>
              </div>
            </DialogContent>
          </Dialog>


          {/* Reminder Info - Subtle footer */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/80 pt-2">
            {dailySettings?.reminderEnabled ? (
              <>
                <Bell className="h-3 w-3 text-foreground/50" />
                <span>Daily reminder at <span className="text-muted-foreground">{dailySettings.reminderTime}</span></span>
              </>
            ) : (
              <>
                <BellOff className="w-3 h-3" />
                <span>Reminder disabled</span>
              </>
            )}
          </div>
        </>
      )}

      {/* Target Exceeded Warning Dialog */}
      <TargetExceededDialog
        open={showTargetExceededDialog}
        onOpenChange={setShowTargetExceededDialog}
        onConfirm={proceedWithStart}
        categoryName="Walk & Detox"
      />

      {/* Night Time Warning Dialog */}
      <AlertDialog open={showNightTimeDialog} onOpenChange={setShowNightTimeDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/[0.06]">
                <Moon className="h-5 w-5 text-foreground/65" />
              </div>
              <AlertDialogTitle className="text-lg">Sleep Time</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                Recovery sessions are not available between <span className="text-foreground font-medium">11 PM and 7 AM</span>.
              </p>
              <p>
                These hours are dedicated to <span className="text-foreground font-medium">sleep</span> — the most important form of cognitive recovery. 
                Active recovery (detox and walking) is designed for daytime use.
              </p>
              <p className="text-xs text-muted-foreground pt-1">
                Get quality rest now. Start your recovery session tomorrow after 7 AM.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="w-full">Understood</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// What This Unlocks Section - Premium Style
function WhatThisUnlocksSection() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full p-4 rounded-xl bg-card/60 border border-border/40 flex items-center justify-between hover:bg-card/80 transition-all duration-200 group">
        <span className="text-xs font-medium text-foreground flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Target className="w-3 h-3 text-primary" />
          </div>
          What this unlocks
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-4 text-xs text-muted-foreground leading-relaxed"
        >
          <p className="mb-3 text-foreground/80">As recovery increases, the system unlocks:</p>
          <div className="space-y-2">
            {["Cognitive tasks", "Deeper training sessions", "Higher daily cognitive load"].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// How Recovery Works Section - Premium Style
function HowRecoveryWorksSection() {
  const [isWalkScienceOpen, setIsWalkScienceOpen] = useState(false);
  
  return (
    <Collapsible open={isWalkScienceOpen} onOpenChange={setIsWalkScienceOpen}>
      <CollapsibleTrigger className="w-full p-4 rounded-xl bg-card/60 border border-border/40 flex items-center justify-between hover:bg-card/80 transition-all duration-200 group">
        <span className="text-xs font-medium text-foreground flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Brain className="w-3 h-3 text-primary" />
          </div>
          How recovery works
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-200",
          isWalkScienceOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-4 space-y-3"
        >
          <div className="space-y-2">
            {[
              { icon: Leaf, text: "Detox restores recovery faster by removing cognitive input" },
              { icon: Footprints, text: "Walking supports recovery through movement and circulation" },
              { icon: Zap, text: "Recovery determines when training and content are effective" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                <item.icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-xs text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
          
          <p className="text-[10px] text-muted-foreground/50 text-center pt-2 italic">
            Recovery prepares the system. Training improves it.
          </p>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
