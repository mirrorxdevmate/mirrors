import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sheet, Tooltip } from '@/components/overlays';
import { Fact, ProfileDetail } from '@/components/profile';
import { Button, Card, LinkButton, Option, Row, T, VerifiedTick, tap } from '@/components/ui';
import { NOT_FOR_ME } from '@/data/options';
import type { Profile } from '@/data/profiles';
import { scheduleBatchReady } from '@/lib/push';
import * as api from '@/services/api';
import { BATCH, useApp } from '@/store/useApp';
import { colors, radius } from '@/theme';
import { countdown, nowMs } from '@/utils/date';

type SheetKind = null | 'notForMe' | 'curious' | 'rewind' | 'streak' | 'starEarned' | 'boostDone';

function useNow(ms = 1000) {
  const [now, setNow] = useState(nowMs);
  useEffect(() => {
    const t = setInterval(() => setNow(nowMs()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export default function Introductions() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ notice?: string }>();
  const s = useApp();
  const now = useNow();
  // The current batch comes from the server (plan limits, filters and ordering are enforced there).
  const [deck, setDeck] = useState<Profile[]>([]);
  const [batch, setBatch] = useState<{ seen: number; resetAt: number; interested: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [lastSeen, setLastSeen] = useState<Profile | null>(null);
  const [gate, setGate] = useState<null | 'verify' | 'banned'>(null);
  const [busy, setBusy] = useState(false);
  const current: Profile | undefined = deck[0];

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const r = await api.getIntroductions();
      setGate(r.banned ? 'banned' : r.needsVerification ? 'verify' : null);
      setDeck(useApp.getState().cachePeople(r.cards));
      if (r.resetAt) {
        const resetAt = new Date(r.resetAt).getTime();
        setBatch({ seen: r.seen, resetAt, interested: 0 });
        // Remind the user when the next set is ready.
        scheduleBatchReady(resetAt, useApp.getState().settings.notifIntroductions);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  // Photo index / expanded state belong to one introduction; they reset when the card changes.
  const [view, setView] = useState({ id: '', photo: 0, expanded: false });
  const same = view.id === current?.id;
  const photo = same ? view.photo : 0;
  const expanded = same ? view.expanded : false;
  const setPhoto = (fn: (p: number) => number) => setView({ id: current?.id ?? '', photo: fn(photo), expanded });
  const setExpanded = (e: boolean) => setView({ id: current?.id ?? '', photo, expanded: e });
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState('');

  useFocusEffect(
    useCallback(() => {
      const st = useApp.getState();
      load();
      st.refreshAccount().catch(() => {});
      api
        .touchActivity()
        .then((r) => {
          useApp.getState().set({ stars: r.stars, streakDays: r.streak });
          if (r.earned) setSheet('starEarned');
        })
        .catch(() => {});
      if (st.boostResultPending && st.boostEndsAt && Date.now() > st.boostEndsAt) {
        st.set({ boostResultPending: false });
        setSheet('boostDone');
      }
    }, [load]),
  );

  // When the batch window ends, fetch the next set automatically.
  const due = !!batch && !current && now >= batch.resetAt;
  useEffect(() => {
    if (!due) return;
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [due, load]);

  // Show a one-off notice when navigated here with ?notice= (adjusting state during render, not in an effect).
  const [handledNotice, setHandledNotice] = useState<string | undefined>();
  if (params.notice !== handledNotice) {
    setHandledNotice(params.notice);
    if (params.notice === 'rewind') setToast('Mirror+ is active. Your Rewind is ready.');
    if (params.notice === 'boost') setToast('Your Boost is active.');
  }

  const boostLeft = s.boostEndsAt ? s.boostEndsAt - now : 0;

  /* ── actions ── */
  const advance = (p: Profile, liked: boolean) => {
    setLastSeen(p);
    setDeck((d) => d.filter((x) => x.id !== p.id));
    setBatch((b) => (b ? { ...b, seen: b.seen + 1, interested: b.interested + (liked ? 1 : 0) } : b));
  };
  const interested = async (strong = false) => {
    if (!current || busy) return;
    const p = current;
    setBusy(true);
    try {
      const r = await api.decide(p.id, strong ? 'strong' : 'interested');
      if (strong) useApp.getState().set({ stars: Math.max(0, s.stars - 1) });
      advance(p, true);
      if (r.matched && r.matchId) {
        useApp.getState().set({ matchIds: { ...useApp.getState().matchIds, [p.id]: r.matchId } });
        router.push(`/match/${p.id}`);
      } else setToast(`We'll let you know if ${p.name} is interested too.`);
    } catch (e) {
      if (e instanceof api.ApiError && e.code === 'no_stars') setSheet('streak');
      else setToast("That didn't go through. Check your connection.");
    } finally {
      setBusy(false);
    }
  };
  const confirmPass = async (r?: string) => {
    if (!current || busy) return;
    const p = current;
    setSheet(null);
    setReason('');
    setBusy(true);
    try {
      await api.decide(p.id, 'pass', r);
      advance(p, false);
    } catch {
      setToast("That didn't go through. Check your connection.");
    } finally {
      setBusy(false);
    }
  };
  const rewind = async () => {
    if (s.plan === 'free') return setSheet('rewind');
    try {
      const id = await api.rewindLast();
      if (!id) return setToast('Nothing to rewind yet.');
      await load();
      setToast(`${useApp.getState().people[id]?.name ?? 'They'} is back.`);
    } catch {
      setToast("Couldn't rewind right now.");
    }
  };
  const star = () => (s.stars > 0 ? interested(true) : setSheet('streak'));

  if (loading || loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <>
            <T v="h3" center>
              Couldn&apos;t load your introductions.
            </T>
            <T v="body" center color={colors.grey700} style={{ marginTop: 6 }}>
              Check your connection and try again.
            </T>
            <Button title="Try again" small style={{ marginTop: 16 }} onPress={() => { setLoading(true); load(); }} />
          </>
        )}
      </View>
    );
  }

  if (gate) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Feather name={gate === 'verify' ? 'shield' : 'slash'} size={30} color={colors.primary} />
          </View>
          <T v="h2" center>
            {gate === 'verify' ? 'Verify to meet people' : 'Your account is suspended'}
          </T>
          <T v="body" center color={colors.grey700} style={{ marginTop: 8 }}>
            {gate === 'verify'
              ? 'Everyone on Mirror completes a quick photo and ID check. It keeps the community real and safe. Your ID is never shown on your profile.'
              : 'Our team found that this account broke the community guidelines. If you think this is a mistake, contact support from Help.'}
          </T>
          {gate === 'verify' ? (
            <Button title="Verify now" style={{ marginTop: 24, alignSelf: 'stretch' }} onPress={() => router.push('/verify')} />
          ) : (
            <Button title="Help" variant="secondary" style={{ marginTop: 24, alignSelf: 'stretch' }} onPress={() => router.push('/settings/help')} />
          )}
        </View>
      </View>
    );
  }

  /* ── paused & batch-complete states ── */
  if (s.paused || !current) {
    const plan = BATCH[s.plan];
    const left = countdown((batch?.resetAt ?? now) - now);
    const bg = lastSeen?.photos[0] ?? s.profile.photos[0];
    return (
      <View style={{ flex: 1, backgroundColor: colors.grey900 }}>
        <StatusBar style="light" />
        {bg ? <Image source={bg} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={30} /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
        <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          <View style={st.stateCard}>
            {s.paused ? (
              <>
                <T v="h2">Your account is paused</T>
                <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
                  Your profile is hidden, and you won&apos;t appear in new introductions while your account is paused.
                </T>
                <Button title="Resume Matching" style={{ marginTop: 20 }} onPress={() => s.setPaused(false)} />
              </>
            ) : (
              <>
                <T v="h2">{s.plan === 'free' ? "You've seen today's introductions." : "You've seen this set."}</T>
                <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
                  {s.plan === 'free' ? 'Your next set will be ready in ' : 'Your next introductions arrive in '}
                  <T v="bodyS">{left.text}</T>.
                </T>
                <Card style={{ marginTop: 16, backgroundColor: colors.white }}>
                  <T v="overline" color={colors.primary}>
                    {s.plan === 'free' ? 'Today' : 'This set'}
                  </T>
                  <T v="bodyM" style={{ marginTop: 4 }}>
                    {batch?.seen ?? 0} seen · {s.plan === 'free' ? `${batch?.interested ?? 0} people you showed interest in this session` : `refreshes about every ${plan.hours} hours`}
                  </T>
                </Card>
                <Button title="View matches" style={{ marginTop: 16 }} onPress={() => router.navigate('/(tabs)/chats')} />
                {s.plan === 'free' ? <LinkButton title="Get introductions faster" onPress={() => router.push('/upgrade')} /> : null}
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  /* ── main card ── */
  return (
    <View style={{ flex: 1, backgroundColor: colors.grey900 }}>
      <StatusBar style="light" />
      <Image source={current.photos[photo]} recyclingKey={`${current.id}-${photo}`} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityLabel={`${current.name}, photo ${photo + 1}`} />
      <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']} locations={[0, 0.2, 0.5, 1]} style={StyleSheet.absoluteFill} />

      {/* photo navigation zones */}
      {!expanded ? (
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', top: 120, bottom: 260 }]}>
          <Pressable style={{ flex: 1 }} accessibilityLabel="Previous photo" onPress={() => setPhoto((p) => Math.max(0, p - 1))} />
          <Pressable style={{ flex: 1 }} accessibilityLabel="More about them" onPress={() => setExpanded(true)} />
          <Pressable style={{ flex: 1 }} accessibilityLabel="Next photo" onPress={() => setPhoto((p) => Math.min(current.photos.length - 1, p + 1))} />
        </View>
      ) : null}

      {/* top bar */}
      <View style={[st.top, { paddingTop: insets.top + 8 }]}>
        <TopCircle label="Type controls" onPress={() => router.push('/settings/my-type')}>
          <Feather name="sliders" size={18} color={colors.grey900} />
        </TopCircle>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T v="caption" color={colors.white}>
            {deck.length} introduction{deck.length === 1 ? '' : 's'} left.
          </T>
          <Row gap={4} style={{ marginTop: 6 }}>
            {current.photos.map((_, i) => (
              <View key={i} style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: i === photo ? colors.white : 'rgba(255,255,255,0.4)' }} />
            ))}
          </Row>
        </View>
        {boostLeft > 0 ? (
          <Pressable accessibilityLabel="Boost active" onPress={() => router.push('/boost')} style={st.boostPill}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.white} />
            <T v="captionM" color={colors.white}>
              {countdown(boostLeft).clock.slice(3)}
            </T>
          </Pressable>
        ) : (
          <TopCircle label="Profile boost" onPress={() => router.push('/boost')}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.primary} />
          </TopCircle>
        )}
      </View>

      {/* detail card or summary */}
      {expanded ? (
        <View style={[st.detailWrap, { top: insets.top + 64 }]}>
          <ScrollView style={st.detail} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <Pressable onPress={() => setExpanded(false)} accessibilityLabel="Collapse profile" style={{ alignSelf: 'center', marginBottom: 6 }}>
              <Feather name="chevron-down" size={22} color={colors.grey500} />
            </Pressable>
            <ProfileDetail p={current} onWhy={() => router.push(`/why/${current.id}`)} />
          </ScrollView>
        </View>
      ) : (
        <Pressable style={st.summary} onPress={() => setExpanded(true)} accessibilityRole="button" accessibilityHint="Shows the full profile">
          <Row gap={6}>
            <T v="h2" color={colors.white}>
              {current.name}, {current.age}
            </T>
            {current.verified ? <VerifiedTick size={18} /> : null}
          </Row>
          <Row gap={6} style={{ marginTop: 4 }}>
            <Feather name="map-pin" size={12} color={colors.white} />
            <T v="caption" color={colors.white}>
              {current.city}{current.distanceKm != null ? `, ${current.distanceKm} km` : ''}
            </T>
          </Row>
          <Row gap={14} style={{ marginTop: 10, flexWrap: 'wrap' }}>
            <Fact icon="human-male-height" label={`${current.heightCm}cm`} color={colors.white} compact />
            <Fact icon="briefcase-outline" label={current.profession} color={colors.white} compact />
            <Fact icon="target" label={current.intent} color={colors.white} compact />
          </Row>
        </Pressable>
      )}

      {/* actions */}
      <View style={st.actions}>
        <ActionBtn size={48} label="Rewind" onPress={rewind}>
          <MaterialCommunityIcons name="restore" size={22} color={colors.grey800} />
        </ActionBtn>
        <ActionBtn size={64} label="Not for me" onPress={() => setSheet('notForMe')}>
          <MaterialCommunityIcons name="close" size={30} color={colors.primary} />
        </ActionBtn>
        <ActionBtn size={48} label="Why did Mirror recommend them?" onPress={() => setSheet('curious')}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={colors.grey800} />
        </ActionBtn>
        <ActionBtn size={64} label="Interested" bg={colors.primary} onPress={() => interested()}>
          <MaterialCommunityIcons name="heart" size={28} color={colors.white} />
        </ActionBtn>
        <ActionBtn size={48} label={`Strong interest, ${s.stars} stars`} onPress={star}>
          <MaterialCommunityIcons name="star-four-points-outline" size={22} color="#7C5CFF" />
          {s.stars > 0 ? (
            <View style={st.starBadge}>
              <T v="caption" color={colors.white} style={{ fontSize: 10 }}>
                {s.stars}
              </T>
            </View>
          ) : null}
        </ActionBtn>
      </View>

      <Tooltip visible={!!toast} text={toast} onHide={() => setToast('')} top={insets.top + 70} />

      {/* ── sheets ── */}
      <Sheet visible={sheet === 'notForMe'} onClose={() => setSheet(null)}>
        <T v="h3">Help us understand why.</T>
        <T v="body" color={colors.grey700} style={{ marginTop: 4, marginBottom: 14 }}>
          Optional. It only affects who you&apos;re shown next.
        </T>
        <ScrollView style={{ maxHeight: 360 }}>
          {NOT_FOR_ME.map((r) => (
            <Option key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
          ))}
        </ScrollView>
        <Button title="Continue" style={{ marginTop: 8 }} onPress={() => confirmPass(reason || undefined)} />
        <Button title="Skip" variant="ghost" onPress={() => confirmPass()} />
      </Sheet>

      <Sheet visible={sheet === 'curious'} onClose={() => setSheet(null)}>
        <T v="h3">Why did Mirror recommend them?</T>
        <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
          {current.outsideRange
            ? "They sit slightly outside the type you described — but they match on the things you ranked highest."
            : `They fit the type you described and share what you ranked highest${s.type.mattersMost.length ? `: ${s.type.mattersMost.join(', ').toLowerCase()}` : ''}.`}
        </T>
        <Card style={{ marginTop: 14, gap: 8 }}>
          {current.outsideRange ? (
            <>
              <T v="body">{current.outsideRange.reason}</T>
              <T v="body">{current.outsideRange.strongOn}</T>
            </>
          ) : (
            current.why.slice(0, 3).map((w) => (
              <T key={w.label} v="body">
                <T v="bodyS">{w.label}: </T>
                {w.text}
              </T>
            ))
          )}
        </Card>
        <Button
          title="Explore profile"
          style={{ marginTop: 16 }}
          onPress={() => {
            setSheet(null);
            setExpanded(true);
          }}
        />
        <Button title="Not for me" variant="ghost" onPress={() => setSheet('notForMe')} />
      </Sheet>

      <Sheet visible={sheet === 'rewind'} onClose={() => setSheet(null)}>
        <T v="h3">Bring back that introduction</T>
        <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
          Rewind lets you undo your last pass. Available on Mirror+ and Premium.
        </T>
        <Card style={{ marginTop: 12 }}>
          <T v="body">The profile you passed is saved while you upgrade.</T>
        </Card>
        <Button
          title="Upgrade"
          style={{ marginTop: 16 }}
          onPress={() => {
            setSheet(null);
            router.push({ pathname: '/upgrade/plans', params: { then: 'rewind' } });
          }}
        />
        <Button title="Back to profile" variant="ghost" onPress={() => setSheet(null)} />
      </Sheet>

      <Sheet visible={sheet === 'streak' || sheet === 'starEarned'} onClose={() => setSheet(null)}>
        <View style={{ alignItems: 'center' }}>
          <View style={st.starIcon}>
            <MaterialCommunityIcons name="star-four-points" size={30} color="#7C5CFF" />
          </View>
          <T v="h3" center>
            {sheet === 'starEarned' ? "You've earned a Star" : 'Keep showing up'}
          </T>
          <T v="body" center color={colors.grey700} style={{ marginTop: 8 }}>
            {sheet === 'starEarned'
              ? 'Seven days of showing up paid off. Use it when someone really stands out.'
              : 'Stay active for seven consecutive days to earn a Strong Interest. Use it when someone really stands out.'}
          </T>
          <Row gap={6} style={{ marginTop: 16 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={{ width: 28, height: 6, borderRadius: 3, backgroundColor: i < s.streakDays % 7 || sheet === 'starEarned' ? colors.primary : colors.grey200 }} />
            ))}
          </Row>
          <T v="caption" color={colors.grey600} style={{ marginTop: 12 }}>
            Free reward. No purchase required.
          </T>
        </View>
        <Button title="Got it" style={{ marginTop: 16 }} onPress={() => setSheet(null)} />
      </Sheet>

      <Sheet visible={sheet === 'boostDone'} onClose={() => setSheet(null)}>
        <T v="h3">Your Boost is complete</T>
        <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
          You got 18% more visibility while your Boost was active.
        </T>
        <Button
          title="Boost again"
          style={{ marginTop: 16 }}
          onPress={() => {
            setSheet(null);
            router.push('/boost');
          }}
        />
        <Button title="Close" variant="ghost" onPress={() => setSheet(null)} />
      </Sheet>
    </View>
  );
}

function TopCircle({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [st.topCircle, pressed && { opacity: 0.8 }]}>
      {children}
    </Pressable>
  );
}

function ActionBtn({ children, size, onPress, bg = colors.white, label }: { children: React.ReactNode; size: number; onPress: () => void; bg?: string; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        st.shadow,
        pressed && { transform: [{ scale: 0.92 }] },
      ]}>
      {children}
    </Pressable>
  );
}

const st = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  topCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  boostPill: { height: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 4 },
  summary: { position: 'absolute', left: 16, right: 16, bottom: 104 },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  shadow: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  detailWrap: { position: 'absolute', left: 12, right: 12, bottom: 96 },
  detail: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg },
  stateCard: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.lg, padding: 20 },
  starBadge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#7C5CFF', alignItems: 'center', justifyContent: 'center' },
  starIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFEBFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
});

