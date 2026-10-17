import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/theme';

export default function PaymentFailed() {
  return (
    <Screen
      footer={
        <>
          <Button title="Try again" onPress={() => router.replace('/upgrade/processing')} />
          <Button title="Change payment method" variant="ghost" onPress={() => router.replace('/upgrade/payment')} />
        </>
      }>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Feather name="x" size={32} color={colors.red} />
        </View>
        <T v="h2" center>
          Your payment didn&apos;t go through.
        </T>
        <T v="body" center color={colors.grey700} style={{ marginTop: 8 }}>
          No charge was made. You can try again or use another payment method.
        </T>
      </View>
    </Screen>
  );
}
