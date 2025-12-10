import { useMemo } from "react";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBadges } from "@/hooks/useBadges";
import { useUserMetrics } from "@/hooks/useExercises";
import { BADGES, getBadgeById, calculateImprovement, getLevelFromXP } from "@/lib/badges";
import { Progress } from "@/components/ui/progress";

export function BadgesSection() {
  const { user } = useAuth();
  const { data: badges, isLoading: badgesLoading } = useUserBadges(user?.id);
  const { data: metrics } = useUserMetrics(user?.id);

  const earnedBadgeIds = useMemo(() => 
    badges?.map(b => b.badge_id) || [], 
    [badges]
  );

  const levelInfo = useMemo(() => 
    getLevelFromXP(metrics?.experience_points || 0),
    [metrics?.experience_points]
  );

  // Calculate improvements from baseline
  const improvements = useMemo(() => {
    if (!metrics) return null;
    return {
      fast: calculateImprovement(
        metrics.fast_thinking || 50, 
        metrics.baseline_fast_thinking ?? undefined
      ),
      slow: calculateImprovement(
        metrics.slow_thinking || 50, 
        metrics.baseline_slow_thinking ?? undefined
      ),
      focus: calculateImprovement(
        metrics.focus_stability || 50, 
        metrics.baseline_focus ?? undefined
      ),
      reasoning: calculateImprovement(
        metrics.reasoning_accuracy || 50, 
        metrics.baseline_reasoning ?? undefined
      ),
      creativity: calculateImprovement(
        metrics.creativity || 50, 
        metrics.baseline_creativity ?? undefined
      ),
    };
  }, [metrics]);

  if (badgesLoading) {
    return (
      <div className="p-4 rounded-xl bg-card/60 border border-border/30">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted/30 rounded w-1/3" />
          <div className="h-20 bg-muted/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Level</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={cn("text-2xl font-bold", levelInfo.color)}>
                {levelInfo.level}
              </span>
              <span className="text-sm text-muted-foreground">{levelInfo.name}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground">XP</span>
            <p className="text-lg font-semibold">{metrics?.experience_points || 0}</p>
          </div>
        </div>
        <div className="space-y-1">
          <Progress value={levelInfo.progress} className="h-2" />
          <p className="text-[10px] text-muted-foreground text-right">
            {levelInfo.xpToNext === Infinity ? "Max Level" : `${levelInfo.xpToNext} XP to next level`}
          </p>
        </div>
      </div>

      {/* Progress from Baseline */}
      {improvements && metrics?.baseline_captured_at && (
        <div className="p-4 rounded-xl bg-card/60 border border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px] font-semibold">Progress from Baseline</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Fast", value: improvements.fast, color: "text-amber-400" },
              { label: "Slow", value: improvements.slow, color: "text-teal-400" },
              { label: "Focus", value: improvements.focus, color: "text-emerald-400" },
              { label: "Logic", value: improvements.reasoning, color: "text-blue-400" },
              { label: "Create", value: improvements.creativity, color: "text-violet-400" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <span className={cn(
                  "text-lg font-bold",
                  item.value > 0 ? item.color : item.value < 0 ? "text-rose-400" : "text-muted-foreground"
                )}>
                  {item.value > 0 ? "+" : ""}{item.value}%
                </span>
                <p className="text-[9px] text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="p-4 rounded-xl bg-card/60 border border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-[13px] font-semibold">Badges</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {earnedBadgeIds.length}/{BADGES.length}
          </span>
        </div>

        {earnedBadgeIds.length === 0 ? (
          <p className="text-[12px] text-muted-foreground text-center py-4">
            Complete sessions to earn your first badge!
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {badges?.slice(0, 8).map((userBadge) => {
              const badgeDef = getBadgeById(userBadge.badge_id);
              if (!badgeDef) return null;
              
              const Icon = badgeDef.icon;
              return (
                <div 
                  key={userBadge.id}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/20 transition-colors"
                  title={`${badgeDef.name}: ${badgeDef.description}`}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    badgeDef.bgColor
                  )}>
                    <Icon className={cn("w-5 h-5", badgeDef.iconColor)} />
                  </div>
                  <span className="text-[9px] text-center text-muted-foreground line-clamp-1">
                    {badgeDef.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {badges && badges.length > 8 && (
          <p className="text-[11px] text-primary text-center mt-2">
            +{badges.length - 8} more badges
          </p>
        )}
      </div>
    </div>
  );
}
