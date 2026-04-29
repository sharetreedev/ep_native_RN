import './global.css';
import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { CheckInProvider } from './src/contexts/CheckInContext';
import { CourseProvider } from './src/contexts/CourseContext';
import { MHFRProvider } from './src/contexts/MHFRContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { fontAssets } from './src/theme/fonts';
import { colors } from './src/theme';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://2660ada112620cc2162f58a8c1472cce@o4511233478819840.ingest.us.sentry.io/4511233481768960',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Keep splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

// Initialise OneSignal (native-only — guarded so Expo Go doesn't crash)
if (Platform.OS !== 'web') {
  try {
    const { OneSignal } = require('react-native-onesignal');
    const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
    if (appId) {
      OneSignal.initialize(appId);
      OneSignal.Notifications.requestPermission(false);
    }
  } catch (e) {
    console.warn('[OneSignal] Native module not available (Expo Go?):', e);
  }
}

export default Sentry.wrap(function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Check for OTA updates on launch
  React.useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.warn('[Updates] Error checking for update:', e);
      }
    })();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <CourseProvider>
            <CheckInProvider>
              <MHFRProvider>
                <NotificationsProvider>
                  <AppNavigator />
                </NotificationsProvider>
              </MHFRProvider>
            </CheckInProvider>
          </CourseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
});
