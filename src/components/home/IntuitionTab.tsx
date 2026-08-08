import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  MetricDetailHeader,
  MetricDetailNavigation,
  MetricFactorCard,
  MetricFactorsSection,
  MetricScoreRing,
} from "@/components/metrics/MetricDetail";
import { useTodayMetrics } from "@/hooks/useTodayMetrics";
import { getSharpnessStatus } from "@/lib/metricStatusLabels";
import { calculateSharpnessRecoveryModifier } from "@/lib/cognitiveEngine";

interface IntuitionTabProps {
  onBackToOverview?: () => void;
}

export function IntuitionTab({ onBackToOverview }: IntuitionTabProps) {
  const { sharpness, S1, S2, recovery, isLoading } = useTodayMetrics();
  const [infoOpen, setInfoOpen] = useState(false);

  const recoveryModifier = calculateSharpnessRecoveryModifier(recovery);
  const s1Contribution = 0.6 * S1;
  const s2Contribution = 0.4 * S2;
  const recoveryImpact = sharpness - (s1Contribution + s2Contribution);

  const subtitle = useMemo(() => {
    if (sharpness >= 80) return "Peak mental clarity for your most demanding work.";
    if (sharpness >= 65) return "Strong clarity for demanding cognitive work.";
    if (sharpness >= 50) return "Moderate clarity. Pace complex work and protect focus.";
    if (sharpness >= 35) return "Reduced clarity. Prefer lighter cognitive work.";
    return "Demanding cognitive work is currently constrained.";
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      {onBackToOverview && <MetricDetailNavigation onBack={onBackToOverview} />}

      <MetricDetailHeader
        title="Sharpness"
        description={subtitle}
        context="Current capacity · updates after training or recovery"
      />

      <MetricScoreRing
        value={sharpness}
        status={getSharpnessStatus(sharpness).label}
        color="hsl(210, 100%, 60%)"
        isLoading={isLoading}
      />

      <MetricFactorsSection>
        <MetricFactorCard
          code="S1"
          name="Fast Processing"
          description="Combined Attentional Efficiency and Rapid Association."
          value={S1}
          weight="60%"
          contribution={s1Contribution}
          window="Current skill state"
        />
        <MetricFactorCard
          code="S2"
          name="Deliberate Reasoning"
          description="Combined Critical Thinking and Insight."
          value={S2}
          weight="40%"
          contribution={s2Contribution}
          window="Current skill state"
        />
        <MetricFactorCard
          code="REC"
          name="Recovery"
          description="Controls how much of the combined capacity is available today."
          value={recovery}
          weight={`×${recoveryModifier.toFixed(2)}`}
          contribution={recoveryImpact}
          contributionTone={recoveryImpact < 0 ? "negative" : "default"}
          window="Today"
        />
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
            Sharpness = (0.60 × S1 + 0.40 × S2) × (0.75 + 0.25 × REC / 100).
            Contributions above show the pre-Recovery capacity and the exact Recovery adjustment.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
