import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Card, Header, ListRow, Row, Screen, T } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { adminOverview } from '@/services/api';
import { colors } from '@/theme';

export default function AdminHome() {
  const { data, loading } = useServer(adminOverview, null);
  if (loading) return <Screen><Header title="Moderation" /><ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /></Screen>;
  if (!data)
    return (
      <Screen>
        <Header title="Moderation" />
        <T v="body" color={colors.grey700}>You don&apos;t have access to this area.</T>
      </Screen>
    );
  const stats = [
    ['Open reports', data.openReports],
    ['IDs to review', data.pendingVerifications],
    ['Banned', data.banned],
    ['Members', data.users],
  ] as const;
  return (
    <Screen scroll>
      <Header title="Moderation" />
      <Row gap={10} style={{ flexWrap: 'wrap', marginBottom: 16 }}>
        {stats.map(([k, v]) => (
          <Card key={k} style={{ width: '47%', flexGrow: 1 }}>
            <T v="h2">{v}</T>
            <T v="caption" color={colors.grey700}>{k}</T>
          </Card>
        ))}
      </Row>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow label="Reports" value={data.openReports ? `${data.openReports} open` : 'All clear'} onPress={() => router.push('/admin/reports')} />
        <ListRow label="Verification review" value={data.pendingVerifications ? `${data.pendingVerifications} waiting` : 'All clear'} last onPress={() => router.push('/admin/verifications')} />
      </Card>
      <View style={{ marginTop: 16 }}>
        <T v="caption" color={colors.grey600}>
          Aim to review reports within 24 hours. Banning ends all of the person&apos;s matches and hides them from everyone.
        </T>
      </View>
    </Screen>
  );
}
