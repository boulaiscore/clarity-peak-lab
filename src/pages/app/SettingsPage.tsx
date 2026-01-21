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
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Settings, Save, Sun, Moon, Globe, Watch, HelpCircle, Mail, ExternalLink, Bell, BellRing, Dumbbell, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainingPlanSelector } from "@/components/settings/TrainingPlanSelector";
import { TrainingPlanId, TRAINING_PLANS } from "@/lib/trainingPlans";
import { OnboardingTutorial } from "@/components/tutorial/OnboardingTutorial";

// Device labels mapping
const DEVICE_LABELS: Record<string, string> = {
  apple_health: "Apple Watch / Apple Health",
  whoop: "Whoop",
  oura: "Oura Ring",
  garmin: "Garmin",
  other: "Other",
};

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { permission, isSupported, requestPermission, setDailyReminder } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlanId>(user?.trainingPlan || "light");
  const [isSaving, setIsSaving] = useState(false);
  
  // Daily Reminder states
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:30");
  
  // Timezone state
  const [timezone, setTimezone] = useState("UTC");
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

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
          setReminderTime(data.reminder_time.substring(0, 5));
        }
        if (data.timezone) {
          setTimezone(data.timezone);
        } else {
          const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezone(detectedTz || "UTC");
        }
      }
    };
    
    loadSettings();
  }, [user?.id]);

  useEffect(() => {
    if (user) {
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
    
    const planConfig = TRAINING_PLANS[trainingPlan];
    const planDuration = planConfig.sessionDuration.split("-")[0];
    
    setDailyReminder(enabled, reminderTime, `${planDuration}min`);
    
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
    
    const planConfig = TRAINING_PLANS[trainingPlan];
    const planDuration = planConfig.sessionDuration.split("-")[0];
    
    if (reminderEnabled) {
      setDailyReminder(true, time, `${planDuration}min`);
    }
    
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
    updateUser({ trainingPlan });
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    setIsSaving(false);
  };

  return (
    <AppShell>
      <div className="container px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-muted-foreground text-sm">Preferences & Training</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Training Plan (merged from Training tab) */}
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

            {/* Daily Reminder (merged from Training tab) */}
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

            {/* Health Device */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Watch className="w-4 h-4 text-primary" />
                Health Device
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {user?.primaryDevice ? DEVICE_LABELS[user.primaryDevice] : "Not selected"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.primaryDevice ? "Wearable integration" : "Select your primary device"}
                  </p>
                </div>
                <Link to="/app/health">
                  <Button variant="outline" size="sm">
                    {user?.primaryDevice ? "Change" : "Select"}
                  </Button>
                </Link>
              </div>
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
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowTutorial(true)}
                >
                  <Play className="w-4 h-4" />
                  Replay Tutorial
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open("mailto:support@superhuman-labs.com", "_blank")}
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} variant="hero" className="w-full min-h-[48px] rounded-xl" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tutorial Modal */}
      <OnboardingTutorial 
        show={showTutorial} 
        onComplete={() => setShowTutorial(false)} 
      />
    </AppShell>
  );
};

export default SettingsPage;
