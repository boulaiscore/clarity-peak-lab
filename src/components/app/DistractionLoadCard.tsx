import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Instagram, MessageCircle, Facebook, Clock, Shield, ChevronDown } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleEnable = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In production, this would trigger native permission dialogs
    setIsEnabled(true);
    localStorage.setItem("distraction-load-enabled", "true");
  };

  const totalMinutes = usageData.reduce((sum, app) => sum + app.minutes, 0);

  // Get distraction level based on total usage
  const getDistractionLevel = () => {
    if (!isEnabled) return { level: "Unknown", color: "text-muted-foreground" };
    if (totalMinutes <= 60) return { level: "Low", color: "text-emerald-400" };
    if (totalMinutes <= 120) return { level: "Elevated", color: "text-amber-400" };
    return { level: "High", color: "text-red-400" };
  };

  const distractionLevel = getDistractionLevel();

  return (
    <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
      {/* Collapsed Header - Always visible */}
      <button
        onClick={() => isEnabled && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full p-4 flex items-center justify-between transition-colors",
          isEnabled && "hover:bg-muted/30 cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium">Distraction Load</h3>
            <div className="flex items-center gap-1.5">
              {isEnabled ? (
                <span className={cn("text-[11px] font-medium", distractionLevel.color)}>
                  {distractionLevel.level}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Not enabled</span>
              )}
            </div>
          </div>
        </div>

        {!isEnabled ? (
          <button
            onClick={handleEnable}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
              "bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.97]"
            )}
          >
            Enable Usage Access
          </button>
        ) : (
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )} />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isEnabled && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-2">
              <div className="flex items-center justify-between mb-2 pt-2 border-t border-border/20">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
