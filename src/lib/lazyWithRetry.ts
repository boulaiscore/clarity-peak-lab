import { ComponentType, lazy } from "react";

const RELOAD_KEY = "looma:chunk-reloaded-at";

/**
 * After a new deploy the previously loaded index references hashed chunks that
 * no longer exist, so dynamic imports reject and the route renders a blank
 * screen. Retry once, then force a single reload to pick up the fresh manifest.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      try {
        return await factory();
      } catch {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
          // Never resolves; the reload replaces the document.
          return new Promise<{ default: T }>(() => undefined);
        }
        throw error;
      }
    }
  });
}
