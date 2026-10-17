import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { SingleSelect } from '@/components/step';
import { Banner, Button, Card, Header, Screen, T, Title, ToggleRow } from '@/components/ui';
import { REPORT_REASONS } from '@/data/options';
import { blockUser, endMatch, submitReport } from '@/services/api';
import { colors, fonts, radius } from '@/theme';

export default function Report() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [step, setStep] = useState<'reason' | 'detail' | 'done'>('reason');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');

  if (step === 'done')
    return (
      <Screen
        footer={
          <>
            {!blocked ? <Button title="Block" variant="secondary" onPress={() => blockUser(id).then(() => setBlocked(true)).catch(() => {})} /> : null}
            <Button title="Unmatch" variant="secondary" onPress={() => { endMatch(id).catch(() => {}); router.dismissTo('/(tabs)/chats'); }} />
            <Button title="Return" onPress={() => router.dismissTo(blocked ? '/(tabs)/chats' : '/(tabs)')} />
          </>
        }>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Feather name="shield" size={34} color={colors.primary} />
          </View>
          <T v="h2" center>
            Report submitted.
          </T>
          <T v="body" color={colors.grey700} center style={{ marginTop: 8 }}>
            We&apos;ll review it. You won&apos;t be told the outcome, and they won&apos;t know you reported them.
          </T>
        </View>
      </Screen>
    );

  if (step === 'detail')
    return (
      <Screen
        scroll
        footer={
          <Button
            title="Submit report"
            loading={loading}
            onPress={async () => {
              setLoading(true);
              setError('');
              try {
                await submitReport(id, reason, details, alsoBlock);
                setBlocked(alsoBlock);
                setStep('done');
              } catch {
                setError("We couldn't send your report. Check your connection and try again.");
              } finally {
                setLoading(false);
              }
            }}
          />
        }>
        <Header onBack={() => setStep('reason')} />
        {error ? <Banner tone="error" text={error} /> : null}
        <Title sub="Optional. Our team reviews every report.">Anything you&apos;d like to add?</Title>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Add details…"
          placeholderTextColor={colors.grey500}
          multiline
          maxLength={1000}
          style={{ minHeight: 140, backgroundColor: colors.base, borderRadius: radius.md, padding: 16, fontFamily: fonts.body, fontSize: 15, color: colors.grey900, textAlignVertical: 'top' }}
        />
        <Card style={{ marginTop: 12, paddingVertical: 4 }}>
          <ToggleRow label="Also block this person" value={alsoBlock} onChange={setAlsoBlock} />
        </Card>
      </Screen>
    );

  return (
    <Screen scroll footer={<Button title="Continue" disabled={!reason} onPress={() => setStep('detail')} />}>
      <Header />
      <Title>Why are you reporting this person?</Title>
      <SingleSelect options={REPORT_REASONS} value={reason} onChange={setReason} />
    </Screen>
  );
}
