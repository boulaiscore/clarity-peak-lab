import { useState } from "react";
import { TRAINING_PLANS, TrainingPlanId, TrainingPlan } from "@/lib/trainingPlans";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrainingPlanSelectorProps {
  selectedPlan: TrainingPlanId;
  onSelectPlan: (plan: TrainingPlanId) => void;
  showDetails?: boolean;
}

export function TrainingPlanSelector({ selectedPlan, onSelectPlan, showDetails = true }: TrainingPlanSelectorProps) {
  const [expandedPlan, setExpandedPlan] = useState<TrainingPlanId | null>(null);
  const plans = Object.values(TRAINING_PLANS) as TrainingPlan[];

  return (
    <div className="space-y-6">
      {/* Period note */}
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
        Progress tracked on a rolling 7-day window. Switch any time — your metrics adapt.
      </p>

      {/* Plans list */}
      <div className="rounded-2xl bg-card/40 border border-border/30 divide-y divide-border/30 overflow-hidden">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isExpanded = expandedPlan === plan.id;

          return (
            <div key={plan.id}>
              {/* Row */}
              <button
                onClick={() => onSelectPlan(plan.id)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4 text-left transition-colors",
                  isSelected ? "bg-foreground/[0.03]" : "hover:bg-foreground/[0.02]"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-medium tracking-tight text-foreground">
                      {plan.name.replace(" Training", "")}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground/80 mt-0.5 truncate">
                    {plan.dailyEstimate.total} · {plan.sessionsPerWeek}× per week
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-foreground border-foreground"
                        : "border-border/60"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
                  </div>
                </div>
              </button>

              {/* Details toggle */}
              {showDetails && (
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  className="w-full flex items-center justify-between px-5 py-2.5 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors border-t border-border/20"
                >
                  <span className="uppercase tracking-[0.1em]">
                    {isExpanded ? "Hide details" : "View details"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>
              )}

              {/* Expanded details */}
              {showDetails && isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-4 bg-foreground/[0.015]">
                  {/* Tagline */}
                  <p className="text-[12px] text-foreground/80 leading-relaxed italic">
                    {plan.tagline}
                  </p>

                  {/* What you do */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60">
                      Protocol
                    </p>
                    <ul className="space-y-1">
                      {plan.whatYouDo.map((item, i) => (
                        <li key={i} className="text-[12px] text-foreground/85 leading-snug pl-3 relative">
                          <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-muted-foreground/50" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-px bg-border/30 rounded-lg overflow-hidden">
                    <Stat label="XP / week" value={String(plan.xpTargetWeek)} />
                    <Stat label="Recovery" value={`${Math.round(plan.detox.weeklyMinutes / 60)}h`} />
                    <Stat label="Tasks" value={`${plan.contentPerWeek}/wk`} />
                  </div>

                  {/* S2 gating */}
                  <div className="text-[11px] text-muted-foreground/80 leading-relaxed">
                    <span className="text-foreground/70 font-medium">S2 access:</span>{" "}
                    {plan.gatingExplainer.s2Requirement} · {plan.gatingExplainer.prerequisiteForS2}
                  </div>

                  {/* Best for */}
                  <p className="text-[11px] text-muted-foreground/70">
                    <span className="text-foreground/70">Best for:</span> {plan.forWhom}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card/60 px-3 py-2.5 text-center">
      <p className="text-[13px] font-medium text-foreground tracking-tight">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60 mt-0.5">{label}</p>
    </div>
  );
}
