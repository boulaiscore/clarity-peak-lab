import { MetricFactorCard, MetricFactorsSection } from "@/components/metrics/MetricDetail";
import type { DigitalAttentionEstimate } from "@/lib/digitalFragmentation";
import type { PassiveSignalSource } from "@/lib/dailyPassiveState";

const META = {
  health: {
    code: "HLT",
    name: "Health context",
    description: "Sleep, sleep timing and movement available from the phone health hub.",
    window: "Today",
  },
  wearable: {
    code: "PHY",
    name: "Wearable physiology",
    description: "HRV, resting heart rate, sleep duration and sleep efficiency received today.",
    window: "Today",
  },
  attention: {
    code: "DFR",
    name: "Digital load & fragmentation",
    description: "Attention-app duration and switching are compared only with your own prior days.",
    window: "Today vs personal median",
  },
  schedule: {
    code: "CAL",
    name: "Schedule load",
    description: "Busy time and meeting density compared with your own prior days.",
    window: "Today vs personal median",
  },
} as const;

function digitalDescription(digital: DigitalAttentionEstimate): string {
  if (digital.mode === "unavailable") {
    return "Connect Attention access to measure aggregate use and switching without storing app identities.";
  }
  if (digital.mode === "legacy_usage") {
    return `${Math.round(digital.attentionUsageMin ?? 0)} min across ${Math.round(digital.activeAppCount ?? 0)} attention apps. Fragmentation starts after the app update.`;
  }
  return [
    `${Math.round(digital.attentionUsageMin ?? 0)} min`,
    `${Math.round(digital.attentionSessionCount ?? 0)} sessions`,
    `${Math.round(digital.attentionSwitchCount ?? 0)} switches`,
    `${Math.round(digital.briefSessionCount ?? 0)} brief`,
  ].join(" · ");
}

export function PassiveStateFactors({
  sources,
  digitalAttention,
}: {
  sources: PassiveSignalSource[];
  digitalAttention: DigitalAttentionEstimate;
}) {
  return (
    <MetricFactorsSection title="Inside Daily State">
      {sources.map((source) => {
        const meta = META[source.id];
        const available = source.status !== "off" && source.score !== null;
        const description = source.id === "attention"
          ? digitalDescription(digitalAttention)
          : meta.description;
        const window = source.id === "attention" && digitalAttention.baselineDays < 7
          ? `${digitalAttention.baselineDays}/7 prior days · learning`
          : meta.window;

        return (
          <MetricFactorCard
            key={source.id}
            code={meta.code}
            name={meta.name}
            description={description}
            value={available ? source.score : null}
            weight={`${Math.round(source.weight * 100)}% max · ${Math.round(source.effectiveWeight * 100)}% today`}
            contribution={available ? `${source.scoreContribution.toFixed(1)} state pts` : "Not used"}
            contributionTone="muted"
            window={window}
            estimated={source.status !== "active"}
          />
        );
      })}
    </MetricFactorsSection>
  );
}
