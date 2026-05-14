/**
 * Recovery Breakdown — WHOOP-style detail screen
 *
 * Visible when tapping the Recovery monitor card on Home.
 * Surfaces the Phone Health Index (PHI) sources, the dynamic
 * REC target for tonight, and today's cognitive recovery actions.
 */

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Footprints, Flame, Smartphone, Clock } from "lucide-react";
import { useRecoveryV2 } from "@/hooks/useRecoveryV2";
import { useTodayPhoneHealthSnapshot } from "@/hooks/usePhoneHealthSync";
import { useTodayActivities } from "@/hooks/useTodayActivities";
import { computeSubScores, computePHI, type PhoneHealthInputs } from "@/lib/phoneHealth";

function fmtMinutes(min: number | null | undefined): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function Bar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-foreground/[0.08] overflow-hidden">
      <div
        className="h-full bg-recovery rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface SourceRowProps {
  icon: React.ReactNode;
  label: string;
  raw: string;
  score: number;
  contribution?: string;
  penalty?: boolean;
}

function SourceRow({ icon, label, raw, score, contribution, penalty }: SourceRowProps) {
  return (
    <div className="py-3 border-b border-border/30 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 flex items-center justify-center text-muted-foreground/80">
            {icon}
          </span>
          <span className="text-[13px] font-medium text-foreground/90">{label}</span>
        </div>
        <span className="text-[12px] tabular-nums text-foreground/70">{raw}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Bar value={score} />
        </div>
        <span
          className={`text-[10px] tabular-nums w-12 text-right ${
            penalty ? "text-amber-400/80" : "text-foreground/60"
          }`}
        >
          {contribution ?? `${Math.round(score)}/100`}
        </span>
      </div>
    </div>
  );
}

export default function RecoveryBreakdown() {
  const navigate = useNavigate();
  const { recovery } = useRecoveryV2();
  const { data: snapshot } = useTodayPhoneHealthSnapshot();
  const { detoxMinutes, walkingMinutes } = useTodayActivities();

  const inputs: PhoneHealthInputs = {
    sleepMin: snapshot?.sleep_min ?? null,
    bedtimeDevMin: snapshot?.bedtime_dev_min ?? null,
    steps: snapshot?.steps ?? null,
    activeMin: snapshot?.active_min ?? null,
    pickups: snapshot?.pickups ?? null,
  };
  const sub = computeSubScores(inputs);
  const result = computePHI(inputs);

  const detoxBoost = Math.round(0.12 * (detoxMinutes ?? 0) * 10) / 10;
  const walkBoost = Math.round(0.06 * (walkingMinutes ?? 0) * 10) / 10;

  const coachLine = (() => {
    if (!result.hasData) {
      return "Connect Apple Health or Health Connect to unlock a personalized recovery target.";
    }
    if (sub.sleep < 50) return "Short sleep capped your recovery. Aim for 7h+ tonight.";
    if (sub.steps < 30 && sub.active < 30)
      return "Light activity day. A 20-min walk would lift tomorrow's target.";
    if (result.phi > 70) return "Strong physical baseline. Add a detox session to push REC higher.";
    return "Steady baseline. Detox or walk to boost recovery within the day.";
  })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Today
        </button>

        {/* Hero */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Recovery
          </div>
          <div className="text-[64px] font-light leading-none tabular-nums text-recovery">
            {recovery != null ? Math.round(recovery) : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            of 100
          </div>
        </div>

        {/* Sources */}
        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-[0.16em] text-foreground/60 mb-2">
            Sources
          </h2>
          <div className="rounded-xl bg-card/40 border border-border/40 px-4">
            <SourceRow
              icon={<Moon className="w-4 h-4" />}
              label="Sleep"
              raw={fmtMinutes(snapshot?.sleep_min ?? null)}
              score={sub.sleep}
            />
            <SourceRow
              icon={<Clock className="w-4 h-4" />}
              label="Consistency"
              raw={
                snapshot?.bedtime_dev_min != null
                  ? `±${Math.round(snapshot.bedtime_dev_min)} min`
                  : "—"
              }
              score={sub.consistency}
            />
            <SourceRow
              icon={<Footprints className="w-4 h-4" />}
              label="Steps"
              raw={
                snapshot?.steps != null
                  ? snapshot.steps.toLocaleString()
                  : "—"
              }
              score={sub.steps}
            />
            <SourceRow
              icon={<Flame className="w-4 h-4" />}
              label="Active minutes"
              raw={
                snapshot?.active_min != null
                  ? `${Math.round(snapshot.active_min)} min`
                  : "—"
              }
              score={sub.active}
            />
            {snapshot?.pickups != null && (
              <SourceRow
                icon={<Smartphone className="w-4 h-4" />}
                label="Phone pickups"
                raw={`${snapshot.pickups}`}
                score={sub.pickupPenalty}
                contribution={`−${Math.round(sub.pickupPenalty * 0.1)}`}
                penalty
              />
            )}
          </div>
        </div>

        {/* PHI summary */}
        <div className="rounded-xl bg-card/40 border border-border/40 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-muted-foreground">Phone Health Index</span>
            <span className="text-[14px] font-semibold tabular-nums text-foreground">
              {result.hasData ? result.phi.toFixed(0) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Target REC tonight</span>
            <span className="text-[14px] font-semibold tabular-nums text-recovery">
              {result.targetRec.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Cognitive actions */}
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.16em] text-foreground/60 mb-2">
            Today's recovery actions
          </h2>
          <div className="rounded-xl bg-card/40 border border-border/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-foreground/85">Detox</span>
              <span className="tabular-nums text-foreground/70">
                {detoxMinutes ?? 0} min
                <span className="ml-2 text-recovery">+{detoxBoost.toFixed(1)}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-foreground/85">Walk</span>
              <span className="tabular-nums text-foreground/70">
                {walkingMinutes ?? 0} min
                <span className="ml-2 text-recovery">+{walkBoost.toFixed(1)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Coach */}
        <p className="text-[12px] leading-relaxed text-muted-foreground italic px-1">
          {coachLine}
        </p>

        {!result.hasData && (
          <button
            onClick={() => navigate("/app/wearable")}
            className="mt-6 w-full py-3 rounded-xl bg-recovery/15 border border-recovery/30 text-recovery text-[13px] font-medium hover:bg-recovery/20 transition-colors"
          >
            Enable Health access
          </button>
        )}
      </div>
    </div>
  );
}
