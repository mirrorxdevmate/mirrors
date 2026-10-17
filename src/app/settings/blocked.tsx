import { ActivityIndicator, View } from 'react-native';

import { Avatar } from '@/components/profile';
import { Button, Card, Header, Row, Screen, T } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { getBlocked, unblockUser } from '@/services/api';
import { colors } from '@/theme';

export default function Blocked() {
  const { data: blocked, loading, setData } = useServer(getBlocked, []);
  return (
    <Screen scroll>
      <Header title="Blocked users" />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : blocked.length === 0 ? (
        <T v="body" color={colors.grey600} center style={{ marginTop: 40 }}>
          You haven&apos;t blocked anyone.
        </T>
      ) : (
        blocked.map((p) => (
          <Card key={p.id} style={{ marginBottom: 10 }}>
            <Row gap={12}>
              <Avatar uri={p.photo ?? undefined} size={44} />
              <View style={{ flex: 1 }}>
                <T v="bodyS">{p.name || 'User'}</T>
              </View>
              <Button
                title="Unblock"
                small
                variant="outline"
                onPress={async () => {
                  setData(blocked.filter((b) => b.id !== p.id));
                  await unblockUser(p.id).catch(() => {});
                }}
              />
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
