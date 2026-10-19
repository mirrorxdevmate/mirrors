import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Dialog, Sheet, Tooltip } from '@/components/overlays';
import { ChevronLeft } from '@/components/icons';
import { Avatar, Verified } from '@/components/profile';
import { BackButton, CircleButton, Row, Screen, T } from '@/components/ui';
import { usePerson } from '@/hooks/usePerson';
import * as api from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

const PROMPTS = ['What does being close to family look like to you?', "What's something you're proud of this year?", 'What does a perfect weekend look like?'];
const acknowledged = new Set<string>();

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { person: p } = usePerson(id);
  const me = useApp((s) => s.userId);
  const cachedMatchId = useApp((s) => s.matchIds[id]);
  const [matchId, setMatchId] = useState<string | null>(cachedMatchId ?? null);
  const [messages, setMessages] = useState<api.ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState<null | 'safety' | 'feedback' | 'remove' | 'block'>(null);
  const [toast, setToast] = useState('');
  const list = useRef<FlatList>(null);

  useEffect(() => {
    if (p?.patternFlag && !acknowledged.has(p.id)) {
      acknowledged.add(p.id);
      router.push({ pathname: '/safety/pattern', params: { id: p.id } });
    }
  }, [p]);

  // Resolve the match for this person (new matches may not be cached yet).
  useEffect(() => {
    if (matchId) return;
    api
      .getMatches()
      .then((rows) => {
        const row = rows.find((r) => r.card.id === id);
        if (row) setMatchId(row.matchId);
        else {
          setEnded(true);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [id, matchId]);

  const addMessage = useCallback((m: api.ChatMessage) => {
    setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m].sort((a, b) => a.created_at.localeCompare(b.created_at))));
  }, []);

  // History + live updates.
  useEffect(() => {
    if (!matchId) return;
    let alive = true;
    api
      .getMessages(matchId)
      .then((rows) => alive && setMessages(rows))
      .catch(() => alive && setToast("Couldn't load messages."))
      .finally(() => alive && setLoading(false));
    api.markRead(matchId).catch(() => {});
    const off = api.onMessages((m) => {
      addMessage(m);
      if (m.sender_id !== useApp.getState().userId) api.markRead(matchId).catch(() => {});
    }, matchId);
    return () => {
      alive = false;
      off();
    };
  }, [matchId, addMessage]);

  if (!p)
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </Screen>
    );

  const send = async (body: string) => {
    const t = body.trim();
    if (!t || !matchId || sending) return;
    setSending(true);
    setText('');
    try {
      addMessage(await api.sendMessage(matchId, t));
    } catch (e) {
      setText(t);
      setToast(e instanceof Error ? e.message : 'Message not sent.');
    } finally {
      setSending(false);
    }
  };

  const close = () => setMenu(null);

  const SAFETY = [
    { key: 'feedback', icon: 'message-square', label: 'Feedback' },
    { key: 'trust', icon: 'shield', label: 'Trust Signals' },
    { key: 'remove', icon: 'x-circle', label: 'Remove Connection' },
    { key: 'report', icon: 'flag', label: 'Report' },
    { key: 'block', icon: 'slash', label: 'Block' },
  ] as const;
  const pick = (k: (typeof SAFETY)[number]['key']) => {
    if (k === 'trust') {
      close();
      router.push({ pathname: '/safety/trust', params: { id } });
    } else if (k === 'report') {
      close();
      router.push({ pathname: '/safety/report', params: { id } });
    } else setMenu(k);
  };

  return (
    <Screen pad={false} edges={['top', 'bottom']}>
      <View style={st.header}>
        <BackButton />
        <Pressable onPress={() => router.push(`/profile-view/${p.id}`)} style={st.who} accessibilityRole="button" accessibilityLabel={`View ${p.name}'s profile`}>
          <Avatar uri={p.photos[0]} size={83} />
          <Row gap={8} style={{ marginTop: 8 }}>
            <Text style={st.name}>{p.name}</Text>
            {p.verified ? <Verified size={14} /> : null}
          </Row>
        </Pressable>
        <CircleButton label="Connection and safety" icon={<Feather name="more-horizontal" size={18} color={colors.grey900} />} onPress={() => setMenu('safety')} />
      </View>

      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 25, paddingBottom: 16, gap: 16, flexGrow: 1 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <T v="body" color={colors.grey600} center style={{ marginBottom: 12 }}>
                Start with something real. Try one of these:
              </T>
              <View style={{ gap: 8, alignItems: 'center' }}>
                {PROMPTS.map((q) => (
                  <Pressable key={q} onPress={() => setText(q)} accessibilityRole="button" style={st.prompt}>
                    <T v="body">{q}</T>
                  </Pressable>
                ))}
              </View>
            </View>
          )
        }
        ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} /> : sending ? <View style={st.typing} /> : null}
        renderItem={({ item }) => (
          <View style={[st.bubble, item.sender_id === me ? st.mine : st.theirs]}>
            <T v="body" color={item.sender_id === me ? colors.white : colors.grey900}>
              {item.body}
            </T>
          </View>
        )}
      />

      {ended ? (
        <T v="body" color={colors.grey600} center style={{ padding: 16 }}>
          This conversation has ended.
        </T>
      ) : (
        <View style={st.composer}>
          <View style={st.inputWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={colors.grey600}
              style={[st.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
              multiline
              maxLength={1000}
              accessibilityLabel="Message"
            />
            <Feather name="mic" size={16} color={colors.grey600} />
            <Feather name="camera" size={16} color={colors.grey600} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Send" disabled={!text.trim() || sending || !matchId} onPress={() => send(text)} style={({ pressed }) => [st.send, pressed && { opacity: 0.8 }]}>
            <Feather name="arrow-up" size={18} color={colors.grey100} />
          </Pressable>
        </View>
      )}

      <Tooltip visible={!!toast} text={toast} onHide={() => setToast('')} top={70} />

      <Sheet visible={menu === 'safety'} onClose={close} title="Connection & safety">
        <View style={{ gap: 14 }}>
          {SAFETY.map((r) => (
            <Pressable key={r.key} accessibilityRole="button" onPress={() => pick(r.key)} style={({ pressed }) => [st.menuRow, pressed && { opacity: 0.7 }]}>
              <Feather name={r.icon} size={16} color={colors.grey900} />
              <T v="body" style={{ flex: 1 }}>
                {r.label}
              </T>
              <Feather name="chevron-right" size={16} color={colors.grey900} />
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet visible={menu === 'feedback'} onClose={close}>
        <Row gap={12}>
          <CircleButton size={34} label="Back" icon={<ChevronLeft />} onPress={() => setMenu('safety')} />
          <Text style={st.sheetSmallTitle}>Feedback</Text>
        </Row>
        <Text style={[st.sheetTitle, { marginTop: 24 }]}>How was your conversation?</Text>
        <T v="body" color={colors.grey700} style={{ marginTop: 12, marginBottom: 50 }}>
          Your feedback helps Mirror understand which connections feel meaningful and improve future introductions.
        </T>
        <View style={{ gap: 14, marginBottom: 20 }}>
          {(['good', 'bad'] as const).map((r) => (
            <Pressable
              key={r}
              accessibilityRole="button"
              style={({ pressed }) => [st.menuRow, { paddingLeft: 8 }, pressed && { opacity: 0.7 }]}
              onPress={async () => {
                close();
                setToast('Thanks — that helps.');
                await api.submitFeedback(id, r).catch(() => {});
              }}>
              <View style={[st.fbIcon, { backgroundColor: r === 'good' ? colors.green : colors.red }]}>
                <Feather name={r === 'good' ? 'thumbs-up' : 'thumbs-down'} size={14} color={colors.white} />
              </View>
              <Text style={[st.fbLabel, { color: r === 'good' ? colors.green : colors.red }]}>{r === 'good' ? 'Good' : 'Bad'}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Dialog
        visible={menu === 'remove'}
        title={`Remove ${p.name}?`}
        message="You'll no longer see each other or be able to message. This can't be undone."
        destructive
        primary={{ label: 'Remove connection', onPress: async () => { close(); await api.endMatch(id).catch(() => {}); router.back(); } }}
        secondary={{ label: 'Cancel', onPress: close }}
        onClose={close}
      />
      <Dialog
        visible={menu === 'block'}
        title={`Block ${p.name}?`}
        message="They won't be able to see your profile or message you. They won't be told."
        destructive
        primary={{ label: 'Block', onPress: async () => { close(); await api.blockUser(id).catch(() => {}); router.back(); } }}
        secondary={{ label: 'Cancel', onPress: close }}
        onClose={close}
      />
    </Screen>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  who: { alignItems: 'center', marginTop: -10 },
  name: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 20, color: colors.grey900 },
  bubble: { maxWidth: 338, paddingHorizontal: 9, paddingVertical: 15, borderRadius: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 3 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.base, borderBottomLeftRadius: 3 },
  typing: { alignSelf: 'flex-end', width: 201, height: 35, borderRadius: 10, backgroundColor: colors.primary, opacity: 0.25, marginTop: 16 },
  prompt: { borderRadius: 360, borderWidth: 1, borderColor: colors.grey500, paddingHorizontal: 16, paddingVertical: 10 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingLeft: 11, paddingRight: 10, paddingTop: 10, paddingBottom: 10 },
  inputWrap: { flex: 1, minHeight: 55, borderRadius: 28, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 26, gap: 10 },
  input: { flex: 1, maxHeight: 120, paddingTop: 18, paddingBottom: 18, fontFamily: fonts.body, fontSize: 14, color: colors.grey900 },
  send: { width: 55, height: 55, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  menuRow: { minHeight: 50, borderRadius: 360, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
  sheetSmallTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.grey900 },
  fbIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  fbLabel: { fontFamily: fonts.bodySemi, fontSize: 14 },
});
