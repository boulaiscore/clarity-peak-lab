import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import {
  MetricDetailHeader,
  MetricInterpretationNote,
  MetricDetailNavigation,
  MetricFactorCard,
  MetricFactorsSection,
  MetricScoreRing,
} from "@/components/metrics/MetricDetail";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCognitiveStates } from "@/hooks/useCognitiveStates";
import { useReasoningQuality } from "@/hooks/useReasoningQuality";
import { getReasoningQualityStatus } from "@/lib/metricStatusLabels";
import { METRIC_COLORS } from "@/lib/metricColors";
import { TASK_TYPE_WEIGHTS } from "@/lib/reasoningQuality";
import { cn } from "@/lib/utils";

interface ImpactDriver {
  id: string;
  code: string;
  name: string;
  value: number | string | null;
  weight: string;
  contribution: number;
  window: string;
  description: string;
  estimated?: boolean;
  tone?: "default" | "negative" | "muted";
  note: string;
}

export default function ReasoningQualityImpact() {
  const {
    rq,
    s2Consistency,
    taskPriming,
    s2ConsistencyContribution,
    taskPrimingContribution,
    s2SessionCount,
    decay,
    isDecaying,
    taskBreakdown,
    isLoading,
  } = useReasoningQuality();
  const { states } = useCognitiveStates();
  const [selectedDriver, setSelectedDriver] = useState<ImpactDriver | null>(null);

  const CT = states.CT;
  const IN = states.IN;
  const consistencyIsEstimated = s2SessionCount < 5;

  const drivers = useMemo<ImpactDriver[]>(() => {
    const taskCount =
      taskBreakdown.podcastCount + taskBreakdown.articleCount + taskBreakdown.bookCount;
    const rows: ImpactDriver[] = [
      {
        id: "ct",
        code: "CT",
        name: "Critical Thinking",
        value: CT,
        weight: "25%",
        contribution: 0.25 * CT,
        window: "Current skill state",
        description: "Analytical accuracy and evaluation of evidence.",
        note: "CT supplies half of S2 Core. Since S2 Core is 50% of RQ, CT contributes 25% of the final score.",
      },
      {
        id: "in",
        code: "IN",
        name: "Insight",
        value: IN,
        weight: "25%",
        contribution: 0.25 * IN,
        window: "Current skill state",
        description: "Pattern recognition and useful conceptual connections.",
        note: "IN supplies half of S2 Core. Since S2 Core is 50% of RQ, IN contributes 25% of the final score.",
      },
      {
        id: "s2-consistency",
        code: "S2-C",
        name: "S2 Consistency",
        value: consistencyIsEstimated ? `Est. ${Math.round(s2Consistency)}` : s2Consistency,
        weight: "30%",
        contribution: s2ConsistencyContribution,
        window: consistencyIsEstimated
          ? `${s2SessionCount}/5 sessions · provisional`
          : `Last ${Math.min(s2SessionCount, 10)} S2 sessions`,
        description: consistencyIsEstimated
          ? "Provisional value until five deliberate-reasoning sessions are available."
          : "Stability of performance across recent deliberate-reasoning sessions.",
        estimated: consistencyIsEstimated,
        tone: consistencyIsEstimated ? "muted" : "default",
        note: consistencyIsEstimated
          ? "The engine uses a neutral fallback of 50 with fewer than five S2 sessions. This is not yet a measured personal pattern."
          : "Consistency is derived from score variability across the last ten S2 sessions: lower variability produces a higher value.",
      },
      {
        id: "task-priming",
        code: "PRIME",
        name: "Task Priming",
        value: taskPriming,
        weight: "20%",
        contribution: taskPrimingContribution,
        window: "Rolling 7 days",
        description: "Recent deliberate reading, listening and timed reasoning sessions.",
        tone: taskPriming === 0 ? "muted" : "default",
        note: `${taskCount} curated item(s): ${taskBreakdown.podcastCount} podcast, ${taskBreakdown.articleCount} article, ${taskBreakdown.bookCount} book. Fresh base weights are ${TASK_TYPE_WEIGHTS.podcast}/${TASK_TYPE_WEIGHTS.article}/${TASK_TYPE_WEIGHTS.book}; custom sessions are duration-weighted.`,
      },
    ];

    if (isDecaying && decay > 0) {
      rows.push({
        id: "decay",
        code: "DECAY",
        name: "Inactivity Adjustment",
        value: `${decay.toFixed(1)} pts`,
        weight: "−2/week",
        contribution: -decay,
        window: "After 14 inactive days",
        description: "Applied when neither S2 training nor deliberate tasks are recorded.",
        tone: "negative",
        note: "The adjustment begins after 14 days without relevant activity and cannot reduce RQ below S2 Core minus 10 points.",
      });
    }

    return rows;
  }, [
    CT,
    IN,
    consistencyIsEstimated,
    decay,
    isDecaying,
    s2Consistency,
    s2ConsistencyContribution,
    s2SessionCount,
    taskBreakdown,
    taskPriming,
    taskPrimingContribution,
  ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6 px-5 pt-3 pb-12">
        <MetricDetailNavigation />

        <MetricDetailHeader
          title="Reasoning Quality"
          description="A changeable signal from recent deliberate-thinking practice and consistency."
          context="Current skills · last 10 S2 sessions · rolling 7-day activity"
        />

        <MetricScoreRing
          value={rq}
          status={getReasoningQualityStatus(rq).label}
          color={METRIC_COLORS.reasoningQuality}
          isLoading={isLoading}
        />

        <MetricInterpretationNote changeDrivers="deliberate-reasoning practice, consistency and recent learning activity" />

        <MetricFactorsSection>
          {drivers.map((driver) => (
            <MetricFactorCard
              key={driver.id}
              code={driver.code}
              name={driver.name}
              description={driver.description}
              value={driver.value}
              weight={driver.weight}
              contribution={driver.contribution}
              window={driver.window}
              estimated={driver.estimated}
              contributionTone={driver.tone}
              onClick={() => setSelectedDriver(driver)}
            />
          ))}
        </MetricFactorsSection>

        <div className="rounded-xl border border-border/30 bg-card/35 p-4 text-xs leading-relaxed text-muted-foreground">
          RQ = 25% CT + 25% IN + 30% S2 Consistency + 20% Task Priming, minus any inactivity adjustment.
        </div>
      </div>

      <Sheet open={!!selectedDriver} onOpenChange={(open) => !open && setSelectedDriver(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[70vh]">
          {selectedDriver && (
            <div className="pb-8">
              <SheetHeader className="text-left mb-5">
                <div className="mb-2 flex items-center gap-3">
                  <span className="rounded-md border border-border/50 bg-background/45 px-2 py-1 text-[10px] font-semibold tracking-[0.1em]">
                    {selectedDriver.code}
                  </span>
                  {selectedDriver.estimated && (
                    <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Estimated</span>
                  )}
                </div>
                <SheetTitle className="text-base font-semibold">{selectedDriver.name}</SheetTitle>
              </SheetHeader>

              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                {selectedDriver.description}
              </p>

              <div className="space-y-3">
                <DetailRow label="Value" value={String(selectedDriver.value ?? "—")} />
                <DetailRow label="Weight" value={selectedDriver.weight} />
                <DetailRow
                  label="Impact"
                  value={`${selectedDriver.contribution > 0 ? "+" : ""}${selectedDriver.contribution.toFixed(1)}`}
                  negative={selectedDriver.contribution < 0}
                />
                <DetailRow label="Data window" value={selectedDriver.window} />
              </div>

              <div className="mt-6 rounded-lg border border-border/20 bg-muted/20 p-3">
                <p className="text-[11px] leading-relaxed text-muted-foreground/80">{selectedDriver.note}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function DetailRow({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/20 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("text-right text-sm tabular-nums", negative && "text-amber-500")}>{value}</span>
    </div>
  );
}
