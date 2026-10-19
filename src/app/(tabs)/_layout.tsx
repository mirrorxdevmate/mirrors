import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/appIcons';
import { tap } from '@/components/ui';
import { listenForNotificationTaps, registerForPush } from '@/lib/push';
import { getMatches, onMessages } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

const ICONS: Record<string, (on: boolean) => React.ReactNode> = {
  index: (on) => <AppIcon name={on ? 'navMatches' : 'navMatchesOff'} height={18} />,
  likes: (on) => <AppIcon name="navLikes" height={18} color={on ? colors.primary : undefined} />,
  chats: (on) => <AppIcon name={on ? 'navChatOn' : 'navChat'} height={20} />,
  profile: (on) => <AppIcon name={on ? 'navProfileOn' : 'navProfile'} height={20} />,
};
const LABELS: Record<string, string> = { index: 'Matches', likes: 'Likes', chats: 'Chat', profile: 'Profile' };

/** Figma "Navbar": white, 16px padding, icon over Inter 14 label; active = coral Medium, inactive = #131821 at 70%. */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unread = useApp((s) => s.unread);
  return (
    <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 12) }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[route.name]}
            style={st.item}
            onPress={() => {
              tap();
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}>
            <View style={{ height: 22, justifyContent: 'flex-end' }}>
              {ICONS[route.name]?.(focused)}
              {route.name === 'chats' && unread > 0 ? <View style={st.dot} /> : null}
            </View>
            <Text style={[st.label, focused ? st.labelOn : null]}>{LABELS[route.name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Keeps the Chat tab badge live: unread messages + brand-new matches. */
function useUnreadBadge() {
  useEffect(() => {
    const refresh = () =>
      getMatches()
        .then((rows) => {
          const st = useApp.getState();
          st.set({
            unread: rows.reduce((n, r) => n + r.unread + (r.last ? 0 : 1), 0),
            matchIds: { ...st.matchIds, ...Object.fromEntries(rows.map((r) => [r.card.id, r.matchId])) },
          });
        })
        .catch(() => {});
    refresh();
    const off = onMessages((m) => {
      if (m.sender_id !== useApp.getState().userId) refresh();
    });
    return off;
  }, []);
}

function usePushNotifications() {
  const userId = useApp((s) => s.userId);
  useEffect(() => {
    if (userId) registerForPush(userId);
  }, [userId]);
  useEffect(() => listenForNotificationTaps(), []);
}

export default function TabsLayout() {
  useUnreadBadge();
  usePushNotifications();
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="likes" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.white, paddingTop: 16, paddingHorizontal: 16 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.grey900, opacity: 0.7 },
  labelOn: { fontFamily: fonts.bodyMedium, color: colors.primary, opacity: 1 },
  dot: { position: 'absolute', right: -3, top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
});
