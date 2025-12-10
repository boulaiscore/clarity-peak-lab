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
      case "30s": return "30s";
      case "2min": return "2min";
      case "5min": return "5min";
      case "7min": return "7min";
      default: return "—";
    }
  };

  const getDailyTimeLabel = (time?: string) => {
    switch (time) {
      case "3min": return "3min/day";
      case "10min": return "10min/day";
      case "30min": return "30min/day";
      default: return "—";
    }
  };

  return (
    <AppShell>
      <div className="px-5 py-5 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-5">
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mb-0.5">
            Strategic Cognitive Training
          </p>
          <h1 className="text-lg font-semibold tracking-tight">
            Hello, {firstName}
          </h1>
        </div>

        {/* Training Profile Card */}
        <div className="p-4 rounded-xl bg-card/60 border border-border/30 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-[13px]">Training Protocol</h2>
            <Link 
              to="/app/account" 
              className="text-[11px] text-primary/80 hover:text-primary flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              Edit
            </Link>
          </div>
          
          {hasGoals ? (
            <div className="space-y-2.5">
              {/* Goals */}
              <div className="flex gap-2">
                {hasFastThinking && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-[11px] font-medium text-amber-400">System 1</span>
                  </div>
                )}
                {hasSlowThinking && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20">
                    <Brain className="w-3 h-3 text-teal-400" />
                    <span className="text-[11px] font-medium text-teal-400">System 2</span>
                  </div>
                )}
              </div>
              
              {/* Preferences */}
              <div className="flex gap-3 text-[11px] text-muted-foreground">
                <span>{getDurationLabel(user?.sessionDuration)} drills</span>
                <span className="text-muted-foreground/40">•</span>
                <span>{getDailyTimeLabel(user?.dailyTimeCommitment)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-[12px] text-muted-foreground mb-2">
                Configure your training
              </p>
              <Link 
                to="/onboarding"
                className="text-[12px] text-primary hover:underline"
              >
                Complete Setup →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Access to Gym */}
        <div className="mb-5">
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mb-2.5">
            Begin Training
          </p>
          <button
            onClick={() => navigate("/neuro-lab")}
            className={cn(
              "group w-full p-4 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5",
              "border border-primary/25 hover:border-primary/40",
              "transition-all duration-200 text-left active:scale-[0.98]"
            )}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground">Cognitive Lab</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Strategic drills • 5 domains
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
          </button>
        </div>

        {/* Training Focus Overview */}
        <div className="mb-5">
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mb-2.5">
            Cognitive Systems
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className={cn(
              "p-3.5 rounded-xl border transition-colors",
              hasFastThinking 
                ? "bg-amber-500/5 border-amber-500/20" 
                : "bg-card/40 border-border/30 opacity-40"
            )}>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-[13px] font-semibold text-foreground">System 1</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Intuitive Processing</p>
            </div>
            <div className={cn(
              "p-3.5 rounded-xl border transition-colors",
              hasSlowThinking 
                ? "bg-teal-500/5 border-teal-500/20" 
                : "bg-card/40 border-border/30 opacity-40"
            )}>
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center mb-2.5">
                <Brain className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="text-[13px] font-semibold text-foreground">System 2</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Deliberate Analysis</p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center pt-2">
          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            Build strategic cognitive advantage
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default Home;
