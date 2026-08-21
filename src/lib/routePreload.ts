const routeLoaders: Record<string, () => Promise<unknown>> = {
  "/app": () => import("@/pages/app/Home"),
  "/neuro-lab": () => import("@/pages/app/NeuroLab"),
  "/app/dashboard": () => import("@/pages/app/Dashboard"),
  "/app/recovery-breakdown": () => import("@/pages/app/RecoveryBreakdown"),
  "/app/wearable": () => import("@/pages/app/Wearable"),
};

export function preloadAppRoute(path: string): void {
  const loader = routeLoaders[path];
  if (loader) void loader().catch(() => undefined);
}

export function preloadPrimaryRoutes(): void {
  const pending = ["/neuro-lab", "/app/dashboard", "/app/recovery-breakdown"];
  const preloadNext = () => {
    const path = pending.shift();
    if (!path) return;
    preloadAppRoute(path);
    schedule(preloadNext);
  };
  schedule(preloadNext);
}

function schedule(callback: () => void): void {
  if (typeof window === "undefined") return;
  const idle = (window as unknown as {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => void;
  }).requestIdleCallback;
  if (typeof idle === "function") {
    idle(callback, { timeout: 1_200 });
    return;
  }
  window.setTimeout(callback, 250);
}
