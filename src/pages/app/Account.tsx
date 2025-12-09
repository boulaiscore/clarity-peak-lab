import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, TrainingGoal, SessionDuration, DailyTimeCommitment } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { User, Crown, Save, LogOut, Zap, Brain, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const Account = () => {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoal[]>(user?.trainingGoals || []);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration | undefined>(user?.sessionDuration);
  const [dailyTimeCommitment, setDailyTimeCommitment] = useState<DailyTimeCommitment | undefined>(user?.dailyTimeCommitment);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setTrainingGoals(user.trainingGoals || []);
      setSessionDuration(user.sessionDuration);
      setDailyTimeCommitment(user.dailyTimeCommitment);
    }
  }, [user]);

  const toggleGoal = (goal: TrainingGoal) => {
    setTrainingGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    updateUser({
      name,
      trainingGoals,
      sessionDuration,
      dailyTimeCommitment,
    });
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    setIsSaving(false);
  };

  const durationOptions: { value: SessionDuration; label: string }[] = [
    { value: "30s", label: "30s" },
    { value: "2min", label: "2min" },
    { value: "5min", label: "5min" },
    { value: "7min", label: "7min" },
  ];

  const dailyTimeOptions: { value: DailyTimeCommitment; label: string }[] = [
    { value: "3min", label: "3 min" },
    { value: "10min", label: "10 min" },
    { value: "30min", label: "30 min" },
  ];

  return (
    <AppShell>
      <div className="container px-6 py-10 sm:py-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold mb-1">{user?.name || "User"}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>

          {/* Subscription Status */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{user?.subscriptionStatus === "premium" ? "Premium" : "Free"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.subscriptionStatus === "premium" ? "Full access" : "Core protocols"}
                  </p>
                </div>
              </div>
              {user?.subscriptionStatus !== "premium" && (
                <Button asChild size="sm" variant="hero" className="rounded-xl">
                  <Link to="/app/premium">Upgrade</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <label className="text-sm font-medium mb-3 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-12"
            />
          </div>

          {/* Training Goals */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              Training Goals
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleGoal("fast_thinking")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  trainingGoals.includes("fast_thinking")
                    ? "border-warning bg-warning/10"
                    : "border-border hover:border-warning/30"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
                <span className="font-medium text-sm block">Fast Thinking</span>
                <span className="text-xs text-muted-foreground">Intuition</span>
              </button>
              <button
                onClick={() => toggleGoal("slow_thinking")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  trainingGoals.includes("slow_thinking")
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-sm block">Slow Thinking</span>
                <span className="text-xs text-muted-foreground">Structured</span>
              </button>
            </div>
          </div>

          {/* Session Duration */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Exercise Duration
            </h3>
            <div className="flex gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSessionDuration(option.value)}
                  className={cn(
                    "flex-1 p-3 rounded-xl border text-sm transition-all",
                    sessionDuration === option.value
                      ? "border-primary bg-primary/8"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Time */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Daily Commitment
            </h3>
            <div className="flex gap-2">
              {dailyTimeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDailyTimeCommitment(option.value)}
                  className={cn(
                    "flex-1 p-3 rounded-xl border text-sm transition-all",
                    dailyTimeCommitment === option.value
                      ? "border-primary bg-primary/8"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={handleSave} variant="hero" className="w-full min-h-[52px] rounded-xl" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={logout} variant="outline" className="w-full min-h-[52px] rounded-xl">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Account;
