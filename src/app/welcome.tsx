import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MirrorLogo } from '@/components/icons';
import { Button } from '@/components/ui';
import { colors, fonts } from '@/theme';

// Still frame of the welcome video. Swap for <VideoView> (expo-video) once the clip is delivered.
const BACKGROUND = require('../../assets/images/welcome-bg.jpg');

export default function Welcome() {
  return (
    <View style={{ flex: 1, backgroundColor: '#2A1E16' }}>
      <StatusBar style="light" />
      <Image source={BACKGROUND} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={st.brand}>
          <MirrorLogo />
          <Text style={st.tagline}>Meet people, on purpose.</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ paddingHorizontal: 16 }}>
          <Button title="Continue with phone number" onPress={() => router.push('/phone')} />
        </View>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push({ pathname: '/phone', params: { returning: '1' } })} style={st.already}>
          <Text style={st.alreadyText}>I already have an account</Text>
        </Pressable>
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
  brand: { paddingHorizontal: 16, marginTop: 66 },
  tagline: { fontFamily: fonts.tagline, fontSize: 14, lineHeight: 16, color: colors.primary, marginTop: 13 },
  already: { alignSelf: 'center', marginTop: 11, paddingVertical: 5 },
  alreadyText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 16, color: colors.grey300, textDecorationLine: 'underline' },
  legal: { fontFamily: 'Urbanist_400Regular', fontSize: 12, lineHeight: 16, color: colors.grey300, textAlign: 'center', marginTop: 25, marginBottom: 22, paddingHorizontal: 16 },
  link: { textDecorationLine: 'underline' },
});
