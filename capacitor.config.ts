import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paleo.heritage',
  appName: 'Paleo Heritage',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      allowEditing: false,
      saveToGallery: true
    },
    Geolocation: {},
    Filesystem: {
      directory: 'DOCUMENTS'
    }
  }
};

export default config;

