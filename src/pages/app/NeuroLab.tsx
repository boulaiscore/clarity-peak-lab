import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { Target, Brain, Sliders, Lightbulb, Sparkles, Zap, ChevronRight, Lock, Crown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { DailyTrainingConfirmDialog } from "@/components/app/DailyTrainingConfirmDialog";
import { useDailyTraining } from "@/hooks/useDailyTraining";
import { Card, CardContent } from "@/components/ui/card";

const AREA_ICONS: Record<string, React.ElementType> = {
  Target,
  Brain,
  Sliders,
  Lightbulb,
  Sparkles,
  Zap,
};

const AREA_GRADIENTS: Record<string, string> = {
  focus: "from-emerald-500/20 to-emerald-600/10",
  reasoning: "from-violet-500/20 to-violet-600/10",
  creativity: "from-rose-500/20 to-rose-600/10",
  memory: "from-cyan-500/20 to-cyan-600/10",
  control: "from-amber-500/20 to-amber-600/10",
};

const AREA_ICON_COLORS: Record<string, string> = {
  focus: "text-emerald-400",
  reasoning: "text-violet-400",
  creativity: "text-rose-400",
  memory: "text-cyan-400",
  control: "text-amber-400",
};

export default function NeuroLab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, isAreaLocked, canAccessNeuroActivation, canStartSession, remainingSessions, maxDailySessions } = usePremiumGating();
  const { isDailyCompleted, isInReminderWindow, reminderTime } = useDailyTraining();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<"area" | "neuro-activation" | "session-limit">("area");
  const [paywallFeatureName, setPaywallFeatureName] = useState<string>("");
  
  const [showDailyConfirm, setShowDailyConfirm] = useState(false);
  const [pendingAreaId, setPendingAreaId] = useState<NeuroLabArea | null>(null);

  const getThinkingBadge = () => {
    const goals = user?.trainingGoals || [];
    const hasFast = goals.includes("fast_thinking");
    const hasSlow = goals.includes("slow_thinking");
    
    if (hasFast && hasSlow) return { label: "System 1 & 2", color: "bg-primary/20 text-primary" };
    if (hasFast) return { label: "System 1", color: "bg-amber-500/20 text-amber-400" };
    if (hasSlow) return { label: "System 2", color: "bg-primary/20 text-primary" };
    return null;
  };

  const badge = getThinkingBadge();

  const handleEnterArea = (areaId: NeuroLabArea) => {
    if (!canStartSession()) {
      setPaywallFeature("session-limit");
      setPaywallFeatureName("");
      setShowPaywall(true);
      return;
    }
    
    if (isAreaLocked(areaId)) {
      const area = NEURO_LAB_AREAS.find(a => a.id === areaId);
      setPaywallFeature("area");
      setPaywallFeatureName(area?.title || "");
      setShowPaywall(true);
      return;
    }
    
    if (!isDailyCompleted && !isInReminderWindow && reminderTime) {
      setPendingAreaId(areaId);
      setShowDailyConfirm(true);
      return;
    }
    
    navigateToArea(areaId);
  };

  const navigateToArea = (areaId: NeuroLabArea) => {
    const isDailyTraining = !isDailyCompleted;
    navigate(`/neuro-lab/${areaId}?daily=${isDailyTraining}`);
  };

  const handleConfirmDailyTraining = () => {
    if (pendingAreaId) {
      navigateToArea(pendingAreaId);
      setShowDailyConfirm(false);
      setPendingAreaId(null);
    }
  };

  const handleNeuroActivation = () => {
    if (!canAccessNeuroActivation()) {
      setPaywallFeature("neuro-activation");
      setPaywallFeatureName("Neuro Activation™");
      setShowPaywall(true);
      return;
    }
    navigate("/neuro-lab/neuro-activation");
  };

  return (
    <AppShell>
      <div className="px-5 py-8 max-w-md mx-auto min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-medium text-gradient">Cognitive Lab</h1>
            {badge && (
              <span className={cn("text-[10px] px-3 py-1 rounded-full font-medium tracking-wide uppercase", badge.color)}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Elite cognitive performance training
          </p>
        </div>

        {/* Daily Training Status */}
        {isDailyCompleted ? (
          <Card variant="premium" className="mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <span className="text-base font-semibold text-success">Daily Training Complete</span>
                  <p className="text-sm text-success/70 mt-0.5">Excellent work. See you tomorrow.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          !isPremium && (
            <Card variant="glow" className="mb-6">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Daily Sessions</span>
                  <span className="text-sm font-semibold text-foreground">
                    {maxDailySessions - remainingSessions} / {maxDailySessions}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-gold transition-all duration-500 rounded-full"
                    style={{ width: `${((maxDailySessions - remainingSessions) / maxDailySessions) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Neuro Activation CTA */}
        <Card variant="premium" className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={handleNeuroActivation}
              className={cn(
                "w-full p-5 transition-all duration-200 text-left press-effect",
                !canAccessNeuroActivation() && "opacity-80"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center shrink-0 shadow-glow">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-foreground">Neuro Activation</h3>
                    <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-gradient-gold rounded-full text-primary-foreground font-semibold uppercase tracking-wider">
                      {!canAccessNeuroActivation() && <Crown className="w-3 h-3" />}
                      Pro
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    5-min cognitive warm-up ritual
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Premium Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 premium-divider" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
            Training Domains
          </span>
          <div className="flex-1 premium-divider" />
        </div>

        {/* Area Cards */}
        <div className="space-y-4">
          {NEURO_LAB_AREAS.map((area) => {
            const IconComponent = AREA_ICONS[area.icon] || Brain;
            const locked = isAreaLocked(area.id);
            const gradient = AREA_GRADIENTS[area.id] || "from-emerald-500/20 to-emerald-600/10";
            const iconColor = AREA_ICON_COLORS[area.id] || "text-emerald-400";
            
            return (
              <Card 
                key={area.id}
                variant={locked ? "default" : "glow"}
                className={cn(
                  "transition-all duration-300",
                  locked && "opacity-60"
                )}
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => handleEnterArea(area.id)}
                    className="w-full p-5 text-left transition-all press-effect"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                        locked 
                          ? "bg-muted" 
                          : `bg-gradient-to-br ${gradient}`
                      )}>
                        <IconComponent className={cn(
                          "w-7 h-7",
                          locked ? "text-muted-foreground" : iconColor
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-foreground">{area.title}</h3>
                          {locked && (
                            <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium uppercase tracking-wider">
                              <Lock className="w-3 h-3" />
                              Pro
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {area.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium tracking-wide">
              Elite Cognitive Performance
            </p>
          </div>
        </div>
      </div>

      <PremiumPaywall 
        open={showPaywall} 
        onOpenChange={setShowPaywall}
        feature={paywallFeature}
        featureName={paywallFeatureName}
      />

      <DailyTrainingConfirmDialog
        open={showDailyConfirm}
        onOpenChange={setShowDailyConfirm}
        reminderTime={reminderTime || "08:00"}
        onConfirm={handleConfirmDailyTraining}
      />
    </AppShell>
  );
}