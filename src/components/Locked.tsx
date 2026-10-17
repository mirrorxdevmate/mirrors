import { router } from 'expo-router';
import { View } from 'react-native';

import { colors, radius } from '@/theme';
import { Badge, Button, T } from './ui';

/** Upsell card shown in place of a paid feature's controls. */
export function Locked({ need, text, plan }: { need: 'plus' | 'premium'; text: string; plan?: 'plus' | 'premium' }) {
  return (
    <View style={{ backgroundColor: colors.secondary, borderRadius: radius.md, padding: 16, marginTop: 8 }}>
      <Badge kind={need} />
      <T v="body" style={{ marginTop: 8 }}>
        {text}
      </T>
      <Button title="See plans" small style={{ marginTop: 12, alignSelf: 'flex-start' }} onPress={() => router.push({ pathname: '/upgrade/plans', params: { plan: plan ?? need } })} />
    </View>
  );
}
