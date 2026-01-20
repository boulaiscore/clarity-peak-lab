import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";

export function useReportAccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionStatus = user?.subscriptionStatus || "free";
  const isPremium = subscriptionStatus === "premium" || subscriptionStatus === "pro";
  const isPro = subscriptionStatus === "pro";
  
  // Get user's training plan info
  const planId = (user?.trainingPlan || "light") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];

  // Get weekly progress to check if plan is complete
  const { 
    allCategoriesComplete, 
    totalProgress, 
    cappedTotalXP, 
    totalXPTarget,
    isLoading: progressLoading 
  } = useCappedWeeklyProgress();

  // Get user's report credits and monthly credits from profile
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

  // Check if user has purchased the PDF in the last 7 days (legacy check)
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
      
      if (error) {
        console.error("Error checking report purchase:", error);
        return false;
      }
      
      return data && data.length > 0;
    },
    enabled: !!user?.id,
  });

  const reportCredits = profileData?.reportCredits || 0;
  const monthlyCredits = profileData?.monthlyCredits || 0;

  // Mutation to use a credit (monthly for Premium, purchased for all)
  const useCredit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      // Pro users don't need credits
      if (isPro) return;
      
      // Premium users use monthly credits first, then purchased credits
      if (subscriptionStatus === "premium" && monthlyCredits > 0) {
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
  
  // Determine if user can download based on tier
  let canDownload = false;
  let hasCreditsOrPurchase = false;

  if (isPro) {
    // Pro: unlimited reports, only need weekly plan completed
    canDownload = weeklyPlanCompleted;
    hasCreditsOrPurchase = true; // Always "has access" for Pro
  } else if (subscriptionStatus === "premium") {
    // Premium: needs monthly credit or purchased credits + weekly plan
    hasCreditsOrPurchase = monthlyCredits > 0 || reportCredits > 0 || hasPurchasedPDF;
    canDownload = hasCreditsOrPurchase && weeklyPlanCompleted;
  } else {
    // Free: needs purchased credits + weekly plan
    hasCreditsOrPurchase = reportCredits > 0 || hasPurchasedPDF;
    canDownload = hasCreditsOrPurchase && weeklyPlanCompleted;
  }
  
  // XP remaining to complete weekly plan
  const xpRemaining = Math.max(0, totalXPTarget - cappedTotalXP);

  return {
    canViewReport: isPremium,
    canDownloadPDF: canDownload,
    reportCredits,
    monthlyCredits,
    isPremium,
    isPro,
    subscriptionStatus,
    isLoading: creditsLoading || purchaseLoading || progressLoading,
    weeklyPlanCompleted,
    weeklyProgress: totalProgress,
    xpRemaining,
    hasCreditsOrPurchase,
    // Plan info for UI
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
