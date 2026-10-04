import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Archivo_900Black } from '@expo-google-fonts/archivo/900Black';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { beforeOrAfterMatchups } from '../data/beforeOrAfter';
import { movieOnMyHeadCards } from '../data/movieOnMyHead';
import { validateContent } from '../data/validate';
import { whatsCommonRounds } from '../data/whatsCommon';
import { palette } from '../theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (__DEV__) {
  const problems = validateContent({
    movieOnMyHead: movieOnMyHeadCards,
    whatsCommon: whatsCommonRounds,
    beforeOrAfter: beforeOrAfterMatchups,
  });
  if (problems.length) console.warn(`TFI content problems:\n${problems.join('\n')}`);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Anton_400Regular,
    Archivo_600SemiBold,
    Archivo_800ExtraBold,
    Archivo_900Black,
  });

  useEffect(() => {
    // Portrait everywhere; Movie on My Head unlocks landscape for its round.
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.ink }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.ink },
          animation: 'default',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="intro/[game]" />
        <Stack.Screen
          name="play/movie-on-my-head"
          options={{
            gestureEnabled: false,
            animation: 'fade',
            // Status bar is hidden by the screen itself (expo-status-bar).
            navigationBarHidden: true,
          }}
        />
        <Stack.Screen name="play/whats-common" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="play/before-or-after" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="results" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
