import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Avatar, Verified } from '@/components/profile';
import { Badge, Card, ListRow, Row, Screen } from '@/components/ui';
import { photoUrl } from '@/lib/supabase';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

const go = (path: string) => () => router.push(path as never);

export default function ProfileTab() {
  const profile = useApp((s) => s.profile);
  const plan = useApp((s) => s.plan);
  const verified = useApp((s) => s.verification.photo === 'verified');
  const isAdmin = useApp((s) => s.isAdmin);
  return (
    <Screen scroll edges={['top']}>
      <Pressable onPress={go('/profile-view/me')} accessibilityRole="button" accessibilityLabel="Preview your profile" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <Avatar uri={photoUrl(profile.photos[0] ?? '')} size={50} />
        <Text style={st.name}>{profile.firstName || 'Your profile'}</Text>
        {verified ? <Verified /> : null}
      </Pressable>
      <Card style={{ paddingVertical: 8, marginTop: 24 }}>
        <ListRow
          label="Mirror+ & Premium"
          badge={
            <Row gap={10}>
              <Badge kind="plus" />
              <Badge kind="premium" />
            </Row>
          }
          onPress={go('/upgrade')}
        />
        <ListRow label="Edit profile" onPress={go('/settings/edit-profile')} />
        <ListRow label="My Type" onPress={go('/settings/my-type')} />
        <ListRow label="Relationship intent" onPress={go('/onboarding/intent?edit=1')} />
        <ListRow label="Preferences" onPress={go('/settings/preferences')} />
        <ListRow label="Discovery" badge={<Badge kind="plus" />} onPress={go('/settings/discovery')} />
        <ListRow label="Travel mode" badge={<Badge kind="premium" />} onPress={go('/settings/travel')} />
        <ListRow label="Deal-breakers" onPress={go('/type/flexibility?edit=1')} />
        <ListRow label="Verification" onPress={go('/settings/verification')} />
        <ListRow label="Your Pattern" onPress={go('/settings/pattern')} />
        <ListRow label="Privacy" onPress={go('/settings/privacy')} />
        <ListRow label="Safety" onPress={go('/settings/safety')} />
        <ListRow label="Notifications" onPress={go('/settings/notifications')} />
        <ListRow label="Account" onPress={go('/settings/account')} />
        <ListRow label="Manage subscription" onPress={go(plan === 'free' ? '/upgrade' : '/subscription')} />
        <ListRow label="Help" last onPress={go('/settings/help')} />
      </Card>
      {isAdmin ? (
        <Card style={{ paddingVertical: 4, marginTop: 16, marginBottom: 8, backgroundColor: colors.secondary }}>
          <ListRow label="Admin · Moderation" last icon={<Feather name="shield" size={18} color={colors.primary} />} onPress={go('/admin')} />
        </Card>
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  name: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 20, color: colors.grey900 },
});
