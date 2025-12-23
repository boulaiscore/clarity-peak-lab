import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neurolooplabs.neurolooppro',
  appName: 'NeuroLoop Pro',
  webDir: 'dist',
  server: {
    cleartext: false
  }
};

export default config;
