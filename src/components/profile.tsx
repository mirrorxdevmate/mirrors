import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Profile } from '@/data/profiles';
import { colors, radius } from '@/theme';
import { Chip, Row, T, VerifiedTick } from './ui';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export const Fact = ({ icon, label, color = colors.grey900, compact }: { icon: IconName; label: string; color?: string; compact?: boolean }) => (
  <Row gap={6} style={compact ? undefined : { minWidth: '45%' }}>
    <MaterialCommunityIcons name={icon} size={15} color={color} />
    <T v="body" color={color}>
      {label}
    </T>
  </Row>
);

export function ProfileDetail({ p, onWhy }: { p: Profile; onWhy?: () => void }) {
  return (
    <View>
      <Row gap={6}>
        <T v="h2">
          {p.name}, {p.age}
        </T>
        {p.verified ? <VerifiedTick size={18} /> : null}
      </Row>
      <Row gap={6} style={{ marginTop: 6 }}>
        <MaterialCommunityIcons name="briefcase-outline" size={15} color={colors.grey800} />
        <T v="body">{p.profession}</T>
      </Row>
      <Row gap={6} style={{ marginTop: 6 }}>
        <Feather name="map-pin" size={13} color={colors.grey600} />
        <T v="caption" color={colors.grey600}>
          {p.city}{p.distanceKm != null ? `, ${p.distanceKm} km` : ''}
        </T>
      </Row>
      <View style={s.facts}>
        <Fact icon="human-male-height" label={`${p.heightCm}cm`} />
        <Fact icon="target" label={p.intent} />
        <Fact icon="glass-wine" label={p.drinking} />
        <Fact icon="smoking-off" label={p.smoking} />
        <Fact icon="baby-face-outline" label={p.children} />
        <Fact icon="paw-outline" label={p.pets} />
      </View>
      <T v="bodyS" style={{ marginTop: 16 }}>
        About
      </T>
      <T v="body" style={{ marginTop: 6 }}>
        {p.about}
      </T>
      <View style={[s.wrap, { marginTop: 10 }]}>
        {[p.faith, p.culture, p.education].filter(Boolean).map((x) => (
          <T key={x} v="body" style={{ marginRight: 14 }}>
            {x}
          </T>
        ))}
      </View>
      <T v="overline" color={colors.grey600} style={{ marginTop: 14, marginBottom: 6 }}>
        Values
      </T>
      <View style={s.wrap}>
        {p.values.map((v) => (
          <Chip key={v} label={v} small />
        ))}
      </View>
      <T v="overline" color={colors.grey600} style={{ marginTop: 14, marginBottom: 6 }}>
        Hobbies
      </T>
      <View style={s.wrap}>
        {p.hobbies.map((v) => (
          <Chip key={v} label={v} small />
        ))}
      </View>
      {onWhy ? (
        <Pressable accessibilityRole="button" onPress={onWhy} style={({ pressed }) => [s.whyRow, pressed && { opacity: 0.8 }]}>
          <T v="bodyM" style={{ flex: 1 }}>
            Why you two?
          </T>
          <View style={s.whyBtn}>
            <Feather name="chevron-right" size={20} color={colors.white} />
          </View>
        </Pressable>
      ) : null}
      {p.photos[1] ? <Image source={p.photos[1]} style={s.second} contentFit="cover" transition={200} accessibilityLabel={`${p.name} photo 2`} /> : null}
    </View>
  );
}

export const Avatar = ({ uri, size = 48, ring }: { uri?: string; size?: number; ring?: boolean }) => (
  <View style={ring ? { padding: 2, borderRadius: size, borderWidth: 2, borderColor: colors.primary } : undefined}>
    {uri ? (
      <Image source={uri} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
    ) : (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.grey300, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="user" size={size / 2} color={colors.white} />
      </View>
    )}
  </View>
);

const s = StyleSheet.create({
  facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 12, marginTop: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  second: { width: '100%', aspectRatio: 0.85, borderRadius: radius.md, marginTop: 16, backgroundColor: colors.grey200 },
  whyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.base, borderRadius: radius.full, paddingLeft: 12, marginTop: 16 },
  whyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
