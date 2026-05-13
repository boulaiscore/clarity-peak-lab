import { motion } from "framer-motion";
import { ChevronRight, Brain, BookOpen, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTodayActivities } from "@/hooks/useTodayActivities";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  train: Brain as any,
  quality: BookOpen as any,
  recover: Wind as any,
};

const ROUTES: Record<string, string> = {
  train: "/app/training",
  quality: "/app/quality-time",
  recover: "/app/recover",
};

const ACCENTS: Record<string, string> = {
  train: "hsl(210, 100%, 60%)",
  quality: "hsl(207, 44%, 62%)",
  recover: "hsl(170, 60%, 50%)",
};

interface TodayActivitiesCardProps {
  outlook: { label: string; line: string };
}

/**
 * WHOOP-inspired "My Day" section.
 * - Daily Outlook header
 * - Today's activities row list (Train, Quality Time, Recover)
 */
export function TodayActivitiesCard({ outlook }: TodayActivitiesCardProps) {
  const navigate = useNavigate();
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

      {/* Today's Activities */}
      <div className="rounded-2xl bg-card/40 border border-border/40 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border/40 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/55">
            Today's Activities
          </span>
        </div>
        <div className="divide-y divide-border/40">
          {activities.map((a) => {
            const Icon = ICONS[a.key];
            const accent = ACCENTS[a.key];
            const empty = a.sessions === 0;
            return (
              <button
                key={a.key}
                onClick={() => navigate(ROUTES[a.key])}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left",
                  "hover:bg-foreground/[0.03] transition-colors active:scale-[0.995]",
                )}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accent}1F` }}
                >
                  <Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground/90 leading-tight">
                    {a.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {empty
                      ? "No session yet"
                      : `${a.sessions} session${a.sessions > 1 ? "s" : ""} · ${formatMinutes(a.minutes)}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-[12px] font-semibold tabular-nums tracking-tight",
                    empty ? "text-muted-foreground/50" : "text-foreground/85",
                  )}
                >
                  {isLoading ? "—" : empty ? "0m" : formatMinutes(a.minutes)}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function formatMinutes(m: number): string {
  if (m < 1) return "0m";
  if (m < 60) return `${Math.round(m)}m`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}
