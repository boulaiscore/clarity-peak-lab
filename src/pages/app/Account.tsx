import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { User, Mail, Target, Clock, Crown, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const goalOptions = [
  { value: "stress", label: "Stress Reduction" },
  { value: "clarity", label: "Mental Clarity" },
  { value: "performance", label: "Peak Performance" },
  { value: "decisions", label: "Better Decisions" },
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
      goal: goal as "stress" | "clarity" | "performance" | "decisions" | undefined,
      timePreference: timePreference as "30s" | "2min" | "5min" | undefined,
    });
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
    setIsSaving(false);
  };

  return (
    <AppShell>
      <div className="container px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Account</h1>
            <p className="text-muted-foreground">
              Manage your profile and preferences.
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Goals Section */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Primary Goal
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {goalOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGoal(option.value)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      goal === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:border-primary/50"
                    )}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Time Preference Section */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Preferred Session Length
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {timeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimePreference(option.value)}
                    className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      timePreference === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/30 hover:border-primary/50"
                    )}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Subscription Section */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Subscription
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {user?.subscriptionStatus === "premium" ? "Premium" : "Free Plan"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.subscriptionStatus === "premium"
                      ? "You have access to all features."
                      : "Upgrade for advanced protocols and insights."}
                  </p>
                </div>
                {user?.subscriptionStatus !== "premium" && (
                  <Button asChild variant="hero">
                    <Link to="/app/premium">Upgrade</Link>
                  </Button>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleSave} variant="hero" disabled={isSaving} className="flex-1">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button onClick={logout} variant="outline" className="sm:w-auto">
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Account;
