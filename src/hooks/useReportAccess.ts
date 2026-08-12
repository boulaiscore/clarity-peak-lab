import { useSubscription } from "@/hooks/useSubscription";
import { canExportReports, canViewPerformanceReport } from "@/lib/entitlements";

/**
 * The performance report is an Elite deliverable.
 *
 * It is intentionally independent from the former report-credit and weekly-XP
 * gates: the report summarizes the user's longitudinal state, passive context,
 * recovery and training response, so completing a Lab quota is not a valid
 * prerequisite for viewing it.
 */
export function useReportAccess() {
  const subscription = useSubscription();
  const hasEliteAccess = canViewPerformanceReport(subscription.tier);

  return {
    canViewReport: hasEliteAccess,
    canDownloadPDF: hasEliteAccess && canExportReports(subscription.tier),
    isElite: subscription.isElite,
    subscriptionStatus: subscription.tier,
    isLoading: subscription.loading,
  };
}
