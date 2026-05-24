import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { useSubscription } from "@/hooks/useSubscription";

export function useReportAccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Single source of truth from Paddle subscription state.
  const { tier, isPro, isElite, isActive } = useSubscription();
  const isPremium = isActive; // any paid plan

  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];

  const {
    allCategoriesComplete,
    totalProgress,
    cappedTotalXP,
    totalXPTarget,
    isLoading: progressLoading,
  } = useCappedWeeklyProgress();

  const { data: profileData, refetch: refetchCredits, isLoading: creditsLoading } = useQuery({
    queryKey: ["report-credits", user?.id],
    queryFn: async () => {
      if (!user?.id) return { reportCredits: 0, monthlyCredits: 0 };
      const { data, error } = await supabase
        .from("profiles")
        .select("report_credits, monthly_report_credits")
        .eq("user_id", user.id)
        .single();
      if (error) {
        console.error("Error fetching report credits:", error);
        return { reportCredits: 0, monthlyCredits: 0 };
      }
      return {
        reportCredits: (data as { report_credits?: number })?.report_credits ?? 0,
        monthlyCredits: (data as { monthly_report_credits?: number })?.monthly_report_credits ?? 0,
      };
    },
    enabled: !!user?.id,
  });

  const { data: hasPurchasedPDF, refetch: refetchPurchase, isLoading: purchaseLoading } = useQuery({
    queryKey: ["report-purchase", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data, error } = await supabase
        .from("report_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("purchased_at", sevenDaysAgo.toISOString())
        .limit(1);
      if (error) return false;
      return data && data.length > 0;
    },
    enabled: !!user?.id,
  });

  const reportCredits = profileData?.reportCredits || 0;
  const monthlyCredits = profileData?.monthlyCredits || 0;

  const useCredit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      // Elite: unlimited on-demand reports.
      if (isElite) return;
      // Pro: consume monthly credit, fall back to purchased.
      if (isPro && monthlyCredits > 0) {
        const { error } = await supabase
          .from("profiles")
          .update({ monthly_report_credits: monthlyCredits - 1 })
          .eq("user_id", user.id);
        if (error) throw error;
      } else if (reportCredits > 0) {
        const { error } = await supabase
          .from("profiles")
          .update({ report_credits: reportCredits - 1 })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        throw new Error("No credits available");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-credits", user?.id] });
    },
  });

  const weeklyPlanCompleted = allCategoriesComplete;

  let canDownload = false;
  let hasCreditsOrPurchase = false;

  if (isElite) {
    canDownload = weeklyPlanCompleted;
    hasCreditsOrPurchase = true;
  } else if (isPro) {
    hasCreditsOrPurchase = monthlyCredits > 0 || reportCredits > 0 || hasPurchasedPDF;
    canDownload = hasCreditsOrPurchase && weeklyPlanCompleted;
  } else {
    hasCreditsOrPurchase = reportCredits > 0 || hasPurchasedPDF;
    canDownload = hasCreditsOrPurchase && weeklyPlanCompleted;
  }

  const xpRemaining = Math.max(0, totalXPTarget - cappedTotalXP);

  return {
    canViewReport: isPremium,
    canDownloadPDF: canDownload,
    reportCredits,
    monthlyCredits,
    isPremium,
    isPro,
    isElite,
    subscriptionStatus: tier,
    isLoading: creditsLoading || purchaseLoading || progressLoading,
    weeklyPlanCompleted,
    weeklyProgress: totalProgress,
    xpRemaining,
    hasCreditsOrPurchase,
    planName: plan.name,
    planXPTarget: totalXPTarget,
    currentXP: cappedTotalXP,
    refetchPurchase: () => {
      refetchCredits();
      refetchPurchase();
    },
    useCredit,
  };
}
