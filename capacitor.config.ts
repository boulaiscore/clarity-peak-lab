import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nloop.pro',
  appName: 'NLOOP Pro',
  webDir: 'dist',
  server: {
    url: "https://clarity-peak-lab.vercel.app",
    cleartext: false
  },
  plugins: {
    App: {
      // Deep link handling
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#6366f1',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0f0f1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  // iOS-specific configuration
  ios: {
    scheme: 'nloop',
    contentInset: 'automatic',
  },
  // Android-specific configuration  
  android: {
    allowMixedContent: false,
  },
};

export default config;
