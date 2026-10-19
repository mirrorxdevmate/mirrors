import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { StepScreen, useStepNav } from '@/components/step';
import { Segmented } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

const toFt = (cm: number) => {
  const inches = Math.round(cm / 2.54);
  return { ft: Math.floor(inches / 12), inch: inches % 12 };
};

export default function Height() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const [unit, setUnit] = useState<'cm' | 'ft'>(profile.heightUnit);
  const [text, setText] = useState(() => {
    const cm = profile.heightCm || 175;
    if (profile.heightUnit === 'cm') return String(cm);
    const { ft, inch } = toFt(cm);
    return `${ft}'${inch}`;
  });
  const { advance } = useStepNav('/details/education');

  const parse = (t: string, u: 'cm' | 'ft') => {
    if (u === 'cm') return Number(t.replace(/\D/g, ''));
    const [ft = '0', inch = '0'] = t.split(/['’\s.]+/);
    return Math.round((Number(ft) * 12 + Number(inch || 0)) * 2.54);
  };
  const cm = parse(text, unit);
  const valid = cm >= 120 && cm <= 230;

  const switchUnit = (u: 'cm' | 'ft') => {
    if (u === unit) return;
    const current = valid ? cm : 175;
    if (u === 'cm') setText(String(current));
    else {
      const { ft, inch } = toFt(current);
      setText(`${ft}'${inch}`);
    }
    setUnit(u);
  };

  const save = () => {
    updateProfile({ heightCm: valid ? cm : profile.heightCm, heightUnit: unit });
    advance();
  };

  return (
    <StepScreen step={6} total={9} title="What's your height?" canContinue={valid} onContinue={save} onSkip={save}>
      <Segmented
        options={[
          { label: 'cm', value: 'cm' },
          { label: 'ft / in', value: 'ft' },
        ]}
        value={unit}
        onChange={switchUnit}
      />
      <View style={st.field}>
        <MaterialCommunityIcons name="human-male-height" size={17} color={colors.grey600} />
        <TextInput
          value={text}
          onChangeText={(t) => setText(unit === 'cm' ? t.replace(/\D/g, '').slice(0, 3) : t.replace(/[^\d'’ ]/g, '').slice(0, 5))}
          keyboardType={unit === 'cm' ? 'number-pad' : 'numbers-and-punctuation'}
          placeholder={unit === 'cm' ? '175' : `5'9`}
          placeholderTextColor={colors.grey600}
          accessibilityLabel={`Height in ${unit === 'cm' ? 'centimetres' : 'feet and inches'}`}
          style={[st.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
        />
        <Text style={st.unit}>{unit === 'cm' ? 'cm' : 'ft / in'}</Text>
      </View>
    </StepScreen>
  );
}

const st = StyleSheet.create({
  field: { marginTop: 8, height: 48, borderRadius: 360, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  input: { flex: 1, height: '100%', fontFamily: fonts.body, fontSize: 14, color: colors.grey900, paddingVertical: 0 },
  unit: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.grey600 },
});
