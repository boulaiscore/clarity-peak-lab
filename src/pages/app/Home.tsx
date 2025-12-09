import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Brain, ChevronRight, Dumbbell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";
  
  const hasGoals = user?.trainingGoals && user.trainingGoals.length > 0;
  const hasFastThinking = user?.trainingGoals?.includes("fast_thinking");
  const hasSlowThinking = user?.trainingGoals?.includes("slow_thinking");

  const getDurationLabel = (duration?: string) => {
    switch (duration) {
      case "30s": return "30 seconds";
      case "2min": return "2 minutes";
      case "5min": return "5 minutes";
      case "7min": return "7 minutes";
      default: return "Not set";
    }
  };

  const getDailyTimeLabel = (time?: string) => {
    switch (time) {
      case "3min": return "3 min/day";
      case "10min": return "10 min/day";
      case "30min": return "30 min/day";
      default: return "Not set";
    }
  };

  return (
    <AppShell>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <p className="label-uppercase mb-1">Cognitive Training</p>
          <h1 className="text-xl font-semibold tracking-tight">
            Hello, {firstName}
          </h1>
        </div>

        {/* Training Profile Card */}
        <div className="p-4 rounded-xl bg-card border border-border/40 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Your Training Profile</h2>
            <Link 
              to="/app/account" 
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              Edit
            </Link>
          </div>
          
          {hasGoals ? (
            <div className="space-y-3">
              {/* Goals */}
              <div className="flex gap-2">
                {hasFastThinking && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
                    <Zap className="w-3.5 h-3.5 text-warning" />
                    <span className="text-xs font-medium text-warning">Fast Thinking</span>
                  </div>
                )}
                {hasSlowThinking && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">Slow Thinking</span>
                  </div>
                )}
              </div>
              
              {/* Preferences */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Session: {getDurationLabel(user?.sessionDuration)}</span>
                <span>•</span>
                <span>{getDailyTimeLabel(user?.dailyTimeCommitment)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Set up your training preferences
              </p>
              <Link 
                to="/onboarding"
                className="text-sm text-primary hover:underline"
              >
                Complete Setup →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Access to Gym */}
        <div className="mb-6">
          <h2 className="label-uppercase mb-3">Start Training</h2>
          <button
            onClick={() => navigate("/neuro-gym")}
            className={cn(
              "group w-full p-5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5",
              "border border-primary/30 hover:border-primary/50",
              "transition-all duration-200 text-left active:scale-[0.98]"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Dumbbell className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground">Neuro Gym</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Targeted cognitive drills across 6 areas
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </div>

        {/* Training Focus Overview */}
        <div className="mb-6">
          <h2 className="label-uppercase mb-3">Your Focus Areas</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              "p-4 rounded-xl border transition-colors",
              hasFastThinking 
                ? "bg-warning/5 border-warning/20" 
                : "bg-card border-border/40 opacity-50"
            )}>
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Fast Thinking</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">System 1 – Intuition</p>
              <p className="text-[9px] text-muted-foreground/60 mt-2 leading-relaxed">
                {hasFastThinking ? "Active training goal" : "Not selected"}
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-xl border transition-colors",
              hasSlowThinking 
                ? "bg-primary/5 border-primary/20" 
                : "bg-card border-border/40 opacity-50"
            )}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Slow Thinking</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">System 2 – Structured</p>
              <p className="text-[9px] text-muted-foreground/60 mt-2 leading-relaxed">
                {hasSlowThinking ? "Active training goal" : "Not selected"}
              </p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Fast and Slow thinking are both skills. Train both.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default Home;
