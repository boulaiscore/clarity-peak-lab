import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { User, Mail, Target, Clock, Crown, Save, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const goalOptions = [
  { value: "reasoning", label: "Critical Thinking" },
  { value: "clarity", label: "Conceptual Clarity" },
  { value: "performance", label: "Cognitive Performance" },
  { value: "decisions", label: "Decision Quality" },
];

const timeOptions = [
  { value: "30s", label: "30 seconds" },
  { value: "2min", label: "2 minutes" },
  { value: "5min", label: "5 minutes" },
];

const Account = () => {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [goal, setGoal] = useState<string | undefined>(user?.goal);
  const [timePreference, setTimePreference] = useState<string | undefined>(user?.timePreference);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    updateUser({
      name,
      goal: goal as any,
      timePreference: timePreference as any,
    });
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    setIsSaving(false);
  };

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

          {/* Training Focus */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Training Focus
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {goalOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGoal(option.value)}
                  className={cn(
                    "p-3 rounded-xl border text-sm transition-all",
                    goal === option.value
                      ? "border-primary bg-primary/8"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="p-6 rounded-xl bg-card border border-border mb-6 shadow-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Default Duration
            </h3>
            <div className="flex gap-2">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimePreference(option.value)}
                  className={cn(
                    "flex-1 p-3 rounded-xl border text-sm transition-all",
                    timePreference === option.value
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
