import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Confetti } from '@/components/overlays';
import { Avatar } from '@/components/profile';
import { Button, Card, CircleButton, Row, Screen, T } from '@/components/ui';
import { usePerson } from '@/hooks/usePerson';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function Match() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { person: p } = usePerson(id);
  const me = useApp((s) => s.profile);
  const type = useApp((s) => s.type);
  if (!p) return null;
  const common = [
    `Both looking for a ${p.intent.toLowerCase()}`,
    p.values.includes('Family') ? 'Family is a priority for you both' : `You both value ${p.values[0].toLowerCase()}`,
    type.mattersMost.includes('Communication') ? 'You both ranked communication in your top 3' : `You both enjoy ${p.hobbies[0].toLowerCase()}`,
  ];
  return (
    <Screen footer={<Button title="Message" onPress={() => router.replace(`/chat/${p.id}`)} />}>
      <Row style={{ justifyContent: 'flex-end', paddingTop: 8 }}>
        <CircleButton label="Close" icon={<Feather name="x" size={18} color={colors.grey900} />} onPress={() => router.back()} />
      </Row>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Row style={{ justifyContent: 'center', marginBottom: 24 }} gap={0}>
          <View style={{ transform: [{ rotate: '-6deg' }], marginRight: -18 }}>
            <Avatar uri={me.photos[0]} size={110} ring />
          </View>
          <View style={{ transform: [{ rotate: '6deg' }] }}>
            <Avatar uri={p.photos[0]} size={110} ring />
          </View>
        </Row>
        <T v="display" center>
          You both chose to meet.
        </T>
        <T v="overline" color={colors.grey600} center style={{ marginTop: 28, marginBottom: 10 }}>
          Things you already have in common
        </T>
        {common.map((c) => (
          <Card key={c} style={{ marginBottom: 8 }}>
            <Row>
              <Feather name="check" size={16} color={colors.primary} />
              <T v="body" style={{ flex: 1 }}>
                {c}
              </T>
            </Row>
          </Card>
        ))}
      </View>
      <Confetti />
    </Screen>
  );
}
