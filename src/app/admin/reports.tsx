import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { Button, Card, Header, Row, Screen, Segmented, T } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { adminReports, adminResolveReport, adminSetBan, type AdminReport } from '@/services/api';
import { colors, radius } from '@/theme';

export default function AdminReports() {
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const { data, loading, reload, setData } = useServer(() => adminReports(filter), [] as AdminReport[]);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (r: AdminReport, action: 'dismiss' | 'actioned' | 'ban') => {
    setBusy(r.id);
    try {
      await adminResolveReport(r.id, action);
      setData(data.filter((x) => (action === 'ban' ? x.reported.id !== r.reported.id : x.id !== r.id)));
    } catch {
      Alert.alert('Could not update the report');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll>
      <Header title="Reports" />
      <Segmented
        options={[{ label: 'Open', value: 'open' }, { label: 'All', value: 'all' }]}
        value={filter}
        onChange={(v) => {
          setFilter(v);
          adminReports(v).then(setData).catch(() => {});
        }}
      />
      <View style={{ height: 16 }} />
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && data.length === 0 ? (
        <T v="body" color={colors.grey600} center style={{ marginTop: 40 }}>
          No reports here.
        </T>
      ) : null}
      {data.map((r) => (
        <Card key={r.id} style={{ marginBottom: 12, gap: 8 }}>
          <Row gap={12}>
            {r.reported.photos?.[0] ? <Image source={r.reported.photos[0]} style={{ width: 48, height: 48, borderRadius: 24 }} /> : null}
            <View style={{ flex: 1 }}>
              <T v="bodyS">
                {r.reported.name} · {r.reported.email || 'no email'}
              </T>
              <T v="caption" color={colors.grey600}>
                {r.reported.reportCount} report{r.reported.reportCount === 1 ? '' : 's'} total{r.reported.banned ? ' · BANNED' : ''}
              </T>
            </View>
          </Row>
          <View style={{ backgroundColor: colors.white, borderRadius: radius.sm, padding: 10 }}>
            <T v="overline" color={colors.primary}>
              {r.reason} · {r.status}
            </T>
            <T v="body" style={{ marginTop: 4 }}>
              {r.details || 'No details given.'}
            </T>
            <T v="caption" color={colors.grey600} style={{ marginTop: 6 }}>
              From {r.reporter.name || 'a member'} ({r.reporter.email}) · {new Date(r.createdAt).toLocaleString()}
            </T>
          </View>
          {r.status === 'open' || r.status === 'reviewing' ? (
            <Row gap={8}>
              <Button title="Dismiss" small variant="outline" style={{ flex: 1 }} loading={busy === r.id} onPress={() => act(r, 'dismiss')} />
              <Button title="Warned" small variant="secondary" style={{ flex: 1 }} onPress={() => act(r, 'actioned')} />
              <Button
                title="Ban"
                small
                variant="danger"
                style={{ flex: 1 }}
                onPress={() =>
                  Alert.alert(`Ban ${r.reported.name}?`, 'They will be hidden from everyone and all their matches end.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Ban', style: 'destructive', onPress: () => act(r, 'ban') },
                  ])
                }
              />
            </Row>
          ) : r.reported.banned ? (
            <Button title="Unban" small variant="outline" onPress={() => adminSetBan(r.reported.id, false).then(reload).catch(() => {})} />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
