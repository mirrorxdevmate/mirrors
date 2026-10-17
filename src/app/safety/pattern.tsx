import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Dialog } from '@/components/overlays';
import { Button, Card, Header, Row, Screen, T, Title } from '@/components/ui';
import { blockUser, endMatch } from '@/services/api';
import { colors } from '@/theme';

/** Pattern notice + summary: context about behaviour, never proof or message content. */
export default function PatternNotice() {
  const { id, summary } = useLocalSearchParams<{ id: string; summary?: string }>();
  const [showSummary, setShowSummary] = useState(!!summary);
  const [confirm, setConfirm] = useState<null | 'unmatch' | 'block'>(null);

  const footer = (
    <>
      <Button title="Continue" onPress={() => router.back()} />
      <Row gap={10}>
        <Button title="Unmatch" variant="secondary" style={{ flex: 1 }} onPress={() => setConfirm('unmatch')} />
        <Button title="Block" variant="secondary" style={{ flex: 1 }} onPress={() => setConfirm('block')} />
      </Row>
    </>
  );

  return (
    <Screen scroll footer={footer}>
      <Header onBack={showSummary && !summary ? () => setShowSummary(false) : undefined} />
      {showSummary ? (
        <>
          <Title>Why you&apos;re seeing this</Title>
          {[
            "Their stated intention has changed several times recently.",
            'Multiple people have raised concerns about mismatched intentions.',
            'Repeated signals over the last 30 days.',
          ].map((t) => (
            <Card key={t} style={{ marginBottom: 10 }}>
              <T v="body">{t}</T>
            </Card>
          ))}
          <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
            No individual conversations, names, dates or message content are exposed.
          </T>
          <T v="bodyS" color={colors.grey800} style={{ marginTop: 12 }}>
            Note: Patterns provide context, not proof.
          </T>
        </>
      ) : (
        <View style={{ paddingTop: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Feather name="alert-triangle" size={26} color={colors.amber} />
          </View>
          <Title sub="Some recent behavior appears inconsistent with this person's stated relationship intention.">Something to be aware of</Title>
          <Button title="View summary" variant="outline" onPress={() => setShowSummary(true)} />
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
