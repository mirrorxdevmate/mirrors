import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { colors } from '@/theme';

/** Thin ring loader used on VERIFYING / PROCESSING screens (50px, soft coral track, coral arc). */
export function Spinner({ size = 50, color = colors.primary, track = colors.secondary }: { size?: number; color?: string; track?: string }) {
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View
      accessibilityRole="progressbar"
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: track, borderTopColor: color, transform: [{ rotate }] }}
    />
  );
}
