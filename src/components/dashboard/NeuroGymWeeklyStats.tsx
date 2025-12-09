import { useAuth } from "@/contexts/AuthContext";
import { useNeuroGymWeeklyStats } from "@/hooks/useNeuroGym";
import { Target, Brain, Sliders, Lightbulb, Sparkles, Zap, Gamepad2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const AREA_CONFIG = [
  { id: "fast-thinking", label: "Fast", icon: Zap },
  { id: "slow-thinking", label: "Slow", icon: Clock },
  { id: "focus", label: "Focus", icon: Target },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "control", label: "Control", icon: Sliders },
  { id: "reasoning", label: "Reasoning", icon: Lightbulb },
  { id: "creativity", label: "Creativity", icon: Sparkles },
  { id: "visual", label: "Visual", icon: Gamepad2 },
  { id: "neuro-activation", label: "Activation", icon: Zap },
] as const;

export function NeuroGymWeeklyStats() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useNeuroGymWeeklyStats(user?.id);

  if (isLoading || !stats) {
    return null;
  }

  const totalSessions = Object.values(stats).reduce((a, b) => a + b, 0);

  if (totalSessions === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-card/50 border border-border/50">
      <h3 className="font-semibold text-sm mb-3">Neuro Gym This Week</h3>
      <div className="grid grid-cols-3 gap-2">
        {AREA_CONFIG.map(({ id, label, icon: Icon }) => {
          const count = stats[id as keyof typeof stats] || 0;
          if (count === 0) return null;
          
          return (
            <div 
              key={id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                "bg-primary/5 border border-primary/10"
              )}
            >
              <Icon className="w-3.5 h-3.5 text-primary/70" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{label}</p>
                <p className="text-[10px] text-muted-foreground">{count} session{count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}
