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
import { ElevenLabsProvider } from '@elevenlabs/react-native';
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
            <ElevenLabsProvider>
              <AppNavigator />
            </ElevenLabsProvider>
          </MHFRProvider>
        </CheckInProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
