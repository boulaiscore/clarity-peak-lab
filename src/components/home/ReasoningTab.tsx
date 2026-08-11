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
    S2,
    AE,
    readinessCognitiveComponent,
    dailyState,
    signalCoverage,
    signalCoverageLevel,
    readinessDecay,
    consecutiveLowRecDays,
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
    if (recovery < 45 || (signalCoverage >= 0.35 && dailyState < 40)) {
      return { label: "Start Recovery", link: "/neuro-lab?tab=detox" };
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
  }, [AE, S2, dailyState, recovery, signalCoverage]);

  const appReadiness = 0.35 * recovery + 0.35 * S2 + 0.30 * AE;
  const appWeight = 1 - signalCoverage;
  const cognitiveWeight = 0.40 * signalCoverage;
  const dailyStateWeight = 0.60 * signalCoverage;

  return (
    <div className="space-y-6 pb-8">
      {onBackToOverview && <MetricDetailNavigation onBack={onBackToOverview} />}

      <MetricDetailHeader
        title="Readiness"
        description={subtitle}
        context={`${signalCoverageLevel} passive coverage · personal baseline`}
      />

      <MetricScoreRing
        value={readiness}
        status={getReadinessStatus(readiness).label}
        color="hsl(245, 58%, 65%)"
        isLoading={isLoading}
      />

      <MetricInterpretationNote changeDrivers="recovery, focused practice and daily conditions" />

      <MetricFactorsSection>
        <MetricFactorCard
          code="APP"
          name="App State"
          description="Recovery, Deliberate Reasoning and Attentional Efficiency."
          value={appReadiness}
          weight={`${Math.round(appWeight * 100)}%`}
          contribution={appWeight * appReadiness}
          window="Current + today"
        />
        {signalCoverage > 0 && (
          <>
            <MetricFactorCard
              code="COG"
              name="Cognitive State"
              description="CT, AE, IN, S2 and S1 combined in the canonical cognitive component."
              value={readinessCognitiveComponent}
              weight={`${Math.round(cognitiveWeight * 100)}%`}
              contribution={cognitiveWeight * readinessCognitiveComponent}
              window="Current skill state"
            />
            <MetricFactorCard
              code="DAY"
              name="Daily State"
              description="Health, wearable, attention load and schedule context available today."
              value={dailyState}
              weight={`${Math.round(dailyStateWeight * 100)}%`}
              contribution={dailyStateWeight * dailyState}
              window="Today · passive"
              estimated
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
            Readiness starts from App State: 35% REC + 35% S2 + 30% AE.
            Signal coverage progressively blends it with 60% Daily State + 40% Cognitive State,
            minus any low-Recovery adjustment.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
