import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_GYM_AREAS, NeuroGymArea } from "@/lib/neuroGym";
import { Target, Brain, Sliders, Lightbulb, Sparkles, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const AREA_ICONS: Record<string, React.ElementType> = {
  Target,
  Brain,
  Sliders,
  Lightbulb,
  Sparkles,
  Zap,
};

export default function NeuroGym() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getThinkingBadge = () => {
    const goals = user?.trainingGoals || [];
    const hasFast = goals.includes("fast_thinking");
    const hasSlow = goals.includes("slow_thinking");
    
    if (hasFast && hasSlow) return { label: "Fast & Slow", color: "bg-primary/15 text-primary" };
    if (hasFast) return { label: "Fast", color: "bg-amber-500/15 text-amber-400" };
    if (hasSlow) return { label: "Slow", color: "bg-teal-500/15 text-teal-400" };
    return null;
  };

  const badge = getThinkingBadge();

  const handleEnterArea = (areaId: NeuroGymArea) => {
    navigate(`/neuro-gym/${areaId}`);
  };

  const handleNeuroActivation = () => {
    navigate("/neuro-gym/neuro-activation");
  };

  return (
    <AppShell>
      <div className="px-5 py-5 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">Neuro Gym</h1>
            {badge && (
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", badge.color)}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            Train your cognitive performance
          </p>
        </div>

        {/* Neuro Activation CTA */}
        <button
          onClick={handleNeuroActivation}
          className={cn(
            "w-full p-4 rounded-xl border transition-all duration-200 mb-5",
            "bg-gradient-to-br from-primary/12 to-transparent",
            "border-primary/25 hover:border-primary/40 active:scale-[0.98]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-[14px]">Neuro Activation</h3>
              <p className="text-[11px] text-muted-foreground">
                7-min complete protocol
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 bg-primary/15 rounded text-primary font-medium">
                PRO
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </div>
          </div>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border/30" />
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            Training Zones
          </span>
          <div className="h-px flex-1 bg-border/30" />
        </div>

        {/* Area Cards */}
        <div className="space-y-2.5">
          {NEURO_GYM_AREAS.map((area) => {
            const IconComponent = AREA_ICONS[area.icon] || Brain;
            
            return (
              <button
                key={area.id}
                onClick={() => handleEnterArea(area.id)}
                className={cn(
                  "w-full p-3.5 rounded-xl border transition-all duration-200 text-left",
                  "bg-card/50 hover:bg-card/80",
                  "border-border/30 hover:border-primary/30",
                  "active:scale-[0.98]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[13px]">{area.title}</h3>
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

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">
            Cognitive Performance System
          </p>
        </div>
      </div>
    </AppShell>
  );
}
