import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User, Save, Brain, Shield, Users, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

// Education level labels mapping
const educationLevelLabels: Record<string, string> = {
  high_school: "High School",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  phd: "PhD / Doctorate",
  other: "Other",
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean | null>(null);

  // Check if user has completed assessment
  useEffect(() => {
    const checkAssessmentStatus = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("user_cognitive_metrics")
        .select("baseline_fast_thinking, baseline_slow_thinking, baseline_captured_at")
        .eq("user_id", user.id)
        .single();
      
      const isSkipped = data?.baseline_fast_thinking === 50 && 
                        data?.baseline_slow_thinking === 50 &&
                        !data?.baseline_captured_at;
      
      setHasCompletedAssessment(!isSkipped && data?.baseline_fast_thinking !== null);
    };
    
    checkAssessmentStatus();
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  const handleResetAssessment = async () => {
    if (!user?.id) return;

    setIsResetting(true);
    try {
      const { error } = await supabase
        .from("user_cognitive_metrics")
        .update({
          baseline_focus: null,
          baseline_reasoning: null,
          baseline_creativity: null,
          baseline_fast_thinking: null,
          baseline_slow_thinking: null,
          baseline_cognitive_age: null,
          baseline_captured_at: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Assessment reset",
        description: "Redirecting to initial assessment...",
      });

      navigate("/onboarding?step=assessment");
    } catch (error) {
      console.error("Error resetting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to reset assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    updateUser({ name });
    toast({ title: "Profile saved", description: "Your profile has been updated." });
    setIsSaving(false);
  };

  const memberSince = user?.id ? format(new Date(), "MMMM yyyy") : "—";
  const maskedAccountId = user?.id ? `••••••${user.id.slice(-4)}` : "—";

  return (
    <AppShell>
      <div className="container px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Profile</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Account Information */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-primary" />
                Account
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user?.email || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-xs text-muted-foreground">Member since</span>
                  <span className="text-sm font-medium">{memberSince}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Account ID</span>
                  <span className="text-sm font-medium font-mono">{maskedAccountId}</span>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <label className="text-sm font-medium mb-2 block">Display Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11" />
            </div>

            {/* Demographics */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                Demographics
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="py-1.5">
                  <span className="text-xs text-muted-foreground block">Birth Date</span>
                  <span className="font-medium">{user?.birthDate ? format(new Date(user.birthDate), "MMM d, yyyy") : "—"}</span>
                </div>
                <div className="py-1.5">
                  <span className="text-xs text-muted-foreground block">Gender</span>
                  <span className="font-medium capitalize">{user?.gender || "—"}</span>
                </div>
                <div className="py-1.5">
                  <span className="text-xs text-muted-foreground block">Education</span>
                  <span className="font-medium">{user?.educationLevel ? educationLevelLabels[user.educationLevel] : "—"}</span>
                </div>
                <div className="py-1.5">
                  <span className="text-xs text-muted-foreground block">Work Type</span>
                  <span className="font-medium capitalize">{user?.workType ? user.workType.replace(/_/g, " ") : "—"}</span>
                </div>
              </div>
            </div>

            {/* Cognitive Baseline */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                <Brain className="w-4 h-4 text-primary" />
                Cognitive Baseline
              </h3>
              {hasCompletedAssessment === false ? (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    Take the initial assessment for personalized baseline metrics.
                  </p>
                  <Button variant="hero" size="sm" className="w-full" onClick={() => navigate("/onboarding?step=assessment")}>
                    <Brain className="w-4 h-4" />
                    Take Assessment
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    Reset to establish new baseline metrics.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full" disabled={isResetting}>
                        <RotateCcw className="w-4 h-4" />
                        {isResetting ? "Resetting..." : "Reset Assessment"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Initial Assessment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will clear your baseline metrics. Training history will be preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAssessment}>Reset & Retake</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} variant="hero" className="w-full min-h-[48px] rounded-xl" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ProfilePage;
