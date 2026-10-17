import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Sheet } from '@/components/overlays';
import { Button, Card, Field, Header, Loading, Screen, T, Title } from '@/components/ui';
import { interpretType } from '@/services/api';
import { useApp, type TypeTrait } from '@/store/useApp';
import { colors } from '@/theme';

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

  if (loading)
    return (
      <Screen>
        <Loading label="Understanding your preferences…" />
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
      {edit ? <Header /> : <View style={{ height: 16 }} />}
      <Title sub="Change anything that doesn't sound like you.">Here&apos;s what we understood.</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {traits.map((t, i) => (
          <Pressable
            key={t.key + i}
            accessibilityRole="button"
            accessibilityHint="Edit"
            onPress={() => setEditing({ index: i, label: t.label, value: t.value })}
            style={{ width: '48%' }}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T v="overline" color={colors.primary}>
                  {t.label}
                </T>
                <Feather name="edit-2" size={12} color={colors.grey600} />
              </View>
              <T v="bodyLM" style={{ marginTop: 4 }}>
                {t.value}
              </T>
            </Card>
          </Pressable>
        ))}
      </View>
      <Button title="+ Add something we missed" variant="outline" style={{ marginTop: 16 }} onPress={() => setEditing({ index: traits.length, label: '', value: '' })} />
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing && editing.index < traits.length ? 'Edit' : 'Add something'}>
        {editing ? (
          <>
            <Field label="What" value={editing.label} onChangeText={(label) => setEditing({ ...editing, label })} placeholder="e.g. Personality" />
            <Field label="Your preference" value={editing.value} onChangeText={(value) => setEditing({ ...editing, value })} placeholder="e.g. Warm and curious" />
            <Button title="Save" disabled={!editing.label.trim() || !editing.value.trim()} onPress={saveEdit} />
            {editing.index < traits.length ? (
              <Button
                title="Remove"
                variant="ghost"
                onPress={() => {
                  setTraits(traits.filter((_, i) => i !== editing.index));
                  setEditing(null);
                }}
              />
            ) : null}
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
