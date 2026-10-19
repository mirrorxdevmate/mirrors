import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';

import { Button, Header, Screen, T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

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
      <Header title="Who catches your attention?" />
      <TextInput
        value={text}
        onChangeText={setText}
        autoFocus
        multiline
        maxLength={500}
        placeholder="Describe the kind of person you're usually attracted to…"
        placeholderTextColor={colors.grey600}
        accessibilityLabel="Describe your type"
        style={[st.area, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
      />
      <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
        You can mention age, personality, lifestyle, culture, values, appearance or anything that matters to you.
      </T>
    </Screen>
  );
}

const st = StyleSheet.create({
  area: { marginTop: 24, height: 199, backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.grey900, textAlignVertical: 'top' },
});
