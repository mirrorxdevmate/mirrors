import { router } from 'expo-router';
import { useEffect } from 'react';

import { Loading, Screen, T } from '@/components/ui';
import { charge } from '@/services/api';
import { useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

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
    <Screen>
      <Loading label="Completing your purchase…" sub="Please keep the app open. Don't press back." />
      <T v="caption" color={colors.grey600} center style={{ marginBottom: 12 }}>
        Manage or cancel anytime in Settings.
      </T>
    </Screen>
  );
}
