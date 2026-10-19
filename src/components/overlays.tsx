import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';
import { Button, T } from './ui';

/** Bottom sheet built on Modal so it works identically on iOS, Android and web. */
export function Sheet({
  visible,
  onClose,
  children,
  title,
  dismissable = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  dismissable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="Close"
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          onPress={dismissable ? onClose : undefined}
        />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={s.handle} />
          {title ? (
            <Text style={s.sheetTitle} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** Figma dialog: full-width #F8F9FA panel over a 40% black scrim, "Attention" eyebrow, stacked pill buttons. */
export function Dialog({
  visible,
  title,
  eyebrow,
  message,
  primary,
  secondary,
  onClose,
  destructive,
}: {
  visible: boolean;
  title: string;
  eyebrow?: string;
  message?: string;
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  onClose: () => void;
  destructive?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.center}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <View style={s.dialog} accessibilityRole="alert">
          {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
          <Text style={s.dialogTitle}>{title}</Text>
          {message ? (
            <T v="bodyL" color={colors.grey700} center style={{ marginTop: 16, lineHeight: 20, paddingHorizontal: 16 }}>
              {message}
            </T>
          ) : null}
          <View style={{ height: 50 }} />
          <Button title={primary.label} variant={destructive ? 'danger' : 'primary'} onPress={primary.onPress} />
          {secondary ? <Button title={secondary.label} variant="outline" onPress={secondary.onPress} style={{ marginTop: 14 }} /> : null}
        </View>
      </View>
    </Modal>
  );
}

export function Tooltip({ text, visible, onHide, top = 110 }: { text: string; visible: boolean; onHide: () => void; top?: number }) {
  const [o] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!visible) return;
    Animated.timing(o, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => Animated.timing(o, { toValue: 0, duration: 200, useNativeDriver: true }).start(onHide), 3200);
    return () => clearTimeout(t);
  }, [visible, o, onHide]);
  if (!visible) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.tooltip, { top, opacity: o }]} accessibilityLiveRegion="polite">
      <Feather name="alert-circle" size={14} color={colors.primary} style={{ marginTop: 1 }} />
      <T v="caption" color={colors.grey900} style={{ flex: 1, fontSize: 12 }}>
        {text}
      </T>
    </Animated.View>
  );
}

function makePieces(count: number, width: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random() * width,
    delay: Math.random() * 600,
    dur: 2200 + Math.random() * 1600,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    drift: (Math.random() - 0.5) * 120,
    spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720),
    round: Math.random() > 0.6,
    v: new Animated.Value(0),
  }));
}

const CONFETTI_COLORS = [colors.primary, colors.secondary, colors.amber, colors.gold500, colors.blue, colors.green, '#F2BCAE'];

/** Lightweight confetti burst (no native deps). */
export function Confetti({ count = 70 }: { count?: number }) {
  const { width, height } = Dimensions.get('window');
  const [pieces] = useState(() => makePieces(count, width));
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.parallel(
      pieces.map((p) => Animated.timing(p.v, { toValue: 1, duration: p.dur, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: true })),
    ).start();
  }, [pieces]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? p.size : 2,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 16, maxHeight: '92%' },
  handle: { alignSelf: 'center', width: 60, height: 2, borderRadius: 1, backgroundColor: colors.grey500, marginBottom: 36 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, marginBottom: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dialog: { width: '100%', backgroundColor: colors.grey100, paddingHorizontal: 16, paddingTop: 31, paddingBottom: 36 },
  eyebrow: { fontFamily: fonts.headingMedium, fontSize: 18, lineHeight: 24, color: colors.grey900, textAlign: 'center', marginBottom: 34 },
  dialogTitle: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, textAlign: 'center' },
  tooltip: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 8, backgroundColor: colors.secondary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12, zIndex: 50, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
});
