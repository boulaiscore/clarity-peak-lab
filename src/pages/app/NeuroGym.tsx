import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_GYM_AREAS, NeuroGymArea } from "@/lib/neuroGym";
import { Target, Brain, Sliders, Lightbulb, Sparkles, Zap, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AREA_ICONS: Record<string, React.ElementType> = {
  Target,
  Brain,
  Sliders,
  Lightbulb,
  Sparkles,
  Gamepad2,
  Zap,
};

export default function NeuroGym() {
  const navigate = useNavigate();

  const handleEnterArea = (areaId: NeuroGymArea) => {
    navigate(`/neuro-gym/${areaId}`);
  };

  const handleNeuroActivation = () => {
    navigate("/neuro-gym/neuro-activation");
  };

  return (
    <AppShell>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Neuro Gym™</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Train your brain like an athlete trains their body.
          </p>
        </div>

        {/* Neuro Activation CTA */}
        <div className="mb-8">
          <button
            onClick={handleNeuroActivation}
            className={cn(
              "w-full p-5 rounded-xl border transition-all duration-300",
              "bg-gradient-to-br from-primary/20 via-primary/10 to-background",
              "border-primary/40 hover:border-primary/60",
              "hover:shadow-lg hover:shadow-primary/10"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-lg">Neuro Activation Session™</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  7-min complete cognitive activation protocol
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-primary/80">
              <span className="px-2 py-0.5 bg-primary/20 rounded-full">Premium</span>
              <span>Focus • Memory • Control • Creativity • Reasoning</span>
            </div>
          </button>
        </div>

        {/* Section Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Training Zones</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* Area Cards */}
        <div className="grid gap-4">
          {NEURO_GYM_AREAS.map((area) => {
            const IconComponent = AREA_ICONS[area.icon] || Brain;
            
            return (
              <button
                key={area.id}
                onClick={() => handleEnterArea(area.id)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all duration-300 text-left",
                  "bg-card/50 hover:bg-card",
                  "border-border/50 hover:border-primary/40",
                  "hover:shadow-md hover:shadow-primary/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{area.title}</h3>
                    <p className="text-xs text-primary/70 mt-0.5">{area.subtitle}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {area.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Quote */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground italic">
            "Your mind is your edge. Neuro Gym helps you sharpen it."
          </p>
        </div>
      </div>
    </AppShell>
  );
}
