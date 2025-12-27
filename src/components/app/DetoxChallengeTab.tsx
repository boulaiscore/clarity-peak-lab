import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, Clock, Trophy, 
  Play, Pause, Check, Sparkles, Target, Ban, Settings, Shield, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  useWeeklyDetoxXP, 
  useTodayDetoxMinutes, 
  useRecordDetoxCompletion,
} from "@/hooks/useDetoxProgress";
import { useAppBlocker } from "@/hooks/useAppBlocker";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DetoxBlockerSettings } from "./DetoxBlockerSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TRAINING_PLANS, type TrainingPlanId } from "@/lib/trainingPlans";

export function DetoxChallengeTab() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAppsToBlock, setSelectedAppsToBlock] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's training plan
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('training_plan')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const planId = (profile?.training_plan || 'light') as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  const detoxRequirement = plan.detox;

  // Real data from database
  const { data: weeklyData } = useWeeklyDetoxXP();
  const { data: todayMinutes } = useTodayDetoxMinutes();
  const recordCompletion = useRecordDetoxCompletion();
  const { startBlocking, stopBlocking, isNative } = useAppBlocker();

  const todayDetoxMinutes = todayMinutes || 0;
  const weeklyDetoxMinutes = weeklyData?.totalMinutes || 0;
  const weeklyDetoxXP = weeklyData?.totalXP || 0;
  const weeklyTarget = detoxRequirement.weeklyMinutes;
  const goalProgress = Math.min(100, (weeklyDetoxMinutes / weeklyTarget) * 100);
  const goalReached = weeklyDetoxMinutes >= weeklyTarget;

  // Calculate XP for current session
  const currentSessionXP = Math.floor(elapsedSeconds / 60) * detoxRequirement.xpPerMinute;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStart = async () => {
    setIsRunning(true);
    setElapsedSeconds(0);
    setCompleted(false);
    
    // Start app blocking if configured
    if (isNative && selectedAppsToBlock.length > 0) {
      await startBlocking(
        selectedAppsToBlock, 
        120, // Block for 2 hours max
        "Detox in corso. Rimani concentrato!"
      );
    }
    
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleStop = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const minutes = Math.floor(elapsedSeconds / 60);
    
    // Check if session meets minimum requirement
    if (minutes < detoxRequirement.minSessionMinutes) {
      toast({
        title: "Sessione troppo breve",
        description: `Minimo ${detoxRequirement.minSessionMinutes} minuti per registrare la sessione`,
        variant: "destructive",
      });
      setIsRunning(false);
      setElapsedSeconds(0);
      return;
    }

    // Calculate XP
    const baseXP = minutes * detoxRequirement.xpPerMinute;
    const newTotal = weeklyDetoxMinutes + minutes;
    const justReachedGoal = weeklyDetoxMinutes < weeklyTarget && newTotal >= weeklyTarget;
    const totalXP = baseXP + (justReachedGoal ? detoxRequirement.bonusXP : 0);

    setIsRunning(false);
    setCompleted(true);
    
    // Stop app blocking
    if (isNative) {
      await stopBlocking();
    }

    // Record completion to database
    recordCompletion.mutate({
      durationMinutes: minutes,
      xpEarned: totalXP,
    }, {
      onSuccess: () => {
        toast({
          title: "Detox completato!",
          description: justReachedGoal 
            ? `+${totalXP} XP (incluso bonus obiettivo settimanale!)` 
            : `+${totalXP} XP guadagnati`,
        });
      },
    });
  };

  const handleCancel = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setElapsedSeconds(0);
    
    if (isNative) {
      await stopBlocking();
    }
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

  return (
    <div className="space-y-5">
      {/* Plan Requirement Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Smartphone className="w-4 h-4 text-teal-400" />
              <Ban className="w-4 h-4 text-teal-400 absolute inset-0" />
            </div>
            <span className="text-xs font-medium text-teal-400">Digital Detox</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              {plan.name}
            </span>
          </div>
          
          {/* Settings Button */}
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <button className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  App Blocking (Android)
                </DialogTitle>
              </DialogHeader>
              <DetoxBlockerSettings 
                selectedApps={selectedAppsToBlock}
                onAppsChange={setSelectedAppsToBlock}
                onBlockingConfigured={(apps) => {
                  toast({
                    title: "App Blocking Configurato",
                    description: `${apps.length} app verranno bloccate durante il detox`,
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Weekly Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Obiettivo Settimanale</span>
            <span className={cn(
              "text-[10px] font-semibold",
              goalReached ? "text-emerald-400" : "text-teal-400"
            )}>
              {formatMinutesToHours(weeklyDetoxMinutes)} / {formatMinutesToHours(weeklyTarget)}
              {goalReached && <Check className="w-3 h-3 inline ml-1" />}
            </span>
          </div>
          <div className="h-2 bg-teal-500/10 rounded-full overflow-hidden">
            <motion.div 
              className={cn(
                "h-full rounded-full",
                goalReached 
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-r from-teal-400 to-cyan-400"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {goalReached && (
            <p className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Obiettivo raggiunto! +{detoxRequirement.bonusXP} XP bonus
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{todayDetoxMinutes}</div>
            <div className="text-[10px] text-muted-foreground">min oggi</div>
          </div>
          <div className="text-center border-x border-border/30">
            <div className="text-lg font-bold text-foreground">{weeklyDetoxMinutes}</div>
            <div className="text-[10px] text-muted-foreground">min settimana</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-teal-400">+{weeklyDetoxXP}</div>
            <div className="text-[10px] text-muted-foreground">XP</div>
          </div>
        </div>
      </div>

      {/* Active Session or Start */}
      {isRunning || completed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-6 rounded-2xl border text-center",
            completed 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-card border-border"
          )}
        >
          {completed ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-400 mb-1">Detox Completato!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Hai trascorso {formatTime(elapsedSeconds)} senza social media
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                +{Math.floor(elapsedSeconds / 60) * detoxRequirement.xpPerMinute} XP
              </div>
              <Button 
                onClick={() => {
                  setCompleted(false);
                  setElapsedSeconds(0);
                }}
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
                    <Smartphone className="w-6 h-6 text-teal-400" />
                    <Ban className="w-6 h-6 text-teal-400 absolute inset-0" />
                  </div>
                  <span className="text-2xl font-mono font-bold">{formatTime(elapsedSeconds)}</span>
                  <span className="text-xs text-teal-400 font-medium">+{currentSessionXP} XP</span>
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-foreground mb-1">Detox in corso...</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Minimo {detoxRequirement.minSessionMinutes} min per registrare
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
                  onClick={handleStop}
                  className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700"
                  disabled={elapsedSeconds < detoxRequirement.minSessionMinutes * 60}
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-teal-500/10 flex items-center justify-center">
              <div className="relative">
                <Smartphone className="w-8 h-8 text-teal-400" />
                <Ban className="w-8 h-8 text-teal-400 absolute inset-0" />
              </div>
            </div>
            
            <h3 className="text-base font-semibold text-foreground mb-2">
              Inizia una Sessione Detox
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Disconnettiti dai social e guadagna <span className="text-teal-400 font-medium">{detoxRequirement.xpPerMinute} XP/min</span>
            </p>

            <Button 
              onClick={handleStart}
              className="w-full gap-2 bg-teal-600 hover:bg-teal-700"
              size="lg"
            >
              <Play className="w-5 h-5 fill-current" />
              Avvia Detox
            </Button>
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Requisiti Piano {plan.name}
            </h4>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-2">
                <Target className="w-3 h-3 text-teal-400" />
                <span><strong>{formatMinutesToHours(weeklyTarget)}</strong> di detox a settimana</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-teal-400" />
                <span>Sessione minima: <strong>{detoxRequirement.minSessionMinutes} min</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-teal-400" />
                <span>Bonus obiettivo: <strong>+{detoxRequirement.bonusXP} XP</strong></span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
