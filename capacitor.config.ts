import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paleoheritage.app',
  appName: 'Paleo Heritage',
  webDir: 'www',
  plugins: {
    Geolocation: {
      // Background location tracking
    }
  },
  android: {
    backgroundColor: '#1e1e1e'
  }
};

export default config;
