import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C } from '@/theme';
import { ItundaProvider } from '@/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaProvider>
        <ItundaProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.bg },
              animation: 'slide_from_right',
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="produce/[id]" />
            <Stack.Screen name="commodity/[category]" />
            <Stack.Screen name="farmer/[id]" />
            <Stack.Screen name="farmers" />
            <Stack.Screen name="orders" />
            <Stack.Screen name="sell" />
            <Stack.Screen name="downloads" />
            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          </Stack>
        </ItundaProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
