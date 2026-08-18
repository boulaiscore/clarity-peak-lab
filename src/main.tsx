import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/bebas-neue";
import "@fontsource/outfit";

// In preview environments we disable/unregister any previously installed Service Worker.
// This prevents stale cached bundles pointing at an old backend project, which can break
// onboarding/profile saves and cause redirect loops.
const host = window.location.hostname;
const isLovablePreview = host.startsWith("id-preview--") || host.includes(".lovableproject.com");
const isNativeApp = Capacitor.isNativePlatform();

// Capacitor ships the web bundle inside the native package and does not need the
// PWA Service Worker. Removing old registrations prevents an Android/iOS update
// from rendering a previously cached UI instead of the assets in the new build.
if ((isLovablePreview || isNativeApp) && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });

  // Best-effort cache cleanup (doesn't throw if Cache Storage isn't available)
  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

createRoot(document.getElementById("root")!).render(<App />);
