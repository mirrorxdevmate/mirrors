import { Card, Header, Screen, ToggleRow } from '@/components/ui';
import { useApp } from '@/store/useApp';

export default function Notifications() {
  const s = useApp((st) => st.settings);
  const update = useApp((st) => st.updateSettings);
  return (
    <Screen scroll>
      <Header title="Notifications" />
      <Card style={{ paddingVertical: 4 }}>
        <ToggleRow label="New introductions" sub="When your next set is ready." value={s.notifIntroductions} onChange={(v) => update({ notifIntroductions: v })} />
        <ToggleRow label="Matches" sub="When you both choose to meet." value={s.notifMatches} onChange={(v) => update({ notifMatches: v })} />
        <ToggleRow label="Messages" value={s.notifMessages} onChange={(v) => update({ notifMessages: v })} />
        <ToggleRow label="Safety alerts" sub="Recommended. Pattern notices and report updates." value={s.notifSafety} onChange={(v) => update({ notifSafety: v })} />
      </Card>
    </Screen>
  );
}
