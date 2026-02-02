import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Download, Check, ArrowLeft } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const InstallPage = () => {
  const navigate = useNavigate();
  const { permission, isSupported, isLoading, requestPermission, setDailyReminder } = useNotifications();
  const { user, updateUser } = useAuth();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMuting, setIsMuting] = useState(false);
  
  // Check if reminders are enabled in profile
  const remindersEnabled = user?.reminderEnabled ?? false;

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    
    window.addEventListener("beforeinstallprompt", handler);
    
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
    
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    if (result.outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      // Enable reminders in profile
      await updateUser({ reminderEnabled: true });
      toast.success("Notifications enabled!");
    }
  };

  const handleMuteNotifications = async () => {
    setIsMuting(true);
    try {
      // Disable reminders in profile and cancel scheduled notifications
      setDailyReminder(false, null, "");
      await updateUser({ reminderEnabled: false });
      toast.success("Notifications muted");
    } finally {
      setIsMuting(false);
    }
  };

  return (
    <AppShell>
      <div className="container px-4 py-5 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/app">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Install LOOMA
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Get the full experience
            </p>
          </div>
        </div>

        {/* Install App Section */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Download className="w-6 h-6 text-primary" />
          </div>
          
          <h2 className="text-base font-semibold text-foreground mb-2">
            Install to Home Screen
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add LOOMA to your home screen for faster access and an app-like experience.
          </p>

          {isInstalled ? (
            <div className="flex items-center gap-2 text-primary">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Already installed</span>
            </div>
          ) : installPrompt ? (
            <Button variant="premium" onClick={handleInstall} className="w-full">
              Install App
            </Button>
          ) : (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">
                <strong>To install:</strong> Tap the share button in your browser, then select "Add to Home Screen".
              </p>
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="p-5 rounded-2xl bg-card border border-border/40 mb-6">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
            permission === "granted" ? "bg-primary/10" : "bg-muted"
          )}>
            {permission === "granted" ? (
              <Bell className="w-6 h-6 text-primary" />
            ) : (
              <BellOff className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          
          <h2 className="text-base font-semibold text-foreground mb-2">
            Training Reminders
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Get notified when it's time for your next cognitive exercise. We'll remind you to train without being annoying.
          </p>

          {!isSupported ? (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">
                Notifications are not supported in this browser.
              </p>
            </div>
          ) : permission === "granted" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {remindersEnabled ? "Notifications enabled" : "Notifications muted"}
                </span>
              </div>
              {remindersEnabled ? (
                <Button
                  variant="outline"
                  onClick={handleMuteNotifications}
                  disabled={isMuting}
                  className="w-full"
                >
                  <BellOff className="w-4 h-4 mr-2" />
                  {isMuting ? "Muting..." : "Mute Notifications"}
                </Button>
              ) : (
                <Button
                  variant="premium"
                  onClick={async () => {
                    setDailyReminder(true, user?.reminderTime ?? "09:00", user?.dailyTimeCommitment ?? "10min");
                    await updateUser({ reminderEnabled: true });
                    toast.success("Notifications enabled!");
                  }}
                  className="w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </Button>
              )}
            </div>
          ) : permission === "denied" ? (
            <div className="p-3 rounded-lg bg-destructive/10">
              <p className="text-xs text-muted-foreground">
                Notifications are blocked. Enable them in your browser settings.
              </p>
            </div>
          ) : (
            <Button
              variant="premium"
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Enabling..." : "Enable Notifications"}
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Your brain is not fixed. It's trainable.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default InstallPage;
