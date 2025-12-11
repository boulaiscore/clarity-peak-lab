import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Brain, ChevronRight, Dumbbell, Settings, Sparkles, Crown } from "lucide-react";
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
      case "30s": return "30s";
      case "2min": return "2min";
      case "5min": return "5min";
      case "7min": return "7min";
      default: return "—";
    }
  };

  const getDailyTimeLabel = (time?: string) => {
    switch (time) {
      case "1min": return "1min/day";
      case "5min": return "5min/day";
      case "10min": return "10min/day";
      default: return "—";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <AppShell>
      <div className="px-5 py-8 max-w-md mx-auto min-h-screen">
        {/* Premium Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">{getGreeting()}</p>
          <h1 className="text-3xl font-medium">
            <span className="text-gradient">{firstName}</span>
          </h1>
        </div>

        {/* Main CTA Card */}
        <Card variant="premium" className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={() => navigate("/neuro-lab")}
              className="group w-full p-6 text-left transition-all duration-200 press-effect"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/20 flex items-center justify-center shrink-0 shadow-glow">
                  <Dumbbell className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-foreground">Cognitive Lab</h3>
                  <p className="text-sm text-muted-foreground mt-1">Strategic drills • 5 domains</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Training Protocol Card */}
        <Card variant="glow" className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Training Protocol</h2>
              <Link to="/app/account" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
                <Settings className="w-3.5 h-3.5" />
                Edit
              </Link>
            </div>

            {hasGoals ? (
              <div className="space-y-4">
                {/* Goals */}
                <div className="flex gap-3">
                  {hasFastThinking && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-foreground">System 1</span>
                    </div>
                  )}
                  {hasSlowThinking && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/20">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">System 2</span>
                    </div>
                  )}
                </div>

                {/* Preferences */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{getDurationLabel(user?.sessionDuration)} drills</span>
                  <span className="text-border">•</span>
                  <span>{getDailyTimeLabel(user?.dailyTimeCommitment)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">Configure your training protocol</p>
                <Link to="/onboarding" className="text-sm text-primary hover:underline font-semibold">
                  Complete Setup →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cognitive Systems */}
        <div className="mb-8">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] mb-4">Cognitive Systems</p>
          <div className="grid grid-cols-2 gap-4">
            <Card 
              variant={hasFastThinking ? "premium" : "default"}
              className={cn(
                "transition-all duration-300",
                !hasFastThinking && "opacity-50"
              )}
            >
              <CardContent className="p-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">System 1</h3>
                <p className="text-xs text-muted-foreground mt-1">Intuitive Processing</p>
              </CardContent>
            </Card>
            <Card 
              variant={hasSlowThinking ? "premium" : "default"}
              className={cn(
                "transition-all duration-300",
                !hasSlowThinking && "opacity-50"
              )}
            >
              <CardContent className="p-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-emerald-500/20 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">System 2</h3>
                <p className="text-xs text-muted-foreground mt-1">Deliberate Analysis</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full glass-card">
            <Crown className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium tracking-wide">
              Build strategic cognitive advantage
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Home;