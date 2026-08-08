import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  MetricDetailHeader,
  MetricInterpretationNote,
  MetricDetailNavigation,
  MetricFactorCard,
  MetricFactorsSection,
  MetricScoreRing,
} from "@/components/metrics/MetricDetail";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { getReadinessStatus } from "@/lib/metricStatusLabels";

interface ReasoningTabProps {
  onBackToOverview?: () => void;
}

export function ReasoningTab({ onBackToOverview }: ReasoningTabProps) {
  const {
    readiness,
    recovery,
    S1,
    S2,
    AE,
    CT,
    IN,
    readinessDecay,
    consecutiveLowRecDays,
    hasWearableData,
    physioComponent,
    isLoading,
  } = useTodayMetrics();
  const [infoOpen, setInfoOpen] = useState(false);

  const subtitle = useMemo(() => {
    if (readiness >= 80) return "Strong capacity for sustained, demanding work.";
    if (readiness >= 65) return "Strong capacity for sustained cognitive work.";
    if (readiness >= 50) return "Steady capacity. Use breaks for longer efforts.";
    if (readiness >= 35) return "Today favors shorter work sessions with deliberate breaks.";
    return "Protect capacity today; this signal can move with recovery and practice.";
  }, [readiness]);

  const cta = useMemo(() => {
    if (!hasWearableData && recovery < 45) {
      return { label: "Start Recovery", link: "/neuro-lab?tab=detox" };
    }

    if (hasWearableData) {
      const candidates = [
        { key: "CT", value: 0.15 * (100 - CT) },
        { key: "AE", value: 0.125 * (100 - AE) },
        { key: "IN", value: 0.10 * (100 - IN) },
      ];
      const bottleneck = candidates.reduce((a, b) => (a.value > b.value ? a : b)).key;
      if (bottleneck === "AE") return { label: "Train Attentional Efficiency", link: "/neuro-lab/focus" };
      if (bottleneck === "IN") return { label: "Train Insight", link: "/neuro-lab/creativity" };
      return { label: "Train Critical Thinking", link: "/neuro-lab/reasoning" };
    }

    const candidates = [
      { key: "REC", value: 0.35 * (100 - recovery) },
      { key: "S2", value: 0.35 * (100 - S2) },
      { key: "AE", value: 0.30 * (100 - AE) },
    ];
    const bottleneck = candidates.reduce((a, b) => (a.value > b.value ? a : b)).key;
    if (bottleneck === "S2") return { label: "Train Deliberate Reasoning", link: "/neuro-lab/reasoning" };
    if (bottleneck === "AE") return { label: "Train Attentional Efficiency", link: "/neuro-lab/focus" };
    return { label: "Start Recovery", link: "/neuro-lab?tab=detox" };
  }, [AE, CT, IN, S2, hasWearableData, recovery]);

  return (
    <div className="space-y-6 pb-8">
      {onBackToOverview && <MetricDetailNavigation onBack={onBackToOverview} />}

      <MetricDetailHeader
        title="Readiness"
        description={subtitle}
        context={hasWearableData ? "Wearable mode · physiological data today" : "App mode · no wearable data today"}
      />

      <MetricScoreRing
        value={readiness}
        status={getReadinessStatus(readiness).label}
        color="hsl(245, 58%, 65%)"
        isLoading={isLoading}
      />

      <MetricInterpretationNote changeDrivers="recovery, focused practice and daily conditions" />

      <MetricFactorsSection>
        {hasWearableData ? (
          <>
            <MetricFactorCard
              code="PHYS"
              name="Physiological State"
              description="HRV, resting heart rate, sleep duration and sleep efficiency."
              value={physioComponent}
              weight="50%"
              contribution={physioComponent == null ? null : 0.5 * physioComponent}
              window="Today · wearable"
            />
            <MetricFactorCard
              code="CT"
              name="Critical Thinking"
              description="Analytical accuracy within the cognitive half of Readiness."
              value={CT}
              weight="15%"
              contribution={0.15 * CT}
              window="Current skill state"
            />
            <MetricFactorCard
              code="AE"
              name="Attentional Efficiency"
              description="Ability to maintain stable, directed attention."
              value={AE}
              weight="12.5%"
              contribution={0.125 * AE}
              window="Current skill state"
            />
            <MetricFactorCard
              code="IN"
              name="Insight"
              description="Ability to identify patterns and useful connections."
              value={IN}
              weight="10%"
              contribution={0.10 * IN}
              window="Current skill state"
            />
            <MetricFactorCard
              code="S2"
              name="Deliberate Reasoning"
              description="Combined Critical Thinking and Insight."
              value={S2}
              weight="7.5%"
              contribution={0.075 * S2}
              window="Current skill state"
            />
            <MetricFactorCard
              code="S1"
              name="Fast Processing"
              description="Combined Attentional Efficiency and Rapid Association."
              value={S1}
              weight="5%"
              contribution={0.05 * S1}
              window="Current skill state"
            />
          </>
        ) : (
          <>
            <MetricFactorCard
              code="REC"
              name="Recovery"
              description="Estimated cognitive reserve available today."
              value={recovery}
              weight="35%"
              contribution={0.35 * recovery}
              window="Today"
            />
            <MetricFactorCard
              code="S2"
              name="Deliberate Reasoning"
              description="Combined Critical Thinking and Insight."
              value={S2}
              weight="35%"
              contribution={0.35 * S2}
              window="Current skill state"
            />
            <MetricFactorCard
              code="AE"
              name="Attentional Efficiency"
              description="Ability to maintain stable, directed attention."
              value={AE}
              weight="30%"
              contribution={0.30 * AE}
              window="Current skill state"
            />
          </>
        )}

        {readinessDecay > 0 && (
          <MetricFactorCard
            code="DECAY"
            name="Low-Recovery Adjustment"
            description="Applied after at least three consecutive days below REC 40."
            value={`${consecutiveLowRecDays} days`}
            weight="−5, then −2/day"
            contribution={-readinessDecay}
            contributionTone="negative"
            window="Rolling week"
          />
        )}
      </MetricFactorsSection>

      <Link to={cta.link} className="block pt-1">
        <Button variant="premium" className="w-full h-12 text-sm">
          {cta.label}
        </Button>
      </Link>

      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <span className="uppercase tracking-wider">Formula</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${infoOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-xl border border-border/30 bg-card/35 p-4 text-xs leading-relaxed text-muted-foreground">
            {hasWearableData
              ? "Wearable Readiness = 50% physiological state + 50% cognitive state. Recovery is not added directly in this mode."
              : "App Readiness = 35% REC + 35% S2 + 30% AE, minus any low-Recovery adjustment."}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
