import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Confetti } from '@/components/overlays';
import { Screen } from '@/components/ui';
import { usePerson } from '@/hooks/usePerson';
import * as api from '@/services/api';
import { photoUrl } from '@/lib/supabase';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

/** MATCH (mutual): both photos, what you share, and a composer to send the first message. */
export default function Match() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { person: p } = usePerson(id);
  const me = useApp((s) => s.profile);
  const type = useApp((s) => s.type);
  const matchId = useApp((s) => s.matchIds[id]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  if (!p) return null;
  const common = [
    `Both looking for a ${p.intent.toLowerCase()}`,
    p.values.includes('Family') ? 'Family is a priority for you both' : `You both value ${(p.values[0] ?? 'honesty').toLowerCase()}`,
    type.mattersMost.includes('Communication') ? 'You both ranked communication in your top 3' : `You both enjoy ${(p.hobbies[0] ?? 'travel').toLowerCase()}`,
  ];

  const send = async () => {
    const t = text.trim();
    if (!t) return router.replace(`/chat/${p.id}`);
    setSending(true);
    try {
      if (matchId) await api.sendMessage(matchId, t);
    } catch {
      // the chat screen will show the composer again
    }
    router.replace(`/chat/${p.id}`);
  };

  return (
    <Screen
      footer={
        <View style={st.composer}>
          <View style={st.inputWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={colors.grey600}
              accessibilityLabel={`Message ${p.name}`}
              style={[st.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
              onSubmitEditing={send}
            />
            <Feather name="mic" size={16} color={colors.grey600} />
            <Feather name="camera" size={16} color={colors.grey600} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Send" disabled={sending} onPress={send} style={st.send}>
            <Feather name="arrow-up" size={18} color={colors.grey100} />
          </Pressable>
        </View>
      }>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={st.close} hitSlop={10}>
        <Feather name="x" size={20} color={colors.grey700} />
      </Pressable>
      <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 60 }}>
        <View style={st.pair}>
          <Image source={photoUrl(me.photos[0] ?? '')} style={[st.photo, { marginRight: -15 }]} contentFit="cover" />
          <Image source={p.photos[0]} style={[st.photo, st.second]} contentFit="cover" />
        </View>
        <Text style={st.title} accessibilityRole="header">
          You both chose to meet.
        </Text>
        <View style={{ marginTop: 25, gap: 8, alignItems: 'center' }}>
          <Text style={st.k}>THINGS YOU ALREADY HAVE IN COMMON</Text>
          {common.map((c) => (
            <Text key={c} style={st.v}>
              {c}
            </Text>
          ))}
        </View>
      </View>
      <Confetti />
    </Screen>
  );
}

const st = StyleSheet.create({
  close: { alignSelf: 'flex-end', marginTop: 12 },
  pair: { flexDirection: 'row', justifyContent: 'center' },
  photo: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.grey200 },
  second: { borderWidth: 1, borderColor: colors.grey400 },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, textAlign: 'center', marginTop: 18 },
  k: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 20, color: colors.primary },
  v: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.grey900, textAlign: 'center' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: -5 },
  inputWrap: { flex: 1, height: 55, borderRadius: 28, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 26, gap: 10 },
  input: { flex: 1, height: '100%', fontFamily: fonts.body, fontSize: 14, color: colors.grey900 },
  send: { width: 55, height: 55, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
