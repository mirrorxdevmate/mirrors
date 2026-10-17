import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Header, Screen, T, Title, ToggleRow } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function WhatOthersSee() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const setStage = useApp((s) => s.setStage);
  const [vis, setVis] = useState(profile.visibility);

  const rows = [
    { key: 'faith', label: 'Faith', value: profile.faith || 'Not set' },
    { key: 'children', label: 'Children', value: profile.children || 'Not set' },
    { key: 'culture', label: 'Cultural background', value: profile.culture.join(' · ') || 'Not set' },
  ];

  const save = () => {
    updateProfile({ visibility: vis });
    if (edit) return router.back();
    setStage('type');
    router.replace({ pathname: '/celebrate', params: { title: 'Lifestyle, understood.', next: '/type/describe' } });
  };

  return (
    <Screen scroll footer={<Button title="Save" onPress={save} />}>
      {edit ? <Header /> : <View style={{ height: 16 }} />}
      <Title sub="Anything can be used for matching without being shown. Nothing sensitive is shown unless you choose.">What appears on your profile?</Title>
      {rows.map((r) => (
        <Card key={r.key} style={{ marginBottom: 12 }}>
          <T v="overline" color={colors.primary}>
            {r.label}
          </T>
          <T v="bodyM" style={{ marginTop: 2, marginBottom: 4 }}>
            {r.value}
          </T>
          <ToggleRow label="Show on my profile" value={vis[r.key]?.show ?? true} onChange={(show) => setVis({ ...vis, [r.key]: { ...vis[r.key], show } })} />
          <ToggleRow label="Use for matching" value={vis[r.key]?.match ?? true} onChange={(match) => setVis({ ...vis, [r.key]: { ...vis[r.key], match } })} />
        </Card>
      ))}
    </Screen>
  );
}
