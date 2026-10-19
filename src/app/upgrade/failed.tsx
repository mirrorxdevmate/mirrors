import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen, T } from '@/components/ui';
import { colors, fonts } from '@/theme';

export default function PaymentFailed() {
  return (
    <Screen
      footer={
        <>
          <Button title="Try again" onPress={() => router.replace('/upgrade/processing')} />
          <Button title="Change payment method" variant="outline" onPress={() => router.replace('/upgrade/payment')} />
        </>
      }>
      <View style={st.center}>
        <View style={st.icon}>
          <Feather name="rotate-cw" size={16} color={colors.grey900} />
        </View>
        <Text style={st.title}>{"Your payment didn't go through."}</Text>
        <T v="body" center color={colors.grey700} style={{ marginTop: 12, paddingHorizontal: 24 }}>
          No charge was made. You can try again or use another payment method.
        </T>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  icon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.grey900, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, textAlign: 'center' },
});
