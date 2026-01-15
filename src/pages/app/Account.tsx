import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth, SessionDuration } from "@/contexts/AuthContext";
import { usePremiumGating, MAX_DAILY_SESSIONS_FREE } from "@/hooks/usePremiumGating";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { User, Crown, Save, LogOut, Zap, Brain, Calendar, RotateCcw, Shield, Mail, CreditCard, HelpCircle, Rocket, ExternalLink, Bell, BellRing, Sun, Moon, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

import { TrainingPlanSelector } from "@/components/settings/TrainingPlanSelector";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  
  const [sessionDuration, setSessionDuration] = useState<SessionDuration | undefined>(user?.sessionDuration);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlanId>(user?.trainingPlan || "light");
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
      setSessionDuration(user.sessionDuration);
      setTrainingPlan(user.trainingPlan || "light");
    }
  }, [user]);

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
    
    // Get session duration from selected plan
    const planConfig = TRAINING_PLANS[trainingPlan];
    const planDuration = planConfig.sessionDuration.split("-")[0]; // e.g. "15-18 min" -> "15"
    
    // Update reminder in notification system
    setDailyReminder(enabled, reminderTime, `${planDuration}min`);
    
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
    
    // Get session duration from selected plan
    const planConfig = TRAINING_PLANS[trainingPlan];
    const planDuration = planConfig.sessionDuration.split("-")[0];
    
    // Update reminder in notification system
    if (reminderEnabled) {
      setDailyReminder(true, time, `${planDuration}min`);
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
      sessionDuration,
      trainingPlan,
    });
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    setIsSaving(false);
  };

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

          {/* Pricing & Subscription Settings */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Pricing & Subscription
            </h3>
            
            {/* Current Plan Overview */}
            <div className="p-4 rounded-lg bg-muted/20 border border-border/50 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isPremium ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Premium Plan</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">BETA ACCESS</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Free Plan</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">LIMITED ACCESS</p>
                      </div>
                    </>
                  )}
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-semibold uppercase",
                  isPremium 
                    ? "bg-emerald-500/15 text-emerald-400" 
                    : "bg-amber-500/15 text-amber-400"
                )}>
                  {isPremium ? "Active" : "Limited"}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Plan Type</span>
                  <span className="font-medium">{isPremium ? "Premium (Beta)" : "Free"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="font-medium">{isPremium ? "Free during beta" : "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-muted-foreground">Next Renewal</span>
                  <span className="font-medium">{isPremium ? "N/A (Beta)" : "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">{isPremium ? "$0.00/mo" : "$0.00/mo"}</span>
                </div>
              </div>
            </div>

            {/* Beta Version Info */}
            {isPremium && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Beta Tester Status</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      You're part of our exclusive beta program. Premium features are free until the official launch.
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <span className="ml-1 font-mono font-medium">v0.9.2-beta</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="ml-1 font-medium">{memberSince}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Available Plans */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Available Plans
              </h4>
              <div className="space-y-3">
                {/* Free Plan */}
                <div className={cn(
                  "p-3 rounded-lg border transition-all",
                  !isPremium 
                    ? "border-primary/30 bg-primary/5" 
                    : "border-border/50 bg-muted/10"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Free</span>
                      {!isPremium && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/15 text-primary">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="font-semibold">$0/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    2 daily sessions • Basic training areas • Limited features
                  </p>
                </div>

                {/* Premium Plan */}
                <div className={cn(
                  "p-3 rounded-lg border transition-all",
                  isPremium 
                    ? "border-primary/30 bg-primary/5" 
                    : "border-border/50 bg-muted/10"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Premium</span>
                      {isPremium && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/15 text-primary">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="font-semibold">$12/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unlimited sessions • All training areas • 1 report/month
                  </p>
                </div>

                {/* Pro Plan */}
                <div className="p-3 rounded-lg border border-border/50 bg-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Pro</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400">
                        BEST VALUE
                      </span>
                    </div>
                    <span className="font-semibold">$16.99/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Everything in Premium • Unlimited reports • Priority support
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Payment Method
              </h4>
              <div className="p-3 rounded-lg border border-border/50 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 rounded bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                      <p className="text-[10px] text-muted-foreground">Expires 12/26</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs h-7" disabled={!isPremium}>
                    Update
                  </Button>
                </div>
              </div>
              {!isPremium && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Payment method will be added when you upgrade to a paid plan.
                </p>
              )}
            </div>

            {/* Manage Subscription CTA */}
            {!isPremium ? (
              <Button asChild variant="hero" className="w-full">
                <Link to="/app/premium">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Link>
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1" size="sm">
                  <Link to="/app/premium">
                    View Plans
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  Cancel Plan
                </Button>
              </div>
            )}
          </div>


          {/* Name */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <label className="text-sm font-medium mb-3 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-12" />
          </div>

          {/* Training Plan */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              Training Plan
            </h3>
            <TrainingPlanSelector 
              selectedPlan={trainingPlan} 
              onSelectPlan={setTrainingPlan}
              showDetails={true}
            />
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
                        Daily training reminder at{" "}
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

          {/* Theme Toggle */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              Appearance
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Light Mode</p>
                <p className="text-xs text-muted-foreground">Switch to light theme</p>
              </div>
              <Switch 
                checked={theme === "light"} 
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>



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
