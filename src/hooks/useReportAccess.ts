import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useReportAccess() {
  const { user } = useAuth();
  const isPremium = user?.subscriptionStatus === "premium";

  // Check if user has purchased the PDF in the last 7 days
  const { data: hasPurchasedPDF, refetch: refetchPurchase, isLoading } = useQuery({
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

  return {
    canViewReport: isPremium,
    canDownloadPDF: hasPurchasedPDF || false,
    isPremium,
    isLoading,
    refetchPurchase,
  };
}
