import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Smartphone, Clock, Trophy, 
  Play, Pause, Check, Sparkles, Target, Ban, Settings, Shield, Info, Loader2, Bell, BellOff
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DetoxBlockerSettings } from "./DetoxBlockerSettings";
import { useAuth } from "@/contexts/AuthContext";
import { scheduleDetoxReminder, cancelDetoxReminder, getNotificationState, requestNotificationPermission } from "@/lib/notifications";

export function DetoxChallengeTab() {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [selectedAppsToBlock, setSelectedAppsToBlock] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const [lastSessionSeconds, setLastSessionSeconds] = useState(0);
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
    setJustCompleted(false);
    const success = await startSession(selectedDuration, selectedAppsToBlock);
    if (!success) {
      toast({
        title: "Errore",
        description: "Impossibile avviare la sessione",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    const sessionMinutes = Math.floor(displaySeconds / 60);
    
    if (sessionMinutes < 30) {
      toast({
        title: "Sessione troppo breve",
        description: "Minimo 30 minuti per registrare la sessione",
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
          title: "Notifiche non abilitate",
          description: "Attiva le notifiche nelle impostazioni del browser",
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

  const formatMinutesToHours = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} min`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  if (sessionLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Weekly Goal Progress Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Smartphone className="w-4 h-4 text-primary" />
              <Ban className="w-4 h-4 text-primary absolute inset-0" />
            </div>
            <span className="text-xs font-medium text-primary">Weekly Goal</span>
          </div>
          
          {/* Goal Settings Button */}
          <Dialog open={showGoalSettings} onOpenChange={setShowGoalSettings}>
            <DialogTrigger asChild>
              <button className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Impostazioni Detox
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Reminder Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Promemoria</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Ricevi una notifica per ricordarti del detox
                    </p>
                  </div>
                  <Switch
                    checked={dailySettings?.reminderEnabled ?? true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleEnableReminder();
                      } else {
                        updateSettings.mutate({ reminderEnabled: false });
                      }
                    }}
                  />
                </div>

                {/* Reminder Time */}
                {dailySettings?.reminderEnabled && (
                  <div className="space-y-2">
                    <Label className="text-sm">Orario Promemoria</Label>
                    <Select
                      value={dailySettings?.reminderTime || "20:00"}
                      onValueChange={(val) => updateSettings.mutate({ reminderTime: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18:00">18:00</SelectItem>
                        <SelectItem value="19:00">19:00</SelectItem>
                        <SelectItem value="20:00">20:00</SelectItem>
                        <SelectItem value="21:00">21:00</SelectItem>
                        <SelectItem value="22:00">22:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* App Blocking Section */}
                <div className="pt-2 border-t border-border/50">
                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2" size="sm">
                        <Shield className="w-4 h-4" />
                        Configura App Blocking (Android)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-base flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          App Blocking
                        </DialogTitle>
                      </DialogHeader>
                      <DetoxBlockerSettings 
                        selectedApps={selectedAppsToBlock}
                        onAppsChange={setSelectedAppsToBlock}
                        onBlockingConfigured={(apps) => {
                          toast({
                            title: "App Blocking Configurato",
                            description: `${apps.length} app verranno bloccate`,
                          });
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weekly Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Progresso Settimanale</span>
            <span className="text-[10px] font-semibold text-primary">
              {formatMinutesToHours(weeklyDetoxMinutes)} • +{weeklyDetoxXP.toFixed(1)} XP
            </span>
          </div>
          <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((weeklyDetoxMinutes / 420) * 100, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            7h settimanali raccomandate per benefici cognitivi
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{weeklyDetoxMinutes}</div>
            <div className="text-[10px] text-muted-foreground">minuti questa settimana</div>
          </div>
          <div className="text-center border-l border-border/30">
            <div className="text-lg font-bold text-primary">+{weeklyDetoxXP.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground">XP guadagnati</div>
          </div>
        </div>
      </div>

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
              <h3 className="text-lg font-semibold text-emerald-400 mb-1">Detox Completato!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Hai trascorso {formatTime(lastSessionSeconds)} senza distrazioni
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                +{(Math.floor(lastSessionSeconds / 60) * DETOX_XP_PER_MINUTE).toFixed(1)} XP
              </div>
              <Button 
                onClick={handleNewSession}
                variant="ghost"
                className="w-full mt-4"
              >
                Nuova Sessione
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
                    <Smartphone className="w-6 h-6 text-primary" />
                    <Ban className="w-6 h-6 text-primary absolute inset-0" />
                  </div>
                  <span className="text-2xl font-mono font-bold">{formatTime(displaySeconds)}</span>
                  <span className="text-xs text-primary font-medium">+{currentSessionXP.toFixed(1)} XP</span>
                  {violationCount > 0 && (
                    <span className="text-[10px] text-amber-400 mt-1">
                      ⚠️ {violationCount} violazion{violationCount === 1 ? 'e' : 'i'}
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-foreground mb-1">Detox in corso...</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Minimo 30 min per registrare
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Annulla
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="flex-1 gap-2"
                  disabled={displaySeconds < 30 * 60}
                >
                  <Check className="w-4 h-4" />
                  Completa
                </Button>
              </div>
            </>
          )}
        </motion.div>
      ) : (
        <>
          {/* Start Session Card */}
          <div className="p-6 rounded-2xl bg-card border border-border text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="relative">
                <Smartphone className="w-8 h-8 text-primary" />
                <Ban className="w-8 h-8 text-primary absolute inset-0" />
              </div>
            </div>
            
            <h3 className="text-base font-semibold text-foreground mb-2">
              Inizia una Sessione Detox
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Disconnettiti e guadagna <span className="text-primary font-medium">{DETOX_XP_PER_MINUTE} XP/min</span>
            </p>

            {/* Duration Selector */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Durata sessione</Label>
              <div className="flex flex-wrap gap-2 justify-center">
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
            </div>

            <Button 
              onClick={handleStart}
              className="w-full gap-2"
              size="lg"
            >
              <Play className="w-5 h-5 fill-current" />
              Avvia Detox ({selectedDuration} min)
            </Button>
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Come funziona
            </h4>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-2">
                <Target className="w-3 h-3 text-primary" />
                <span>Obiettivo: <strong>{formatMinutesToHours(dailyProgress.dailyGoal)}</strong> di detox al giorno</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-primary" />
                <span>Sessione minima: <strong>30 min</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-primary" />
                <span>XP potenziali oggi: <strong>+{dailyProgress.potentialXP} XP</strong></span>
              </li>
              <li className="flex items-center gap-2">
                {dailySettings?.reminderEnabled ? (
                  <Bell className="w-3 h-3 text-primary" />
                ) : (
                  <BellOff className="w-3 h-3 text-muted-foreground" />
                )}
                <span>
                  Promemoria: <strong>{dailySettings?.reminderEnabled ? `alle ${dailySettings.reminderTime}` : "disattivato"}</strong>
                </span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
