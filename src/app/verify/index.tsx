import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Header, LinkButton, Screen, T } from '@/components/ui';
import { finishVerification } from '@/components/verifyFlow';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export default function VerificationIntro() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const v = useApp((s) => s.verification);
  const items = [
    { key: 'photo' as const, icon: 'face-recognition' as const, title: 'Photo verification', sub: 'A quick selfie check that you match your photos. Takes a minute.' },
    { key: 'identity' as const, icon: 'card-account-details-outline' as const, title: 'Identity verification', sub: 'A government ID check. Not shown on your profile.' },
  ];
  const next = v.photo === 'none' || v.photo === 'rejected' ? 'photo' : 'identity';
  return (
    <Screen
      scroll
      footer={
        <>
          <Button title="Verify now" onPress={() => router.push({ pathname: `/verify/${next}`, params: from ? { from } : {} })} />
          <LinkButton title="Later" onPress={() => finishVerification(!!from)} />
        </>
      }>
      <Header title="Build trust from the start." onBack={from ? undefined : () => router.back()} />
      <T v="bodyL" color={colors.grey700} style={{ marginTop: 24, marginBottom: 24, lineHeight: 20 }}>
        {"Verification helps people feel more confident about who they're meeting."}
      </T>
      <View style={{ gap: 12 }}>
        {items.map((i) => (
          <View key={i.key} style={st.card}>
            <MaterialCommunityIcons name={i.icon} size={20} color="#000" />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={st.title}>{i.title}</Text>
                {v[i.key] !== 'none' ? (
                  <Text style={[st.state, { color: v[i.key] === 'verified' ? colors.green : v[i.key] === 'rejected' ? colors.red : colors.orange }]}>
                    {v[i.key] === 'verified' ? 'Verified' : v[i.key] === 'rejected' ? 'Try again' : 'Pending'}
                  </Text>
                ) : null}
              </View>
              <T v="body" color={colors.grey600}>
                {i.sub}
              </T>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { minHeight: 96, backgroundColor: colors.base, borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 20, color: colors.grey900 },
  state: { fontFamily: fonts.bodySemi, fontSize: 12 },
});
