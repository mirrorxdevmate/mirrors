import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sheet, Tooltip } from '@/components/overlays';
import { AppIcon } from '@/components/appIcons';
import { Fact, ProfileDetail, Verified } from '@/components/profile';
import { Button, LinkButton, Row, T, tap } from '@/components/ui';
import { NOT_FOR_ME } from '@/data/options';
import type { Profile } from '@/data/profiles';
import { scheduleBatchReady } from '@/lib/push';
import { photoUrl } from '@/lib/supabase';
import * as api from '@/services/api';
import { BATCH, useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';
import { countdown, nowMs } from '@/utils/date';

type SheetKind = null | 'notForMe' | 'curious' | 'rewind' | 'rewindReady' | 'streak' | 'starEarned' | 'boostDone';

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
    if (params.notice === 'rewind') setSheet('rewindReady');
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

  /* ── paused & batch-complete states (BATCH COMPLETE / PAUSED frames) ── */
  if (s.paused || !current) {
    const plan = BATCH[s.plan];
    const left = countdown((batch?.resetAt ?? now) - now);
    const bg = lastSeen?.photos[0] ?? photoUrl(s.profile.photos[0] ?? '');
    const seen = batch?.seen ?? 0;
    return (
      <View style={{ flex: 1, backgroundColor: '#C9B98A' }}>
        <StatusBar style="dark" />
        {bg ? <Image source={bg} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={40} /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
        <View style={[st.top, { paddingTop: insets.top + 24 }]}>
          <TopCircle label="Type controls" onPress={() => router.push('/settings/my-type')}>
            <AppIcon name="filters" height={18} />
          </TopCircle>
          <View style={{ flex: 1 }} />
          <TopCircle label="Profile boost" onPress={() => router.push('/boost')}>
            <AppIcon name="boost" height={25} />
          </TopCircle>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
          <View style={st.stateCard}>
            {s.paused ? (
              <>
                <Text style={st.stateTitle}>Your account is paused</Text>
                <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
                  {"Your profile is hidden, and you won't appear in new introductions while your account is paused."}
                </T>
                <Button title="Resume Matching" style={st.stateBtn} onPress={() => s.setPaused(false)} />
              </>
            ) : (
              <>
                <Text style={st.stateTitle}>{s.plan === 'free' ? "You've seen today's introductions." : "You've seen this set."}</Text>
                <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
                  {s.plan === 'free' ? 'Your next set will be ready in ' : 'Your next introductions arrive in '}
                  {left.text}.
                </T>
                <Text style={st.stateLabel}>{s.plan === 'free' ? 'TODAY' : 'THIS SET'}</Text>
                <T v="bodyL" style={{ marginTop: 8 }}>
                  {seen} of {Math.max(seen, plan.size)} seen ·{' '}
                  {s.plan === 'free' ? `${batch?.interested ?? 0} people you showed interest in` : `refreshes about every ${plan.hours} hours`}
                </T>
                {s.plan !== 'premium' ? <Button title="View matches" style={st.stateBtn} onPress={() => router.navigate('/(tabs)/chats')} /> : null}
                {s.plan === 'free' ? <LinkButton title="Get introductions faster" style={{ marginTop: 12 }} onPress={() => router.push('/upgrade')} /> : null}
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
      <LinearGradient colors={['rgba(0,0,0,0.25)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']} locations={[0, 0.18, 0.55, 1]} style={StyleSheet.absoluteFill} />

      {/* expanded: the photo blurs behind the card (Figma: white 12% + 60px blur) */}
      {expanded ? (
        <>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
        </>
      ) : null}

      {/* photo navigation zones */}
      {!expanded ? (
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', top: 120, bottom: 260 }]}>
          <Pressable style={{ flex: 1 }} accessibilityLabel="Previous photo" onPress={() => setPhoto((p) => Math.max(0, p - 1))} />
          <Pressable style={{ flex: 1 }} accessibilityLabel="More about them" onPress={() => setExpanded(true)} />
          <Pressable style={{ flex: 1 }} accessibilityLabel="Next photo" onPress={() => setPhoto((p) => Math.min(current.photos.length - 1, p + 1))} />
        </View>
      ) : null}

      {/* top bar */}
      <View style={[st.top, { paddingTop: insets.top + 5 }]}>
        <TopCircle label="Type controls" onPress={() => router.push('/settings/my-type')}>
          <AppIcon name="filters" height={18} />
        </TopCircle>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={st.left}>
            {deck.length} introduction{deck.length === 1 ? '' : 's'} left.
          </Text>
          {!expanded ? (
            <Row gap={5} style={{ marginTop: 14 }}>
              {current.photos.map((_, i) => (
                <View key={i} style={{ width: 11, height: 2, borderRadius: 1, backgroundColor: colors.white, opacity: i === photo ? 1 : 0.5 }} />
              ))}
            </Row>
          ) : null}
        </View>
        {boostLeft > 0 ? (
          <Pressable accessibilityLabel="Boost active" onPress={() => router.push('/boost')} style={st.boostOn}>
            <AppIcon name="boost" height={16} />
            <Text style={st.boostTime}>{countdown(boostLeft).clock.slice(3)}</Text>
          </Pressable>
        ) : (
          <TopCircle label="Profile boost" onPress={() => router.push('/boost')}>
            <AppIcon name="boost" height={25} />
          </TopCircle>
        )}
      </View>

      {/* detail card or summary */}
      {expanded ? (
        <View style={[st.detailWrap, { top: insets.top + 79 }]}>
          <View style={st.detail}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.8)' }]} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <ProfileDetail p={current} onWhy={() => router.push(`/why/${current.id}`)} />
              <Pressable onPress={() => setExpanded(false)} accessibilityRole="button" accessibilityLabel="Collapse profile" style={{ alignSelf: 'center', marginTop: 12 }}>
                <T v="caption" color={colors.grey600}>
                  Show less
                </T>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      ) : (
        <Pressable style={st.summary} onPress={() => setExpanded(true)} accessibilityRole="button" accessibilityHint="Shows the full profile">
          <Row gap={12}>
            <Text style={st.name}>
              {current.name}, {current.age}
            </Text>
            {current.verified ? <Verified /> : null}
          </Row>
          <Row gap={8} style={{ marginTop: 8 }}>
            <AppIcon name="pin" height={14} color={colors.white} />
            <Text style={st.loc}>
              {current.city}
              {current.distanceKm != null ? `, ${current.distanceKm} km` : ''}
            </Text>
          </Row>
          <Row gap={24} style={{ marginTop: 8, flexWrap: 'wrap', rowGap: 6 }}>
            <Fact compact icon={<AppIcon name="height" height={15} color={colors.white} />} label={`${current.heightCm}cm`} color={colors.white} />
            {current.profession ? <Fact compact icon={<AppIcon name="job" height={12} color={colors.white} />} label={current.profession} color={colors.white} /> : null}
            <Fact compact icon={<AppIcon name="intent" height={15} color={colors.white} />} label={current.intent} color={colors.white} />
          </Row>
        </Pressable>
      )}

      {/* actions */}
      <View style={st.actions}>
        <ActionBtn size={50} label="Rewind" onPress={rewind}>
          <AppIcon name="rewind" height={21} />
        </ActionBtn>
        <ActionBtn size={70} label="Not for me" onPress={() => setSheet('notForMe')}>
          <AppIcon name="notForMe" height={39} />
        </ActionBtn>
        <ActionBtn size={50} label="Why did Mirror recommend them?" onPress={() => setSheet('curious')}>
          <AppIcon name="curious" height={22} />
        </ActionBtn>
        <ActionBtn size={70} label="Interested" bg={colors.primary} onPress={() => interested()}>
          <AppIcon name="interested" height={39} />
        </ActionBtn>
        <ActionBtn size={50} label={`Strong interest, ${s.stars} stars`} onPress={star}>
          <AppIcon name="sparkle" height={23} />
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
      <Sheet visible={sheet === 'notForMe'} onClose={() => setSheet(null)} title="Help us understand why.">
        <T v="bodyL" color={colors.grey700} style={{ marginBottom: 16, lineHeight: 20 }}>
          {"Optional. It only affects who you're shown next."}
        </T>
        <ScrollView style={{ maxHeight: 460 }}>
          {NOT_FOR_ME.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ checked: reason === r }}
              onPress={() => setReason(r)}
              style={[st.pill, reason === r && { backgroundColor: colors.secondary }]}>
              <T v={reason === r ? 'bodyM' : 'body'}>{r}</T>
            </Pressable>
          ))}
        </ScrollView>
        <Button title="Continue" style={{ marginTop: 8 }} onPress={() => confirmPass(reason || undefined)} />
        <LinkButton title="Skip" style={{ marginTop: 12, marginBottom: 4 }} onPress={() => confirmPass()} />
      </Sheet>

      <Sheet visible={sheet === 'curious'} onClose={() => setSheet(null)} title="Why did Mirror recommend them?">
        <T v="bodyL" color={colors.grey700} style={{ lineHeight: 20 }}>
          {current.outsideRange
            ? 'They sit slightly outside the type you described — older than your stated range — but they match on the things you ranked highest.'
            : `They fit the type you described and share what you ranked highest${s.type.mattersMost.length ? `: ${s.type.mattersMost.join(', ').toLowerCase()}` : ''}.`}
        </T>
        <View style={{ gap: 16, marginTop: 24, marginBottom: 70 }}>
          {(current.outsideRange ? [current.outsideRange.reason, current.outsideRange.strongOn] : current.why.slice(0, 2).map((w) => `${w.label}: ${w.text}`)).map((t) => (
            <View key={t} style={[st.pill, { marginBottom: 0 }]}>
              <T v="bodyM">{t}</T>
            </View>
          ))}
        </View>
        <Button
          title="Explore profile"
          onPress={() => {
            setSheet(null);
            setExpanded(true);
          }}
        />
        <Button title="Not for me" variant="outline" style={{ marginTop: 14 }} onPress={() => setSheet('notForMe')} />
      </Sheet>

      <Sheet visible={sheet === 'rewind'} onClose={() => setSheet(null)} title="Bring back that introduction">
        <T v="bodyL" color={colors.grey700} style={{ lineHeight: 20 }}>
          Rewind lets you undo your last pass. Available on Mirror+ and Premium.
        </T>
        <View style={st.note}>
          <T v="caption" color={colors.grey900} style={{ fontSize: 12 }}>
            The profile you passed is saved while you upgrade.
          </T>
        </View>
        <Button
          title="Upgrade"
          onPress={() => {
            setSheet(null);
            router.push({ pathname: '/upgrade/plans', params: { then: 'rewind' } });
          }}
        />
        <LinkButton title="Back to profile" style={{ marginTop: 12, marginBottom: 4 }} onPress={() => setSheet(null)} />
      </Sheet>

      <Sheet visible={sheet === 'rewindReady'} onClose={() => setSheet(null)} title="Mirror+ is active">
        <T v="bodyL" color={colors.grey700}>
          Mirror+ is active. Your Rewind is ready.
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel="Rewind now" onPress={() => { setSheet(null); rewind(); }} style={st.bigTick}>
          <Feather name="check" size={30} color={colors.white} />
        </Pressable>
      </Sheet>

      <Sheet visible={sheet === 'streak' || sheet === 'starEarned'} onClose={() => setSheet(null)} title={sheet === 'starEarned' ? "You've earned a Star" : 'Keep showing up'}>
        <T v="bodyL" color={colors.grey700} style={{ lineHeight: 20 }}>
          {sheet === 'starEarned'
            ? 'Seven days of showing up paid off. Use it when someone really stands out.'
            : 'Stay active for seven consecutive days to earn a Strong Interest. Use it when someone really stands out.'}
        </T>
        <View style={st.streak} accessibilityLabel={`${sheet === 'starEarned' ? 7 : s.streakDays % 7} of 7 days`}>
          {Array.from({ length: 7 }).map((_, i) => {
            const done = sheet === 'starEarned' || i < s.streakDays % 7;
            return (
              <Fragment key={i}>
                {i > 0 ? <View style={[st.streakLine, done && { backgroundColor: colors.grey500 }]} /> : null}
                <View style={[st.streakDot, { backgroundColor: done ? colors.primary : colors.grey400 }]}>
                  <Feather name="check" size={7} color={colors.white} />
                </View>
              </Fragment>
            );
          })}
        </View>
        <T v="captionM" center style={{ fontSize: 12, marginBottom: 24 }}>
          Free reward. No purchase required.
        </T>
      </Sheet>

      <Modal visible={sheet === 'boostDone'} transparent animationType="fade" onRequestClose={() => setSheet(null)} statusBarTranslucent>
        <Pressable style={st.dim} onPress={() => setSheet(null)}>
          <View style={st.stateCard}>
            <Text style={st.stateTitle}>Your Boost is complete</Text>
            <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
              You got 18% more visibility while your Boost was active.
            </T>
            <Button
              title="Boost again"
              style={st.stateBtn}
              onPress={() => {
                setSheet(null);
                router.push('/boost');
              }}
            />
          </View>
        </Pressable>
      </Modal>
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
  top: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16 },
  topCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  left: { marginTop: 15, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.white, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 6 },
  boostOn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  boostTime: { fontFamily: fonts.bodyMedium, fontSize: 8, color: colors.grey900, marginTop: 1 },
  name: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.white },
  loc: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.white },
  summary: { position: 'absolute', left: 17, right: 16, bottom: 116 },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 19 },
  shadow: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  detailWrap: { position: 'absolute', left: 16, right: 16, bottom: 110 },
  detail: { flex: 1, borderRadius: 32, overflow: 'hidden' },
  note: { backgroundColor: colors.secondary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, marginTop: 34, marginBottom: 34 },
  bigTick: { alignSelf: 'center', width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 70, marginBottom: 60 },
  pill: { minHeight: 60, borderRadius: 360, backgroundColor: colors.base, paddingHorizontal: 16, justifyContent: 'center', marginBottom: 16 },
  stateCard: { backgroundColor: colors.base, borderRadius: 24, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 },
  stateTitle: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
  stateLabel: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 20, color: colors.primary, marginTop: 16 },
  stateBtn: { alignSelf: 'center', width: 166, marginTop: 16 },
  dim: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', paddingHorizontal: 16 },
  streak: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 40 },
  streakDot: { width: 12, height: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  streakLine: { flex: 1, height: 1, backgroundColor: colors.grey300, marginHorizontal: 6 },
  starBadge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#7C5CFF', alignItems: 'center', justifyContent: 'center' },
  starIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFEBFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
});

