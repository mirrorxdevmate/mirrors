import { useEffect, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { colors, fonts } from '@/theme';

const KNOB = 14;

type Box = { values: number[]; width: number; onChange: (v: number[]) => void; start: number[]; min: number; max: number; step: number };

function makeResponder(box: Box, i: number) {
  const toX = (v: number) => ((v - box.min) / (box.max - box.min)) * box.width;
  const fromX = (x: number) => {
    const w = box.width || 1;
    const raw = box.min + (Math.max(0, Math.min(w, x)) / w) * (box.max - box.min);
    return Math.round(raw / box.step) * box.step;
  };
  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      box.start[i] = toX(box.values[i]);
    },
    onPanResponderMove: (_, g) => {
      const vals = box.values;
      let v = fromX(box.start[i] + g.dx);
      if (vals.length === 2) v = i === 0 ? Math.min(v, vals[1] - box.step) : Math.max(v, vals[0] + box.step);
      if (v !== vals[i]) {
        const next = [...vals];
        next[i] = v;
        box.values = next;
        box.onChange(next);
      }
    },
  });
}

/**
 * Figma "Slider": thin grey track, coral active segment, white knobs with a coral value tag underneath.
 * Pass two values for a range, one for a single slider.
 */
export function Slider({
  min,
  max,
  values,
  onChange,
  step = 1,
  label,
}: {
  min: number;
  max: number;
  values: number[];
  onChange: (v: number[]) => void;
  step?: number;
  label?: string;
}) {
  const [width, setWidth] = useState(0);
  // Mutable box read by the gesture handlers (kept in sync after each render).
  const [box] = useState(() => ({ values, width: 0, onChange, start: [0, 0], min, max, step }));
  useEffect(() => {
    Object.assign(box, { values, width, onChange, min, max, step });
  });
  const [responders] = useState(() => [0, 1].map((i) => makeResponder(box, i)));

  const toX = (v: number) => ((v - min) / (max - min)) * width;
  const lo = values.length === 2 ? toX(values[0]) : 0;
  const hi = toX(values[values.length - 1]);

  return (
    <View style={st.wrap} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel={label} accessibilityValue={{ text: values.join(' to ') }}>
      <View style={st.track} />
      <View style={[st.active, { left: lo, width: Math.max(0, hi - lo) }]} />
      {width > 0
        ? values.map((v, i) => (
            <View key={i} style={[st.knobBox, { left: toX(v) - 20 }]} {...responders[i].panHandlers} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <View style={st.knob} />
              <View style={st.tag}>
                <Text style={st.tagText}>{v}</Text>
              </View>
            </View>
          ))
        : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { height: 44, justifyContent: 'flex-start', marginHorizontal: 7 },
  track: { position: 'absolute', left: 0, right: 0, top: 10, height: 3, borderRadius: 2, backgroundColor: colors.grey300 },
  active: { position: 'absolute', top: 10, height: 3, borderRadius: 2, backgroundColor: colors.primary },
  knobBox: { position: 'absolute', top: 4, width: 40, alignItems: 'center' },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grey500 },
  tag: { marginTop: 4, minWidth: 22, height: 16, borderRadius: 4, backgroundColor: colors.primary, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.white },
});
