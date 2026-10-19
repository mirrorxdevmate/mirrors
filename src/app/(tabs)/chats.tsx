import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/overlays';
import { Verified } from '@/components/profile';
import { Button, Row, Screen, T, Toggle } from '@/components/ui';
import type { Profile } from '@/data/profiles';
import { getLikes, getMatches, onMessages, type MatchRow } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

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
      <Row style={{ paddingHorizontal: 16, marginTop: 12, height: 24 }}>
        <Text style={[st.h1, { flex: 1 }]} accessibilityRole="header">
          Chat
        </Text>
        <Pressable accessibilityLabel="Chat settings" hitSlop={10} onPress={() => setSettings(true)}>
          <Feather name="settings" size={16} color={colors.grey900} />
        </Pressable>
      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 20, paddingBottom: 16 }}>
        {people.map((p) => {
          const isNew = fresh.some((f) => f.id === p.id);
          return (
            <Pressable key={p.id} onPress={() => router.push(`/chat/${p.id}`)} style={{ alignItems: 'center', width: 60 }} accessibilityLabel={`${isNew ? 'New match ' : ''}${p.name}`}>
              <View style={[st.ring, isNew && { borderColor: colors.primary }]}>
                {p.photos[0] ? <Image source={p.photos[0]} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
              </View>
              {isNew ? (
                <View style={st.newBadge}>
                  <Text style={st.newText}>New</Text>
                </View>
              ) : null}
              <Row gap={2} style={{ marginTop: isNew ? 4 : 8 }}>
                <Text style={st.avatarName} numberOfLines={1}>
                  {p.name}
                </Text>
                {p.verified ? <Verified size={10} /> : null}
              </Row>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={st.panel}>
        <Text style={st.h2}>Messages</Text>
        <FlatList
          data={convos}
          keyExtractor={(r) => r.matchId}
          ItemSeparatorComponent={() => <View style={st.sep} />}
          ListHeaderComponent={
            likes.count ? (
              <>
                <Pressable style={st.row} onPress={() => router.navigate('/(tabs)/likes')} accessibilityRole="button">
                  <View>
                    {likes.photo ? <Image source={likes.photo} style={st.avatar} blurRadius={plan === 'free' ? 14 : 0} /> : <View style={[st.avatar, { backgroundColor: colors.grey300 }]} />}
                    <View style={[st.dot, { backgroundColor: colors.green }]} />
                  </View>
                  <Text style={st.rowName}>
                    {likes.name ?? 'Someone'}
                    {likes.count > 1 ? ` and ${likes.count - 1}+` : ''} <Text style={st.likesYou}>Likes you</Text>
                  </Text>
                </Pressable>
                {convos.length ? <View style={st.sep} /> : null}
              </>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 32 }}>
              <T v="bodyLM" center>
                {people.length ? 'Say hello to your matches above' : 'No conversations yet'}
              </T>
              <T v="body" center color={colors.grey700} style={{ marginTop: 6 }}>
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
              <Pressable style={st.row} onPress={() => router.push(`/chat/${p.id}`)} accessibilityRole="button" accessibilityLabel={`${p.name}${unread ? ', unread' : ''}: ${last.body}`}>
                <View>
                  {p.photos[0] ? <Image source={p.photos[0]} style={st.avatar} contentFit="cover" /> : <View style={[st.avatar, { backgroundColor: colors.grey300 }]} />}
                  {unread ? <View style={[st.dot, { backgroundColor: colors.red }]} /> : null}
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                  <Row gap={8}>
                    <Text style={st.rowName}>{p.name}</Text>
                    {p.verified ? <Verified size={14} /> : null}
                  </Row>
                  <Text style={[st.preview, unread && { color: colors.grey900 }]} numberOfLines={1}>
                    {last.fromMe ? 'You: ' : ''}
                    {last.body}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      <Sheet visible={settings} onClose={() => setSettings(false)} title="Chat Settings">
        <View style={st.setting}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={st.rowName}>Show verified chats only</Text>
            <Text style={st.preview}>Only show conversations with verified people.</Text>
          </View>
          <Toggle label="Show verified chats only" value={verifiedOnly} onChange={(v) => updateSettings({ verifiedChatsOnly: v })} />
        </View>
        <View style={{ height: 120 }} />
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
  h2: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: colors.grey900, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  ring: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: colors.base, overflow: 'hidden', backgroundColor: colors.grey200, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 2 },
  newBadge: { marginTop: -6, height: 16, paddingHorizontal: 5, borderRadius: 15, backgroundColor: colors.primary, justifyContent: 'center' },
  newText: { fontFamily: fonts.headingMedium, fontSize: 10, color: colors.white },
  avatarName: { fontFamily: fonts.headingMedium, fontSize: 12, lineHeight: 14, color: colors.grey900, maxWidth: 46 },
  panel: { flex: 1, backgroundColor: colors.base, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 93 },
  sep: { height: 1, backgroundColor: colors.white },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  dot: { position: 'absolute', right: -5, top: 25, width: 10, height: 10, borderRadius: 5 },
  rowName: { fontFamily: 'Urbanist_600SemiBold', fontSize: 16, lineHeight: 20, color: colors.grey900 },
  likesYou: { fontFamily: 'Urbanist_400Regular', fontSize: 14, color: colors.grey600 },
  preview: { fontFamily: 'Urbanist_400Regular', fontSize: 14, lineHeight: 20, color: colors.grey700 },
  setting: { minHeight: 80, borderRadius: 16, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
});
