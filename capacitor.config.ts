import type { CapacitorConfig } from "@capacitor/cli";

const liveReloadUrl = process.env.CAPACITOR_LIVE_RELOAD_URL;

const config: CapacitorConfig = {
  appId: "com.neurolooplabs.looma",
  appName: "LOOMA",
  webDir: "dist",
  // Native release builds use the bundled web app. A remote URL is allowed
  // only when a developer explicitly opts into live reload.
  ...(liveReloadUrl
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: liveReloadUrl.startsWith("http://"),
        },
      }
    : {}),
  plugins: {
    App: {
      // Deep link handling
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#6366f1",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#0f0f1a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  // iOS-specific configuration
  ios: {
    scheme: "looma",
    contentInset: "automatic",
  },
  // Android-specific configuration
  android: {
    allowMixedContent: false,
  },
};

export default config;
