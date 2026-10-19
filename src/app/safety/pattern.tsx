import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dialog } from '@/components/overlays';
import { Button, Header, Row, Screen, T } from '@/components/ui';
import { blockUser, endMatch } from '@/services/api';
import { colors, fonts } from '@/theme';

/** Pattern notice + summary: context about behaviour, never proof or message content. */
export default function PatternNotice() {
  const { id, summary } = useLocalSearchParams<{ id: string; summary?: string }>();
  const [showSummary, setShowSummary] = useState(!!summary);
  const [confirm, setConfirm] = useState<null | 'unmatch' | 'block'>(null);

  const footer = (
    <>
      {showSummary ? (
        <T v="body" color={colors.grey600}>
          Note: Patterns provide context, not proof.
        </T>
      ) : null}
      <Button title="Continue" onPress={() => router.back()} />
      <Row gap={14}>
        <Button title="Unmatch" variant="outline" style={{ flex: 1 }} onPress={() => setConfirm('unmatch')} />
        <Button title="Block" variant="outline" style={{ flex: 1 }} onPress={() => setConfirm('block')} />
      </Row>
    </>
  );
  const points = [
    'Their stated intention has changed several times recently.',
    'Multiple people have raised concerns about mismatched intentions.',
    'Repeated signals over the last 30 days.',
    'No individual conversations, names, dates or message content are exposed.',
  ];

  return (
    <Screen scroll={showSummary} footer={footer}>
      {showSummary ? (
        <>
          <Header title="Why you're seeing this" onBack={!summary ? () => setShowSummary(false) : undefined} />
          <View style={st.timeline}>
            {points.map((t, i) => (
              <View key={t} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ alignItems: 'center', width: 8 }}>
                  {i === points.length - 1 ? <View style={st.line} /> : null}
                  <View style={st.dot} />
                  {i < points.length - 1 ? <View style={[st.line, { flex: 1 }]} /> : null}
                </View>
                <T v="body" style={{ flex: 1, paddingBottom: i < points.length - 1 ? 34 : 0 }}>
                  {t}
                </T>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 80 }}>
          <Text style={st.h1}>Something to be aware of</Text>
          <T v="body" style={{ marginTop: 16 }}>
            {"Some recent behavior appears inconsistent with this person's stated relationship intention."}
          </T>
          <Pressable accessibilityRole="button" onPress={() => setShowSummary(true)} style={{ marginTop: 16 }} hitSlop={8}>
            <T v="body" color={colors.grey700} style={{ textDecorationLine: 'underline' }}>
              View summary
            </T>
          </Pressable>
        </View>
      )}
      <Dialog
        visible={!!confirm}
        title={confirm === 'block' ? 'Block this person?' : 'Unmatch this person?'}
        message={confirm === 'block' ? "They won't be able to see your profile or message you." : "You'll no longer be able to message each other."}
        destructive
        primary={{
          label: confirm === 'block' ? 'Block' : 'Unmatch',
          onPress: () => {
            (confirm === 'block' ? blockUser(id) : endMatch(id)).catch(() => {});
            setConfirm(null);
            router.dismissTo('/(tabs)/chats');
          },
        }}
        secondary={{ label: 'Cancel', onPress: () => setConfirm(null) }}
        onClose={() => setConfirm(null)}
      />
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
  timeline: { marginTop: 24, backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  line: { width: 1, minHeight: 10, backgroundColor: colors.grey600, marginTop: 6 },
});
