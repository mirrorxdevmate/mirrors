import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spinner } from '@/components/Spinner';
import { Button, Screen, T } from '@/components/ui';
import { charge } from '@/services/api';
import { useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export default function Processing() {
  useEffect(() => {
    const { item, method } = useCheckout.getState();
    if (!item) return router.back();
    charge(item, method)
      .then(async () => {
        // The server applied the purchase; pull the new plan / boost balance.
        await useApp.getState().refreshAccount().catch(() => {});
        router.replace('/upgrade/success');
      })
      .catch(() => router.replace('/upgrade/failed'));
  }, []);

  return (
    <Screen
      footer={
        <>
          <Button title="Loading" loading />
          <T v="body" color={colors.grey700} center>
            Manage or cancel anytime in Settings.
          </T>
        </>
      }>
      <View style={st.center}>
        <Spinner />
        <Text style={st.title}>Completing your purchase…</Text>
        <T v="body" color={colors.grey700} center>
          {"Please keep the app open. Don't press back."}
        </T>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 120 },
  title: { fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 24, color: colors.grey900, marginTop: 16 },
});
