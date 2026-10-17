import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/profile';
import { Badge, Card, ListRow, Row, Screen, T, VerifiedTick } from '@/components/ui';
import { BATCH, useApp } from '@/store/useApp';
import { colors } from '@/theme';

const go = (path: string) => () => router.push(path as never);

export default function ProfileTab() {
  const profile = useApp((s) => s.profile);
  const plan = useApp((s) => s.plan);
  const verified = useApp((s) => s.verification.photo === 'verified');
  const isAdmin = useApp((s) => s.isAdmin);
  return (
    <Screen scroll edges={['top']}>
      <Row gap={12} style={{ paddingVertical: 12 }}>
        <Avatar uri={profile.photos[0]} size={52} />
        <View style={{ flex: 1 }}>
          <Row gap={6}>
            <T v="h3">{profile.firstName || 'Your profile'}</T>
            {verified ? <VerifiedTick /> : null}
          </Row>
          <Pressable onPress={go('/profile-view/me')} accessibilityRole="button" hitSlop={8}>
            <Row gap={2}>
              <T v="body" color={colors.grey600}>
                Preview
              </T>
              <Feather name="chevron-right" size={14} color={colors.grey600} />
            </Row>
          </Pressable>
        </View>
        {plan !== 'free' ? <Badge kind={plan === 'plus' ? 'plus' : 'premium'} /> : null}
      </Row>
      <Card style={{ paddingVertical: 0, marginTop: 4 }}>
        <ListRow
          label={plan === 'free' ? 'Mirror+ & Premium' : `You're on ${BATCH[plan].label}`}
          badge={
            plan === 'free' ? (
              <Row gap={6}>
                <Badge kind="plus" />
                <Badge kind="premium" />
              </Row>
            ) : undefined
          }
          onPress={go('/upgrade')}
        />
        <ListRow label="Edit profile" onPress={go('/settings/edit-profile')} />
        <ListRow label="My Type" onPress={go('/settings/my-type')} />
        <ListRow label="Relationship intent" value={profile.intent} onPress={go('/onboarding/intent?edit=1')} />
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
        <Card style={{ paddingVertical: 0, marginTop: 12, backgroundColor: colors.secondary }}>
          <ListRow label="Admin · Moderation" last icon={<Feather name="shield" size={18} color={colors.primary} />} onPress={go('/admin')} />
        </Card>
      ) : null}
    </Screen>
  );
}
