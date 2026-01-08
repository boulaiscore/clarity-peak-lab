import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCappedWeeklyProgress } from "@/hooks/useCappedWeeklyProgress";

export function useReportAccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPremium = user?.subscriptionStatus === "premium";

  // Get weekly progress to check if plan is complete
  const { 
    allCategoriesComplete, 
    totalProgress, 
    cappedTotalXP, 
    totalXPTarget,
    isLoading: progressLoading 
  } = useCappedWeeklyProgress();

  // Get user's report credits from profile
  const { data: reportCredits, refetch: refetchCredits, isLoading: creditsLoading } = useQuery({
    queryKey: ["report-credits", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("report_credits")
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching report credits:", error);
        return 0;
      }
      
      return (data as { report_credits?: number })?.report_credits ?? 0;
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

  // Mutation to use a credit
  const useCredit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      if ((reportCredits || 0) < 1) throw new Error("No credits available");

      const { error } = await supabase
        .from("profiles")
        .update({ report_credits: (reportCredits || 0) - 1 })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-credits", user?.id] });
    },
  });

  const hasCreditsOrPurchase = (reportCredits || 0) > 0 || hasPurchasedPDF;
  const weeklyPlanCompleted = allCategoriesComplete;
  
  // Can download only if: has credits/purchase AND weekly plan is completed
  const canDownload = hasCreditsOrPurchase && weeklyPlanCompleted;
  
  // XP remaining to complete weekly plan
  const xpRemaining = Math.max(0, totalXPTarget - cappedTotalXP);

  return {
    canViewReport: isPremium,
    canDownloadPDF: canDownload,
    reportCredits: reportCredits || 0,
    isPremium,
    isLoading: creditsLoading || purchaseLoading || progressLoading,
    weeklyPlanCompleted,
    weeklyProgress: totalProgress,
    xpRemaining,
    hasCreditsOrPurchase,
    refetchPurchase: () => {
      refetchCredits();
      refetchPurchase();
    },
    useCredit,
  };
}
