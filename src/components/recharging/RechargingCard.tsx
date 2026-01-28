import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Fast Charge Card - Entry point for the cognitive reset feature
 * Displayed in the NeuroLab page
 */
export function RechargingCard() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/recharging")}
      className="w-full p-4 rounded-xl bg-muted/30 border border-border/40 text-left transition-all duration-200 hover:bg-muted/50 hover:border-border/60 active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-0.5">
            Fast Charge
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Restore reasoning clarity after cognitive overload.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
}
