import { TRAINING_PLANS, TrainingPlanId, TrainingPlan } from "@/lib/trainingPlans";
import { cn } from "@/lib/utils";

const PLAN_ESSENCE: Record<TrainingPlanId, string> = {
  light: "Light maintenance. Mostly fast, intuitive drills.",
  expert: "Balanced regimen. Intuition and deliberate reasoning.",
  superhuman: "Peak load. Heavy deliberate reasoning, strict recovery.",
};

type PlanSpec = { label: string; value: string };

const PLAN_SPECS: Record<TrainingPlanId, PlanSpec[]> = {
  light: [
    { label: "Volume", value: "4–5 games / week" },
    { label: "Focus", value: "System 1 (intuitive)" },
    { label: "Reasoning", value: "Up to 4 S2 / week" },
    { label: "Unlock", value: "Recovery ≥ 50%" },
    { label: "Recovery", value: "8h / week" },
    { label: "Tasks", value: "Optional" },
  ],
  expert: [
    { label: "Volume", value: "6–7 games / week" },
    { label: "Focus", value: "S1 + S2 balanced" },
    { label: "Reasoning", value: "Up to 7 S2 / week" },
    { label: "Recovery", value: "14h / week" },
    { label: "Tasks", value: "2 / week" },
  ],
  superhuman: [
    { label: "Volume", value: "8–10 games / week" },
    { label: "Focus", value: "Heavy System 2" },
    { label: "Reasoning", value: "Up to 10 S2 / week" },
    { label: "Unlock", value: "Recovery ≥ 55%" },
    { label: "Recovery", value: "28h / week" },
    { label: "Tasks", value: "3 mandatory / week" },
  ],
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
                <div className="text-[12px] text-muted-foreground/70 mt-1.5 leading-snug tracking-tight">
                  {PLAN_ESSENCE[plan.id]}
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

      {/* Selected plan: clean spec sheet */}
      <div className="space-y-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
            {current.name.replace(" Training", "")} · Specs
          </p>
          <p className="text-[10px] tracking-tight text-muted-foreground/50">
            {current.dailyEstimate.total} · {current.xpTargetWeek} XP / wk
          </p>
        </div>

        <dl className="divide-y divide-border/20">
          {PLAN_SPECS[selectedPlan].map((spec) => (
            <div key={spec.label} className="flex items-center justify-between py-2.5">
              <dt className="text-[12px] text-muted-foreground/70 tracking-tight">
                {spec.label}
              </dt>
              <dd className="text-[12.5px] text-foreground/90 tracking-tight font-normal">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-[10px] text-muted-foreground/40 leading-relaxed pt-2">
        Tracked on a rolling 7-day window. Switch any time — metrics adapt automatically.
      </p>
    </div>
  );
}
