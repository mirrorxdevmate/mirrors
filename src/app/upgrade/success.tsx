import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Confetti } from '@/components/overlays';
import { Button, Card, Row, Screen, T } from '@/components/ui';
import { FEATURES, PLAN_LABEL, useCheckout } from '@/store/checkout';
import { colors } from '@/theme';

export default function PurchaseSuccess() {
  const item = useCheckout((s) => s.item);
  const then = useCheckout((s) => s.then);
  if (!item) return null;

  const finish = () => {
    useCheckout.getState().set({ item: null, then: null });
    router.dismissAll();
    if (item.kind === 'boost') router.push({ pathname: '/boost', params: { purchased: '1' } });
    else router.navigate({ pathname: '/(tabs)', params: then === 'rewind' ? { notice: 'rewind' } : {} });
  };

  return (
    <Screen footer={<Button title={item.kind === 'boost' ? 'Use my Boost' : 'Start exploring'} onPress={finish} />}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <T v="display" center>
          {item.kind === 'plan' ? `Welcome to ${PLAN_LABEL[item.plan]}` : 'Boosts added'}
        </T>
        {item.kind === 'plan' ? (
          <>
            <T v="overline" color={colors.grey600} center style={{ marginTop: 24, marginBottom: 10 }}>
              You&apos;ve unlocked
            </T>
            <Card style={{ gap: 10 }}>
              {FEATURES[item.plan].map((f) => (
                <Row key={f}>
                  <Feather name="check" size={16} color={colors.primary} />
                  <T v="body">{f}</T>
                </Row>
              ))}
            </Card>
          </>
        ) : (
          <T v="body" center color={colors.grey700} style={{ marginTop: 12 }}>
            {item.count} Boost{item.count > 1 ? 's are' : ' is'} ready. A receipt has been sent to your email.
          </T>
        )}
      </View>
      <Confetti />
    </Screen>
  );
}
