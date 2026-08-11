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
} from "@/components/metrics/MetricDetail";
import { RecoveryScoreBar } from "@/components/metrics/RecoveryScale";
import { useRecoveryEffective } from "@/hooks/useRecoveryEffective";
import { getRecoveryStatus } from "@/lib/metricStatusLabels";

interface CapacityTabProps {
  onBackToOverview?: () => void;
}

export function CapacityTab({ onBackToOverview }: CapacityTabProps) {
  const {
    recoveryEffective: recovery,
    recoveryTarget,
    isV2Initialized,
    hasRecoveryData,
    phoneHealthTarget,
    phoneHealthConfidence,
    phoneHealthAvailableSources,
    phoneHealthUpdatedAt,
    phoneHealthSource,
    wearableRawScore,
    wearableConfidence,
    wearableWeight,
    wearableContribution,
    wearableUpdatedAt,
    wearableSource,
    weeklyDetoxMinutes,
    weeklyWalkMinutes,
    isLoading,
  } = useRecoveryEffective();
  const [infoOpen, setInfoOpen] = useState(false);

  const isNeutralEstimate = !isLoading && !isV2Initialized && !hasRecoveryData;
  const score = recovery;
  const status = isNeutralEstimate ? "Estimating" : getRecoveryStatus(recovery).label;
  const subtitle = isNeutralEstimate
    ? "Connect Health or a wearable to make Recovery responsive to your day."
    : recovery >= 80
      ? "Strong cognitive reserve is available today."
      : recovery >= 65
        ? "Strong cognitive reserve is available today."
        : recovery >= 50
          ? "Steady reserve. Deep focus is available with pacing."
          : "Today favors restoration before demanding work.";
  const healthLabel = phoneHealthSource === "health_connect"
    ? "Health Connect target"
    : phoneHealthSource === "healthkit"
      ? "Apple Health target"
      : "Neutral baseline";
  const healthValue = phoneHealthTarget ?? 50;
  const healthWeight = `${Math.round((1 - wearableWeight) * 100)}%`;
  const healthFreshness = phoneHealthUpdatedAt
    ? `Today · ${new Date(phoneHealthUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "No Health snapshot today";
  const wearableFreshness = wearableUpdatedAt
    ? `Today · ${new Date(wearableUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "No wearable snapshot today";

  return (
    <div className="space-y-6 pb-8">
      {onBackToOverview && <MetricDetailNavigation onBack={onBackToOverview} />}

      <MetricDetailHeader
        title="Recovery"
        description={subtitle}
        context="Daily estimate · health, wearable and recovery actions"
      />

      <RecoveryScoreBar
        value={score}
        status={status}
        isLoading={isLoading}
        note={isNeutralEstimate ? "Neutral estimate" : undefined}
      />

      <MetricInterpretationNote changeDrivers="rest, screen-free time, walking and daily conditions" />

      <MetricFactorsSection title="Inputs used today">
        <MetricFactorCard
          code="HLT"
          name={healthLabel}
          description={phoneHealthTarget == null
            ? "No Health data was stored today, so the formula starts from the neutral value."
            : `${phoneHealthAvailableSources.length} Health signal groups observed at ${Math.round(phoneHealthConfidence * 100)}% coverage.`}
          value={healthValue}
          weight={healthWeight}
          contribution={phoneHealthTarget == null ? "Neutral base" : `Base ${Math.round(phoneHealthTarget)}`}
          contributionTone="muted"
          window={healthFreshness}
          estimated={phoneHealthTarget == null}
        />
        <MetricFactorCard
          code="PHY"
          name={wearableSource === "health_connect" ? "Wearable physiology · Health Connect" : wearableSource === "healthkit" ? "Wearable physiology · Apple Health" : "Wearable physiology"}
          description={wearableRawScore == null
            ? "No HRV, resting-heart-rate or distinct sleep signal was stored today."
            : `Observed physiology coverage is ${Math.round(wearableConfidence * 100)}%; missing signals stay neutral.`}
          value={wearableRawScore}
          weight={`${Math.round(wearableWeight * 100)}%`}
          contribution={wearableRawScore == null ? "Not used" : wearableContribution}
          contributionTone={wearableContribution < 0 ? "negative" : wearableContribution === 0 ? "muted" : "default"}
          window={wearableFreshness}
          estimated={wearableRawScore == null}
        />
        <MetricFactorCard
          code="RECₜ"
          name="Combined daily target"
          description="The single target shared by Home, Monitor, Lab gating and metric history."
          value={recoveryTarget}
          weight="65% of gap/day"
          contribution={`Toward ${Math.round(recoveryTarget)}`}
          contributionTone="muted"
          window="Today"
          estimated
        />
      </MetricFactorsSection>

      <MetricFactorsSection title="Recovery actions">
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

      {(!phoneHealthTarget || wearableRawScore == null) && (
        <Link
          to="/app/wearable"
          className="block rounded-xl border border-border/35 bg-card/30 px-4 py-3 text-center text-xs font-medium text-foreground/80 transition-colors hover:bg-card/55"
        >
          Review Health & wearable data
        </Link>
      )}

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
