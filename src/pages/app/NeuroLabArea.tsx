import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_LAB_AREAS, NeuroLabArea as AreaType, NeuroLabDuration, getNeuroLabExerciseCount } from "@/lib/neuroLab";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Clock, Target, Brain, Sliders, Lightbulb, Sparkles, Gamepad2, Play, Zap } from "lucide-react";
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

export default function NeuroLabArea() {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<ThinkingMode | null>(null);
  
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
  
  // Use the user's exact session duration preference
  const duration: NeuroLabDuration = (user?.sessionDuration as NeuroLabDuration) || "2min";
  const { min, max } = getNeuroLabExerciseCount(duration);
  
  const handleStartSession = () => {
    if (!selectedMode) return;
    navigate(`/neuro-lab/session?area=${area}&duration=${duration}&mode=${selectedMode}`);
  };

  const getDurationLabel = () => {
    switch (duration) {
      case "30s": return "30 Seconds";
      case "2min": return "2 Minutes";
      case "5min": return "5 Minutes";
      case "7min": return "7 Minutes";
      default: return "2 Minutes";
    }
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

        {/* Session Info based on preferences */}
        <div className="mb-6 p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold">{getDurationLabel()}</p>
              <p className="text-xs text-muted-foreground">{getExerciseCount()}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on your preferences. Change in{" "}
            <button 
              onClick={() => navigate("/app/account")}
              className="text-primary hover:underline"
            >
              Settings
            </button>
          </p>
        </div>

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
    </AppShell>
  );
}
