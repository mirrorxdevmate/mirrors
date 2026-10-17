import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Header, Row, Screen, T, Title } from '@/components/ui';
import { finishVerification } from '@/components/verifyFlow';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function VerificationIntro() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const v = useApp((s) => s.verification);
  const items = [
    { key: 'photo' as const, icon: 'camera' as const, title: 'Photo verification', sub: 'A quick selfie check that you match your photos. Takes a minute.' },
    { key: 'identity' as const, icon: 'credit-card' as const, title: 'Identity verification', sub: 'A government ID check. Not shown on your profile.' },
  ];
  const next = v.photo === 'none' ? 'photo' : 'identity';
  return (
    <Screen
      scroll
      footer={
        <>
          <Button title="Verify now" onPress={() => router.push({ pathname: `/verify/${next}`, params: from ? { from } : {} })} />
          {from ? <Button title="Later" variant="ghost" onPress={() => finishVerification(true)} /> : null}
        </>
      }>
      {from ? <Header /> : <View style={{ height: 16 }} />}
      <Title sub="Everyone on Mirror completes both checks. It helps people feel confident about who they're meeting.">Build trust from the start.</Title>
      {items.map((i) => (
        <Card key={i.key} style={{ marginBottom: 12 }}>
          <Row gap={12} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={i.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Row>
                <T v="bodyS" style={{ flex: 1 }}>
                  {i.title}
                </T>
                {v[i.key] !== 'none' ? (
                  <T v="captionM" color={v[i.key] === 'verified' ? colors.green : colors.amber}>
                    {v[i.key] === 'verified' ? 'Verified' : 'Pending'}
                  </T>
                ) : null}
              </Row>
              <T v="body" color={colors.grey700} style={{ marginTop: 2 }}>
                {i.sub}
              </T>
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
