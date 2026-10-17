import { router } from 'expo-router';

import { useApp } from '@/store/useApp';

/** Leaves the verification chapter: into the app after onboarding, or back to Settings. */
export function finishVerification(fromSettings: boolean) {
  if (fromSettings) {
    router.dismissTo('/settings/verification');
    return;
  }
  useApp.getState().setStage('home');
  router.replace({ pathname: '/celebrate', params: { title: "You're all set!", next: '/(tabs)' } });
}
