import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Play, Pause, Check, Sparkles, Info, Loader2, Bell, BellOff, 
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
import { useAuth } from "@/contexts/AuthContext";
import { scheduleDetoxReminder, cancelDetoxReminder, getNotificationState, requestNotificationPermission } from "@/lib/notifications";
import { DETOX_COGNITIVE_MESSAGES } from "@/lib/cognitiveFeedback";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TargetExceededDialog } from "./TargetExceededDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { REC_TARGET } from "@/lib/decayConstants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Recovery impact percentages based on canonical formula:
// REC% = (weekly_detox_minutes + 0.5 × weekly_walk_minutes) / REC_TARGET × 100
// With REC_TARGET = 840 min (14 hrs/week):
// - Base rate per 30 min = 30/840 × 100 ≈ 3.57%
// To ensure proportional consistency across durations, we calculate based on 30-min units
const getRecoveryImpact = (minutes: number, mode: "detox" | "walk"): number => {
  // Calculate exact percentage
  const exactPercent = (minutes / REC_TARGET) * 100;
  // For walk, apply 0.5 multiplier before rounding
  const modeAdjusted = mode === "detox" ? exactPercent : exactPercent * 0.5;
  // Round to nearest integer for display
  return Math.round(modeAdjusted);
};

type RecoveryMode = "detox" | "walk";

const RECOVERY_MODES = {
  detox: {
    id: "detox" as RecoveryMode,
    label: "Detox (Digital Off)",
    description: "Complete stop from digital input. Rest, sit, or disengage.",
    impact: "High recovery impact",
    icon: Leaf,
  },
  walk: {
    id: "walk" as RecoveryMode,
    label: "Walk (Active Recovery)",
    description: "Light walking with minimal stimulation.",
    constraints: "No podcasts, no calls, no scrolling.",
    impact: "Moderate recovery impact",
    icon: Footprints,
  },
};

export function DetoxChallengeTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedAppsToBlock, setSelectedAppsToBlock] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedMode, setSelectedMode] = useState<RecoveryMode>("detox");
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
      setShowNightTimeDialog(true);
      return;
    }
    
    // Check if detox target is already reached
    if (detoxComplete) {
      setShowTargetExceededDialog(true);
      return;
    }
    
    proceedWithStart();
  };

  const proceedWithStart = () => {
    setShowTargetExceededDialog(false);
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
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentModeConfig = RECOVERY_MODES[selectedMode];

  return (
    <div className="space-y-5">
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
                    <Leaf className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-2xl font-mono font-bold">{formatTime(displaySeconds)}</span>
                  <span className="text-xs text-primary font-medium">{DETOX_COGNITIVE_MESSAGES.activeSession.status}</span>
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
          {/* Header - Minimal */}
          <div className="text-center mb-5">
            <p className="text-sm text-muted-foreground">Choose the recovery mode that fits your situation.</p>
          </div>

          {/* Recovery Mode Selector - Minimal Side-by-Side */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.values(RECOVERY_MODES) as typeof RECOVERY_MODES[RecoveryMode][]).map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn(
                    "relative p-4 rounded-xl text-left transition-all duration-200",
                    isSelected
                      ? "bg-card border-2 border-foreground/20"
                      : "bg-card/60 border border-border/40 hover:border-border"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                      isSelected ? "bg-foreground/10" : "bg-muted/40"
                    )}>
                      <Icon className={cn(
                        "w-4.5 h-4.5",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )} />
                    </div>
                    {isSelected && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-foreground/80 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-background" />
                      </div>
                    )}
                  </div>
                  
                  <h4 className={cn(
                    "text-sm font-semibold mb-1",
                    isSelected ? "text-foreground" : "text-foreground/80"
                  )}>
                    {mode.id === "detox" ? "Digital Detox" : "Active Walk"}
                  </h4>
                  
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {mode.id === "detox" 
                      ? "Full digital pause" 
                      : "Light movement, no devices"
                    }
                  </p>
                  
                  <div className={cn(
                    "mt-2 text-[10px] font-medium",
                    isSelected ? "text-foreground/70" : "text-muted-foreground/80"
                  )}>
                    {mode.id === "detox" ? "100% impact" : "50% impact"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Session Duration - Compact */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Duration</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {DETOX_SLOT_OPTIONS.map((slot) => {
                const isSelected = selectedDuration === slot.value;
                return (
                  <button
                    key={slot.value}
                    onClick={() => setSelectedDuration(slot.value)}
                    className={cn(
                      "py-2 rounded-lg text-sm font-medium transition-all",
                      isSelected
                        ? "bg-foreground/10 text-foreground border border-foreground/20"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impact on Your System Block */}
          <ImpactBlock mode={selectedMode} duration={selectedDuration} />

          {/* CTA - Premium Style */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-3"
          >
            <p className="text-xs text-muted-foreground">
              {selectedMode === "detox" 
                ? "Best before high-focus or deep reasoning sessions."
                : "Best when recovery is low but movement feels manageable."
              }
            </p>
            <Button 
              onClick={handleStart}
              variant="hero"
              className="w-full min-h-[56px] gap-3 text-base font-semibold"
              size="lg"
            >
              <Play className="w-5 h-5 fill-current" />
              Start {selectedMode === "detox" ? "Detox" : "Walk"} • {selectedDuration} min
            </Button>
          </motion.div>

          {/* Expandable Sections */}
          <div className="space-y-3 pt-2">
            <WhatThisUnlocksSection />
            <HowRecoveryWorksSection />
          </div>

          {/* Reminder Info - Subtle footer */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/80 pt-2">
            {dailySettings?.reminderEnabled ? (
              <>
                <Bell className="w-3 h-3 text-primary/60" />
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
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
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

// Impact Block Component - Subtle Blue Style
function ImpactBlock({ mode, duration }: { mode: "detox" | "walk"; duration: number }) {
  const recoveryImpact = getRecoveryImpact(duration, mode);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="p-5 rounded-2xl bg-gradient-to-br from-primary/6 via-primary/3 to-transparent border border-primary/15"
    >
      <h4 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-primary/70" />
        </div>
        Estimated Impact
      </h4>
      
      <div className="space-y-3">
        {/* Recovery - Primary metric */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-background/50">
          <span className="text-xs text-foreground flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
            Recovery
          </span>
          <span className="text-lg font-bold text-primary">+{recoveryImpact}%</span>
        </div>
        
        {/* Secondary effects */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-background/30 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
              <span className="text-[10px] font-medium text-muted-foreground">Sharpness</span>
            </div>
            <span className="text-[11px] text-foreground/70">Indirect boost</span>
          </div>
          
          <div className="p-2.5 rounded-xl bg-background/30 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/70" />
              <span className="text-[10px] font-medium text-muted-foreground">Readiness</span>
            </div>
            <span className="text-[11px] text-foreground/70">
              {mode === "detox" ? "Next-day focus" : "Light boost"}
            </span>
          </div>
        </div>
      </div>
      
    </motion.div>
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
