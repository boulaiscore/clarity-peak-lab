import { motion } from "framer-motion";
import { ChevronRight, Brain, BookOpen, Headphones, Wind, Footprints } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTodayActivities, ActivityKey, TodayActivity } from "@/hooks/useTodayActivities";
import { cn } from "@/lib/utils";

const ROUTES: Record<ActivityKey, string> = {
  games: "/app/training",
  quality: "/app/quality-time",
  detox: "/app/recover",
  walk: "/app/recover",
};

// WHOOP-style flat blue tiles. One accent per category — calm, monochrome family.
const ACCENT: Record<ActivityKey, string> = {
  games: "hsl(210, 90%, 58%)",
  quality: "hsl(207, 55%, 60%)",
  detox: "hsl(195, 60%, 55%)",
  walk: "hsl(180, 45%, 55%)",
};

const ICON: Record<ActivityKey, React.ComponentType<{ className?: string }>> = {
  games: Brain,
  quality: BookOpen,
  detox: Wind,
  walk: Footprints,
};

interface TodayActivitiesCardProps {
  outlook: { label: string; line: string };
}

function formatTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")}${ampm}`;
}

/**
 * WHOOP-style end-of-day summary: each row is a completed session today,
 * with a flat colored value tile, UPPERCASE label, and start/end timestamps.
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
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground mb-2.5 px-0.5">
        Today
      </h2>

      {/* Daily Outlook */}
      <button
        onClick={() => navigate("/app/dashboard")}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-2xl mb-2.5",
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

      {/* End-of-day session list */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[68px] rounded-2xl bg-card/30 border border-border/30 animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl bg-card/40 border border-border/40 px-4 py-6 text-center">
          <p className="text-[12px] text-muted-foreground/80">
            No activities recorded yet today.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <ActivityRow key={a.id} activity={a} onClick={() => navigate(ROUTES[a.key])} />
          ))}
        </div>
      )}
    </motion.section>
  );
}

function ActivityRow({ activity, onClick }: { activity: TodayActivity; onClick: () => void }) {
  const accent = ACCENT[activity.key];
  const Icon = ICON[activity.key];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 pr-3 rounded-2xl text-left",
        "bg-card/40 border border-border/40 hover:bg-card/60 hover:border-border/60",
        "transition-colors active:scale-[0.995]",
      )}
    >
      {/* Left: solid value tile */}
      <div
        className="relative w-[68px] h-[52px] rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent }}
      >
        <Icon className="absolute left-2 top-2 w-3.5 h-3.5 text-white/85" />
        <span className="text-[20px] font-bold leading-none tabular-nums text-white">
          {activity.tileValue}
        </span>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-foreground/95 leading-tight truncate">
          {activity.label}
        </p>
      </div>

      {/* Right: timestamps */}
      <div className="flex flex-col items-end leading-tight tabular-nums flex-shrink-0">
        <span className="text-[11px] text-foreground/75">{formatTime(activity.endedAt)}</span>
        <span className="text-[11px] text-muted-foreground/70 mt-0.5">{formatTime(activity.startedAt)}</span>
      </div>
    </button>
  );
}
