import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Dialog, Sheet, Tooltip } from '@/components/overlays';
import { Avatar } from '@/components/profile';
import { BackButton, Button, Chip, ListRow, Row, Screen, T, VerifiedTick } from '@/components/ui';
import { usePerson } from '@/hooks/usePerson';
import * as api from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, fonts, radius } from '@/theme';

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

  return (
    <Screen pad={false} edges={['top', 'bottom']}>
      <Row gap={10} style={st.header}>
        <BackButton />
        <Pressable onPress={() => router.push(`/profile-view/${p.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }} accessibilityRole="button" accessibilityLabel={`View ${p.name}'s profile`}>
          <Avatar uri={p.photos[0]} size={36} />
          <T v="h3">{p.name}</T>
          {p.verified ? <VerifiedTick /> : null}
        </Pressable>
        <Pressable accessibilityLabel="Connection and safety" hitSlop={10} onPress={() => setMenu('safety')}>
          <Feather name="more-vertical" size={22} color={colors.grey900} />
        </Pressable>
      </Row>

      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          loading ? null : <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <T v="body" color={colors.grey600} center style={{ marginBottom: 12 }}>
              Start with something real. Try one of these:
            </T>
            <View style={{ gap: 8, alignItems: 'center' }}>
              {PROMPTS.map((q) => (
                <Chip key={q} label={q} onPress={() => setText(q)} />
              ))}
            </View>
          </View>
        }
        ListFooterComponent={
          loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} /> : null
        }
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
        <Row style={st.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={colors.grey500}
            style={st.input}
            multiline
            maxLength={1000}
            accessibilityLabel="Message"
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Send" disabled={!text.trim() || sending || !matchId} onPress={() => send(text)} style={[st.send, (!text.trim() || !matchId) && { opacity: 0.4 }]}>
            <Feather name="send" size={18} color={colors.white} />
          </Pressable>
        </Row>
      )}

      <Tooltip visible={!!toast} text={toast} onHide={() => setToast('')} top={70} />

      <Sheet visible={menu === 'safety'} onClose={close} title="Connection & safety">
        <ListRow label="Feedback" onPress={() => setMenu('feedback')} />
        <ListRow label="Trust Signals" onPress={() => { close(); router.push({ pathname: '/safety/trust', params: { id } }); }} />
        <ListRow label="Remove Connection" onPress={() => setMenu('remove')} />
        <ListRow label="Report" danger onPress={() => { close(); router.push({ pathname: '/safety/report', params: { id } }); }} />
        <ListRow label="Block" danger last onPress={() => setMenu('block')} />
      </Sheet>

      <Sheet visible={menu === 'feedback'} onClose={close} title="Feedback">
        <T v="h4">How was your conversation?</T>
        <T v="body" color={colors.grey700} style={{ marginTop: 4, marginBottom: 16 }}>
          Your feedback helps Mirror understand which connections feel meaningful and improve future introductions.
        </T>
        <Row gap={10}>
          {(['good', 'bad'] as const).map((r) => (
            <Button
              key={r}
              title={r === 'good' ? 'Good' : 'Bad'}
              variant={r === 'good' ? 'primary' : 'secondary'}
              style={{ flex: 1 }}
              icon={<Feather name={r === 'good' ? 'thumbs-up' : 'thumbs-down'} size={16} color={r === 'good' ? colors.white : colors.grey900} />}
              onPress={async () => {
                close();
                setToast('Thanks — that helps.');
                await api.submitFeedback(id, r).catch(() => {});
              }}
            />
          ))}
        </Row>
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
  header: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.grey300 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.base, borderBottomLeftRadius: 4 },
  composer: { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.grey300, alignItems: 'flex-end' },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: colors.base, borderRadius: radius.lg, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontFamily: fonts.body, fontSize: 15, color: colors.grey900 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
