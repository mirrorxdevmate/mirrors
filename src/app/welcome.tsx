import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, LinkButton, T } from '@/components/ui';
import { WELCOME_PHOTO } from '@/data/profiles';
import { colors, fonts } from '@/theme';

export default function Welcome() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.grey900 }}>
      <StatusBar style="light" />
      <Image source={WELCOME_PHOTO} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.85)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
        <View style={{ marginTop: 60 }}>
          <T v="h1" color={colors.white} accessibilityRole="header">
            Mirror
          </T>
          <T v="caption" color={colors.primary} style={{ fontFamily: fonts.display, fontSize: 14 }}>
            Meet people, on purpose.
          </T>
          <T v="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 12, maxWidth: 280 }}>
            Find better matches. Understand compatibility. Connect with confidence.
          </T>
        </View>
        <View style={{ flex: 1 }} />
        <Button title="Continue with email" onPress={() => router.push('/email')} />
        <LinkButton title="I already have an account" color={colors.white} onPress={() => router.push('/email')} />
        <Text style={st.legal}>
          By signing up, you agree to our{' '}
          <Text style={st.link} onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}>
            Terms & Conditions
          </Text>
          . See how we collect, use, and protect your data in our{' '}
          <Text style={st.link} onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}>
            Privacy Policy
          </Text>
          .
        </Text>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  legal: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8, marginBottom: 8 },
  link: { textDecorationLine: 'underline', color: colors.white },
});
