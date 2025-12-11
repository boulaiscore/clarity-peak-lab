import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Brain, ChevronRight, Dumbbell, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";

  const hasGoals = user?.trainingGoals && user.trainingGoals.length > 0;
  const hasFastThinking = user?.trainingGoals?.includes("fast_thinking");
  const hasSlowThinking = user?.trainingGoals?.includes("slow_thinking");

  const getDurationLabel = (duration?: string) => {
    switch (duration) {
      case "30s":
        return "30s";
      case "2min":
        return "2min";
      case "5min":
        return "5min";
      case "7min":
        return "7min";
      default:
        return "—";
    }
  };

  const getDailyTimeLabel = (time?: string) => {
    switch (time) {
      case "1min":
        return "1min/day";
      case "5min":
        return "5min/day";
      case "10min":
        return "10min/day";
      default:
        return "—";
    }
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <AppShell>
      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {getGreeting()}, <br />{firstName} 👋
          </h1>
        </div>

        {/* Main CTA Card */}
        <Card className="mb-5 overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => navigate("/neuro-lab")}
              className="group w-full p-5 text-left transition-all duration-200 active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-pastel-teal flex items-center justify-center shrink-0">
                  <Dumbbell className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">Cognitive Lab</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Strategic drills • 5 domains</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Training Protocol Card */}
        <Card className="mb-5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Training Protocol</h2>
              <Link to="/app/account" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                <Settings className="w-3.5 h-3.5" />
                Edit
              </Link>
            </div>

            {hasGoals ? (
              <div className="space-y-3">
                {/* Goals */}
                <div className="flex gap-2">
                  {hasFastThinking && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pastel-yellow">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-foreground">System 1</span>
                    </div>
                  )}
                  {hasSlowThinking && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pastel-teal">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">System 2</span>
                    </div>
                  )}
                </div>

                {/* Preferences */}
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <span>{getDurationLabel(user?.sessionDuration)} drills</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{getDailyTimeLabel(user?.dailyTimeCommitment)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Configure your training</p>
                <Link to="/onboarding" className="text-sm text-primary hover:underline font-medium">
                  Complete Setup →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cognitive Systems */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Cognitive Systems</p>
          <div className="grid grid-cols-2 gap-3">
            <Card className={cn(
              "transition-all duration-200",
              hasFastThinking ? "ring-2 ring-amber-400/30" : "opacity-50"
            )}>
              <CardContent className="p-4">
                <div className="w-11 h-11 rounded-xl bg-pastel-yellow flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-foreground">System 1</h3>
                <p className="text-xs text-muted-foreground mt-1">Intuitive Processing</p>
              </CardContent>
            </Card>
            <Card className={cn(
              "transition-all duration-200",
              hasSlowThinking ? "ring-2 ring-primary/30" : "opacity-50"
            )}>
              <CardContent className="p-4">
                <div className="w-11 h-11 rounded-xl bg-pastel-teal flex items-center justify-center mb-3">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">System 2</h3>
                <p className="text-xs text-muted-foreground mt-1">Deliberate Analysis</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-card">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">
              Build strategic cognitive advantage
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Home;
