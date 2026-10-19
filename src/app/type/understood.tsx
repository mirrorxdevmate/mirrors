import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/overlays';
import { Spinner } from '@/components/Spinner';
import { Button, Field, Header, Screen, T } from '@/components/ui';
import { interpretType } from '@/services/api';
import { useApp, type TypeTrait } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export default function WhatWeUnderstood() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const type = useApp((s) => s.type);
  const interestedIn = useApp((s) => s.profile.interestedIn);
  const updateType = useApp((s) => s.updateType);
  const [loading, setLoading] = useState(true);
  const [traits, setTraits] = useState<TypeTrait[]>([]);
  const [ages, setAges] = useState({ ageMin: type.ageMin, ageMax: type.ageMax });
  const [editing, setEditing] = useState<{ index: number; label: string; value: string } | null>(null);

  useEffect(() => {
    let alive = true;
    interpretType(type.description, interestedIn).then((r) => {
      if (!alive) return;
      setTraits(r.traits);
      setAges({ ageMin: r.ageMin, ageMax: r.ageMax });
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [type.description, interestedIn]);

  // INTERPRETING
  if (loading)
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 80 }}>
          <Spinner />
          <T v="bodyL" color={colors.grey700} center>
            Understanding your preferences…
          </T>
        </View>
      </Screen>
    );

  const saveEdit = () => {
    if (!editing) return;
    const label = editing.label.trim();
    const value = editing.value.trim();
    if (!label || !value) return;
    const next = [...traits];
    const item = { key: next[editing.index]?.key ?? label.toLowerCase().replace(/\W+/g, '-'), label, value };
    if (editing.index >= next.length) next.push(item);
    else next[editing.index] = item;
    if (item.key === 'age') {
      const m = value.match(/(\d{2})\D+(\d{2})/);
      if (m) setAges({ ageMin: +m[1], ageMax: +m[2] });
    }
    setTraits(next);
    setEditing(null);
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          title="Looks right"
          onPress={() => {
            updateType({ traits, ...ages });
            if (edit) router.back();
            else router.push('/type/flexibility');
          }}
        />
      }>
      <Header title="Here's what we understood." />
      <T v="bodyL" color={colors.grey700} style={{ marginTop: 24, marginBottom: 24, lineHeight: 20 }}>
        {"Change anything that doesn't sound like you."}
      </T>
      <View style={{ gap: 12 }}>
        {traits.map((t, i) => (
          <Pressable
            key={t.key + i}
            accessibilityRole="button"
            accessibilityLabel={`${t.label}: ${t.value}. Edit`}
            onPress={() => setEditing({ index: i, label: t.label, value: t.value })}
            style={({ pressed }) => [st.card, pressed && { opacity: 0.8 }]}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={st.label}>{t.label.toUpperCase()}</Text>
              <Text style={st.value}>{t.value}</Text>
            </View>
            <Feather name="edit-2" size={15} color={colors.grey600} />
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setEditing({ index: traits.length, label: '', value: '' })}
        style={({ pressed }) => [st.add, pressed && { opacity: 0.6 }]}>
        <T v="body" color={colors.grey800} center>
          + Add something we missed
        </T>
      </Pressable>
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing && editing.index < traits.length ? 'Edit' : 'Add something'}>
        {editing ? (
          <View style={{ gap: 12 }}>
            <Field label="What" value={editing.label} onChangeText={(label) => setEditing({ ...editing, label })} placeholder="e.g. Personality" />
            <Field label="Your preference" value={editing.value} onChangeText={(value) => setEditing({ ...editing, value })} placeholder="e.g. Warm and curious" />
            <Button title="Save" disabled={!editing.label.trim() || !editing.value.trim()} onPress={saveEdit} />
            {editing.index < traits.length ? (
              <Button
                title="Remove"
                variant="outline"
                onPress={() => {
                  setTraits(traits.filter((_, i) => i !== editing.index));
                  setEditing(null);
                }}
              />
            ) : null}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { minHeight: 76, backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 20, color: colors.grey600 },
  value: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 20, color: colors.grey900 },
  add: { marginTop: 16, height: 45, borderRadius: 360, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.grey500, justifyContent: 'center' },
});
