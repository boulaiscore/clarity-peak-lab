import { useNavigate } from "react-router-dom";
import { Zap, ChevronRight } from "lucide-react";

/**
 * Recharging Card - Entry point for the Recharging feature
 * Displayed in the NeuroLab page
 */
export function RechargingCard() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/recharging")}
      className="w-full p-4 rounded-xl bg-muted/30 border border-border/40 text-left transition-all duration-200 hover:bg-muted/50 hover:border-border/60 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-0.5">
              Recharging
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Restore reasoning clarity after cognitive overload.
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
      </div>
    </button>
  );
}
