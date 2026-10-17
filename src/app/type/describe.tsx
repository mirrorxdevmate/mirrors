import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button, Header, Screen, T, Title } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts, radius } from '@/theme';

export default function DescribeType() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const saved = useApp((s) => s.type.description);
  const updateType = useApp((s) => s.updateType);
  const [text, setText] = useState(saved);
  const ok = text.trim().length >= 10;

  return (
    <Screen
      scroll
      footer={
        <Button
          title="Continue"
          disabled={!ok}
          onPress={() => {
            updateType({ description: text.trim() });
            const target = { pathname: '/type/understood' as const, params: edit ? { edit: '1' } : {} };
            if (edit) router.replace(target);
            else router.push(target);
          }}
        />
      }>
      {edit ? <Header /> : <View style={{ height: 16 }} />}
      <Title>Who catches your attention?</Title>
      <TextInput
        value={text}
        onChangeText={setText}
        autoFocus
        multiline
        maxLength={500}
        placeholder="Describe the kind of person you're usually attracted to…"
        placeholderTextColor={colors.grey500}
        style={{ minHeight: 180, backgroundColor: colors.base, borderRadius: radius.md, padding: 16, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.grey900, textAlignVertical: 'top' }}
      />
      <T v="caption" color={colors.grey600} style={{ marginTop: 10 }}>
        You can mention age, personality, lifestyle, culture, values, appearance or anything that matters to you.
      </T>
      {text.length > 0 && !ok ? (
        <T v="caption" color={colors.grey700} style={{ marginTop: 6 }}>
          A little more detail helps Mirror understand you.
        </T>
      ) : null}
    </Screen>
  );
}
