import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Show notifications while the app is open, too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const projectId: string | undefined = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

/** Asks permission (once) and stores this device's Expo push token for the signed-in user. */
export async function registerForPush(userId: string) {
  if (Platform.OS === 'web' || !Device.isDevice || !projectId) return; // simulators / web can't receive pushes
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Mirror', importance: Notifications.AndroidImportance.HIGH, lightColor: '#E07A5F' });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from('push_tokens').upsert({ token, user_id: userId, platform: Platform.OS, updated_at: new Date().toISOString() });
  } catch (e) {
    console.warn('push registration failed', e);
  }
}

/** Opens the screen a notification points to (data.url), including when the app was launched by it. */
export function listenForNotificationTaps() {
  const open = (r: Notifications.NotificationResponse | null) => {
    const url = r?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.push(url as never);
  };
  Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(open);
  return () => sub.remove();
}

const BATCH_ID = 'next-batch';

/** Local reminder when the next set of introductions is ready (no server needed). */
export async function scheduleBatchReady(at: number, enabled: boolean) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(BATCH_ID).catch(() => {});
  if (!enabled || at <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: BATCH_ID,
    content: { title: 'Your next introductions are ready', body: 'New people Mirror thinks you should meet.', data: { url: '/' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
  }).catch(() => {});
}

/** Removes this device's token on sign-out so the next user doesn't get these notifications. */
export async function unregisterPush() {
  if (Platform.OS === 'web' || !Device.isDevice || !projectId) return;
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from('push_tokens').delete().eq('token', token);
  } catch {
    // ignore
  }
}
