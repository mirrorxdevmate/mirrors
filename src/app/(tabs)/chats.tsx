import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/overlays';
import { Avatar } from '@/components/profile';
import { Button, Row, Screen, T, ToggleRow, VerifiedTick } from '@/components/ui';
import type { Profile } from '@/data/profiles';
import { getLikes, getMatches, onMessages, type MatchRow } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, radius } from '@/theme';

export default function Chats() {
  const verifiedOnly = useApp((s) => s.settings.verifiedChatsOnly);
  const updateSettings = useApp((s) => s.updateSettings);
  const plan = useApp((s) => s.plan);
  const [settings, setSettings] = useState(false);
  const [rows, setRows] = useState<(MatchRow & { person: Profile })[]>([]);
  const [likes, setLikes] = useState<{ count: number; photo?: string; name?: string }>({ count: 0 });

  const load = useCallback(async () => {
    try {
      const [m, l] = await Promise.all([getMatches(), getLikes()]);
      const people = useApp.getState().cachePeople(m.map((r) => r.card));
      setRows(m.map((r, i) => ({ ...r, person: people[i] })));
      const st = useApp.getState();
      st.set({ matchIds: { ...st.matchIds, ...Object.fromEntries(m.map((r) => [r.card.id, r.matchId])) } });
      const first = l.items[0] as { photo?: string; name?: string; photos?: string[] } | undefined;
      setLikes({ count: l.count, photo: first?.photo ?? first?.photos?.[0], name: l.unlocked ? first?.name : undefined });
    } catch {
      // keep the last list if offline
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useEffect(() => onMessages(() => load()), [load]);

  const visible = useMemo(() => rows.filter((r) => !verifiedOnly || r.person.verified), [rows, verifiedOnly]);
  const people = visible.map((r) => r.person);
  const fresh = visible.filter((r) => !r.last).map((r) => r.person);
  const convos = visible.filter((r) => r.last);

  return (
    <Screen pad={false} edges={['top']}>
      <Row style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <T v="h2" style={{ flex: 1 }}>
          Chat
        </T>
        <Pressable accessibilityLabel="Chat settings" hitSlop={10} onPress={() => setSettings(true)}>
          <Feather name="settings" size={20} color={colors.grey900} />
        </Pressable>
      </Row>

      {fresh.length ? (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: 12 }}>
            {fresh.map((p) => (
              <Pressable key={p.id} onPress={() => router.push(`/chat/${p.id}`)} style={{ alignItems: 'center', width: 64 }} accessibilityLabel={`New match ${p.name}`}>
                <Avatar uri={p.photos[0]} size={60} ring />
                <Row gap={2} style={{ marginTop: 4 }}>
                  <T v="caption" numberOfLines={1}>
                    {p.name}
                  </T>
                  {p.verified ? <VerifiedTick size={12} /> : null}
                </Row>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={st.panel}>
        <T v="h3" style={{ padding: 16, paddingBottom: 8 }}>
          Messages
        </T>
        <FlatList
          data={convos}
          keyExtractor={(r) => r.matchId}
          ListHeaderComponent={
            likes.count ? (
              <Pressable style={st.row} onPress={() => router.navigate('/(tabs)/likes')} accessibilityRole="button">
                <View>
                  {likes.photo ? <Image source={likes.photo} style={{ width: 52, height: 52, borderRadius: 26 }} blurRadius={plan === 'free' ? 14 : 0} /> : null}
                  <View style={st.online} />
                </View>
                <T v="bodyS">
                  {likes.name ?? 'Someone'}
                  {likes.count > 1 ? ` and ${likes.count - 1}+` : ''}{' '}
                  <T v="caption" color={colors.grey600}>
                    Likes you
                  </T>
                </T>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 32 }}>
              <Feather name="message-circle" size={36} color={colors.grey400} />
              <T v="h4" center style={{ marginTop: 12 }}>
                {people.length ? 'Say hello to your matches above' : 'No conversations yet'}
              </T>
              <T v="body" center color={colors.grey600} style={{ marginTop: 6 }}>
                {people.length ? 'Tap a match to start a conversation.' : 'When you both choose to meet, you can chat here.'}
              </T>
              {!people.length ? <Button title="See introductions" small style={{ marginTop: 16 }} onPress={() => router.navigate('/(tabs)')} /> : null}
            </View>
          }
          renderItem={({ item: r }) => {
            const p = r.person;
            const last = r.last!;
            const unread = r.unread > 0;
            return (
              <Pressable style={st.row} onPress={() => router.push(`/chat/${p.id}`)} accessibilityRole="button">
                <View>
                  <Avatar uri={p.photos[0]} size={52} />
                  {unread ? <View style={st.unread} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Row gap={4}>
                    <T v="bodyS">{p.name}</T>
                    {p.verified ? <VerifiedTick size={14} /> : null}
                  </Row>
                  <T v="caption" color={unread ? colors.grey900 : colors.grey600} numberOfLines={1} style={{ marginTop: 2 }}>
                    {last.fromMe ? 'You: ' : ''}
                    {last.body}
                  </T>
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      <Sheet visible={settings} onClose={() => setSettings(false)} title="Chat Settings">
        <ToggleRow label="Show verified chats only" sub="Only show conversations with verified people." value={verifiedOnly} onChange={(v) => updateSettings({ verifiedChatsOnly: v })} />
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  panel: { flex: 1, backgroundColor: colors.base, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.grey300 },
  online: { position: 'absolute', right: 0, top: 22, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.base },
  unread: { position: 'absolute', right: -1, top: 24, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.red, borderWidth: 2, borderColor: colors.base },
});
