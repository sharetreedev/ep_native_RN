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
import { ToastProvider } from './src/contexts/ToastContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { fontAssets } from './src/theme/fonts';
import { colors } from './src/theme';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://2660ada112620cc2162f58a8c1472cce@o4511233478819840.ingest.us.sentry.io/4511233481768960',
  environment: 'production',
  enabled: !__DEV__,

  // PII is required for grouping users to crashes; disclosed in privacy policy.
  // See https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  enableLogs: true,

  // Replay sampling kept low because Pulse handles sensitive emotional content.
  // Errors are always replayed; routine sessions are sampled at 1%.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1,
  integrations: [
    // Explicit masking config — defaults already mask text/images, declared
    // here so the privacy posture is visible at the call site for any
    // Sharetree contributor reviewing this file.
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: true,
    }),
    Sentry.feedbackIntegration(),
  ],
});

// Keep splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

// Initialise OneSignal (native-only — guarded so Expo Go doesn't crash).
// Permission is NOT requested here — see PushPrimer for the context-first
// prompt that runs inside the authenticated app shell.
if (Platform.OS !== 'web') {
  try {
    const { OneSignal } = require('react-native-onesignal');
    const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
    if (appId) {
      OneSignal.initialize(appId);
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
        <ToastProvider>
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
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
});
