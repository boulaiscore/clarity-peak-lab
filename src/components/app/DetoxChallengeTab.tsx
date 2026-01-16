import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Clock, Play, Pause, Check, Sparkles, Info, Loader2, Bell, BellOff, 
  Leaf, Footprints
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
            <Label className="text-xs text-muted-foreground mb-3 block">Session duration</Label>
            <div className="flex flex-wrap gap-2">
              {DETOX_SLOT_OPTIONS.map((slot) => (
                <button
                  key={slot.value}
                  onClick={() => setSelectedDuration(slot.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    selectedDuration === slot.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Minimum session: 30 min for measurable impact
            </p>
          </div>

          {/* CTA */}
          <Button 
            onClick={handleStart}
            className="w-full gap-2"
            size="lg"
          >
            <Play className="w-5 h-5 fill-current" />
            Start {selectedMode === "detox" ? "Detox" : "Walk"} ({selectedDuration} min)
          </Button>

          {/* How Recovery Works */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              How recovery works
            </h4>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Detox contributes more to recovery than walking.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Both reduce decision fatigue and restore clarity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Recovery affects availability of training sessions and tasks.</span>
              </li>
            </ul>
          </div>

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
