import { AlertTriangle, ExternalLink } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";

export function PastDueBanner() {
  const { isPastDue } = useSubscription();
  if (!isPastDue) return null;

  const openPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("paddle-customer-portal", {
        body: { environment: getPaddleEnvironment() },
      });
      if (error || !data?.url) throw new Error(data?.error || error?.message || "");
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Could not open billing portal");
    }
  };

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-center gap-3 text-xs">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="text-amber-100/90">
        Your last payment failed. Update your payment method to keep your access.
      </span>
      <button
        onClick={openPortal}
        className="inline-flex items-center gap-1 font-medium text-amber-200 hover:text-white underline underline-offset-2"
      >
        Update payment
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}
