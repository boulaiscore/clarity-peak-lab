import { TRAINING_PLANS, TrainingPlanId, TrainingPlan } from "@/lib/trainingPlans";
import { cn } from "@/lib/utils";

const PRACTICAL_DESCRIPTIONS: Record<TrainingPlanId, string> = {
  light:
    "1 short game per day, mostly fast intuitive (System 1). Deep reasoning unlocks only when recovered. Best to keep cognition stable without pressure.",
  expert:
    "1–2 games per day balancing fast reactions and deliberate reasoning. Adds 2 weekly tasks to build Reasoning Quality. The standard performance regimen.",
  superhuman:
    "2–3 intensive games per day with frequent System 2 reasoning. Requires 28h/week of recovery and 3 mandatory tasks. Built for peak cognitive output.",
};


interface TrainingPlanSelectorProps {
  selectedPlan: TrainingPlanId;
  onSelectPlan: (plan: TrainingPlanId) => void;
  showDetails?: boolean;
}

export function TrainingPlanSelector({ selectedPlan, onSelectPlan }: TrainingPlanSelectorProps) {
  const plans = Object.values(TRAINING_PLANS) as TrainingPlan[];
  const current = TRAINING_PLANS[selectedPlan];

  return (
    <div className="space-y-8">
      {/* Plans list — pure monochrome rows */}
      <div className="divide-y divide-border/30 border-y border-border/30">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className="w-full flex items-center justify-between py-5 text-left group"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-[15px] font-normal tracking-tight text-foreground">
                  {plan.name.replace(" Training", "")}
                </div>
                <div className="text-[12px] text-muted-foreground/80 mt-1.5 leading-snug tracking-tight">
                  {PRACTICAL_DESCRIPTIONS[plan.id]}
                </div>
                <div className="text-[11px] text-muted-foreground/50 mt-2 tracking-tight">
                  {plan.dailyEstimate.total} · {plan.sessionsPerWeek}× / week · {plan.xpTargetWeek} XP
                </div>
              </div>
              <div
                className={cn(
                  "ml-4 w-[18px] h-[18px] rounded-full border transition-colors shrink-0",
                  isSelected
                    ? "border-foreground bg-foreground"
                    : "border-border/60 group-hover:border-foreground/40"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Single contextual detail for the selected plan */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
          About {current.name.replace(" Training", "")}
        </p>
        <p className="text-[13px] text-foreground/85 leading-relaxed">
          {current.tagline}
        </p>
        <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
          {current.gatingExplainer.s2Requirement}.
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed pt-2">
        Tracked on a rolling 7-day window. Switch any time — metrics adapt automatically.
      </p>
    </div>
  );
}
