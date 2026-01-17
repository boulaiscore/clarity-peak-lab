import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neurolooplabs.neurolooppro',
  appName: 'NeuroLoop Pro',
  webDir: 'dist',
  server: {
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
  },
  // iOS-specific configuration
  ios: {
    scheme: 'neuroloop',
    contentInset: 'automatic',
  },
  // Android-specific configuration  
  android: {
    allowMixedContent: false,
  },
};

export default config;
