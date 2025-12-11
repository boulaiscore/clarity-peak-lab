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

const AREA_COLORS: Record<string, string> = {
  focus: "bg-pastel-teal",
  reasoning: "bg-pastel-purple",
  creativity: "bg-pastel-pink",
  memory: "bg-pastel-green",
  control: "bg-pastel-yellow",
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
    if (hasFast) return { label: "System 1", color: "bg-pastel-yellow text-amber-700" };
    if (hasSlow) return { label: "System 2", color: "bg-pastel-teal text-primary" };
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
      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight">Cognitive Lab</h1>
            {badge && (
              <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", badge.color)}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Strategic cognitive training
          </p>
        </div>

        {/* Daily Training Status */}
        {isDailyCompleted ? (
          <Card className="mb-5 bg-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-success">Daily Training Complete</span>
                  <p className="text-xs text-success/70">Great work! See you tomorrow</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          !isPremium && (
            <Card className="mb-5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Daily Sessions</span>
                  <span className="text-sm font-semibold">
                    {maxDailySessions - remainingSessions}/{maxDailySessions}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all rounded-full"
                    style={{ width: `${((maxDailySessions - remainingSessions) / maxDailySessions) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Neuro Activation CTA */}
        <Card className="mb-5 overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={handleNeuroActivation}
              className={cn(
                "w-full p-4 transition-all duration-200 text-left active:scale-[0.99]",
                !canAccessNeuroActivation() && "opacity-80"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-pastel-purple flex items-center justify-center shrink-0">
                  <Zap className="w-7 h-7 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">Neuro Activation</h3>
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-primary/15 rounded-full text-primary font-medium">
                      {!canAccessNeuroActivation() && <Crown className="w-3 h-3" />}
                      PRO
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    5-min cognitive warm-up
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Training Domains
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Area Cards */}
        <div className="space-y-3">
          {NEURO_LAB_AREAS.map((area) => {
            const IconComponent = AREA_ICONS[area.icon] || Brain;
            const locked = isAreaLocked(area.id);
            const areaColor = AREA_COLORS[area.id] || "bg-pastel-teal";
            
            return (
              <Card 
                key={area.id}
                className={cn(
                  "transition-all duration-200",
                  locked && "opacity-60"
                )}
              >
                <CardContent className="p-0">
                  <button
                    onClick={() => handleEnterArea(area.id)}
                    className="w-full p-4 text-left transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        locked ? "bg-muted" : areaColor
                      )}>
                        <IconComponent className={cn(
                          "w-6 h-6",
                          locked ? "text-muted-foreground" : "text-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">{area.title}</h3>
                          {locked && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
                              <Lock className="w-3 h-3" />
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                          {area.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-card">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">
              Strategic Cognitive Performance
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
