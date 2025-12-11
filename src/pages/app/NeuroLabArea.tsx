import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea as AreaType, NeuroLabDuration, getNeuroLabExerciseCount } from "@/lib/neuroLab";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumGating, FREE_DURATIONS } from "@/hooks/usePremiumGating";
import { PremiumPaywall } from "@/components/app/PremiumPaywall";
import { ArrowLeft, Clock, Target, Brain, Sliders, Lightbulb, Sparkles, Gamepad2, Play, Zap, Lock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const AREA_ICONS: Record<string, React.ElementType> = {
  Target,
  Brain,
  Sliders,
  Lightbulb,
  Sparkles,
  Gamepad2,
  Zap,
  Clock,
};

type ThinkingMode = "fast" | "slow";

const ALL_DURATIONS: { value: NeuroLabDuration; label: string }[] = [
  { value: "30s", label: "30s" },
  { value: "2min", label: "2min" },
  { value: "5min", label: "5min" },
  { value: "7min", label: "7min" },
];

export default function NeuroLabArea() {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDurationLocked, canStartSession } = usePremiumGating();
  
  const [selectedMode, setSelectedMode] = useState<ThinkingMode | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<NeuroLabDuration>(
    (user?.sessionDuration as NeuroLabDuration) || "2min"
  );
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<"duration" | "session-limit">("duration");
  
  const areaConfig = NEURO_LAB_AREAS.find(a => a.id === area);
  
  if (!areaConfig) {
    return (
      <AppShell>
        <div className="container px-4 py-6">
          <p className="text-muted-foreground">Area not found</p>
          <Button variant="ghost" onClick={() => navigate("/neuro-lab")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cognitive Lab
          </Button>
        </div>
      </AppShell>
    );
  }
  
  const IconComponent = AREA_ICONS[areaConfig.icon] || Brain;
  const { min, max } = getNeuroLabExerciseCount(selectedDuration);
  
  const handleDurationSelect = (duration: NeuroLabDuration) => {
    if (isDurationLocked(duration)) {
      setPaywallFeature("duration");
      setShowPaywall(true);
      return;
    }
    setSelectedDuration(duration);
  };
  
  const handleStartSession = () => {
    if (!selectedMode) return;
    
    if (!canStartSession()) {
      setPaywallFeature("session-limit");
      setShowPaywall(true);
      return;
    }
    
    navigate(`/neuro-lab/session?area=${area}&duration=${selectedDuration}&mode=${selectedMode}`);
  };

  const getExerciseCount = () => {
    if (min === max) return `${min} drill${min !== 1 ? 's' : ''}`;
    return `${min}-${max} drills`;
  };

  return (
    <AppShell>
      <div className="container px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/neuro-lab")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Area Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <IconComponent className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{areaConfig.title}</h1>
            <p className="text-sm text-primary/70 mt-0.5">{areaConfig.subtitle}</p>
            <p className="text-muted-foreground text-sm mt-2">{areaConfig.description}</p>
          </div>
        </div>

        {/* Session Duration Selection - Hidden for Critical Reasoning */}
        {area !== "reasoning" && (
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Session Duration</h2>
            <div className="grid grid-cols-4 gap-2">
              {ALL_DURATIONS.map(({ value, label }) => {
                const locked = isDurationLocked(value);
                const isSelected = selectedDuration === value;
                
                return (
                  <button
                    key={value}
                    onClick={() => handleDurationSelect(value)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all text-center",
                      isSelected && !locked
                        ? "border-primary bg-primary/10"
                        : locked
                          ? "border-border/30 bg-muted/20"
                          : "border-border/50 bg-card/50 hover:border-primary/50"
                    )}
                  >
                    <span className={cn(
                      "font-semibold text-sm",
                      locked && "text-muted-foreground"
                    )}>
                      {label}
                    </span>
                    {locked && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
                        <Lock className="w-2 h-2" />
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Thinking Mode Selection */}
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Choose Training Mode</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* System 1 Option */}
            <button
              onClick={() => setSelectedMode("fast")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                selectedMode === "fast"
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card/50 hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className={cn(
                  "w-5 h-5",
                  selectedMode === "fast" ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="font-semibold">System 1</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Quick pattern recognition, intuitive responses
              </p>
            </button>

            {/* System 2 Option */}
            <button
              onClick={() => setSelectedMode("slow")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                selectedMode === "slow"
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card/50 hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className={cn(
                  "w-5 h-5",
                  selectedMode === "slow" ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="font-semibold">System 2</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Deliberate analysis, strategic reasoning
              </p>
            </button>
          </div>
        </div>

        {/* Session Info - Hidden for Critical Reasoning */}
        {area !== "reasoning" && (
          <div className="mb-6 p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">{selectedDuration === "30s" ? "30 Seconds" : selectedDuration}</p>
                <p className="text-xs text-muted-foreground">{getExerciseCount()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <Button 
          onClick={handleStartSession}
          variant="hero"
          className="w-full min-h-[56px] mb-6"
          disabled={!selectedMode}
        >
          <Play className="w-5 h-5 mr-2" />
          {selectedMode 
            ? `Start ${selectedMode === "fast" ? "System 1" : "System 2"} Training`
            : "Select a Training Mode"
          }
        </Button>

        {/* Benefits */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Strategic insight:</span> Short, targeted drills 
            build cognitive advantage. Consistency compounds into elite performance.
          </p>
        </div>
      </div>

      <PremiumPaywall 
        open={showPaywall} 
        onOpenChange={setShowPaywall}
        feature={paywallFeature}
      />
    </AppShell>
  );
}
