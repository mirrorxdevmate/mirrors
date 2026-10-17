import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { Confetti } from '@/components/overlays';
import { T } from '@/components/ui';
import { colors } from '@/theme';

/** Shared confetti interstitial used between onboarding chapters ("You're verified!", "Looking good!" …). */
export default function Celebrate() {
  const { title = 'Done!', next = '/' } = useLocalSearchParams<{ title?: string; next?: string }>();
  const go = () => router.replace(next as never);

  useEffect(() => {
    const t = setTimeout(go, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={{ flex: 1, backgroundColor: colors.white }} onPress={go} accessibilityHint="Tap to continue">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <T v="display" center color={colors.grey900} accessibilityLiveRegion="polite">
          {title}
        </T>
      </View>
      <Confetti />
    </Pressable>
  );
}
