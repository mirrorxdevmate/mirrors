import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Profile } from '@/data/profiles';
import { colors, fonts, radius } from '@/theme';
import { AppIcon } from './appIcons';
import { Glyph } from './designIcons';
import { ChevronLeft } from './icons';
import { Row, T } from './ui';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** One fact row (icon + Inter 14). `icon` may be a Figma glyph element or a vector-icon name. */
export const Fact = ({ icon, label, color = colors.grey900, compact }: { icon: IconName | React.ReactNode; label: string; color?: string; compact?: boolean }) => (
  <Row gap={8} style={compact ? undefined : { width: '50%', height: 23 }}>
    {typeof icon === 'string' ? <MaterialCommunityIcons name={icon as IconName} size={15} color={color} /> : icon}
    <T v="body" color={color} numberOfLines={1} style={{ flexShrink: 1 }}>
      {label}
    </T>
  </Row>
);

/** Small verified seal from the design (blue rosette with a tick). */
export const Verified = ({ size = 16 }: { size?: number }) => <AppIcon name="verified" size={size} />;

/** Expanded introduction card (HOME / INTRODUCTIONS scrolled). */
export function ProfileDetail({ p, onWhy }: { p: Profile; onWhy?: () => void }) {
  const tags = [p.faith, p.culture, p.education].filter(Boolean);
  return (
    <View>
      <Row gap={12}>
        <Text style={s.name}>
          {p.name}, {p.age}
        </Text>
        {p.verified ? <Verified /> : null}
      </Row>
      {p.profession ? (
        <Row gap={8} style={{ marginTop: 8 }}>
          <AppIcon name="job" height={13} />
          <Text style={s.job}>{p.profession}</Text>
        </Row>
      ) : null}
      <Row gap={8} style={{ marginTop: 8 }}>
        <AppIcon name="pin" height={14} />
        <Text style={s.loc}>
          {p.city}
          {p.distanceKm != null ? `, ${p.distanceKm} km` : ''}
        </Text>
      </Row>
      <View style={s.facts}>
        <Fact icon={<AppIcon name="height" height={15} />} label={`${p.heightCm}cm`} />
        <Fact icon={<AppIcon name="intent" height={15} />} label={p.intent} />
        <Fact icon={<Glyph name="Drinking" color={colors.grey900} height={17} />} label={p.drinking} />
        <Fact icon={<Glyph name="Smoking" color={colors.grey900} height={14} />} label={p.smoking} />
        <Fact icon={<AppIcon name="children" height={13} />} label={p.children} />
        <Fact icon={<Glyph name="Pets" color={colors.grey900} height={14} />} label={p.pets} />
      </View>
      <Text style={s.h}>About</Text>
      <T v="body" style={{ marginTop: 8 }}>
        {p.about}
      </T>
      {tags.length ? (
        <View style={[s.wrap, { marginTop: 8 }]}>
          {tags.map((x) => (
            <View key={x} style={s.tag}>
              <T v="body">{x}</T>
            </View>
          ))}
        </View>
      ) : null}
      {p.values.length ? (
        <>
          <Text style={s.label}>VALUES</Text>
          <View style={s.wrap}>
            {p.values.map((v) => (
              <View key={v} style={s.chip}>
                <T v="body">{v}</T>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {p.hobbies.length ? (
        <>
          <Text style={s.label}>HOBBIES</Text>
          <View style={s.wrap}>
            {p.hobbies.map((v) => (
              <View key={v} style={s.chip}>
                <T v="body">{v}</T>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {onWhy ? (
        <Pressable accessibilityRole="button" onPress={onWhy} style={({ pressed }) => [s.whyRow, pressed && { opacity: 0.8 }]}>
          <Text style={[s.job, { flex: 1 }]}>Why you two?</Text>
          <View style={s.whyBtn}>
            <ChevronRight />
          </View>
        </Pressable>
      ) : null}
      {p.photos[1] ? <Image source={p.photos[1]} style={s.second} contentFit="cover" transition={200} accessibilityLabel={`${p.name} photo 2`} /> : null}
    </View>
  );
}

const ChevronRight = () => (
  <View style={{ transform: [{ scaleX: -1 }] }}>
    <ChevronLeft color={colors.white} />
  </View>
);

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
  name: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
  job: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.grey900 },
  loc: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 20, color: colors.grey600 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginTop: 18 },
  h: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 16, color: colors.grey900, marginTop: 17 },
  label: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20, color: colors.grey600, marginTop: 16, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { height: 26, borderRadius: 360, backgroundColor: colors.white, paddingHorizontal: 8, justifyContent: 'center' },
  chip: { height: 26, borderRadius: 360, backgroundColor: colors.white, paddingHorizontal: 10, justifyContent: 'center' },
  second: { width: '100%', aspectRatio: 0.85, borderRadius: radius.md, marginTop: 16, backgroundColor: colors.grey200 },
  whyRow: { flexDirection: 'row', alignItems: 'center', height: 60, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 30, paddingLeft: 16, paddingRight: 5, marginTop: 23 },
  whyBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
