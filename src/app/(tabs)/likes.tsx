import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Screen, T } from '@/components/ui';
import type { Profile } from '@/data/profiles';
import { getLikes, type Card } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, radius } from '@/theme';

export default function Likes() {
  const [state, setState] = useState<{ count: number; unlocked: boolean; people: Profile[]; previews: string[] } | null>(null);

  useFocusEffect(
    useCallback(() => {
      getLikes()
        .then((r) => {
          const people = r.unlocked ? useApp.getState().cachePeople(r.items as Card[]) : [];
          const previews = r.unlocked ? [] : (r.items as { photo: string }[]).map((x) => x.photo).filter(Boolean);
          setState({ count: r.count, unlocked: r.unlocked, people, previews });
        })
        .catch(() => setState((s) => s ?? { count: 0, unlocked: false, people: [], previews: [] }));
    }, []),
  );

  if (!state)
    return (
      <Screen edges={['top']}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </Screen>
    );

  const { count, unlocked, people, previews } = state;

  return (
    <Screen scroll edges={['top']}>
      <T v="h2" style={{ marginTop: 12 }}>
        Interested in you
      </T>
      {count === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Feather name="heart" size={36} color={colors.grey400} />
          <T v="h4" center style={{ marginTop: 12 }}>
            No one yet
          </T>
          <T v="body" center color={colors.grey600} style={{ marginTop: 6 }}>
            When someone shows interest in you, they&apos;ll appear here.
          </T>
        </View>
      ) : (
        <>
          <T v="bodyLM" style={{ marginTop: 12 }}>
            {count} {count === 1 ? 'person is' : 'people are'} interested in you.
          </T>
          <T v="body" color={colors.grey700} style={{ marginTop: 4, marginBottom: 16 }}>
            {unlocked ? 'Tap a profile to read it in full before you decide.' : 'Their profiles are hidden until you upgrade.'}
          </T>
          <View style={st.grid}>
            {unlocked
              ? people.map((p) => (
                  <Pressable key={p.id} style={st.cell} accessibilityRole="button" accessibilityLabel={`${p.name}, ${p.age}`} onPress={() => router.push(`/profile-view/${p.id}`)}>
                    {p.photos[0] ? <Image source={p.photos[0]} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                    <View style={st.label}>
                      <T v="captionM" color={colors.white}>
                        {p.name}, {p.age}
                        {p.city ? ` · ${p.city}` : ''}
                      </T>
                    </View>
                  </Pressable>
                ))
              : previews.slice(0, 3).map((photo, i) => (
                  <Pressable key={i} style={st.cell} accessibilityRole="button" accessibilityLabel="Hidden profile" onPress={() => router.push('/upgrade')}>
                    <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={25} />
                  </Pressable>
                ))}
            {!unlocked && count > 3 ? (
              <Pressable style={[st.cell, st.more]} onPress={() => router.push('/upgrade')} accessibilityRole="button">
                <T v="h3" color={colors.primary}>
                  + {count - 3} more
                </T>
              </Pressable>
            ) : null}
          </View>
          {!unlocked ? <Button title="See who's interested" style={{ marginTop: 20 }} onPress={() => router.push('/upgrade')} /> : null}
        </>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%', flexGrow: 1, aspectRatio: 0.78, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.grey200 },
  label: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.35)' },
  more: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary },
});
