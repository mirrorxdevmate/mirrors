import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T, tap } from '@/components/ui';
import { listenForNotificationTaps, registerForPush } from '@/lib/push';
import { getMatches, onMessages } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

const ICONS: Record<string, (c: string) => React.ReactNode> = {
  index: (c) => <MaterialCommunityIcons name="heart-multiple-outline" size={24} color={c} />,
  likes: (c) => <Feather name="user-plus" size={22} color={c} />,
  chats: (c) => <Feather name="message-circle" size={22} color={c} />,
  profile: (c) => <Feather name="user" size={22} color={c} />,
};
const LABELS: Record<string, string> = { index: 'Matches', likes: 'Likes', chats: 'Chat', profile: 'Profile' };

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unread = useApp((s) => s.unread);
  return (
    <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const color = focused ? colors.primary : colors.grey700;
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
            <View>
              {ICONS[route.name]?.(color)}
              {route.name === 'chats' && unread > 0 ? <View style={st.dot} /> : null}
            </View>
            <T v="caption" color={color} style={{ marginTop: 4 }}>
              {LABELS[route.name]}
            </T>
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
  bar: { flexDirection: 'row', backgroundColor: colors.white, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.grey300 },
  item: { flex: 1, alignItems: 'center' },
  dot: { position: 'absolute', right: -3, top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
});
