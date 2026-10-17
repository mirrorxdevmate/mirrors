import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, fonts, gradients, radius, text as textColors, type } from '@/theme';

export const tap = () => Haptics.selectionAsync().catch(() => {});

/* ───────────── Typography ───────────── */

type Variant = keyof typeof type;
export function T({
  v = 'body',
  color,
  center,
  style,
  ...rest
}: TextProps & { v?: Variant; color?: string; center?: boolean }) {
  return (
    <Text
      {...rest}
      style={[type[v] as TextStyle, { color: color ?? textColors.primary }, center && { textAlign: 'center' }, style]}
    />
  );
}

/* ───────────── Layout ───────────── */

export function Screen({
  children,
  scroll,
  footer,
  edges = ['top', 'bottom'],
  bg = colors.white,
  pad = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
  edges?: Edge[];
  bg?: string;
  pad?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[pad && styles.pad, { paddingBottom: 24 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, pad && styles.pad, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const Gap = ({ h = 16, w }: { h?: number; w?: number }) => <View style={{ height: w ? undefined : h, width: w }} />;
export const Row = ({ children, style, gap = 8 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
);

/* ───────────── Buttons ───────────── */

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'white' | 'ghost' | 'danger';
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const palette: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: disabled ? colors.primaryDisabled : colors.primary, fg: colors.white },
    secondary: { bg: colors.base, fg: colors.grey900 },
    outline: { bg: 'transparent', fg: colors.grey900, border: colors.grey300 },
    white: { bg: colors.white, fg: colors.grey900 },
    ghost: { bg: 'transparent', fg: colors.grey900 },
    danger: { bg: colors.red, fg: colors.white },
  };
  const p = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && { height: 40, paddingHorizontal: 18 },
        { backgroundColor: p.bg, borderColor: p.border ?? 'transparent', borderWidth: p.border ? 1 : 0 },
        pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        disabled && variant !== 'primary' && { opacity: 0.5 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <Row gap={8}>
          {icon}
          <T v={small ? 'captionM' : 'bodyM'} color={p.fg}>
            {title}
          </T>
        </Row>
      )}
    </Pressable>
  );
}

export function LinkButton({ title, onPress, color = colors.grey900, style }: { title: string; onPress?: () => void; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={10} onPress={onPress} style={[{ alignSelf: 'center', paddingVertical: 10 }, style]}>
      <T v="bodyM" color={color} style={{ textDecorationLine: 'underline' }}>
        {title}
      </T>
    </Pressable>
  );
}

export function CircleButton({
  icon,
  onPress,
  size = 32,
  bg = colors.white,
  border = true,
  label,
}: {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  bg?: string;
  border?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: border ? 1 : 0,
          borderColor: colors.grey900,
        },
        pressed && { opacity: 0.7 },
      ]}>
      {icon}
    </Pressable>
  );
}

export const BackButton = ({ onPress, light }: { onPress?: () => void; light?: boolean }) => (
  <CircleButton
    label="Back"
    bg={light ? 'rgba(255,255,255,0.9)' : colors.white}
    icon={<Feather name="chevron-left" size={18} color={colors.grey900} />}
    onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
  />
);

/* ───────────── Headers ───────────── */

export function Header({ title, onBack, right, big }: { title?: string; onBack?: () => void; right?: React.ReactNode; big?: boolean }) {
  return (
    <Row gap={12} style={{ paddingTop: 8, paddingBottom: 12, minHeight: 48 }}>
      <BackButton onPress={onBack} />
      {title ? (
        <T v={big ? 'h2' : 'h3'} style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </T>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </Row>
  );
}

export function ProgressHeader({ step, total, onBack }: { step: number; total: number; onBack?: () => void }) {
  return (
    <Row gap={12} style={{ paddingTop: 8, paddingBottom: 16 }}>
      <BackButton onPress={onBack} />
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step }}>
        <View style={[styles.trackFill, { width: `${(step / total) * 100}%` }]} />
      </View>
      <T v="caption" color={colors.grey700}>
        {step}/{total}
      </T>
    </Row>
  );
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <T v="h2">{children}</T>
      {sub ? (
        <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

/* ───────────── Selection controls ───────────── */

export function Option({ label, selected, onPress, multi, sub }: { label: string; selected: boolean; onPress: () => void; multi?: boolean; sub?: string }) {
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: selected ? colors.secondary : colors.base },
        pressed && { opacity: 0.85 },
      ]}>
      <View
        style={[
          multi ? styles.checkbox : styles.radio,
          { borderColor: selected ? colors.primary : colors.grey500, backgroundColor: multi && selected ? colors.primary : 'transparent' },
        ]}>
        {selected && !multi ? <View style={styles.radioDot} /> : null}
        {selected && multi ? <Feather name="check" size={10} color={colors.white} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <T v="bodyM">{label}</T>
        {sub ? (
          <T v="caption" color={colors.grey700}>
            {sub}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, small }: { label: string; selected?: boolean; onPress?: () => void; small?: boolean }) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      onPress={
        onPress
          ? () => {
              tap();
              onPress();
            }
          : undefined
      }
      style={[
        styles.chip,
        small && { paddingVertical: 4, paddingHorizontal: 10 },
        { backgroundColor: selected ? colors.primary : colors.base },
      ]}>
      <T v={small ? 'caption' : 'bodyM'} color={selected ? colors.white : colors.grey900}>
        {label}
      </T>
    </Comp>
  );
}

export function Segmented<V extends string>({ options, value, onChange }: { options: { label: string; value: V }[]; value: V; onChange: (v: V) => void }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.value === value }}
          onPress={() => {
            tap();
            onChange(o.value);
          }}
          style={[styles.segmentItem, o.value === value && { backgroundColor: colors.primary }]}>
          <T v="bodyM" color={o.value === value ? colors.white : colors.grey900}>
            {o.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

export function ToggleRow({ label, sub, value, onChange, disabled }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Row style={{ paddingVertical: 10 }} gap={12}>
      <View style={{ flex: 1 }}>
        <T v="bodyM">{label}</T>
        {sub ? (
          <T v="caption" color={colors.grey700} style={{ marginTop: 2 }}>
            {sub}
          </T>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        value={value}
        onValueChange={(v) => {
          tap();
          onChange(v);
        }}
        trackColor={{ true: colors.primary, false: colors.grey300 }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.grey300}
        {...(Platform.OS === 'web' ? ({ activeThumbColor: colors.white } as object) : null)}
      />
    </Row>
  );
}

/* ───────────── Inputs ───────────── */

export const Field = forwardRef<TextInput, TextInputProps & { error?: string; label?: string; left?: React.ReactNode; boxStyle?: StyleProp<ViewStyle> }>(
  function Field({ error, label, left, style, boxStyle, ...rest }, ref) {
    return (
      <View style={{ marginBottom: 12 }}>
        {label ? (
          <T v="captionM" color={colors.grey700} style={{ marginBottom: 6 }}>
            {label}
          </T>
        ) : null}
        <View style={[styles.field, error ? { borderColor: colors.red, borderWidth: 1 } : null, boxStyle]}>
          {left}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.grey500}
            style={[{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.grey900, paddingVertical: 0 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object), style]}
            {...rest}
          />
        </View>
        {error ? (
          <T v="caption" color={colors.red} style={{ marginTop: 6 }}>
            {error}
          </T>
        ) : null}
      </View>
    );
  },
);

/* ───────────── Surfaces ───────────── */

export const Card = ({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) =>
  onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  ) : (
    <View style={[styles.card, style]}>{children}</View>
  );

export function Badge({ kind }: { kind: 'plus' | 'premium' }) {
  return (
    <LinearGradient
      colors={kind === 'plus' ? gradients.mirrorPlus : gradients.premium}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.badge}>
      <T v="captionM" color={colors.white} style={{ fontSize: 11 }}>
        {kind === 'plus' ? 'Mirror+' : 'Premium'}
      </T>
    </LinearGradient>
  );
}

export function ListRow({
  label,
  value,
  onPress,
  badge,
  danger,
  last,
  icon,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  badge?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.listRow, !last && styles.divider, pressed && { opacity: 0.6 }]}>
      {icon}
      <T v="bodyL" color={danger ? colors.red : colors.grey900} style={{ flexShrink: 1 }}>
        {label}
      </T>
      {badge}
      <View style={{ flex: 1 }} />
      {value ? (
        <T v="body" color={colors.grey600} numberOfLines={1} style={{ maxWidth: 170 }}>
          {value}
        </T>
      ) : null}
      {onPress && !danger ? <Feather name="chevron-right" size={18} color={colors.grey500} /> : null}
    </Pressable>
  );
}

export function SectionLabel({ children, color = colors.primary }: { children: string; color?: string }) {
  return (
    <T v="overline" color={color} style={{ marginBottom: 4 }}>
      {children}
    </T>
  );
}

export function Loading({ label, sub }: { label: string; sub?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <T v="h3" center style={{ marginTop: 20 }}>
        {label}
      </T>
      {sub ? (
        <T v="body" center color={colors.grey700} style={{ marginTop: 8 }}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

export function Banner({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' | 'success' }) {
  const map = { info: [colors.base, colors.grey800], error: ['#FDECEC', colors.red], success: ['#EAF8E4', '#237A07'] } as const;
  return (
    <Row style={{ backgroundColor: map[tone][0], padding: 12, borderRadius: radius.md, marginBottom: 12 }}>
      <Ionicons name={tone === 'error' ? 'alert-circle' : tone === 'success' ? 'checkmark-circle' : 'information-circle'} size={18} color={map[tone][1]} />
      <T v="body" color={map[tone][1]} style={{ flex: 1 }}>
        {text}
      </T>
    </Row>
  );
}

export const VerifiedTick = ({ size = 16 }: { size?: number }) => <Ionicons name="checkmark-circle" size={size} color={colors.blue} accessibilityLabel="Verified" />;

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 4 },
  btn: { height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.secondary, overflow: 'hidden' },
  trackFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, minHeight: 52, paddingVertical: 12, borderRadius: radius.lg, marginBottom: 10 },
  radio: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.full },
  segment: { flexDirection: 'row', backgroundColor: colors.secondary, borderRadius: radius.full, padding: 4 },
  segmentItem: { flex: 1, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.base, borderRadius: radius.full, height: 52, paddingHorizontal: 16 },
  card: { backgroundColor: colors.base, borderRadius: radius.md, padding: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.grey400 },
});
