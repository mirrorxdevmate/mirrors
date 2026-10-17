import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { toProfile, type Profile } from '@/data/profiles';
import * as api from '@/services/api';

export type Plan = 'free' | 'plus' | 'premium';
export type Billing = 'monthly' | 'quarterly' | 'annual';
export type Stage = 'auth' | 'basics' | 'details' | 'type' | 'verify' | 'home';
export type VerifyState = 'none' | 'pending' | 'verified' | 'rejected';
export type Flex = 'Flexible' | 'Preference' | 'Important' | 'Deal-breaker';

export type TypeTrait = { key: string; label: string; value: string };
export type Card = { id: string; brand: string; last4: string; exp: string; name: string };

export const BATCH: Record<Plan, { size: number; hours: number; label: string }> = {
  free: { size: 20, hours: 24, label: 'Free' },
  plus: { size: 30, hours: 8, label: 'Mirror+' },
  premium: { size: 40, hours: 5, label: 'Premium' },
};

export type UserProfile = {
  phone: string;
  countryCode: string;
  email: string;
  firstName: string;
  birthday: { d: string; m: string; y: string };
  gender: string;
  genderCustom: string;
  interestedIn: 'Man' | 'Woman' | 'Everyone' | '';
  location: { city: string; mode: 'gps' | 'manual' | '' };
  photos: string[];
  intent: string;
  intentDetail: string;
  relationshipStatus: string;
  children: string;
  lifestyle: Record<string, string>;
  hobbies: string[];
  faith: string;
  heightCm: number;
  heightUnit: 'cm' | 'ft';
  education: string;
  profession: string;
  culture: string[];
  about: string;
  /** field -> { show, match } */
  visibility: Record<string, { show: boolean; match: boolean }>;
};

export type TypePrefs = {
  description: string;
  traits: TypeTrait[];
  flexibility: Record<string, Flex>;
  mattersMost: string[];
  dealBreakers: string[];
  ageMin: number;
  ageMax: number;
  distanceKm: number;
  advanced: Record<string, string>;
};

export type Settings = {
  verifiedChatsOnly: boolean;
  profileVisibility: 'Everyone' | 'Matches only';
  locationPrecision: 'City' | 'Neighbourhood';
  incognito: boolean;
  discoveryVisible: boolean;
  behavioralPersonalization: boolean;
  safetyAnalysis: boolean;
  patternInsights: boolean;
  notifIntroductions: boolean;
  notifMatches: boolean;
  notifMessages: boolean;
  notifSafety: boolean;
  discoveryCity: string | null;
  travel: { city: string; date: string } | null;
  recentDestinations: string[];
};

type State = {
  hydrated: boolean;
  userId: string | null;
  stage: Stage;
  profile: UserProfile;
  type: TypePrefs;
  settings: Settings;
  paused: boolean;
  // server-managed (read-only on the client; refreshed with refreshAccount)
  verification: { photo: VerifyState; identity: VerifyState };
  plan: Plan;
  billing: Billing;
  renewsAt: number | null;
  cancelled: boolean;
  paymentMethod: string;
  boosts: number;
  boostEndsAt: number | null;
  stars: number;
  streakDays: number;
  isAdmin: boolean;
  // local conveniences
  cards: Card[];
  boostResultPending: boolean;
  /** Cache of people we've been shown, keyed by profile id. */
  people: Record<string, Profile>;
  /** profile id → active match id */
  matchIds: Record<string, string>;
  unread: number;
};

type Actions = {
  set: (p: Partial<State>) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  updateType: (p: Partial<TypePrefs>) => void;
  updateSettings: (p: Partial<Settings>) => void;
  setStage: (s: Stage) => void;
  setPaused: (paused: boolean) => void;
  /** Pull my profile + plan/verification state from the server into the store. */
  refreshAccount: () => Promise<void>;
  cachePeople: (cards: api.Card[]) => Profile[];
  reset: () => void;
};

const initialProfile: UserProfile = {
  phone: '',
  countryCode: '+971',
  email: '',
  firstName: '',
  birthday: { d: '', m: '', y: '' },
  gender: '',
  genderCustom: '',
  interestedIn: '',
  location: { city: '', mode: '' },
  photos: [],
  intent: '',
  intentDetail: '',
  relationshipStatus: '',
  children: '',
  lifestyle: {},
  hobbies: [],
  faith: '',
  heightCm: 170,
  heightUnit: 'cm',
  education: '',
  profession: '',
  culture: [],
  about: '',
  visibility: {
    faith: { show: true, match: true },
    children: { show: true, match: true },
    culture: { show: true, match: true },
  },
};

const initialType: TypePrefs = {
  description: '',
  traits: [],
  flexibility: {},
  mattersMost: [],
  dealBreakers: [],
  ageMin: 30,
  ageMax: 40,
  distanceKm: 50,
  advanced: {},
};

const initialSettings: Settings = {
  verifiedChatsOnly: false,
  profileVisibility: 'Everyone',
  locationPrecision: 'City',
  incognito: false,
  discoveryVisible: true,
  behavioralPersonalization: true,
  safetyAnalysis: true,
  patternInsights: true,
  notifIntroductions: true,
  notifMatches: true,
  notifMessages: true,
  notifSafety: true,
  discoveryCity: null,
  travel: null,
  recentDestinations: [],
};

const initialState: Omit<State, 'hydrated'> = {
  userId: null,
  stage: 'auth',
  profile: initialProfile,
  type: initialType,
  settings: initialSettings,
  paused: false,
  verification: { photo: 'none', identity: 'none' },
  plan: 'free',
  billing: 'monthly',
  renewsAt: null,
  cancelled: false,
  paymentMethod: '',
  boosts: 0,
  boostEndsAt: null,
  stars: 0,
  streakDays: 0,
  isAdmin: false,
  cards: [],
  boostResultPending: false,
  people: {},
  matchIds: {},
  unread: 0,
};

/* ── mapping between the store and the `profiles` table ── */

function toRow(s: Pick<State, 'profile' | 'type' | 'settings' | 'stage' | 'paused'>) {
  const p = s.profile;
  const b = p.birthday;
  return {
    email: p.email,
    first_name: p.firstName,
    birthday: b.y && b.m && b.d ? `${b.y}-${b.m.padStart(2, '0')}-${b.d.padStart(2, '0')}` : null,
    gender: p.gender,
    gender_custom: p.genderCustom,
    interested_in: p.interestedIn,
    city: p.location.city,
    location_mode: p.location.mode,
    photos: p.photos,
    intent: p.intent,
    intent_detail: p.intentDetail,
    relationship_status: p.relationshipStatus,
    children: p.children,
    lifestyle: p.lifestyle,
    hobbies: p.hobbies,
    faith: p.faith,
    height_cm: p.heightCm,
    height_unit: p.heightUnit,
    education: p.education,
    profession: p.profession,
    culture: p.culture,
    about: p.about,
    visibility: p.visibility,
    type_prefs: s.type,
    settings: s.settings,
    stage: s.stage === 'auth' ? 'basics' : s.stage,
    paused: s.paused,
  };
}

type Row = Record<string, any>;

function fromRow(r: Row, prev: State): Partial<State> {
  const [y = '', m = '', d = ''] = String(r.birthday ?? '').split('-');
  const ts = (v: unknown) => (v ? new Date(String(v)).getTime() : null);
  return {
    userId: r.id,
    stage: r.stage,
    paused: !!r.paused,
    profile: {
      ...prev.profile,
      phone: prev.profile.phone || String(r.phone ?? ''),
      email: r.email ?? '',
      firstName: r.first_name ?? '',
      birthday: { d, m, y },
      gender: r.gender ?? '',
      genderCustom: r.gender_custom ?? '',
      interestedIn: r.interested_in ?? '',
      location: { city: r.city ?? '', mode: r.location_mode ?? '' },
      photos: r.photos ?? [],
      intent: r.intent ?? '',
      intentDetail: r.intent_detail ?? '',
      relationshipStatus: r.relationship_status ?? '',
      children: r.children ?? '',
      lifestyle: r.lifestyle ?? {},
      hobbies: r.hobbies ?? [],
      faith: r.faith ?? '',
      heightCm: r.height_cm ?? 170,
      heightUnit: r.height_unit === 'ft' ? 'ft' : 'cm',
      education: r.education ?? '',
      profession: r.profession ?? '',
      culture: r.culture ?? [],
      about: r.about ?? '',
      visibility: { ...initialProfile.visibility, ...(r.visibility ?? {}) },
    },
    type: { ...initialType, ...(r.type_prefs ?? {}) },
    settings: { ...initialSettings, ...(r.settings ?? {}) },
    verification: { photo: r.photo_status ?? 'none', identity: r.id_status ?? 'none' },
    plan: r.plan ?? 'free',
    billing: r.billing ?? 'monthly',
    renewsAt: ts(r.plan_renews_at),
    cancelled: !!r.plan_cancelled,
    paymentMethod: r.payment_method ?? '',
    boosts: r.boosts ?? 0,
    boostEndsAt: ts(r.boost_ends_at),
    stars: r.stars ?? 0,
    streakDays: r.streak_days ?? 0,
    isAdmin: !!r.is_admin,
  };
}

/* ── debounced write-through of my profile ── */

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let syncError: ((e: unknown) => void) | null = null;
export const onSyncError = (fn: (e: unknown) => void) => {
  syncError = fn;
};

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    const s = useApp.getState();
    if (!s.userId) return;
    api.saveMyProfile(toRow(s)).catch((e) => syncError?.(e));
  }, 400);
}

/** Flush pending profile edits now (e.g. before a server call that depends on them). */
export async function flushProfile() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  const s = useApp.getState();
  if (s.userId) await api.saveMyProfile(toRow(s));
}

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,
      hydrated: false,
      set: (p) => set(p),
      updateProfile: (p) => {
        set((s) => ({ profile: { ...s.profile, ...p } }));
        schedulePush();
      },
      updateType: (p) => {
        set((s) => ({ type: { ...s.type, ...p } }));
        schedulePush();
      },
      updateSettings: (p) => {
        set((s) => ({ settings: { ...s.settings, ...p } }));
        schedulePush();
      },
      setStage: (stage) => {
        set({ stage });
        schedulePush();
      },
      setPaused: (paused) => {
        set({ paused });
        schedulePush();
      },
      refreshAccount: async () => {
        const row = await api.loadMyProfile();
        if (row) set(fromRow(row, get()));
      },
      cachePeople: (cards) => {
        const { profile, type, people } = get();
        const list = cards.map((c) => toProfile(c, profile, type));
        set({ people: { ...people, ...Object.fromEntries(list.map((p) => [p.id, p])) } });
        return list;
      },
      reset: () => {
        if (pushTimer) clearTimeout(pushTimer);
        set({ ...initialState });
      },
    }),
    {
      name: 'mirror-app-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<State>,
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);

export const getProfile = (id: string): Profile | undefined => useApp.getState().people[id];

export const planAtLeast = (plan: Plan, need: Plan) => {
  const order: Plan[] = ['free', 'plus', 'premium'];
  return order.indexOf(plan) >= order.indexOf(need);
};
