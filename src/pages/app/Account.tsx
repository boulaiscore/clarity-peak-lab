import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, SessionDuration } from "@/contexts/AuthContext";
import { usePremiumGating, MAX_DAILY_SESSIONS_FREE } from "@/hooks/usePremiumGating";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Crown, Save, LogOut, Zap, Brain, Calendar, RotateCcw, Shield, Mail, CreditCard, HelpCircle, Rocket, ExternalLink, Bell, BellRing, Sun, Moon, Dumbbell, GraduationCap, Briefcase, Users, Globe } from "lucide-react";
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

// Education level labels mapping
const educationLevelLabels: Record<string, string> = {
  high_school: "High School",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  phd: "PhD / Doctorate",
  other: "Other",
};

// Field of study labels mapping
const disciplineLabels: Record<string, string> = {
  stem: "STEM",
  business: "Business & Economics",
  humanities: "Humanities & Literature",
  social_sciences: "Social Sciences",
  health: "Health & Medicine",
  law: "Law",
  arts: "Arts & Design",
  other: "Other",
};

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
  
  // Timezone state
  const [timezone, setTimezone] = useState("UTC");

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("reminder_enabled, reminder_time, timezone")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setReminderEnabled(data.reminder_enabled || false);
        if (data.reminder_time) {
          // Format time from "HH:mm:ss" to "HH:mm"
          setReminderTime(data.reminder_time.substring(0, 5));
        }
        if (data.timezone) {
          setTimezone(data.timezone);
        } else {
          // Auto-detect timezone on first load if not set
          const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezone(detectedTz || "UTC");
        }
      }
    };
    
    loadSettings();
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

  const handleTimezoneChange = async (newTimezone: string) => {
    setTimezone(newTimezone);
    
    if (user?.id) {
      await supabase
        .from("profiles")
        .update({ timezone: newTimezone })
        .eq("user_id", user.id);
      
      toast({
        title: "Timezone updated",
        description: `Your timezone is now set to ${newTimezone}`,
      });
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
      <div className="container px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Compact Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{user?.name || "User"}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Tabbed Navigation */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
              <TabsTrigger value="training" className="text-xs">Training</TabsTrigger>
              <TabsTrigger value="preferences" className="text-xs">Settings</TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs">Plan</TabsTrigger>
            </TabsList>

            {/* ==================== PROFILE TAB ==================== */}
            <TabsContent value="profile" className="space-y-4">
              {/* Account Information */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  Account
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{user?.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                    <span className="text-xs text-muted-foreground">Member since</span>
                    <span className="text-sm font-medium">{memberSince}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">Account ID</span>
                    <span className="text-sm font-medium font-mono">{maskedAccountId}</span>
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <label className="text-sm font-medium mb-2 block">Display Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11" />
              </div>

              {/* Demographics */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  Demographics
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="py-1.5">
                    <span className="text-xs text-muted-foreground block">Birth Date</span>
                    <span className="font-medium">{user?.birthDate ? format(new Date(user.birthDate), "MMM d, yyyy") : "—"}</span>
                  </div>
                  <div className="py-1.5">
                    <span className="text-xs text-muted-foreground block">Gender</span>
                    <span className="font-medium capitalize">{user?.gender || "—"}</span>
                  </div>
                  <div className="py-1.5">
                    <span className="text-xs text-muted-foreground block">Education</span>
                    <span className="font-medium">{user?.educationLevel ? educationLevelLabels[user.educationLevel] : "—"}</span>
                  </div>
                  <div className="py-1.5">
                    <span className="text-xs text-muted-foreground block">Work Type</span>
                    <span className="font-medium capitalize">{user?.workType ? user.workType.replace(/_/g, " ") : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Cognitive Baseline */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <Brain className="w-4 h-4 text-primary" />
                  Cognitive Baseline
                </h3>
                {hasCompletedAssessment === false ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      Take the initial assessment for personalized baseline metrics.
                    </p>
                    <Button variant="hero" size="sm" className="w-full" onClick={() => navigate("/onboarding?step=assessment")}>
                      <Brain className="w-4 h-4" />
                      Take Assessment
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      Reset to establish new baseline metrics.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full" disabled={isResetting}>
                          <RotateCcw className="w-4 h-4" />
                          {isResetting ? "Resetting..." : "Reset Assessment"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Initial Assessment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear your baseline metrics. Training history will be preserved.
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
            </TabsContent>

            {/* ==================== TRAINING TAB ==================== */}
            <TabsContent value="training" className="space-y-4">
              {/* Training Plan */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
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
                <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <Bell className="w-4 h-4 text-primary" />
                    Daily Reminder
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">Training reminder</p>
                      <p className="text-xs text-muted-foreground">Daily notification</p>
                    </div>
                    <Switch checked={reminderEnabled} onCheckedChange={handleReminderToggle} />
                  </div>
                  {reminderEnabled && (
                    <div className="space-y-3">
                      <Input 
                        type="time" 
                        value={reminderTime} 
                        onChange={(e) => handleReminderTimeChange(e.target.value)}
                        className="h-11"
                      />
                      <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs">
                        <BellRing className="w-3.5 h-3.5 text-primary" />
                        <span>Reminder at <span className="font-semibold">{reminderTime}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ==================== PREFERENCES TAB ==================== */}
            <TabsContent value="preferences" className="space-y-4">
              {/* Appearance */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
                  Appearance
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Light Mode</p>
                    <p className="text-xs text-muted-foreground">Switch theme</p>
                  </div>
                  <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
                </div>
              </div>

              {/* Timezone */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-primary" />
                  Timezone
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  For day boundary calculations (streak tracking, daily resets).
                </p>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="Pacific/Honolulu">Hawaii (UTC-10)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska (UTC-9)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                    <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                    <SelectItem value="Europe/London">London (UTC+0/+1)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris / Berlin (UTC+1/+2)</SelectItem>
                    <SelectItem value="Europe/Rome">Rome (UTC+1/+2)</SelectItem>
                    <SelectItem value="Europe/Helsinki">Helsinki (UTC+2/+3)</SelectItem>
                    <SelectItem value="Europe/Moscow">Moscow (UTC+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (UTC+4)</SelectItem>
                    <SelectItem value="Asia/Kolkata">India (UTC+5:30)</SelectItem>
                    <SelectItem value="Asia/Bangkok">Bangkok (UTC+7)</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore (UTC+8)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (UTC+10/+11)</SelectItem>
                    <SelectItem value="Pacific/Auckland">Auckland (UTC+12/+13)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground/60 mt-2">
                  Device: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>

              {/* Help & Support */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  Help & Support
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Need assistance? Our team is here to help.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open("mailto:support@superhuman-labs.com", "_blank")}
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </Button>
              </div>
            </TabsContent>

            {/* ==================== SUBSCRIPTION TAB ==================== */}
            <TabsContent value="subscription" className="space-y-4">
              {/* Current Plan */}
              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isPremium ? (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Premium Plan</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">BETA ACCESS</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">Free Plan</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">LIMITED</p>
                        </div>
                      </>
                    )}
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase",
                    isPremium ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  )}>
                    {isPremium ? "Active" : "Limited"}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm border-t border-border/30 pt-3">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground text-xs">Billing</span>
                    <span className="font-medium text-xs">{isPremium ? "Free during beta" : "—"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground text-xs">Price</span>
                    <span className="font-medium text-xs">$0.00/mo</span>
                  </div>
                </div>
              </div>

              {/* Beta Info */}
              {isPremium && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Rocket className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">Beta Tester</p>
                      <p className="text-xs text-muted-foreground">
                        Premium features free until official launch.
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">v0.9.2-beta</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade CTA */}
              {!isPremium && (
                <Button asChild variant="hero" className="w-full">
                  <Link to="/app/premium">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Link>
                </Button>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <Button onClick={handleSave} variant="hero" className="w-full min-h-[48px] rounded-xl" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={logout} variant="outline" className="w-full min-h-[48px] rounded-xl">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-border/30 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground/50">
              <Zap className="w-3 h-3" />
              <span className="text-[10px] font-medium tracking-wide">SuperHuman Labs</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Account;
