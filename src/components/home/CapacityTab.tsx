import { useState } from "react";
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
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { getRecoveryStatus } from "@/lib/metricStatusLabels";

interface CapacityTabProps {
  onBackToOverview?: () => void;
}

export function CapacityTab({ onBackToOverview }: CapacityTabProps) {
  const {
    recoveryEffective: recovery,
    recoveryTarget,
    isUsingRRI,
    isV2Initialized,
    hasRecoveryData,
    weeklyDetoxMinutes,
    weeklyWalkMinutes,
    isLoading,
  } = useRecoveryEffective();
  const [infoOpen, setInfoOpen] = useState(false);

  const showNoData = !isLoading && !isV2Initialized && !hasRecoveryData;
  const score = showNoData ? null : recovery;
  const status = showNoData ? "Not initialized" : getRecoveryStatus(recovery).label;
  const subtitle = showNoData
    ? "Complete a Recovery action to establish your first estimate."
    : recovery >= 80
      ? "Strong cognitive reserve is available today."
      : recovery >= 65
        ? "Strong cognitive reserve is available today."
        : recovery >= 50
          ? "Steady reserve. Deep focus is available with pacing."
          : "Today favors restoration before demanding work.";

  return (
    <div className="space-y-6 pb-8">
      {onBackToOverview && <MetricDetailNavigation onBack={onBackToOverview} />}

      <MetricDetailHeader
        title="Recovery"
        description={subtitle}
        context="Daily estimate · health, wearable and recovery actions"
      />

      <MetricScoreRing
        value={score}
        status={status}
        color="hsl(172, 66%, 50%)"
        isLoading={isLoading}
        note={isUsingRRI ? "Initial estimate from onboarding" : undefined}
      />

      <MetricInterpretationNote changeDrivers="rest, screen-free time, walking and daily conditions" />

      <MetricFactorsSection title="What moves Recovery">
        <MetricFactorCard
          code="RECₜ"
          name="Daily Recovery Target"
          description="Health and wearable target, confidence-blended toward the neutral baseline of 50."
          value={recoveryTarget}
          weight="65% of gap/day"
          contribution={`Toward ${Math.round(recoveryTarget)}`}
          contributionTone="muted"
          window="Today"
          estimated
        />
        <MetricFactorCard
          code="DET"
          name="Digital Detox"
          description="Completed screen-free time adds the full Recovery action rate."
          value={`${Math.round(weeklyDetoxMinutes)} min`}
          weight="+0.12/min"
          contribution={0.12 * weeklyDetoxMinutes}
          window="Rolling 7 days"
        />
        <MetricFactorCard
          code="WALK"
          name="Walking"
          description="Completed walking time adds half the Detox action rate."
          value={`${Math.round(weeklyWalkMinutes)} min`}
          weight="+0.06/min"
          contribution={0.06 * weeklyWalkMinutes}
          window="Rolling 7 days"
        />
      </MetricFactorsSection>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Link to="/neuro-lab?tab=detox">
          <Button variant="premium" className="w-full h-12 text-sm">
            Start Detox
          </Button>
        </Link>
        <Link to="/neuro-lab?tab=walk">
          <Button variant="outline" className="w-full h-12 text-sm">
            Start Walking
          </Button>
        </Link>
      </div>

      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <span className="uppercase tracking-wider">Formula</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${infoOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-xl border border-border/30 bg-card/35 p-4 text-xs leading-relaxed text-muted-foreground">
            Each new day, REC closes 65% of the gap toward its Health and wearable target (or 50 without data).
            Completed actions then add 0.12 × (Detox minutes + 0.5 × Walking minutes), capped at 100.
            Action impacts above are gross rolling inputs; daily recalibration determines the current score.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
