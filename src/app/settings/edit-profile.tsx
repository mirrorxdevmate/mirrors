import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { PhotoGrid } from '@/components/PhotoGrid';
import { Card, Header, ListRow, Screen, SectionLabel, T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts, radius } from '@/theme';
import { toFtIn } from '@/utils/date';

export default function EditProfile() {
  const p = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const [about, setAbout] = useState(p.about);
  const e = (path: string) => () => router.push(`${path}?edit=1` as never);

  return (
    <Screen scroll>
      <Header title="Edit profile" spaced />
      <SectionLabel>Photos</SectionLabel>
      <PhotoGrid photos={p.photos} onChange={(photos) => photos.length && updateProfile({ photos })} />
      <T v="caption" color={colors.grey600} style={{ marginTop: 6 }}>
        Keep at least one photo of your face.
      </T>

      <SectionLabel>About</SectionLabel>
      <TextInput
        value={about}
        onChangeText={setAbout}
        onBlur={() => updateProfile({ about: about.trim() })}
        multiline
        maxLength={300}
        placeholder="A few lines about you…"
        placeholderTextColor={colors.grey500}
        style={{ minHeight: 100, backgroundColor: colors.base, borderRadius: radius.md, padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.grey900, textAlignVertical: 'top', marginBottom: 16 }}
      />

      <SectionLabel>Basics</SectionLabel>
      <Card style={{ paddingVertical: 0, marginBottom: 16 }}>
        <ListRow label="Name" value={p.firstName} onPress={e('/onboarding/name')} />
        <ListRow label="Gender" value={p.genderCustom || p.gender} onPress={e('/onboarding/gender')} />
        <ListRow label="Location" value={p.location.city} onPress={e('/onboarding/location')} />
        <ListRow label="Looking for" value={p.intent} onPress={e('/onboarding/intent')} />
        <ListRow label="What that means" value={p.intentDetail} last onPress={e('/onboarding/intent-detail')} />
      </Card>
      <SectionLabel>Details</SectionLabel>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow label="Relationship status" value={p.relationshipStatus} onPress={e('/details/status')} />
        <ListRow label="Children" value={p.children} onPress={e('/details/children')} />
        <ListRow label="Lifestyle" value={Object.values(p.lifestyle).join(', ')} onPress={e('/details/lifestyle')} />
        <ListRow label="Hobbies" value={p.hobbies.join(', ')} onPress={e('/details/hobbies')} />
        <ListRow label="Faith" value={p.faith} onPress={e('/details/faith')} />
        <ListRow label="Height" value={p.heightUnit === 'cm' ? `${p.heightCm} cm` : toFtIn(p.heightCm)} onPress={e('/details/height')} />
        <ListRow label="Education" value={p.education} onPress={e('/details/education')} />
        <ListRow label="Profession" value={p.profession} onPress={e('/details/profession')} />
        <ListRow label="Cultural background" value={p.culture.join(', ')} last onPress={e('/details/culture')} />
      </Card>
    </Screen>
  );
}
