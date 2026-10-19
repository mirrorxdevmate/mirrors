import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Button } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

/** Figma GREETING: radial #E7947E → #480404 (ellipse derived from the Figma gradient transform). */
export function GreetingBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 430 932" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="g" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(407 376) rotate(118) scale(853 526)">
          <Stop offset="0" stopColor="#E7947E" />
          <Stop offset="1" stopColor="#480404" />
        </RadialGradient>
      </Defs>
      <Rect width="430" height="932" fill="url(#g)" />
    </Svg>
  );
}

export default function Greeting() {
  const setStage = useApp((s) => s.setStage);
  return (
    <View style={{ flex: 1, backgroundColor: '#8A3A2C' }}>
      <StatusBar style="light" />
      <GreetingBackground />
      <SafeAreaView style={st.body}>
        <Text style={st.title} accessibilityRole="header">
          Welcome to Mirror
        </Text>
        <Text style={st.lead}>To every soul seeking connection through these screens:</Text>
        <Text style={st.text}>
          May Mirror be a doorway to genuine love, deeper understanding, and lasting joy.{'\n'}May every tap carry respect, every message begin with
          honesty, and every connection honor the person behind the screen.
        </Text>
        <Button
          title="Begin"
          variant="secondary"
          style={{ width: 166, marginTop: 59 }}
          onPress={() => {
            setStage('basics');
            router.replace('/onboarding/birthday');
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 40 },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 40, color: colors.white, textAlign: 'center' },
  lead: { fontFamily: 'Urbanist_600SemiBold', fontSize: 18, lineHeight: 20, color: colors.white, textAlign: 'center', marginTop: 41 },
  text: { fontFamily: 'Urbanist_400Regular', fontSize: 16, lineHeight: 20, color: colors.white, textAlign: 'center', marginTop: 20 },
});
