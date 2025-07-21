import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.selectz.app',
  appName: 'Selectz',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      'https://*.supabase.co',
      'https://*.netlify.app'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      spinnerColor: '#3b82f6',
      androidStatusBarTranslucent: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    }
  },
  ios: {
    scheme: 'Selectz'
  },
  android: {
    scheme: 'selectz'
  }
};

export default config;
