import './global.css';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { CheckInProvider } from './src/contexts/CheckInContext';
import { MHFRProvider } from './src/contexts/MHFRContext';
// Wrapped in try/catch — registerGlobals() in the ElevenLabs SDK can crash
// at import time if LiveKit native modules aren't linked correctly.
let ElevenLabsProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
try {
  ElevenLabsProvider = require('@elevenlabs/react-native').ElevenLabsProvider;
} catch (e) {
  console.warn('ElevenLabs SDK failed to load:', e);
}
import { fontAssets } from './src/theme/fonts';
import { colors } from './src/theme';

// Keep splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CheckInProvider>
          <MHFRProvider>
            {ElevenLabsProvider ? (
              <ElevenLabsProvider>
                <AppNavigator />
              </ElevenLabsProvider>
            ) : (
              <AppNavigator />
            )}
          </MHFRProvider>
        </CheckInProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
