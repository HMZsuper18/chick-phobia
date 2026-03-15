import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'chick_phobia.hamzah.com',
  appName: 'chick phobia',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['accounts.google.com']
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // الـ Web Client ID من Google Cloud Console (الذي يبدأ بـ 4654)
      serverClientId: '465447309915-4bgjc1fipr4769lsv9v7v9m75v0rht0r.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;