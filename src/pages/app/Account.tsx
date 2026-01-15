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
import { User, Crown, Save, LogOut, Zap, Brain, Calendar, Lock, RotateCcw, Shield, Mail, CreditCard, HelpCircle, CheckCircle2, Rocket, ExternalLink, Bell, BellRing, Sun, Moon, Dumbbell, Calculator, Info, Activity } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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


          {/* How We Calculate Your Metrics - Q&A Section */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              How We Calculate Your Metrics
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Understand the exact formulas and data sources behind your cognitive scores. All values are normalized 0–100.
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              {/* Baseline Assessment - NEW SECTION */}
              <AccordionItem value="baseline-assessment" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-violet-400" />
                    Baseline Assessment
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>The initial assessment establishes your <strong>cognitive baseline</strong> — the starting point for all progress tracking.</p>
                    
                    <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                      <p className="font-semibold text-violet-400 text-xs mb-2">📊 Assessment → Cognitive States</p>
                      <ul className="text-xs space-y-1">
                        <li>• <strong>Focus drills</strong> → AE (Attentional Efficiency)</li>
                        <li>• <strong>Reasoning drills</strong> → CT (Critical Thinking)</li>
                        <li>• <strong>Creativity Fast drill</strong> → RA (Rapid Association)</li>
                        <li>• <strong>Creativity Slow drill</strong> → IN (Insight)</li>
                      </ul>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-semibold text-foreground text-xs mb-2">What Baseline Determines:</p>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>• <strong>Initial Cognitive Age</strong> — Your starting cognitive age estimate</li>
                        <li>• <strong>Baseline AE, RA, CT, IN</strong> — Reference values for progress tracking</li>
                        <li>• <strong>Improvement Delta</strong> — How much you've improved from baseline</li>
                      </ul>
                    </div>
                    
                    <div className="p-2 rounded bg-primary/5 border border-primary/20 text-xs">
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span>
                          <strong>Skipped Assessment:</strong> If skipped, all states default to 50 and cognitive age equals chronological age. 
                          You can retake the assessment in Settings.
                        </span>
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            
              {/* Cognitive States - BASE VARIABLES */}
              <AccordionItem value="cognitive-states" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Cognitive States (Base Variables)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>These are the ONLY trainable cognitive states. All metrics are derived from these base variables.</p>
                    
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="font-semibold text-amber-400 text-xs mb-2">⚡ System 1 — Intuition (Fast Thinking)</p>
                      <ul className="text-xs space-y-1 mb-2">
                        <li>• <strong>AE</strong> = Attentional Efficiency (0–100)</li>
                        <li>• <strong>RA</strong> = Rapid Association (0–100)</li>
                      </ul>
                      <div className="p-2 rounded bg-muted/30 font-mono text-[10px]">
                        S1 = (AE + RA) / 2
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="font-semibold text-primary text-xs mb-2">🧠 System 2 — Reasoning (Slow Thinking)</p>
                      <ul className="text-xs space-y-1 mb-2">
                        <li>• <strong>CT</strong> = Critical Thinking (0–100)</li>
                        <li>• <strong>IN</strong> = Insight (0–100)</li>
                      </ul>
                      <div className="p-2 rounded bg-muted/30 font-mono text-[10px]">
                        S2 = (CT + IN) / 2
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs">
                      <p className="font-semibold text-foreground mb-1">Database Mapping:</p>
                      <ul className="space-y-0.5 text-muted-foreground">
                        <li>• AE ← <code className="bg-muted/50 px-1 rounded">focus_stability</code></li>
                        <li>• RA ← <code className="bg-muted/50 px-1 rounded">fast_thinking</code></li>
                        <li>• CT ← <code className="bg-muted/50 px-1 rounded">reasoning_accuracy</code></li>
                        <li>• IN ← <code className="bg-muted/50 px-1 rounded">slow_thinking</code></li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Sharpness - PRIMARY TODAY METRIC */}
              <AccordionItem value="sharpness" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Sharpness (Primary Metric)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Sharpness measures your <strong>immediate cognitive performance capacity</strong>. It's the primary metric on the Home screen.</p>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs">
                      <p className="text-foreground font-semibold mb-2">Formula:</p>
                      <p className="mb-2">Sharpness_base = <strong className="text-amber-400">0.50</strong> × S1 + <strong className="text-primary">0.30</strong> × AE + <strong className="text-primary">0.20</strong> × S2</p>
                      <p className="text-primary">Sharpness = Sharpness_base × (0.75 + 0.25 × REC / 100)</p>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span><strong>Base Weights:</strong> 50% System 1 (intuition), 30% Attentional Efficiency, 20% System 2 (reasoning).</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span><strong>Recovery Modulation:</strong> Recovery provides 0–25% boost. At 0% recovery, Sharpness is 75% of base. At 100% recovery, full 100%.</span>
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                      <p className="font-semibold text-foreground mb-2">Example:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• S1 = 60, S2 = 50, AE = 55, REC = 80</li>
                        <li>• Sharpness_base = 0.50×60 + 0.30×55 + 0.20×50 = 30 + 16.5 + 10 = <strong>56.5</strong></li>
                        <li>• Modulator = 0.75 + 0.25×(80/100) = 0.95</li>
                        <li>• <span className="text-primary font-semibold">Sharpness = 56.5 × 0.95 = 53.7</span></li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Cognitive Readiness */}
              <AccordionItem value="cognitive-readiness" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Cognitive Readiness (Support Metric)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Cognitive Readiness measures your <strong>capacity for focused reasoning</strong>. Formula differs based on wearable availability.</p>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-semibold text-foreground text-xs mb-2">Without Wearable:</p>
                      <div className="font-mono text-[10px] bg-background/50 p-2 rounded">
                        Readiness = <strong className="text-emerald-400">0.35</strong> × REC + <strong className="text-primary">0.35</strong> × S2 + <strong className="text-amber-400">0.30</strong> × AE
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <p className="font-semibold text-emerald-400 text-xs mb-2">With Wearable:</p>
                      <div className="font-mono text-[10px] bg-muted/30 p-2 rounded mb-2">
                        Readiness = <strong>0.5</strong> × PhysioComponent + <strong>0.5</strong> × CognitiveComponent
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">Where CognitiveComponent =</p>
                      <div className="font-mono text-[10px] bg-muted/30 p-2 rounded">
                        0.30×CT + 0.25×AE + 0.20×IN + 0.15×S2 + 0.10×S1
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/40">
                        <p className="font-semibold text-emerald-400">HIGH</p>
                        <p className="text-muted-foreground">≥ 70</p>
                      </div>
                      <div className="p-2 rounded bg-amber-500/20 border border-amber-500/40">
                        <p className="font-semibold text-amber-400">MEDIUM</p>
                        <p className="text-muted-foreground">40-69</p>
                      </div>
                      <div className="p-2 rounded bg-red-500/20 border border-red-500/40">
                        <p className="font-semibold text-red-400">LOW</p>
                        <p className="text-muted-foreground">&lt; 40</p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Recovery - FOUNDATIONAL */}
              <AccordionItem value="recovery" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    Recovery (Foundational Metric)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Recovery is a <strong>modulator, not a trainable skill</strong>. It affects Sharpness, Readiness, and SCI but does NOT affect Cognitive Age.</p>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs">
                      <p className="text-foreground font-semibold mb-2">Formula:</p>
                      <p className="mb-2">REC_input = weekly_detox_minutes + <strong className="text-emerald-400">0.5</strong> × weekly_walk_minutes</p>
                      <p className="text-primary">REC = min(100, REC_input / detox_target × 100)</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <p className="font-semibold text-emerald-400 text-xs mb-2">🚫 Important: NO XP from Detox/Walk</p>
                      <p className="text-xs">Detox and Walking sessions contribute <strong>only to Recovery calculation</strong>. They do NOT generate XP and do NOT increase cognitive skills (AE, RA, CT, IN).</p>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span><strong>Detox Target:</strong> 60 minutes/week (default).</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span><strong>Walk Contribution:</strong> Walking minutes count at 50% rate (0.5× multiplier).</span>
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                      <p className="font-semibold text-foreground mb-2">Example:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Detox this week: 45 min</li>
                        <li>• Walking this week: 30 min</li>
                        <li>• REC_input = 45 + 0.5×30 = 60 min</li>
                        <li>• <span className="text-primary font-semibold">REC = min(100, 60/60×100) = 100%</span></li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Dual-Process Integration */}
              <AccordionItem value="dual-process" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-400" />
                    Dual-Process Integration
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Based on Kahneman's dual-process theory, this measures the <strong>balance between fast and slow thinking systems</strong>.</p>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs">
                      <p className="text-foreground font-semibold mb-2">Formula:</p>
                      <p className="text-primary">DualProcess = 100 − |S1 − S2|</p>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span><strong>Perfect Balance:</strong> When S1 = S2, DualProcess = 100 (maximum integration).</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span><strong>Imbalance Penalty:</strong> Every point difference between S1 and S2 reduces the score by 1.</span>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/40">
                        <p className="font-semibold text-emerald-400">ELITE</p>
                        <p className="text-muted-foreground">≥ 85</p>
                      </div>
                      <div className="p-2 rounded bg-primary/20 border border-primary/40">
                        <p className="font-semibold text-primary">GOOD</p>
                        <p className="text-muted-foreground">70-84</p>
                      </div>
                      <div className="p-2 rounded bg-amber-500/20 border border-amber-500/40">
                        <p className="font-semibold text-amber-400">UNBALANCED</p>
                        <p className="text-muted-foreground">&lt; 70</p>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                      <p className="font-semibold text-foreground mb-2">Example:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• S1 = 65 (strong intuition)</li>
                        <li>• S2 = 55 (developing reasoning)</li>
                        <li>• <span className="text-primary font-semibold">DualProcess = 100 − |65−55| = 90 (Elite)</span></li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Cognitive Network - SCI */}
              <AccordionItem value="cognitive-network" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Cognitive Network (SCI)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>The Synthesized Cognitive Index (SCI) integrates performance, engagement, and recovery into a single score.</p>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs">
                      <p className="text-foreground font-semibold mb-2">Master Formula:</p>
                      <p className="text-primary">SCI = <strong>0.50</strong> × CP + <strong>0.30</strong> × BE + <strong>0.20</strong> × REC</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="font-semibold text-foreground text-xs mb-2">📊 Cognitive Performance (CP) — 50% weight</p>
                      <div className="font-mono text-[10px] bg-muted/30 p-2 rounded mb-2">
                        CP = 0.30×CT + 0.25×AE + 0.15×IN + 0.30×DualProcess
                      </div>
                      <p className="text-[10px] text-muted-foreground">Uses Critical Thinking, Attentional Efficiency, Insight, and the Dual-Process balance score.</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <p className="font-semibold text-foreground text-xs mb-2">🎯 Behavioral Engagement (BE) — 30% weight</p>
                      <div className="font-mono text-[10px] bg-muted/30 p-2 rounded mb-2">
                        BE = 0.50×Games% + 0.30×Tasks% + 0.20×Consistency%
                      </div>
                      <ul className="text-[10px] space-y-1 text-muted-foreground">
                        <li>• Games% = min(100, weekly_games_xp / games_target × 100)</li>
                        <li>• Tasks% = min(100, weekly_tasks_xp / tasks_target × 100)</li>
                        <li>• Consistency% = sessions_completed / sessions_required × 100</li>
                      </ul>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="font-semibold text-foreground text-xs mb-2">🧘 Recovery (REC) — 20% weight</p>
                      <div className="font-mono text-[10px] bg-muted/30 p-2 rounded">
                        REC = min(100, (weekly_detox_minutes + 0.5×weekly_walk_minutes) / detox_target × 100)
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">80+: Elite integration</div>
                      <div className="p-2 rounded bg-primary/10 border border-primary/30 text-primary">65-79: High clarity</div>
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">50-64: Developing</div>
                      <div className="p-2 rounded bg-muted/30 border border-border/50">{"<50"}: Building foundation</div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Cognitive Age */}
              <AccordionItem value="cognitive-age" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Cognitive Age
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Cognitive Age is established at initial assessment and tracks improvement over time. <strong>Recovery does NOT affect Cognitive Age.</strong></p>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs">
                      <p className="text-foreground font-semibold mb-2">Formula:</p>
                      <p className="mb-1">PerformanceAvg = (AE + RA + CT + IN + S2) / 5</p>
                      <p className="mb-1">Improvement = PerformanceAvg − BaselinePerformanceAvg</p>
                      <p className="text-primary">CognitiveAge = BaselineCognitiveAge − (Improvement / 10)</p>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span><strong>Performance Average:</strong> Uses 5 metrics: AE, RA, CT, IN, and S2.</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                        <span><strong>Improvement Rate:</strong> Every 10 points of improvement = 1 year younger.</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Info className="w-3 h-3 mt-1 text-amber-400 flex-shrink-0" />
                        <span><strong>Cap:</strong> ±15 years from baseline cognitive age.</span>
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                      <p className="font-semibold text-foreground mb-2">Example:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Baseline Cognitive Age: 38 years</li>
                        <li>• Baseline Performance Avg: 50</li>
                        <li>• Current Performance Avg: 65</li>
                        <li>• Improvement = 65 − 50 = 15 points</li>
                        <li>• <span className="text-primary font-semibold">Cognitive Age = 38 − (15/10) = 36.5 years</span></li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* XP Routing */}
              <AccordionItem value="xp-routing" className="border-border/50">
                <AccordionTrigger className="text-sm hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-primary" />
                    XP Routing & State Updates
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Each exercise routes XP to <strong>ONE AND ONLY ONE skill</strong>. No automatic splitting.</p>
                    
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="font-semibold text-amber-400 text-xs mb-2">🎮 Training (Games/Challenges)</p>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div className="p-1.5 rounded bg-muted/30 text-center">
                          <p className="font-semibold">Easy</p>
                          <p className="text-muted-foreground">3 XP</p>
                        </div>
                        <div className="p-1.5 rounded bg-muted/30 text-center">
                          <p className="font-semibold">Medium</p>
                          <p className="text-muted-foreground">5 XP</p>
                        </div>
                        <div className="p-1.5 rounded bg-muted/30 text-center">
                          <p className="font-semibold">Hard</p>
                          <p className="text-muted-foreground">8 XP</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Optional score scaling: XP = baseXP × (score/100)</p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-semibold text-foreground text-xs mb-2">Skill Routing:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-amber-500/10">
                          <p className="text-amber-400 font-semibold">S1 Focus → AE</p>
                        </div>
                        <div className="p-2 rounded bg-amber-500/10">
                          <p className="text-amber-400 font-semibold">S1 Creativity → RA</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10">
                          <p className="text-primary font-semibold">S2 Reasoning → CT</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10">
                          <p className="text-primary font-semibold">S2 Creativity → IN</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="font-semibold text-primary text-xs mb-2">📚 Tasks (Content Completion)</p>
                      <p className="text-xs mb-2">Tasks affect ONLY System 2 (CT and IN):</p>
                      <ul className="text-xs space-y-1">
                        <li>• Podcast (8 XP): CT +1.2, IN +0.8</li>
                        <li>• Article (10 XP): CT +1.75, IN +0.75</li>
                        <li>• Book (12 XP): CT +1.8, IN +1.2</li>
                      </ul>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs">
                      <p className="text-foreground font-semibold mb-1">State Update Formula:</p>
                      <p>Δstate = XP × 0.5</p>
                      <p>state = clamp(0, 100, state + Δstate)</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
