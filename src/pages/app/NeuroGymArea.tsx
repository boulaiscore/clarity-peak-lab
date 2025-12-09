import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { NEURO_GYM_AREAS, NeuroGymArea as AreaType, NeuroGymDuration } from "@/lib/neuroGym";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Clock, Target, Brain, Sliders, Lightbulb, Sparkles, Gamepad2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const AREA_ICONS: Record<string, React.ElementType> = {
  Target,
  Brain,
  Sliders,
  Lightbulb,
  Sparkles,
  Gamepad2,
};

// Map user session duration to NeuroGym duration
const mapToDuration = (userDuration?: string): NeuroGymDuration => {
  switch (userDuration) {
    case "30s":
    case "2min":
      return "3min";
    case "5min":
    case "7min":
      return "7min";
    default:
      return "3min";
  }
};

export default function NeuroGymArea() {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const areaConfig = NEURO_GYM_AREAS.find(a => a.id === area);
  
  if (!areaConfig) {
    return (
      <AppShell>
        <div className="container px-4 py-6">
          <p className="text-muted-foreground">Area not found</p>
          <Button variant="ghost" onClick={() => navigate("/neuro-gym")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Neuro Gym
          </Button>
        </div>
      </AppShell>
    );
  }
  
  const IconComponent = AREA_ICONS[areaConfig.icon] || Brain;
  const duration = mapToDuration(user?.sessionDuration);
  
  const handleStartSession = () => {
    navigate(`/neuro-gym/session?area=${area}&duration=${duration}`);
  };

  const getDurationLabel = () => {
    return duration === "3min" ? "3 Minutes" : "7 Minutes";
  };

  const getExerciseCount = () => {
    return duration === "3min" ? "2-3 drills" : "4-5 drills";
  };

  return (
    <AppShell>
      <div className="container px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/neuro-gym")}
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

        {/* What You'll Train */}
        <div className="mb-8 p-4 rounded-xl bg-card/50 border border-border/50">
          <h2 className="font-semibold mb-3">What You'll Train</h2>
          <div className="flex flex-wrap gap-2">
            {areaConfig.categories.map((cat) => (
              <span 
                key={cat}
                className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize"
              >
                {cat.replace(/_/g, " ")}
              </span>
            ))}
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
        >
          <Play className="w-5 h-5 mr-2" />
          Start Session
        </Button>

        {/* Benefits */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Pro tip:</span> Short, targeted drills 
            for sustainable cognitive performance. Consistency beats intensity.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
