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
import { PassiveStateFactors } from "@/components/metrics/PassiveStateFactors";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { METRIC_COLORS } from "@/lib/metricColors";
import { getSharpnessStatus } from "@/lib/metricStatusLabels";

interface IntuitionTabProps {
  onBackToOverview?: () => void;
}

export function IntuitionTab({ onBackToOverview }: IntuitionTabProps) {
  const {
    sharpness,
    S1,
    S2,
    recovery,
    dailyState,
    signalCoverage,
    signalCoverageLevel,
    signalSources,
    digitalAttention,
    sharpnessBreakdown,
    isLoading,
  } = useTodayMetrics();
  const [infoOpen, setInfoOpen] = useState(false);

  const recoveryModifier = sharpnessBreakdown.recoveryModifier;

  const subtitle = useMemo(() => {
    if (sharpness >= 80) return "Strong clarity for your most demanding work.";
    if (sharpness >= 65) return "Strong clarity for demanding cognitive work.";
    if (sharpness >= 50) return "Steady clarity. Pace complex work and protect focus.";
    if (sharpness >= 35) return "Today favors lighter cognitive work and shorter focus blocks.";
    return "Protect capacity today; this signal can move with recovery and practice.";
  }, [sharpness]);

  const cta = useMemo(() => {
    if (recovery < 45) {
      return { label: "Start Recovery", link: "/neuro-lab?tab=detox" };
    }

    const s1Potential = 0.6 * (100 - S1) * recoveryModifier;
    const s2Potential = 0.4 * (100 - S2) * recoveryModifier;
    const recoveryPotential = (0.6 * S1 + 0.4 * S2) * (1 - recoveryModifier);
    const bottleneck = [
      { key: "REC", value: recoveryPotential },
      { key: "S1", value: s1Potential },
      { key: "S2", value: s2Potential },
    ].reduce((a, b) => (a.value > b.value ? a : b)).key;

    if (bottleneck === "S1") return { label: "Train Fast Processing", link: "/neuro-lab/focus" };
    if (bottleneck === "S2") return { label: "Train Deliberate Reasoning", link: "/neuro-lab/reasoning" };
    return { label: "Start Recovery", link: "/neuro-lab?tab=detox" };
  }, [S1, S2, recovery, recoveryModifier]);

  return (
    <div className="space-y-6 pb-8">
      {onBackToOverview && <MetricDetailNavigation onBack={onBackToOverview} />}

      <MetricDetailHeader
        title="Sharpness"
        description={subtitle}
        context={`Current capacity · ${signalCoverageLevel.toLowerCase()} passive coverage`}
      />

      <MetricScoreRing
        value={sharpness}
        status={getSharpnessStatus(sharpness).label}
        color={METRIC_COLORS.sharpness}
        isLoading={isLoading}
        rings={[
          { label: "S1", value: S1, color: METRIC_COLORS.system1 },
          { label: "S2", value: S2, color: METRIC_COLORS.system2 },
        ]}
      />

      <MetricInterpretationNote changeDrivers="recovery and fast-processing or reasoning practice" />

      <MetricFactorsSection>
        <MetricFactorCard
          code="S1"
          name="Fast Processing"
          description="Combined Attentional Efficiency and Rapid Association."
          value={S1}
          weight="60%"
          contribution={sharpnessBreakdown.s1Contribution}
          window="Current skill state"
        />
        <MetricFactorCard
          code="S2"
          name="Deliberate Reasoning"
          description="Combined Critical Thinking and Insight."
          value={S2}
          weight="40%"
          contribution={sharpnessBreakdown.s2Contribution}
          window="Current skill state"
        />
        <MetricFactorCard
          code="REC"
          name="Recovery"
          description="Controls how much of the combined capacity is available today."
          value={recovery}
          weight={`${Math.round((1 - signalCoverage) * 100)}% share · ×${recoveryModifier.toFixed(2)}`}
          contribution={sharpnessBreakdown.recoveryAdjustment}
          contributionTone={sharpnessBreakdown.recoveryAdjustment < 0 ? "negative" : "default"}
          window="Today"
        />
        {signalCoverage > 0 && (
          <MetricFactorCard
            code="DAY"
            name="Daily State"
            description="Health, wearable, attention load and schedule context available today."
            value={dailyState}
            weight={`${Math.round(signalCoverage * 100)}% share · ×${sharpnessBreakdown.dailyStateModifier.toFixed(2)}`}
            contribution={sharpnessBreakdown.dailyStateAdjustment}
            contributionTone={sharpnessBreakdown.dailyStateAdjustment < 0 ? "negative" : "default"}
            window="Today · passive"
            estimated
          />
        )}
      </MetricFactorsSection>

      {signalCoverage > 0 && (
        <PassiveStateFactors sources={signalSources} digitalAttention={digitalAttention} />
      )}

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
            Sharpness starts from 60% S1 + 40% S2. Signal coverage progressively blends
            the Recovery modifier with today&apos;s passive-state modifier; missing signals stay neutral.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
