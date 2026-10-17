import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, gradients } from '@/theme';

export default function Greeting() {
  const setStage = useApp((s) => s.setStage);
  return (
    <LinearGradient colors={gradients.greeting} locations={[0, 0.3, 0.5, 0.75, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
        <T v="display" color={colors.white} center accessibilityRole="header">
          Welcome to Mirror
        </T>
        <T v="h4" color={colors.white} center style={{ marginTop: 36 }}>
          To every soul seeking connection through these screens:
        </T>
        <T v="body" color="rgba(255,255,255,0.9)" center style={{ marginTop: 16 }}>
          May Mirror be a doorway to genuine love, deeper understanding, and lasting joy.{'\n'}May every tap carry respect, every message begin
          with honesty, and every connection honor the person behind the screen.
        </T>
        <View style={{ height: 40 }} />
        <Button
          title="Begin"
          variant="secondary"
          style={{ paddingHorizontal: 48 }}
          onPress={() => {
            setStage('basics');
            router.replace('/onboarding/birthday');
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
