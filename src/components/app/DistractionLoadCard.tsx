import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone, Instagram, MessageCircle, Facebook, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialAppUsage {
  app: string;
  icon: React.ElementType;
  minutes: number;
  color: string;
}

export function DistractionLoadCard() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("distraction-load-enabled");
    return stored === "true";
  });

  // Mock usage data - in production this would come from device APIs
  const [usageData, setUsageData] = useState<SocialAppUsage[]>([
    { app: "Instagram", icon: Instagram, minutes: 0, color: "text-pink-400" },
    { app: "TikTok", icon: Clock, minutes: 0, color: "text-cyan-400" },
    { app: "WhatsApp", icon: MessageCircle, minutes: 0, color: "text-emerald-400" },
    { app: "Facebook", icon: Facebook, minutes: 0, color: "text-blue-400" },
  ]);

  useEffect(() => {
    if (isEnabled) {
      // Simulate fetching usage data
      // In production, this would use native device APIs
      setUsageData([
        { app: "Instagram", icon: Instagram, minutes: 47, color: "text-pink-400" },
        { app: "TikTok", icon: Clock, minutes: 32, color: "text-cyan-400" },
        { app: "WhatsApp", icon: MessageCircle, minutes: 28, color: "text-emerald-400" },
        { app: "Facebook", icon: Facebook, minutes: 12, color: "text-blue-400" },
      ]);
    }
  }, [isEnabled]);

  const handleEnable = () => {
    // In production, this would trigger native permission dialogs
    setIsEnabled(true);
    localStorage.setItem("distraction-load-enabled", "true");
  };

  const totalMinutes = usageData.reduce((sum, app) => sum + app.minutes, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-card border border-border/40"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Smartphone className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">Distraction Load</h3>
          <p className="text-[10px] text-muted-foreground">Social media screen time</p>
        </div>
      </div>

      {!isEnabled ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">Not enabled</span>
          </div>
          <button
            onClick={handleEnable}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
              "bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.97]"
            )}
          >
            Enable Usage Access
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</span>
            <span className={cn(
              "text-xs font-semibold",
              totalMinutes > 120 ? "text-red-400" : 
              totalMinutes > 60 ? "text-amber-400" : "text-emerald-400"
            )}>
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total
            </span>
          </div>
          
          {usageData.map((app) => (
            <div key={app.app} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <app.icon className={cn("w-3.5 h-3.5", app.color)} />
                <span className="text-xs text-muted-foreground">{app.app}</span>
              </div>
              <span className={cn("text-xs font-medium tabular-nums", app.color)}>
                {app.minutes}m
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
