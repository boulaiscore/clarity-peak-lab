import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth, TrainingGoal, SessionDuration, DailyTimeCommitment } from "@/contexts/AuthContext";
import { usePremiumGating, MAX_DAILY_SESSIONS_FREE } from "@/hooks/usePremiumGating";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { User, Crown, Save, LogOut, Zap, Brain, Calendar, Lock, RotateCcw, Shield, Mail, CreditCard, HelpCircle, CheckCircle2, Rocket, ExternalLink, Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { WearableIntegrationSection } from "@/components/settings/WearableIntegrationSection";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const Account = () => {
  const { user, updateUser, logout } = useAuth();
  const { isPremium, dailySessionsUsed, remainingSessions } = usePremiumGating();
  const { permission, isSupported, requestPermission, setDailyReminder, scheduledAt } = useNotifications();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoal[]>(user?.trainingGoals || []);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration | undefined>(user?.sessionDuration);
  const [dailyTimeCommitment, setDailyTimeCommitment] = useState<DailyTimeCommitment | undefined>(
    user?.dailyTimeCommitment,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean | null>(null);
  
  // Daily Reminder states
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:30");

  // Load reminder settings from database
  useEffect(() => {
    const loadReminderSettings = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("reminder_enabled, reminder_time")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setReminderEnabled(data.reminder_enabled || false);
        if (data.reminder_time) {
          // Format time from "HH:mm:ss" to "HH:mm"
          setReminderTime(data.reminder_time.substring(0, 5));
        }
      }
    };
    
    loadReminderSettings();
  }, [user?.id]);

  // Check if user has completed assessment (non-default baseline values)
  useEffect(() => {
    const checkAssessmentStatus = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("user_cognitive_metrics")
        .select("baseline_fast_thinking, baseline_slow_thinking, baseline_captured_at")
        .eq("user_id", user.id)
        .single();
      
      // If all baselines are exactly 50, they likely skipped
      const isSkipped = data?.baseline_fast_thinking === 50 && 
                        data?.baseline_slow_thinking === 50 &&
                        !data?.baseline_captured_at;
      
      setHasCompletedAssessment(!isSkipped && data?.baseline_fast_thinking !== null);
    };
    
    checkAssessmentStatus();
  }, [user?.id]);

  const handleResetAssessment = async () => {
    if (!user?.id) return;

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          baseline_focus: null,
          baseline_reasoning: null,
          baseline_creativity: null,
          baseline_fast_thinking: null,
          baseline_slow_thinking: null,
          baseline_cognitive_age: null,
          baseline_captured_at: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Assessment reset",
        description: "Redirecting to initial assessment...",
      });

      navigate("/onboarding?step=assessment");
    } catch (error) {
      console.error("Error resetting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to reset assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setTrainingGoals(user.trainingGoals || []);
      setSessionDuration(user.sessionDuration);
      setDailyTimeCommitment(user.dailyTimeCommitment);
    }
  }, [user]);

  const toggleGoal = (goal: TrainingGoal) => {
    setTrainingGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const result = await requestPermission();
      if (result !== "granted") {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setReminderEnabled(enabled);
    
    // Update reminder in notification system
    setDailyReminder(enabled, reminderTime, dailyTimeCommitment || "7min");
    
    // Save to database
    if (user?.id) {
      await supabase
        .from("profiles")
        .update({ reminder_enabled: enabled })
        .eq("user_id", user.id);
    }
    
    toast({
      title: enabled ? "Reminder enabled" : "Reminder disabled",
      description: enabled ? `You'll receive a daily notification at ${reminderTime}` : "Daily reminders have been turned off.",
    });
  };

  const handleReminderTimeChange = async (time: string) => {
    setReminderTime(time);
    
    // Update reminder in notification system
    if (reminderEnabled) {
      setDailyReminder(true, time, dailyTimeCommitment || "7min");
    }
    
    // Save to database
    if (user?.id) {
      await supabase
        .from("profiles")
        .update({ reminder_time: time + ":00" })
        .eq("user_id", user.id);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    updateUser({
      name,
      trainingGoals,
      sessionDuration,
      dailyTimeCommitment,
    });
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    setIsSaving(false);
  };

  const dailyTimeOptions: { value: DailyTimeCommitment; label: string }[] = [
    { value: "3min", label: "3 min" },
    { value: "7min", label: "7 min" },
    { value: "10min", label: "10 min" },
  ];

  // Get member since date (from user creation or fallback)
  const memberSince = user?.id ? format(new Date(), "MMMM yyyy") : "—";
  const maskedAccountId = user?.id ? `••••••${user.id.slice(-4)}` : "—";

  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold mb-1">{user?.name || "User"}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>

          {/* Account Information */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </span>
                <span className="text-sm font-medium">{user?.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since
                </span>
                <span className="text-sm font-medium">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Account ID
                </span>
                <span className="text-sm font-medium font-mono">{maskedAccountId}</span>
              </div>
            </div>
          </div>

          {/* Subscription Status - Premium Beta */}
          {isPremium ? (
            <div className="p-6 rounded-xl bg-card border border-primary/30 mb-6 shadow-card relative overflow-hidden">
              {/* Beta Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  <Rocket className="w-3 h-3" />
                  BETA TESTER
                </span>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Premium Access</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5">
                You're part of our exclusive beta program. Premium features are free during the beta period.
              </p>

              {/* Subscription Details */}
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50 mb-5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Subscription Details
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Beta Status</span>
                    <span className="font-medium text-emerald-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Renewal</span>
                    <span className="font-medium">Free during beta</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Payment
                    </span>
                    <span className="font-medium">No payment required</span>
                  </div>
                </div>
              </div>

              {/* Features Included */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-5">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                  Included Features
                </h4>
                <ul className="space-y-2">
                  <li className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Full access to all Neuro Lab areas
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Neuro Activation feature
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Unlimited daily sessions
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    All session durations (30s-7min)
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Complete badge system
                  </li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground/70 mb-4">
                After the beta period ends, you'll be notified before any changes to your subscription.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-destructive">
                    Leave Beta Program
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Beta Program?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will lose access to Premium features and revert to the Free plan. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Leave Program
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            /* Subscription Status - Free Plan */
            <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Free Plan</p>
                    <p className="text-xs text-muted-foreground">Limited access</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="hero" className="rounded-xl">
                  <Link to="/app/premium">Upgrade</Link>
                </Button>
              </div>

              {/* Daily Sessions */}
              <div className="pt-4 border-t border-border/50 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Daily Sessions</span>
                  <span className="text-sm font-medium">
                    {dailySessionsUsed}/{MAX_DAILY_SESSIONS_FREE}
                  </span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all rounded-full",
                      remainingSessions === 0 ? "bg-destructive" : "bg-primary",
                    )}
                    style={{ width: `${(dailySessionsUsed / MAX_DAILY_SESSIONS_FREE) * 100}%` }}
                  />
                </div>
                {remainingSessions === 0 && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Daily limit reached. Resets tomorrow.
                  </p>
                )}
              </div>

              {/* Beta Promo */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Beta Access Available</p>
                    <p className="text-xs text-muted-foreground">
                      Get Premium free as a beta tester. Limited to 100 spots.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Name */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <label className="text-sm font-medium mb-3 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12" />
          </div>

          {/* Training Goals */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">Training Goals</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleGoal("fast_thinking")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  trainingGoals.includes("fast_thinking")
                    ? "border-warning bg-warning/10"
                    : "border-border hover:border-warning/30",
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
                <span className="font-medium text-sm block">Fast Thinking</span>
                <span className="text-xs text-muted-foreground">Intuition</span>
              </button>
              <button
                onClick={() => toggleGoal("slow_thinking")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  trainingGoals.includes("slow_thinking")
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-sm block">Slow Thinking</span>
                <span className="text-xs text-muted-foreground">Structured</span>
              </button>
            </div>
          </div>

          {/* Daily Time */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Daily Commitment
            </h3>
            <div className="flex gap-2">
              {dailyTimeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDailyTimeCommitment(option.value)}
                  className={cn(
                    "flex-1 p-3 rounded-xl border text-sm transition-all",
                    dailyTimeCommitment === option.value
                      ? "border-primary bg-primary/8"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Reminder */}
          {isSupported && (
            <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Daily Reminder
              </h3>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium">Enable daily training reminder</p>
                  <p className="text-xs text-muted-foreground">Get notified when it's time to train</p>
                </div>
                <Switch 
                  checked={reminderEnabled} 
                  onCheckedChange={handleReminderToggle}
                />
              </div>
              
              {reminderEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Reminder time</label>
                    <Input 
                      type="time" 
                      value={reminderTime} 
                      onChange={(e) => handleReminderTimeChange(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <BellRing className="w-4 h-4 text-primary" />
                      <span>
                        Daily {dailyTimeCommitment || "7min"} session reminder at{" "}
                        <span className="font-semibold">{reminderTime}</span>
                      </span>
                    </div>
                    {scheduledAt && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Next: {format(scheduledAt, "MMM d, h:mm a")}
                      </p>
                    )}
                  </div>
                  
                  {permission !== "granted" && (
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      ⚠️ Enable browser notifications to receive reminders
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Wearable Integration */}
          <WearableIntegrationSection />

          {/* Cognitive Baseline */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Cognitive Baseline
            </h3>
            
            {hasCompletedAssessment === false ? (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  You skipped the initial assessment. Take it now to get personalized baseline metrics.
                </p>
                <Button 
                  variant="hero" 
                  className="w-full rounded-xl" 
                  onClick={() => navigate("/onboarding?step=assessment")}
                >
                  <Brain className="w-4 h-4" />
                  Take Assessment
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  Reset your initial assessment to establish new baseline metrics for Fast/Slow thinking scores.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full rounded-xl" disabled={isResetting}>
                      <RotateCcw className="w-4 h-4" />
                      {isResetting ? "Resetting..." : "Reset Assessment"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Initial Assessment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear your current baseline cognitive metrics and redirect you to retake the initial
                        assessment. Your training history will be preserved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetAssessment}>Reset & Retake</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>

          {/* Help & Support */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Help & Support
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Need help with your account or subscription? Our team is here to assist you.
            </p>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => window.open("mailto:support@superhuman-labs.com", "_blank")}
            >
              <Mail className="w-4 h-4" />
              Contact Support
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </Button>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={handleSave} variant="hero" className="w-full min-h-[52px] rounded-xl" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={logout} variant="outline" className="w-full min-h-[52px] rounded-xl">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* SuperHuman Labs Footer */}
          <div className="mt-12 pt-6 border-t border-border/50 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors">
              <Zap className="w-3 h-3" />
              <span className="text-xs font-medium tracking-wide">SuperHuman Labs</span>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-1">Cognitive Performance Engineering</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Account;
