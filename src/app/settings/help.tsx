import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable } from 'react-native';

import { Button, Card, Header, Row, Screen, T } from '@/components/ui';
import { colors } from '@/theme';

const FAQ = [
  ['How are introductions chosen?', 'Mirror uses the type you described, what matters most to you and the choices you make. Every introduction comes with a "Why you two?" explanation.'],
  ['When do I get new introductions?', 'Free: a new set every 24 hours. Mirror+: about every 8 hours. Premium: about every 5 hours.'],
  ['What does "Not for me" do?', 'It passes on the introduction. Telling us why is optional and only affects who you’re shown next.'],
  ['How do Stars work?', 'Stay active seven days in a row to earn a Star (Strong Interest). It’s a free reward — no purchase required.'],
  ['How do I cancel my subscription?', 'Profile → Manage subscription → Cancel subscription. You keep paid features until the end of the billing period.'],
  ['Is my verification data shown?', 'No. We only store a verified / not-verified result. Your ID and selfie are never shown on your profile.'],
];

export default function Help() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen scroll>
      <Header title="Help" />
      {FAQ.map(([q, a], i) => (
        <Card key={q} style={{ marginBottom: 10 }}>
          <Pressable onPress={() => setOpen(open === i ? null : i)} accessibilityRole="button" accessibilityState={{ expanded: open === i }}>
            <Row>
              <T v="bodyS" style={{ flex: 1 }}>
                {q}
              </T>
              <Feather name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.grey600} />
            </Row>
          </Pressable>
          {open === i ? (
            <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
              {a}
            </T>
          ) : null}
        </Card>
      ))}
      <Button title="Contact support" style={{ marginTop: 12 }} onPress={() => Linking.openURL('mailto:support@mirror.app?subject=Help%20with%20Mirror')} />
      <Button title="Terms & Privacy" variant="ghost" onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} />
    </Screen>
  );
}
