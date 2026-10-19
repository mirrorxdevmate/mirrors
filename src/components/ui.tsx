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

import { ChevronLeft, RadioDot } from './icons';
import { Spinner } from './Spinner';
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

/**
 * Screen scaffold matching the Figma frames: 16px side gutters, content under the status bar,
 * sticky footer (CTA + optional link) 17px above the home indicator.
 */
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
      style={{ flex: 1 }}
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

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'white' | 'ghost' | 'danger' | 'dangerOutline';
/** Figma "Buttons": 55px pill, Inter Medium 14. Disabled = 50% opacity. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  small,
  textStyle,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  textStyle?: StyleProp<TextStyle>;
}) {
  const palette: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.white },
    secondary: { bg: colors.base, fg: colors.grey900 },
    outline: { bg: 'transparent', fg: colors.grey900, border: colors.grey900 },
    white: { bg: colors.white, fg: colors.grey900 },
    ghost: { bg: 'transparent', fg: colors.grey900 },
    danger: { bg: colors.red, fg: colors.white },
    dangerOutline: { bg: 'transparent', fg: colors.red, border: colors.red },
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
        pressed && !disabled && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}>
      {loading ? (
        <Row gap={8}>
          <ActivityIndicator color={p.fg} size="small" />
          <Text style={[styles.btnText, { color: p.fg }]}>Loading</Text>
        </Row>
      ) : (
        <Row gap={8}>
          {icon}
          <Text style={[styles.btnText, small && { fontSize: 12 }, { color: p.fg }, textStyle]}>{title}</Text>
        </Row>
      )}
    </Pressable>
  );
}

/** Underlined text link (e.g. "Skip", "Change number", "Enter location manually"). */
export function LinkButton({ title, onPress, color = colors.grey900, style }: { title: string; onPress?: () => void; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={10} onPress={onPress} style={({ pressed }) => [{ alignSelf: 'center' }, pressed && { opacity: 0.6 }, style]}>
      <Text style={[styles.link, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function CircleButton({
  icon,
  onPress,
  size = 34,
  bg = 'transparent',
  border = true,
  borderColor = colors.grey900,
  label,
}: {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  bg?: string;
  border?: boolean;
  borderColor?: string;
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
          borderColor,
        },
        pressed && { opacity: 0.6 },
      ]}>
      {icon}
    </Pressable>
  );
}

export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** 34px outlined circle with the Figma chevron. */
export const BackButton = ({ onPress, light }: { onPress?: () => void; light?: boolean }) => (
  <CircleButton
    label="Back"
    bg={light ? 'rgba(255,255,255,0.9)' : 'transparent'}
    icon={<ChevronLeft />}
    onPress={onPress ?? goBack}
  />
);

/* ───────────── Headers ───────────── */

/**
 * Back button with the title inline (Urbanist Bold 24). `top` is the gap under the status bar:
 * 32 on the sign-in screens, 12 elsewhere.
 */
export function Header({
  title,
  onBack,
  right,
  big = true,
  top = 12,
  noBack,
  spaced,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  big?: boolean;
  top?: number;
  noBack?: boolean;
  /** Adds the 24px gap Figma uses between the header and the first block. */
  spaced?: boolean;
}) {
  return (
    <Row gap={12} style={{ marginTop: top, minHeight: 34, marginBottom: spaced ? 24 : 0 }}>
      {noBack ? null : <BackButton onPress={onBack} />}
      {title ? (
        <T v={big ? 'h2' : 'h3'} style={[big && { lineHeight: 24 }, { flex: 1 }]} numberOfLines={2} accessibilityRole="header">
          {title}
        </T>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </Row>
  );
}

/** Back button + 5px progress track + "n/total" (onboarding steps). */
export function ProgressHeader({ step, total, onBack }: { step: number; total: number; onBack?: () => void }) {
  return (
    <Row gap={12} style={{ marginTop: 12, height: 34 }}>
      <BackButton onPress={onBack} />
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step }}>
        <View style={[styles.trackFill, { width: `${(step / total) * 100}%` }]} />
      </View>
      <T v="body" color={colors.grey700} style={{ minWidth: 22 }}>
        {step}/{total}
      </T>
    </Row>
  );
}

/** Screen title (Urbanist Bold 24/24) with optional Inter 16/20 subtitle; 24px under the header. */
export function Title({ children, sub, top = 24, extra }: { children: React.ReactNode; sub?: React.ReactNode; top?: number; extra?: React.ReactNode }) {
  return (
    <View style={{ marginTop: top, marginBottom: sub ? 16 : 24 }}>
      <T v="h2" style={{ lineHeight: 28 }} accessibilityRole="header">
        {children}
        {extra}
      </T>
      {sub ? (
        typeof sub === 'string' ? (
          <T v="bodyL" color={colors.grey700} style={{ marginTop: 12, lineHeight: 20 }}>
            {sub}
          </T>
        ) : (
          <View style={{ marginTop: 12 }}>{sub}</View>
        )
      ) : null}
    </View>
  );
}

/* ───────────── Selection controls ───────────── */

/** Option pill (60px). Selected: #FFDBD2 + coral radio, Inter Medium 16. */
export function Option({ label, selected, onPress, multi, sub, style }: { label: string; selected: boolean; onPress: () => void; multi?: boolean; sub?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.option, { backgroundColor: selected ? colors.secondary : colors.base }, pressed && { opacity: 0.85 }, style]}>
      {multi ? <CheckBox on={selected} /> : <RadioDot on={selected} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionText, selected ? styles.optionTextOn : null]}>{label}</Text>
        {sub ? (
          <T v="caption" color={colors.grey700}>
            {sub}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

export function CheckBox({ on, size = 16 }: { on: boolean; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        borderWidth: on ? 0 : 1,
        borderColor: colors.grey500,
        backgroundColor: on ? colors.primary : colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {on ? <Feather name="check" size={size - 3} color={colors.white} /> : null}
    </View>
  );
}

/**
 * Chips. `solid` (hobbies): coral when selected, white text. `tint` (lifestyle): #FFDBD2 + radio when selected.
 */
export function Chip({
  label,
  selected,
  onPress,
  small,
  icon,
  kind = 'solid',
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
  icon?: (color: string) => React.ReactNode;
  kind?: 'solid' | 'tint';
  style?: StyleProp<ViewStyle>;
}) {
  const Comp = onPress ? Pressable : View;
  const solid = kind === 'solid';
  const bg = selected ? (solid ? colors.primary : colors.secondary) : colors.base;
  const fg = selected ? (solid ? colors.white : colors.grey900) : solid ? colors.grey600 : colors.grey700;
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
      style={[styles.chip, small && { height: 32, paddingHorizontal: 12 }, { backgroundColor: bg }, style]}>
      {!solid && selected ? <RadioDot on /> : null}
      {icon ? icon(fg) : null}
      <Text style={[styles.chipText, small && { fontSize: 12 }, { color: fg }, selected && { fontFamily: fonts.bodyMedium }]} numberOfLines={1}>
        {label}
      </Text>
    </Comp>
  );
}

/** Tinted track with a coral thumb: 60/44px (height step) or 50/35px (`compact`, billing period). */
export function Segmented<V extends string>({ options, value, onChange, compact }: { options: { label: string; value: V }[]; value: V; onChange: (v: V) => void; compact?: boolean }) {
  const active = options.findIndex((o) => o.value === value);
  return (
    <View style={[styles.segment, compact && { height: 50, padding: 7.5 }]} accessibilityRole="tablist">
      {options.map((o, i) => (
        <React.Fragment key={o.value}>
          {i > 0 && compact && i !== active && i - 1 !== active ? <View style={styles.segmentSep} /> : null}
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: o.value === value }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segmentItem, compact && { height: 35 }, o.value === value && { backgroundColor: colors.primary }]}>
            <Text style={[styles.btnText, { color: o.value === value ? colors.white : colors.grey900 }]}>{o.label}</Text>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}

/** Figma "Controls" toggle: 32×16 track, 12px knob. */
export function Toggle({ value, onChange, disabled, label }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={10}
      onPress={() => {
        tap();
        onChange(!value);
      }}
      style={[styles.toggle, { backgroundColor: value ? colors.primary : colors.grey500 }, disabled && { opacity: 0.5 }]}>
      <View style={[styles.knob, { transform: [{ translateX: value ? 16 : 0 }] }]} />
    </Pressable>
  );
}

export function ToggleRow({
  label,
  sub,
  value,
  onChange,
  disabled,
  style,
  pill,
  row,
  last,
  badge,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  pill?: boolean;
  /** Settings-list style: Inter 16 label with a divider (like ListRow). */
  row?: boolean;
  last?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <Row
      style={[
        { minHeight: 45 },
        pill && { borderRadius: 360, paddingHorizontal: 16, backgroundColor: value ? colors.white : colors.grey100 },
        row && { minHeight: 53, paddingVertical: 8 },
        row && !last && styles.divider,
        style,
      ]}
      gap={12}>
      <View style={{ flex: 1 }}>
        <Row gap={10}>
          <Text style={row ? styles.rowLabel : [styles.toggleLabel, value && { fontFamily: fonts.bodyMedium, color: colors.grey800 }]}>{label}</Text>
          {badge}
        </Row>
        {sub ? (
          <T v="caption" color={colors.grey600} style={{ marginTop: 2 }}>
            {sub}
          </T>
        ) : null}
      </View>
      <Toggle label={label} value={value} onChange={onChange} disabled={disabled} />
    </Row>
  );
}

/* ───────────── Inputs ───────────── */

/** Figma "Input Fields": 55px pill, #EAF1F5, Inter 14. */
export const Field = forwardRef<TextInput, TextInputProps & { error?: string | boolean; label?: string; left?: React.ReactNode; right?: React.ReactNode; boxStyle?: StyleProp<ViewStyle>; focusRing?: boolean }>(
  function Field({ error, label, left, right, style, boxStyle, focusRing = true, onFocus, onBlur, ...rest }, ref) {
    const [focused, setFocused] = React.useState(false);
    return (
      <View>
        {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
        <View
          style={[
            styles.field,
            focused && focusRing ? { borderColor: colors.primary, borderWidth: 1 } : null,
            error ? { borderColor: colors.red, borderWidth: 1 } : null,
            rest.editable === false && { opacity: 0.6 },
            boxStyle,
          ]}>
          {left}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.grey600}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object), style]}
            {...rest}
          />
          {right}
        </View>
        {typeof error === 'string' && error ? (
          <T v="caption" color={colors.red} style={{ marginTop: 8 }}>
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

/** Plan badges: Premium = gold gradient with dark text, Mirror+ = blue gradient with white text (26px, r16). */
export function Badge({ kind, small }: { kind: 'plus' | 'premium'; small?: boolean }) {
  return (
    <LinearGradient
      colors={kind === 'plus' ? gradients.mirrorPlus : gradients.premium}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, small && { height: 20, paddingHorizontal: 8 }]}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: small ? 10 : 12, lineHeight: 15, color: kind === 'plus' ? colors.white : colors.grey900 }}>
        {kind === 'plus' ? 'Mirror+' : 'Premium'}
      </Text>
    </LinearGradient>
  );
}

/** Settings list row (55px): Inter 16 label, #787A7C value + chevron, 1px #CED4DA divider. */
export function ListRow({
  label,
  value,
  onPress,
  badge,
  danger,
  last,
  icon,
  compact,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  badge?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.listRow, compact && { minHeight: 53 }, !last && styles.divider, pressed && { opacity: 0.6 }]}>
      {icon}
      <Text style={[styles.rowLabel, danger && { color: colors.red }]} numberOfLines={1}>
        {label}
      </Text>
      {badge}
      <View style={{ flex: 1 }} />
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress ? (
        <View style={{ transform: [{ scaleX: -1 }], marginLeft: 4 }}>
          <ChevronLeft color={colors.grey600} />
        </View>
      ) : null}
    </Pressable>
  );
}

/** Section caption above a group (Figma: "ADVANCED TYPE CONTROLS" — Inter 12, #5B5F6A, uppercase). */
export function SectionLabel({ children, color = colors.grey700 }: { children: string; color?: string }) {
  return <Text style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 20, color, marginTop: 24, marginBottom: 12, textTransform: 'uppercase' }}>{children}</Text>;
}

export function Loading({ label, sub }: { label: string; sub?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
      <Spinner />
      <View style={{ gap: 8 }}>
        <T v="bodyL" center color={colors.grey700}>
          {label}
        </T>
        {sub ? (
          <T v="body" center color={colors.grey600}>
            {sub}
          </T>
        ) : null}
      </View>
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

/** Figma "Status Banner": 40px #EAF1F5 strip, 16px icon + Inter SemiBold 14 in the status colour. */
export function StatusBanner({ tone, text, style }: { tone: 'pending' | 'success' | 'error' | 'info'; text: string; style?: StyleProp<ViewStyle> }) {
  const c = { pending: colors.orange, success: colors.green, error: colors.red, info: colors.blue }[tone];
  const icon = { pending: 'alert-circle', success: 'check-circle', error: 'x-circle', info: 'info' }[tone] as 'info';
  return (
    <Row gap={10} style={[{ minHeight: 40, borderRadius: 8, backgroundColor: colors.base, paddingHorizontal: 16, paddingVertical: 10 }, style]}>
      <Feather name={icon} size={16} color={c} />
      <Text style={{ flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: c }}>{text}</Text>
    </Row>
  );
}

export const VerifiedTick = ({ size = 16 }: { size?: number }) => <Ionicons name="checkmark-circle" size={size} color={colors.blue} accessibilityLabel="Verified" />;

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 17, gap: 12 },
  btn: { height: 55, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  btnText: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 17 },
  link: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 16, textDecorationLine: 'underline', textAlign: 'center' },
  track: { flex: 1, height: 5, borderRadius: 11, backgroundColor: colors.secondary, justifyContent: 'center' },
  trackFill: { height: 6, backgroundColor: colors.primary, borderRadius: 360 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, minHeight: 60, paddingVertical: 12, borderRadius: radius.full, marginBottom: 16 },
  optionText: { fontFamily: fonts.body, fontSize: 16, lineHeight: 20, color: colors.grey700 },
  optionTextOn: { fontFamily: fonts.bodyMedium, color: colors.grey800 },
  chip: { height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, borderRadius: radius.full },
  chipText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  segment: { flexDirection: 'row', backgroundColor: colors.secondary, borderRadius: radius.full, padding: 8, height: 60 },
  segmentItem: { flex: 1, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  segmentSep: { width: 1, height: 26, alignSelf: 'center', backgroundColor: colors.grey600 },
  toggle: { width: 32, height: 16, borderRadius: 33, padding: 2, justifyContent: 'center' },
  knob: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.white },
  toggleLabel: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.grey600 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.base, borderRadius: radius.full, height: 55, paddingHorizontal: 16, borderWidth: 1, borderColor: 'transparent' },
  fieldLabel: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.grey800, marginBottom: 8 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.grey900, paddingVertical: 0, height: '100%' },
  card: { backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { fontFamily: fonts.body, fontSize: 16, lineHeight: 20, color: colors.grey800, flexShrink: 1 },
  rowValue: { fontFamily: fonts.body, fontSize: 16, lineHeight: 20, color: colors.grey600, maxWidth: 190 },
  badge: { height: 26, paddingHorizontal: 10, borderRadius: 16, justifyContent: 'center' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 55, paddingVertical: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.grey400 },
});
