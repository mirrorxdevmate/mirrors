import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Glyph } from '@/components/designIcons';
import { StepScreen, useStepNav } from '@/components/step';
import { Chip, T } from '@/components/ui';
import { LIFESTYLE } from '@/data/options';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export const SubWithItalic = ({ lead, italic }: { lead: string; italic: string }) => (
  <T v="bodyL" color={colors.grey700} style={{ lineHeight: 20 }}>
    {lead}
    {'\n'}
    <Text style={{ fontFamily: fonts.bodyItalic }}>{italic}</Text>
  </T>
);

export default function Lifestyle() {
  const saved = useApp((s) => s.profile.lifestyle);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState<Record<string, string>>(saved);
  const { advance } = useStepNav('/details/hobbies');
  const save = (v: Record<string, string>) => {
    updateProfile({ lifestyle: v });
    advance();
  };
  return (
    <StepScreen
      step={3}
      total={9}
      title="Lifestyle"
      sub={<SubWithItalic lead="A few things about your everyday life" italic="These help us understand compatibility beyond the basics." />}
      canContinue={Object.keys(value).length > 0}
      onContinue={() => save(value)}
      onSkip={() => save(value)}>
      {LIFESTYLE.map((g) => (
        <View key={g.key} style={st.group}>
          <View style={st.head}>
            <Glyph name={g.label} color={colors.grey900} />
            <Text style={st.label}>{g.label}</Text>
          </View>
          <View style={st.row}>
            {g.options.map((o) => (
              <Chip
                key={o}
                kind="tint"
                label={o}
                selected={value[g.key] === o}
                style={{ flexGrow: 1 }}
                onPress={() => {
                  const next = { ...value };
                  if (next[g.key] === o) delete next[g.key];
                  else next[g.key] = o;
                  setValue(next);
                }}
              />
            ))}
          </View>
        </View>
      ))}
    </StepScreen>
  );
}

const st = StyleSheet.create({
  group: { paddingVertical: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 20, marginBottom: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.grey700 },
  row: { flexDirection: 'row', gap: 8 },
});
