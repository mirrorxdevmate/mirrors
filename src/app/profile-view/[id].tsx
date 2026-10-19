import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileDetail } from '@/components/profile';
import { BackButton, Button, Row } from '@/components/ui';
import type { Profile } from '@/data/profiles';
import { usePerson } from '@/hooks/usePerson';
import { showInterest } from '@/services/actions';
import { decide } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

/** Full profile view (from Likes, Chat header, or "Preview" of your own profile with id = "me"). */
export default function ProfileView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useApp((s) => s.profile);
  const matched = useApp((s) => !!s.matchIds[id]);
  const { person } = usePerson(id === 'me' ? undefined : id);
  const p: Profile | undefined =
    id === 'me'
      ? {
          id: 'me',
          gender: me.gender === 'Man' ? 'man' : me.gender === 'Woman' ? 'woman' : 'other',
          idVerified: useApp.getState().verification.identity === 'verified',
          name: me.firstName || 'You',
          age: me.birthday.y ? new Date().getFullYear() - Number(me.birthday.y) : 0,
          verified: useApp.getState().verification.photo === 'verified',
          city: me.location.city.split(',')[0] || '—',
          distanceKm: null,
          heightCm: me.heightCm,
          profession: me.profession || '—',
          intent: me.intent || '—',
          drinking: me.lifestyle.drinking ?? '—',
          smoking: me.lifestyle.smoking ?? '—',
          children: me.visibility.children?.show ? me.children || '—' : 'Hidden',
          pets: me.lifestyle.pets ?? '—',
          about: me.about || me.intentDetail || 'Add a short bio from Edit profile.',
          faith: me.visibility.faith?.show ? me.faith : '',
          culture: me.visibility.culture?.show ? me.culture.join(', ') : '',
          education: me.education,
          values: useApp.getState().type.mattersMost,
          hobbies: me.hobbies,
          photos: me.photos,
          why: [],
          whyPremium: [],
        }
      : person;
  if (!p) return null;
  const own = id === 'me';

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {p.photos[0] ? <Image source={p.photos[0]} style={{ width: '100%', aspectRatio: 0.8, backgroundColor: colors.grey200 }} contentFit="cover" /> : <View style={{ height: 120 }} />}
        <View style={{ padding: 16, paddingTop: 20, marginTop: -32, marginHorizontal: 16, backgroundColor: colors.base, borderRadius: 32 }}>
          <ProfileDetail p={p} onWhy={own ? undefined : () => router.push(`/why/${p.id}`)} />
        </View>
      </ScrollView>
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 16 }} edges={['top']}>
        <BackButton light />
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={{ position: 'absolute', left: 16, right: 16, bottom: 8 }}>
        {own ? (
          <Button title="Edit profile" onPress={() => router.replace('/settings/edit-profile')} />
        ) : matched ? (
          <Button title="Message" onPress={() => router.replace(`/chat/${p.id}`)} />
        ) : (
          <Row gap={10}>
            <Button title="Not for me" variant="white" style={{ flex: 1, borderWidth: 1, borderColor: colors.grey900 }} onPress={() => { decide(p.id, 'pass').catch(() => {}); router.back(); }} />
            <Button
              title="Interested"
              style={{ flex: 1 }}
              onPress={async () => {
                const mutual = await showInterest(p.id, { replace: true }).catch(() => false);
                if (!mutual) router.back();
              }}
            />
          </Row>
        )}
      </SafeAreaView>
    </View>
  );
}
