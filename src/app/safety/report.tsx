import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SingleSelect } from '@/components/step';
import { Banner, Button, CheckBox, Header, LinkButton, Screen, T } from '@/components/ui';
import { REPORT_REASONS } from '@/data/options';
import { blockUser, endMatch, submitReport } from '@/services/api';
import { colors, fonts } from '@/theme';

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
            {!blocked ? <Button title="Block" onPress={() => blockUser(id).then(() => setBlocked(true)).catch(() => {})} /> : null}
            <Button
              title="Unmatch"
              variant="outline"
              onPress={() => {
                endMatch(id).catch(() => {});
                router.dismissTo('/(tabs)/chats');
              }}
            />
            <LinkButton title="Return" onPress={() => router.dismissTo(blocked ? '/(tabs)/chats' : '/(tabs)')} />
          </>
        }>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <View style={st.tick}>
            <Feather name="check" size={18} color={colors.white} />
          </View>
          <Text style={st.doneTitle}>Report submitted.</Text>
          <T v="body" color={colors.grey700} center style={{ marginTop: 12, paddingHorizontal: 16 }}>
            {"We'll review it. You won't be told the outcome, and they won't know you reported them."}
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
        <Header title="Anything you'd like to add?" onBack={() => setStep('reason')} />
        {error ? (
          <View style={{ marginTop: 16 }}>
            <Banner tone="error" text={error} />
          </View>
        ) : null}
        <T v="body" color={colors.grey700} style={{ marginTop: 24 }}>
          Optional. Our team reviews every report.
        </T>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Add details…"
          placeholderTextColor={colors.grey600}
          multiline
          maxLength={1000}
          accessibilityLabel="Report details"
          style={[st.area, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
        />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: alsoBlock }} onPress={() => setAlsoBlock(!alsoBlock)} style={st.check} hitSlop={8}>
          <CheckBox on={alsoBlock} />
          <T v="bodyL">Also block this person</T>
        </Pressable>
      </Screen>
    );

  return (
    <Screen scroll footer={<Button title="Continue" disabled={!reason} onPress={() => setStep('detail')} />}>
      <Header title="Why are you reporting this person?" />
      <View style={{ height: 24 }} />
      <SingleSelect options={REPORT_REASONS} value={reason} onChange={setReason} />
    </Screen>
  );
}

const st = StyleSheet.create({
  tick: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  doneTitle: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, textAlign: 'center' },
  area: { marginTop: 16, height: 166, backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingTop: 12, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.grey900, textAlignVertical: 'top' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
});
