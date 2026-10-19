import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Header, Screen, T } from '@/components/ui';
import type { Profile } from '@/data/profiles';
import { getLikes, type Card } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

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

  const shown = unlocked ? people : previews.slice(0, 4);
  const more = count - shown.length;

  return (
    <Screen scroll edges={['top']} footer={!unlocked && count > 0 ? <Button title="See who's interested" onPress={() => router.push('/upgrade')} /> : undefined}>
      <Header title="Interested in you" big={false} onBack={() => router.navigate('/(tabs)')} />
      {count === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <Text style={st.h1}>No one yet</Text>
          <T v="body" center color={colors.grey700} style={{ marginTop: 12 }}>
            {"When someone shows interest in you, they'll appear here."}
          </T>
        </View>
      ) : (
        <>
          <Text style={[st.h1, { marginTop: 24 }]}>
            {count} {count === 1 ? 'person is' : 'people are'} interested in you.
          </Text>
          <T v="body" color={colors.grey700} style={{ marginTop: 16, marginBottom: 16 }}>
            {unlocked ? 'Tap a profile to read it in full before you decide.' : 'Their profiles are hidden until you upgrade.'}
          </T>
          <View style={st.grid}>
            {shown.map((item, i) => {
              const p = unlocked ? (item as Profile) : null;
              const photo = p ? p.photos[0] : (item as string);
              return (
                <Pressable
                  key={p?.id ?? i}
                  style={st.cell}
                  accessibilityRole="button"
                  accessibilityLabel={p ? `${p.name}, ${p.age}` : 'Hidden profile'}
                  onPress={() => (p ? router.push(`/profile-view/${p.id}`) : router.push('/upgrade'))}>
                  <View style={st.photo}>{photo ? <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={p ? 0 : 25} /> : null}</View>
                  {p ? (
                    <T v="body" color={colors.grey800} style={{ marginTop: 8, marginLeft: 12 }} numberOfLines={1}>
                      {p.name}, {p.age}
                      {p.city ? ` · ${p.city.split(',')[0]}` : ''}
                    </T>
                  ) : (
                    <View style={st.skeleton} />
                  )}
                </Pressable>
              );
            })}
          </View>
          {more > 0 ? (
            <T v="body" color={colors.grey700} center style={{ marginTop: 24 }}>
              + {more} more
            </T>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 16 },
  cell: { width: '47.5%' },
  photo: { width: '100%', aspectRatio: 191 / 139, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.grey200 },
  skeleton: { marginTop: 10, height: 12, borderRadius: 6, backgroundColor: colors.base },
});
