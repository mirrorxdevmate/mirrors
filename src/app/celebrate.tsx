import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { Confetti } from '@/components/overlays';
import { colors, fonts } from '@/theme';

/**
 * Figma CONFETTI interstitial: confetti burst, then the message (Urbanist Medium 18) fades in
 * just below centre ("Looking good!", "You're verified!", "Lifestyle, understood." …).
 */
export default function Celebrate() {
  const { title = 'Done!', next = '/' } = useLocalSearchParams<{ title?: string; next?: string }>();
  const [fade] = useState(() => new Animated.Value(0));
  const go = () => router.replace(next as never);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, delay: 350, useNativeDriver: true }).start();
    const t = setTimeout(go, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={st.root} onPress={go} accessibilityHint="Tap to continue">
      <Confetti />
      <Animated.Text
        accessibilityLiveRegion="polite"
        style={[st.text, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
        {title}
      </Animated.Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  text: { fontFamily: fonts.headingMedium, fontSize: 18, lineHeight: 24, color: colors.grey900, textAlign: 'center', marginTop: 180 },
});
