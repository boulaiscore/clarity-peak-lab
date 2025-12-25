import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea } from "@/lib/neuroLab";
import { CognitiveInputs } from "@/components/dashboard/CognitiveInputs";
import { Target, Brain, Sliders, Lightbulb, Sparkles, Zap, ChevronRight, Lock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating } from "@/hooks/usePremiumGating";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { DailyTrainingConfirmDialog } from "@/components/app/DailyTrainingConfirmDialog";
import { useDailyTraining } from "@/hooks/useDailyTraining";

const AREA_ICONS: Record<string, React.ElementType> = {
  Target,
  Brain,
  Sliders,
  Lightbulb,
  Sparkles,
  Zap,
};

export default function NeuroLab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, isAreaLocked, canAccessNeuroActivation, canStartSession, remainingSessions, maxDailySessions } = usePremiumGating();
  const { isDailyCompleted, isInReminderWindow, reminderTime } = useDailyTraining();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<"area" | "neuro-activation" | "session-limit">("area");
  const [paywallFeatureName, setPaywallFeatureName] = useState<string>("");
  
  // State for daily training confirmation
  const [showDailyConfirm, setShowDailyConfirm] = useState(false);
  const [pendingAreaId, setPendingAreaId] = useState<NeuroLabArea | null>(null);

  const getThinkingBadge = () => {
    const goals = user?.trainingGoals || [];
    const hasFast = goals.includes("fast_thinking");
    const hasSlow = goals.includes("slow_thinking");
    
    if (hasFast && hasSlow) return { label: "System 1 & 2", color: "bg-primary/15 text-primary" };
    if (hasFast) return { label: "System 1", color: "bg-amber-500/15 text-amber-400" };
    if (hasSlow) return { label: "System 2", color: "bg-teal-500/15 text-teal-400" };
    return null;
  };

  const badge = getThinkingBadge();

  const handleEnterArea = (areaId: NeuroLabArea) => {
    // Check session limit first
    if (!canStartSession()) {
      setPaywallFeature("session-limit");
      setPaywallFeatureName("");
      setShowPaywall(true);
      return;
    }
    
    // Check area access
    if (isAreaLocked(areaId)) {
      const area = NEURO_LAB_AREAS.find(a => a.id === areaId);
      setPaywallFeature("area");
      setPaywallFeatureName(area?.title || "");
      setShowPaywall(true);
      return;
    }
    
    // If daily training not completed and outside reminder window, show confirmation
    if (!isDailyCompleted && !isInReminderWindow && reminderTime) {
      setPendingAreaId(areaId);
      setShowDailyConfirm(true);
      return;
    }
    
    // Navigate with daily training flag
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
      <div className="px-5 py-5 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">Cognitive Lab</h1>
            {badge && (
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", badge.color)}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            Strategic cognitive training
          </p>
        </div>

        {/* Daily Training Status */}
        {isDailyCompleted ? (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <span className="text-sm font-medium text-green-400">Daily Training Complete</span>
            </div>
          </div>
        ) : (
          !isPremium && (
            <div className="mb-4 p-3 rounded-xl bg-card/50 border border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Daily Sessions</span>
                <span className="text-sm font-medium">
                  {maxDailySessions - remainingSessions}/{maxDailySessions}
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-border/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((maxDailySessions - remainingSessions) / maxDailySessions) * 100}%` }}
                />
              </div>
            </div>
          )
        )}

        {/* Neuro Activation CTA */}
        <button
          onClick={handleNeuroActivation}
          className={cn(
            "w-full p-4 rounded-xl border transition-all duration-200 mb-5",
            "bg-gradient-to-br from-primary/12 to-transparent",
            "border-primary/25 hover:border-primary/40 active:scale-[0.98]",
            !canAccessNeuroActivation() && "opacity-80"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-[14px]">Neuro Activation</h3>
              <p className="text-[11px] text-muted-foreground">
                5-min cognitive warm-up
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {!canAccessNeuroActivation() ? (
                <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-primary/15 rounded text-primary font-medium">
                  <Crown className="w-3 h-3" />
                  PRO
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 bg-primary/15 rounded text-primary font-medium">
                  PRO
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </div>
          </div>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border/30" />
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            Training Domains
          </span>
          <div className="h-px flex-1 bg-border/30" />
        </div>

        {/* Area Cards */}
        <div className="space-y-2.5">
          {NEURO_LAB_AREAS.map((area) => {
            const IconComponent = AREA_ICONS[area.icon] || Brain;
            const locked = isAreaLocked(area.id);
            
            return (
              <button
                key={area.id}
                onClick={() => handleEnterArea(area.id)}
                className={cn(
                  "w-full p-3.5 rounded-xl border transition-all duration-200 text-left",
                  "bg-card/50 hover:bg-card/80",
                  "border-border/30 hover:border-primary/30",
                  "active:scale-[0.98]",
                  locked && "opacity-70"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    locked ? "bg-muted/50" : "bg-primary/10"
                  )}>
                    <IconComponent className={cn(
                      "w-5 h-5",
                      locked ? "text-muted-foreground" : "text-primary"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[13px]">{area.title}</h3>
                      {locked && (
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-muted/50 rounded text-muted-foreground font-medium">
                          <Lock className="w-2.5 h-2.5" />
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {area.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-border/30" />
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            Passive Training
          </span>
          <div className="h-px flex-1 bg-border/30" />
        </div>

        {/* Cognitive Inputs */}
        <CognitiveInputs />

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">
            Strategic Cognitive Performance
          </p>
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