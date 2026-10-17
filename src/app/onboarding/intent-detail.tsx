import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput } from 'react-native';

import { StepScreen } from '@/components/step';
import { Card, T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts, radius } from '@/theme';

const EXAMPLES = ['Building toward marriage.', 'Dating intentionally but taking my time.'];

export default function IntentDetail() {
  const saved = useApp((s) => s.profile.intentDetail);
  const updateProfile = useApp((s) => s.updateProfile);
  const setStage = useApp((s) => s.setStage);
  const [text, setText] = useState(saved);
  const { edit } = useLocalSearchParams<{ edit?: string }>();

  const finish = (detail: string) => {
    updateProfile({ intentDetail: detail.trim() });
    if (edit) return router.back();
    setStage('details');
    router.replace({ pathname: '/celebrate', params: { title: 'Looking good!', next: '/details/status' } });
  };

  return (
    <StepScreen step={8} total={8} title="What does that mean to you?" onContinue={() => finish(text)} canContinue={text.trim().length > 0} onSkip={() => finish('')}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a sentence or two…"
        placeholderTextColor={colors.grey500}
        multiline
        maxLength={200}
        style={{ minHeight: 120, backgroundColor: colors.base, borderRadius: radius.md, padding: 16, fontFamily: fonts.body, fontSize: 15, color: colors.grey900, textAlignVertical: 'top' }}
      />
      <T v="caption" color={colors.grey600} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
        {text.length}/200
      </T>
      <T v="overline" color={colors.grey600} style={{ marginTop: 16, marginBottom: 8 }}>
        For example
      </T>
      {EXAMPLES.map((e) => (
        <Pressable key={e} onPress={() => setText(e)} accessibilityRole="button" accessibilityHint="Use this example">
          <Card style={{ marginBottom: 8 }}>
            <T v="body" color={colors.grey800}>
              &ldquo;{e}&rdquo;
            </T>
          </Card>
        </Pressable>
      ))}
    </StepScreen>
  );
}
