import { Link } from "react-router-dom";
import { ChevronRight, Activity, Moon, Heart } from "lucide-react";
import { GarminIcon } from "@/components/icons/WearableIcons";
import { useWearableSync } from "@/hooks/useWearableSync";
import { useAuth } from "@/contexts/AuthContext";

/**
 * WearableConnectionPrompt
 * 
 * Shown on Home/Dashboard when user hasn't connected a wearable yet.
 * Explains WHY connecting improves their cognitive metrics.
 */
export function WearableConnectionPrompt() {
  const { user } = useAuth();
  const { isConnected } = useWearableSync();

  // Don't show if already connected
  if (isConnected) return null;

  // Always show the prompt to encourage wearable connection
  // (works on web as preview, and on native for actual connection)

  return (
    <Link 
      to="/app/wearable"
      className="block group"
    >
      <div className="relative p-4 rounded-xl bg-gradient-to-br from-primary/5 via-card to-primary/10 border border-primary/20 overflow-hidden transition-all duration-300 hover:border-primary/30">
        {/* Subtle ambient glow */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl opacity-60" />
        
        <div className="relative z-10 flex items-start gap-3">
          {/* Icon */}
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
            <GarminIcon className="w-4 h-4 text-primary" size={16} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-foreground">
                Connect your wearable
              </h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
            
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Unlock deeper insights into your cognitive readiness by syncing sleep, HRV, and resting heart rate data.
            </p>
            
            {/* Data types */}
            <div className="flex items-center gap-3 mt-2.5">
              <div className="flex items-center gap-1">
                <Moon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Sleep</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">HRV</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">RHR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
