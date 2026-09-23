/**
 * Canonical routes into the Lab training library.
 *
 * A nonce is appended so that navigating to the same system twice (for example
 * from a lock card while already on the Lab page) still produces a URL change
 * and re-opens the requested system accordion.
 */

export type ThinkingSystemParam = "fast" | "slow";

export const LAB_RECOVERY_ROUTE = "/neuro-lab?tab=detox";

export function labGamesRoute(system: ThinkingSystemParam): string {
  return `/neuro-lab?tab=games&system=${system}&o=${Date.now().toString(36)}`;
}
