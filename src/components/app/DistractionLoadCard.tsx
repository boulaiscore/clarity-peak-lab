import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Instagram, MessageCircle, Facebook, Clock, ChevronDown, Youtube, Twitter, Send, Linkedin, Camera, Gamepad2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppBlocker } from "@/hooks/useAppBlocker";

// Package name to icon/color mapping
const APP_CONFIG: Record<string, { icon: React.ElementType; color: string; name: string }> = {
  "com.instagram.android": { icon: Instagram, color: "text-pink-400", name: "Instagram" },
  "com.facebook.katana": { icon: Facebook, color: "text-blue-400", name: "Facebook" },
  "com.facebook.orca": { icon: MessageCircle, color: "text-blue-400", name: "Messenger" },
  "com.twitter.android": { icon: Twitter, color: "text-sky-400", name: "X (Twitter)" },
  "com.zhiliaoapp.musically": { icon: Clock, color: "text-cyan-400", name: "TikTok" },
  "com.snapchat.android": { icon: Camera, color: "text-yellow-400", name: "Snapchat" },
  "com.whatsapp": { icon: MessageCircle, color: "text-emerald-400", name: "WhatsApp" },
  "org.telegram.messenger": { icon: Send, color: "text-sky-400", name: "Telegram" },
  "com.linkedin.android": { icon: Linkedin, color: "text-blue-500", name: "LinkedIn" },
  "com.pinterest": { icon: Gamepad2, color: "text-red-400", name: "Pinterest" },
  "com.reddit.frontpage": { icon: Gamepad2, color: "text-orange-400", name: "Reddit" },
  "com.discord": { icon: Gamepad2, color: "text-indigo-400", name: "Discord" },
  "com.youtube": { icon: Youtube, color: "text-red-500", name: "YouTube" },
};

const SOCIAL_PACKAGES = Object.keys(APP_CONFIG);

export function DistractionLoadCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    isNative,
    hasUsagePermission,
    usageStats,
    isLoading,
    requestUsagePermission,
  } = useAppBlocker();

  // Filter only social apps and map to display format
  const socialUsage = useMemo(() => {
    return usageStats
      .filter(stat => SOCIAL_PACKAGES.includes(stat.packageName))
      .map(stat => {
        const config = APP_CONFIG[stat.packageName] || { 
          icon: Smartphone, 
          color: "text-muted-foreground", 
          name: stat.appName 
        };
        return {
          packageName: stat.packageName,
          app: config.name,
          icon: config.icon,
          minutes: stat.usageMinutes,
          color: config.color,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }, [usageStats]);

  const totalMinutes = socialUsage.reduce((sum, app) => sum + app.minutes, 0);

  const handleEnableClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    requestUsagePermission();
  };

  // Get distraction level based on total usage
  const getDistractionLevel = () => {
    if (!hasUsagePermission) return { level: "Unknown", color: "text-muted-foreground" };
    if (totalMinutes <= 60) return { level: "Low", color: "text-emerald-400" };
    if (totalMinutes <= 120) return { level: "Elevated", color: "text-amber-400" };
    return { level: "High", color: "text-red-400" };
  };

  const distractionLevel = getDistractionLevel();
  const isEnabled = hasUsagePermission;

  // Show different states based on platform and permissions
  const renderEnableButton = () => {
    if (isLoading) {
      return (
        <span className="text-[11px] text-muted-foreground">Loading...</span>
      );
    }

    if (!isNative) {
      return (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>Android only</span>
        </div>
      );
    }

    return (
      <button
        onClick={handleEnableClick}
        className={cn(
          "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
          "bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.97]"
        )}
      >
        Enable Usage Access
      </button>
    );
  };

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
            <div className="flex flex-col">
              {isEnabled ? (
                <span className={cn("text-[11px] font-medium", distractionLevel.color)}>
                  {distractionLevel.level}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Not enabled</span>
              )}
              <span className="text-[9px] text-muted-foreground/60 leading-tight">
                Measures external noise affecting System 1 clarity.
              </span>
            </div>
          </div>
        </div>

        {!isEnabled ? (
          renderEnableButton()
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
              
              {socialUsage.length === 0 ? (
                <div className="text-center py-2">
                  <span className="text-[11px] text-muted-foreground">No social app usage today</span>
                </div>
              ) : (
                socialUsage.map((app) => (
                  <div key={app.packageName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <app.icon className={cn("w-3.5 h-3.5", app.color)} />
                      <span className="text-xs text-muted-foreground">{app.app}</span>
                    </div>
                    <span className={cn("text-xs font-medium tabular-nums", app.color)}>
                      {app.minutes}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
