import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable } from 'react-native';

import { CITIES } from '@/data/profiles';
import { colors } from '@/theme';
import { Sheet } from './overlays';
import { Field, T } from './ui';

export function CityPicker({ visible, onClose, onPick, title = 'Search a city' }: { visible: boolean; onClose: () => void; onPick: (city: string) => void; title?: string }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? CITIES.filter((c) => c.toLowerCase().includes(s)) : CITIES;
    // Allow free-text cities not in the suggestion list.
    return s && !list.some((c) => c.toLowerCase() === s) ? [...list, q.trim()] : list;
  }, [q]);

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <Field
        autoFocus
        value={q}
        onChangeText={setQ}
        placeholder="Search a city"
        returnKeyType="search"
        left={<Feather name="search" size={16} color={colors.grey600} />}
      />
      <FlatList
        data={results}
        keyExtractor={(c) => c}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: 360 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              onPick(item);
              setQ('');
              onClose();
            }}
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.grey300 }}>
            <Feather name="map-pin" size={16} color={colors.grey600} />
            <T v="bodyL">{item}</T>
          </Pressable>
        )}
      />
    </Sheet>
  );
}
