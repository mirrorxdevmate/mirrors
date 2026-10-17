import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Urbanist_400Regular, Urbanist_600SemiBold, Urbanist_700Bold, useFonts } from '@expo-google-fonts/urbanist';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initBilling } from '@/lib/billing';
import { initSentry, Sentry, setSentryUser } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
initSentry();

const onSignedIn = (userId: string) => {
  setSentryUser(userId);
  initBilling(userId).catch(() => {});
};

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Urbanist_400Regular,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Fraunces_400Regular_Italic,
  });
  const hydrated = useApp((s) => s.hydrated);
  const [authChecked, setAuthChecked] = useState(false);
  const ready = (fontsLoaded || !!fontError) && hydrated && authChecked;

  // The Supabase session is the source of truth for who is signed in.
  useEffect(() => {
    if (!hydrated) return;
    supabase.auth.getSession().then(async ({ data }) => {
      const st = useApp.getState();
      if (!data.session) {
        if (st.stage !== 'auth' || st.userId) st.reset();
      } else {
        const cachedUser = st.userId;
        st.set({ userId: data.session.user.id });
        onSignedIn(data.session.user.id);
        // Decide the first screen from the server profile (wait up to 4s; fall back to cached data offline).
        const refresh = st.refreshAccount().catch(() => {});
        if (st.stage === 'auth' || cachedUser !== data.session.user.id) {
          await Promise.race([refresh, new Promise((r) => setTimeout(r, 4000))]);
        }
      }
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        useApp.getState().set({ userId: session.user.id });
        onSignedIn(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        setSentryUser(null);
        useApp.getState().reset();
        if (router.canDismiss()) router.dismissAll();
        router.replace('/welcome');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrated]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white }, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="greeting" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="celebrate" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="match/[id]" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
          <Stack.Screen name="upgrade/processing" options={{ gestureEnabled: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
