import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, Clock, Trophy, 
  Play, Pause, Check, Sparkles, Target, Ban, Settings, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  useWeeklyDetoxXP, 
  useTodayDetoxMinutes, 
  useRecordDetoxCompletion,
  useDetoxGoal,
  useUpdateDetoxGoal
} from "@/hooks/useDetoxProgress";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface DetoxSession {
  targetMinutes: number;
  label: string;
  xp: number;
}

const DETOX_OPTIONS: DetoxSession[] = [
  { targetMinutes: 15, label: "15 min", xp: 10 },
  { targetMinutes: 30, label: "30 min", xp: 25 },
  { targetMinutes: 60, label: "1 hour", xp: 50 },
  { targetMinutes: 120, label: "2 hours", xp: 100 },
];

export function DetoxChallengeTab() {
  const [selectedOption, setSelectedOption] = useState<DetoxSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [goalMinutes, setGoalMinutes] = useState(120);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Real data from database
  const { data: weeklyData } = useWeeklyDetoxXP();
  const { data: todayMinutes } = useTodayDetoxMinutes();
  const { data: goal } = useDetoxGoal();
  const updateGoal = useUpdateDetoxGoal();
  const recordCompletion = useRecordDetoxCompletion();

  const todayDetoxMinutes = todayMinutes || 0;
  const weeklyDetoxMinutes = weeklyData?.totalMinutes || 0;
  const weeklyDetoxXP = weeklyData?.totalXP || 0;
  const weeklyGoal = goal?.weeklyMinutesTarget || 120;
  const goalProgress = Math.min(100, (weeklyDetoxMinutes / weeklyGoal) * 100);

  // Initialize goal slider when goal data loads
  useEffect(() => {
    if (goal) {
      setGoalMinutes(goal.weeklyMinutesTarget);
    }
  }, [goal]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStart = () => {
    if (!selectedOption) return;
    setIsRunning(true);
    setElapsedSeconds(0);
    setCompleted(false);
    
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const newValue = prev + 1;
        if (selectedOption && newValue >= selectedOption.targetMinutes * 60) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          setCompleted(true);
          // Record completion to database
          recordCompletion.mutate({
            durationMinutes: selectedOption.targetMinutes,
            xpEarned: selectedOption.xp,
          }, {
            onSuccess: () => {
              toast({
                title: "Detox Complete!",
                description: `You earned +${selectedOption.xp} XP`,
              });
            },
          });
        }
        return newValue;
      });
    }, 1000);
  };

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const handleSaveGoal = () => {
    updateGoal.mutate({
      weeklyMinutesTarget: goalMinutes,
      weeklySessionsTarget: Math.ceil(goalMinutes / 30), // Estimate sessions
    }, {
      onSuccess: () => {
        toast({
          title: "Goal Updated",
          description: `Weekly target set to ${goalMinutes} minutes`,
        });
        setShowGoalSettings(false);
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = selectedOption 
    ? Math.min((elapsedSeconds / (selectedOption.targetMinutes * 60)) * 100, 100) 
    : 0;

  return (
    <div className="space-y-5">
      {/* Stats Banner with Goal */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Smartphone className="w-4 h-4 text-teal-400" />
              <Ban className="w-4 h-4 text-teal-400 absolute inset-0" />
            </div>
            <span className="text-xs font-medium text-teal-400">Digital Detox</span>
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
                <DialogTitle className="text-base">Weekly Detox Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Target minutes per week</span>
                    <span className="text-lg font-bold text-teal-400">{goalMinutes} min</span>
                  </div>
                  <Slider
                    value={[goalMinutes]}
                    onValueChange={(v) => setGoalMinutes(v[0])}
                    min={30}
                    max={420}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>30 min</span>
                    <span>7 hours</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Suggested:</span> Start with 2 hours/week and gradually increase. 
                    This equals about {Math.ceil(goalMinutes / 30)} sessions of 30 min each.
                  </p>
                </div>

                <Button onClick={handleSaveGoal} className="w-full gap-2 bg-teal-600 hover:bg-teal-700">
                  <Save className="w-4 h-4" />
                  Save Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Goal Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Weekly Goal Progress</span>
            <span className="text-[10px] font-semibold text-teal-400">
              {weeklyDetoxMinutes} / {weeklyGoal} min
            </span>
          </div>
          <div className="h-2 bg-teal-500/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{todayDetoxMinutes}</div>
            <div className="text-[10px] text-muted-foreground">min today</div>
          </div>
          <div className="text-center border-x border-border/30">
            <div className="text-lg font-bold text-foreground">{weeklyDetoxMinutes}</div>
            <div className="text-[10px] text-muted-foreground">min this week</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-teal-400">+{weeklyDetoxXP}</div>
            <div className="text-[10px] text-muted-foreground">XP earned</div>
          </div>
        </div>
      </div>

      {/* Active Challenge or Selection */}
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
              <h3 className="text-lg font-semibold text-emerald-400 mb-1">Challenge Complete!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                You stayed off social media for {selectedOption?.label}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                +{selectedOption?.xp} XP
              </div>
              <Button 
                onClick={() => {
                  setCompleted(false);
                  setSelectedOption(null);
                }}
                variant="ghost"
                className="w-full mt-4"
              >
                Start New Challenge
              </Button>
            </>
          ) : (
            <>
              <div className="relative w-28 h-28 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted/30"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={`${progress * 2.83} 283`}
                    strokeLinecap="round"
                    className="text-teal-500 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative mb-1">
                    <Smartphone className="w-5 h-5 text-teal-400" />
                    <Ban className="w-5 h-5 text-teal-400 absolute inset-0" />
                  </div>
                  <span className="text-xl font-mono font-bold">{formatTime(elapsedSeconds)}</span>
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-foreground mb-1">Detox in progress...</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Stay off social media for {selectedOption?.label}
              </p>
              
              <Button 
                onClick={handleCancel}
                variant="outline"
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                Cancel Challenge
              </Button>
            </>
          )}
        </motion.div>
      ) : (
        <>
          {/* Intro */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Earn XP by disconnecting:</span> Choose a challenge duration and stay off social media to earn points.
            </p>
          </div>

          {/* Challenge Options */}
          <div className="grid grid-cols-2 gap-3">
            {DETOX_OPTIONS.map((option) => (
              <motion.button
                key={option.targetMinutes}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOption(option)}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left",
                  selectedOption?.targetMinutes === option.targetMinutes
                    ? "bg-teal-500/15 border-teal-500/40"
                    : "bg-card border-border/50 hover:border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{option.label}</span>
                </div>
                <div className="flex items-center gap-1 text-teal-400 text-xs font-medium">
                  <Trophy className="w-3 h-3" />
                  +{option.xp} XP
                </div>
              </motion.button>
            ))}
          </div>

          {/* Start Button */}
          <AnimatePresence>
            {selectedOption && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
              <Button 
                  onClick={handleStart}
                  className="w-full gap-2 bg-teal-600 hover:bg-teal-700"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start {selectedOption.label} Detox
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* How It Works */}
      <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
        <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          How It Works
        </h4>
        <ul className="space-y-1.5 text-[11px] text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-teal-400">1.</span>
            Select a challenge duration
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400">2.</span>
            Start the timer and put your phone down
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400">3.</span>
            Avoid opening social apps until time is up
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400">4.</span>
            Earn XP and build healthier habits
          </li>
        </ul>
      </div>
    </div>
  );
}