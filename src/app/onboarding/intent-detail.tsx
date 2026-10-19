import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput } from 'react-native';

import { StepScreen } from '@/components/step';
import { T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

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
        placeholderTextColor={colors.grey600}
        multiline
        maxLength={200}
        accessibilityLabel="What does that mean to you?"
        style={[st.area, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
      />
      <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
        FOR EXAMPLE
      </T>
      {EXAMPLES.map((e) => (
        <Pressable
          key={e}
          onPress={() => setText(e)}
          accessibilityRole="button"
          accessibilityHint="Use this example"
          style={({ pressed }) => [st.example, pressed && { opacity: 0.6 }]}>
          <T v="body" color={colors.grey700}>
            &quot;{e}&quot;
          </T>
        </Pressable>
      ))}
    </StepScreen>
  );
}

const st = StyleSheet.create({
  area: { height: 166, backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.grey900, textAlignVertical: 'top' },
  example: { minHeight: 42, borderRadius: 360, borderWidth: 1, borderColor: colors.grey500, paddingHorizontal: 17, justifyContent: 'center', marginTop: 16 },
});
