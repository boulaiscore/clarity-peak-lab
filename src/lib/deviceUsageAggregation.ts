import type { AppUsageStat } from "@/lib/capacitor/appBlocker";

export interface AttentionUsageAggregate {
  attentionUsageMin: number;
  activeAppCount: number;
  lastAttentionUseAt: string | null;
}

/**
 * Reduces native usage records before persistence. The returned object cannot
 * contain package names, app names, content, contacts or social identities.
 */
export function aggregateAttentionUsage(stats: AppUsageStat[]): AttentionUsageAggregate {
  const valid = stats.filter((stat) =>
    Number.isFinite(stat.usageMinutes) && stat.usageMinutes >= 0,
  );
  const lastUsed = valid
    .map((stat) => stat.lastUsed)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a)[0];

  return {
    attentionUsageMin: Math.round(
      valid.reduce((sum, stat) => sum + stat.usageMinutes, 0),
    ),
    activeAppCount: valid.filter((stat) => stat.usageMinutes > 0).length,
    lastAttentionUseAt: lastUsed ? new Date(lastUsed).toISOString() : null,
  };
}
