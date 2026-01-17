import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw, CreditCard, Zap, RotateCcw } from "lucide-react";
import { AdminUserOverview } from "@/hooks/useAdminUsers";

interface AdminActionsProps {
  user: AdminUserOverview;
  onUpdate: () => void;
}

export function AdminActions({ user, onUpdate }: AdminActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newSubscription, setNewSubscription] = useState(user.subscription_status || "free");
  const [creditsToAdd, setCreditsToAdd] = useState("1");

  const handleUpdateSubscription = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_status: newSubscription })
        .eq("user_id", user.user_id);

      if (error) throw error;
      
      toast.success(`Subscription updated to ${newSubscription}`);
      onUpdate();
    } catch (err) {
      console.error("Error updating subscription:", err);
      toast.error("Failed to update subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredits = async () => {
    const credits = parseInt(creditsToAdd, 10);
    if (isNaN(credits) || credits < 1) {
      toast.error("Invalid credits amount");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ report_credits: (user.report_credits || 0) + credits })
        .eq("user_id", user.user_id);

      if (error) throw error;
      
      toast.success(`Added ${credits} report credits`);
      onUpdate();
    } catch (err) {
      console.error("Error adding credits:", err);
      toast.error("Failed to add credits");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAssessment = async () => {
    if (!confirm("Are you sure? This will reset all cognitive metrics and require the user to redo calibration.")) {
      return;
    }

    setIsLoading(true);
    try {
      // Reset onboarding and metrics
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: false })
        .eq("user_id", user.user_id);

      if (profileError) throw profileError;

      // Delete cognitive metrics
      const { error: metricsError } = await supabase
        .from("user_cognitive_metrics")
        .delete()
        .eq("user_id", user.user_id);

      if (metricsError) throw metricsError;
      
      toast.success("Assessment reset successfully");
      onUpdate();
    } catch (err) {
      console.error("Error resetting assessment:", err);
      toast.error("Failed to reset assessment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Management */}
        <div className="space-y-3">
          <Label>Change Subscription</Label>
          <div className="flex gap-2">
            <Select value={newSubscription} onValueChange={setNewSubscription}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleUpdateSubscription}
              disabled={isLoading || newSubscription === user.subscription_status}
            >
              <Zap className="w-4 h-4 mr-1" />
              Update
            </Button>
          </div>
        </div>

        {/* Add Credits */}
        <div className="space-y-3">
          <Label>Add Report Credits</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={creditsToAdd}
              onChange={(e) => setCreditsToAdd(e.target.value)}
              className="w-24"
            />
            <Button onClick={handleAddCredits} disabled={isLoading}>
              <CreditCard className="w-4 h-4 mr-1" />
              Add Credits
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current credits: {user.report_credits ?? 0}
          </p>
        </div>

        {/* Reset Assessment */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-destructive">Danger Zone</Label>
          <Button
            variant="destructive"
            onClick={handleResetAssessment}
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset Assessment
          </Button>
          <p className="text-xs text-muted-foreground">
            Resets cognitive metrics and requires user to redo calibration
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
