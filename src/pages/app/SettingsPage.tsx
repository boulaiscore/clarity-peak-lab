import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
import { useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Globe,
  Watch,
  HelpCircle,
  Mail,
  ExternalLink,
  Bell,
  Play,
  FileText,
  Shield,
  Trash2,
  ChevronRight,
  CreditCard,
  BrainCircuit,
  Fingerprint,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCheckout } from "@/hooks/useCheckout";
import { DEFAULT_TRAINING_PLAN } from "@/lib/trainingPlans";
import { OnboardingTutorial } from "@/components/tutorial/OnboardingTutorial";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useNativeSecurity } from "@/contexts/NativeSecurityContext";

const DEVICE_LABELS: Record<string, string> = {
  apple_health: "Apple Health",
  whoop: "Whoop",
  oura: "Oura Ring",
  garmin: "Garmin",
  other: "Other",
};

// ─── Reusable list primitives (iOS-style grouped list) ──────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 px-1 mb-2 mt-6 first:mt-0">
      {children}
    </p>
  );
}

function ListGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card/60 border border-border/40 overflow-hidden divide-y divide-border/40">
      {children}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  trailing,
  onClick,
  destructive,
  external,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  external?: boolean;
}) {
  const interactive = !!onClick;
  const Wrapper = interactive ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
        interactive && "hover:bg-muted/30 active:bg-muted/40"
      )}
    >
      <Icon
        className={cn(
          "w-[18px] h-[18px] flex-shrink-0 stroke-[1.5]",
          destructive ? "text-destructive/80" : "text-muted-foreground"
        )}
      />
      <span
        className={cn(
          "text-[14px] font-normal flex-1 truncate",
          destructive ? "text-destructive" : "text-foreground"
        )}
      >
        {label}
      </span>
      {value && (
        <span className="text-[13px] text-muted-foreground truncate max-w-[45%]">
          {value}
        </span>
      )}
      {trailing}
      {interactive && !trailing && (
        external ? (
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
        )
      )}
    </Wrapper>
  );
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { isPro: hasCoachInsights } = useSubscription();
  const checkout = useCheckout();
  const navigate = useNavigate();
  const { permission, isSupported, requestPermission, setDailyReminder } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const {
    isNative,
    isAvailable: biometricAvailable,
    biometricLabel,
    biometricLockEnabled,
    setBiometricLockEnabled,
  } = useNativeSecurity();

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:30");
  const [timezone, setTimezone] = useState("UTC");
  const [showTutorial, setShowTutorial] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  const handleOpenBillingPortal = async () => {
    if (!user?.email) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setBillingLoading(true);
    try {
      await checkout.manageSubscription();
    } catch (e) {
      console.error(e);
      toast({ title: "Could not open billing portal", variant: "destructive" });
    } finally {
      setBillingLoading(false);
    }
  };

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
        if (data.reminder_time) setReminderTime(data.reminder_time.substring(0, 5));
        if (data.timezone) setTimezone(data.timezone);
        else setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      }
    };
    loadSettings();
  }, [user?.id]);

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const result = await requestPermission();
      if (result !== "granted") {
        toast({
          title: "Notifications blocked",
          description: "Enable notifications in your device settings.",
          variant: "destructive",
        });
        return;
      }
    }
    setReminderEnabled(enabled);
    const planDuration = DEFAULT_TRAINING_PLAN.sessionDuration.split("-")[0];
    setDailyReminder(enabled, reminderTime, `${planDuration}min`);
    if (user?.id) {
      await supabase.from("profiles").update({ reminder_enabled: enabled }).eq("user_id", user.id);
    }
  };

  const handleReminderTimeChange = async (time: string) => {
    setReminderTime(time);
    const planDuration = DEFAULT_TRAINING_PLAN.sessionDuration.split("-")[0];
    if (reminderEnabled) setDailyReminder(true, time, `${planDuration}min`);
    if (user?.id) {
      await supabase.from("profiles").update({ reminder_time: time + ":00" }).eq("user_id", user.id);
    }
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    setTimezone(newTimezone);
    if (user?.id) {
      await supabase.from("profiles").update({ timezone: newTimezone }).eq("user_id", user.id);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (securityLoading) return;
    setSecurityLoading(true);
    const result = await setBiometricLockEnabled(enabled);
    setSecurityLoading(false);

    if (!result.success) {
      toast({
        title: enabled ? "App lock not enabled" : "App lock unchanged",
        description: "error" in result ? result.error : undefined,
        variant: "destructive",
      });
      return;
    }

    toast({ title: enabled ? "App lock enabled" : "App lock disabled" });
  };

  const deviceLabel = user?.primaryDevice ? DEVICE_LABELS[user.primaryDevice] : "Not set";

  return (
    <AppShell>
      <div className="px-5 py-8 sm:py-10 max-w-xl mx-auto pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[26px] font-semibold tracking-tight">Settings</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Preferences, training, and account
          </p>
        </div>

        {/* TRAINING */}
        <SectionLabel>Training</SectionLabel>
        <ListGroup>
          <Row
            icon={BrainCircuit}
            label="Adaptive Cognitive Coach"
            value={hasCoachInsights ? "Shadow mode" : "Pro"}
            onClick={() => navigate("/app/adaptive-coach")}
          />
          {isSupported && (
            <>
              <Row
                icon={Bell}
                label="Daily reminder"
                trailing={
                  <Switch
                    checked={reminderEnabled}
                    onCheckedChange={handleReminderToggle}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              />
              {reminderEnabled && (
                <div className="px-4 py-3 flex items-center gap-3">
                  <span className="text-[13px] text-muted-foreground flex-1">Reminder time</span>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="h-9 w-32 text-[13px]"
                  />
                </div>
              )}
            </>
          )}
        </ListGroup>

        {/* PREFERENCES */}
        <SectionLabel>Preferences</SectionLabel>
        <ListGroup>
          <Row
            icon={theme === "dark" ? Moon : Sun}
            label={theme === "dark" ? "Dark mode" : "Light mode"}
            trailing={
              <Switch
                checked={theme === "light"}
                onCheckedChange={toggleTheme}
                onClick={(e) => e.stopPropagation()}
              />
            }
          />
          <div className="px-4 py-3 flex items-center gap-3">
            <Globe className="w-[18px] h-[18px] text-muted-foreground stroke-[1.5]" />
            <span className="text-[14px] flex-1">Timezone</span>
            <Select value={timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="h-9 w-[160px] text-[13px] border-border/40 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                <SelectItem value="Pacific/Honolulu">Hawaii</SelectItem>
                <SelectItem value="America/Anchorage">Alaska</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                <SelectItem value="America/Denver">Mountain</SelectItem>
                <SelectItem value="America/Chicago">Central</SelectItem>
                <SelectItem value="America/New_York">Eastern</SelectItem>
                <SelectItem value="America/Sao_Paulo">São Paulo</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris / Berlin</SelectItem>
                <SelectItem value="Europe/Rome">Rome</SelectItem>
                <SelectItem value="Europe/Helsinki">Helsinki</SelectItem>
                <SelectItem value="Europe/Moscow">Moscow</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                <SelectItem value="Asia/Kolkata">India</SelectItem>
                <SelectItem value="Asia/Bangkok">Bangkok</SelectItem>
                <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                <SelectItem value="Pacific/Auckland">Auckland</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ListGroup>

        {/* SECURITY */}
        <SectionLabel>Security</SectionLabel>
        <ListGroup>
          <Row
            icon={Fingerprint}
            label="Face ID / Fingerprint"
            value={
              !isNative
                ? "Mobile app"
                : biometricAvailable
                  ? biometricLabel
                  : "Not set up"
            }
            trailing={
              isNative ? (
                <Switch
                  checked={biometricLockEnabled}
                  disabled={securityLoading || (!biometricAvailable && !biometricLockEnabled)}
                  onCheckedChange={(enabled) => void handleBiometricToggle(enabled)}
                  onClick={(event) => event.stopPropagation()}
                  aria-label="Require Face ID or fingerprint to open LOOMA"
                />
              ) : undefined
            }
          />
        </ListGroup>

        {/* BILLING */}
        <SectionLabel>Billing</SectionLabel>
        <ListGroup>
          <Row
            icon={CreditCard}
            label={billingLoading ? "Opening…" : "Invoices & payment methods"}
            external
            onClick={handleOpenBillingPortal}
          />
        </ListGroup>

        {/* HELP */}
        <SectionLabel>Help</SectionLabel>
        <ListGroup>
          
          <Row
            icon={Mail}
            label="Contact support"
            external
            onClick={() => window.open("https://www.neurolooplabs.com/#/support", "_blank")}
          />
          <Row
            icon={HelpCircle}
            label="Help center"
            external
            onClick={() => window.open("https://www.neurolooplabs.com/#/support", "_blank")}
          />
        </ListGroup>

        {/* LEGAL */}
        <SectionLabel>Legal</SectionLabel>
        <ListGroup>
          <Row
            icon={Shield}
            label="Privacy policy"
            external
            onClick={() => window.open("https://www.neurolooplabs.com/#/privacy", "_blank")}
          />
          <Row
            icon={FileText}
            label="Terms of service"
            external
            onClick={() => window.open("https://www.neurolooplabs.com/#/terms", "_blank")}
          />
        </ListGroup>

        {/* ACCOUNT — destructive */}
        <SectionLabel>Account</SectionLabel>
        <ListGroup>
          <Row
            icon={Trash2}
            label="Delete account"
            destructive
            external
            onClick={() => window.open("https://www.neurolooplabs.com/#/delete-account", "_blank")}
          />
        </ListGroup>

        <p className="text-[10px] text-muted-foreground/40 text-center mt-8">
          LOOMA · Cognitive Performance OS
        </p>
      </div>

      <OnboardingTutorial show={showTutorial} onComplete={() => setShowTutorial(false)} />
    </AppShell>
  );
};

export default SettingsPage;
