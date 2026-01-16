import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Play, Pause, Check, Sparkles, Info, Loader2, Bell, BellOff, 
  Leaf, Footprints, ChevronDown, Zap, Brain, Target
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
              <p className="text-xs text-muted-foreground/70 mb-3">
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
          {/* Header */}
          <div className="text-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">Recover Mental Clarity</h2>
            <p className="text-sm text-muted-foreground">Choose the recovery mode that fits your situation.</p>
          </div>

          {/* Recovery Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.values(RECOVERY_MODES) as typeof RECOVERY_MODES[RecoveryMode][]).map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    isSelected
                      ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                      : "bg-card/50 border-border/50 hover:border-border"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                    isSelected ? "bg-primary/20" : "bg-muted/50"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  
                  <h4 className={cn(
                    "text-sm font-medium mb-1",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {mode.label}
                  </h4>
                  
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                    {mode.description}
                  </p>
                  
                  {"constraints" in mode && (
                    <p className="text-[10px] text-amber-500/80 mb-2">
                      {mode.constraints}
                    </p>
                  )}
                  
                  <span className={cn(
                    "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full",
                    isSelected 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted/50 text-muted-foreground"
                  )}>
                    {mode.impact}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Session Duration */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <Label className="text-xs text-muted-foreground mb-3 block text-center">Session duration</Label>
            <div className="grid grid-cols-4 gap-2">
              {DETOX_SLOT_OPTIONS.map((slot) => (
                <button
                  key={slot.value}
                  onClick={() => setSelectedDuration(slot.value)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-xs font-medium transition-all text-center",
                    selectedDuration === slot.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Minimum session: 30 min for measurable impact
            </p>
          </div>

          {/* Impact on Your System Block */}
          <ImpactBlock mode={selectedMode} duration={selectedDuration} />

          {/* CTA Context */}
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground/80 mb-2">
              {selectedMode === "detox" 
                ? "Best before high-focus or deep reasoning sessions."
                : "Best when recovery is low but movement feels manageable."
              }
            </p>
            <Button 
              onClick={handleStart}
              className="w-full gap-2"
              size="lg"
            >
              <Play className="w-5 h-5 fill-current" />
              Start {selectedMode === "detox" ? "Detox" : "Walk"} ({selectedDuration} min)
            </Button>
          </div>

          {/* What This Unlocks - Expandable */}
          <WhatThisUnlocksSection />

          {/* How Recovery Works - Science-based */}
          <HowRecoveryWorksSection />

          {/* Reminder Info */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
            {dailySettings?.reminderEnabled ? (
              <>
                <Bell className="w-3 h-3 text-primary" />
                <span>Reminder at <strong>{dailySettings.reminderTime}</strong></span>
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
    </div>
  );
}

// Impact Block Component
function ImpactBlock({ mode, duration }: { mode: "detox" | "walk"; duration: number }) {
  const recoveryImpact = getRecoveryImpact(duration, mode);
  
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
      <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-primary" />
        Impact on your system
      </h4>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Recovery
          </span>
          <span className="text-sm font-semibold text-emerald-400">+{recoveryImpact}%</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            Sharpness
          </span>
          <span className="text-[11px] text-muted-foreground/80">indirect boost</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            Readiness
          </span>
          <span className="text-[11px] text-muted-foreground/80">
            {mode === "detox" ? "improves next-day focus" : "light improvement"}
          </span>
        </div>
      </div>
      
      {/* Indirect Effect Explanation */}
      <p className="text-[10px] text-muted-foreground/70 mt-3 pt-3 border-t border-border/30 leading-relaxed">
        Recovery does not train skills directly. It determines how effective cognitive input can be.
        <span className="block mt-1 text-muted-foreground/50">
          Impact increases with duration but is not strictly linear.
        </span>
      </p>
    </div>
  );
}

// What This Unlocks Section
function WhatThisUnlocksSection() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full p-3 rounded-xl bg-card/50 border border-border/50 flex items-center justify-between hover:bg-card/80 transition-colors">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-primary" />
          What this unlocks
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 py-3 text-[11px] text-muted-foreground leading-relaxed">
          <p className="mb-2">As recovery increases, the system progressively unlocks:</p>
          <ul className="space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>cognitive tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>deeper training sessions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>higher daily cognitive load</span>
            </li>
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// How Recovery Works Section
function HowRecoveryWorksSection() {
  const [isWalkScienceOpen, setIsWalkScienceOpen] = useState(false);
  
  return (
    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
      <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5 text-primary" />
        How recovery works
      </h4>
      
      <ul className="space-y-1.5 text-[11px] text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>
          <span>Detox restores recovery faster by removing cognitive input</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>
          <span>Walking supports recovery through movement and circulation</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>
          <span>Recovery determines when training and content are effective</span>
        </li>
      </ul>
      
      {/* Closing line */}
      <p className="text-[10px] text-muted-foreground/60 mt-3 pt-2 border-t border-border/20 italic">
        Recovery prepares the system. Training improves it.
      </p>
      
      {/* Why Walking Helps - Expandable */}
      <Collapsible open={isWalkScienceOpen} onOpenChange={setIsWalkScienceOpen} className="mt-3">
        <CollapsibleTrigger className="text-[10px] text-primary/80 hover:text-primary flex items-center gap-1 transition-colors">
          <span>Why walking helps cognition</span>
          <ChevronDown className={cn(
            "w-3 h-3 transition-transform",
            isWalkScienceOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="text-[10px] text-muted-foreground/70 mt-2 leading-relaxed">
            Light walking increases blood flow and supports neurochemical balance linked to attention and memory, making cognitive effort more effective later.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
