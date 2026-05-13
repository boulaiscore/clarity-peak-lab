import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayActivities, ActivityKey } from "@/hooks/useTodayActivities";
import { TRAINING_PLANS, TrainingPlanId } from "@/lib/trainingPlans";
import { cn } from "@/lib/utils";

const ROUTES: Record<ActivityKey, string> = {
  games: "/app/training",
  quality: "/app/quality-time",
  detox: "/app/recover",
  walk: "/app/recover",
};

// Brand-aligned accents (HSL semantic — matches metric palette memory)
const ACCENT: Record<ActivityKey, string> = {
  games: "hsl(210, 100%, 60%)", // Sharpness blue
  quality: "hsl(207, 44%, 62%)", // Reasoning steel blue
  detox: "hsl(170, 60%, 50%)", // Recovery teal
  walk: "hsl(160, 55%, 55%)", // Recovery green
};

interface TodayActivitiesCardProps {
  outlook: { label: string; line: string };
}

/**
 * WHOOP-inspired "My Day" — planned activities driven by the user's training plan.
 * Each row: colored square tile (value + unit) · UPPERCASE label · progress vs target · chevron.
 */
export function TodayActivitiesCard({ outlook }: TodayActivitiesCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const planId: TrainingPlanId = (user?.trainingPlan || "expert") as TrainingPlanId;
  const plan = TRAINING_PLANS[planId];
  const { data: activities = [], isLoading } = useTodayActivities();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mb-5"
    >
      {/* Section title */}
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground mb-2.5 px-0.5">
        My Day
      </h2>

      {/* Daily Outlook compact card */}
      <button
        onClick={() => navigate("/app/dashboard")}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-2xl mb-2",
          "bg-card/40 border border-border/40 hover:bg-card/60 hover:border-border/60",
          "transition-colors active:scale-[0.99] text-left",
        )}
      >
        <div className="w-7 h-7 rounded-lg bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-semibold tracking-wider text-foreground/80">L</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/55 mb-0.5">
            Daily Outlook
          </p>
          <p className="text-[12px] font-medium text-foreground/90 truncate">{outlook.line}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
      </button>

      {/* Today's Activities — WHOOP-style rows */}
      <div className="rounded-2xl bg-card/40 border border-border/40 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border/40 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/55">
            Today's Activities
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/40">
            {plan?.name ?? "Plan"}
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {activities.map((a) => {
            const accent = ACCENT[a.key];
            return (
              <button
                key={a.key}
                onClick={() => navigate(ROUTES[a.key])}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left",
                  "hover:bg-foreground/[0.03] transition-colors active:scale-[0.995]",
                )}
              >
                {/* Left tile — value + unit, WHOOP square */}
                <div
                  className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: a.hasActivity ? `${accent}26` : `${accent}12`,
                    border: `1px solid ${accent}${a.hasActivity ? "55" : "22"}`,
                  }}
                >
                  <span
                    className="text-[15px] font-bold leading-none tabular-nums"
                    style={{ color: a.hasActivity ? accent : `${accent}AA` }}
                  >
                    {isLoading ? "—" : a.tileValue}
                  </span>
                  <span
                    className="text-[8px] font-semibold uppercase tracking-[0.1em] mt-0.5"
                    style={{ color: a.hasActivity ? accent : `${accent}88` }}
                  >
                    {a.tileUnit}
                  </span>
                </div>

                {/* Label + progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground/90 leading-tight">
                    {a.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">
                    {a.progress}
                  </p>
                </div>

                {/* Status pill */}
                <span
                  className={cn(
                    "text-[9px] font-semibold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md",
                    a.complete
                      ? "bg-foreground/[0.08] text-foreground/85"
                      : a.hasActivity
                      ? "bg-foreground/[0.04] text-foreground/55"
                      : "text-muted-foreground/40",
                  )}
                >
                  {a.complete ? "Done" : a.hasActivity ? "In progress" : "Pending"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
