import type { Card } from '@/services/api';
import type { TypePrefs, UserProfile } from '@/store/useApp';

export type WhyItem = { label: string; text: string; tone?: 'warn' };

/** A person as shown in the app, built from a sanitised server card. */
export type Profile = {
  id: string;
  name: string;
  age: number;
  gender: 'man' | 'woman' | 'other';
  verified: boolean;
  idVerified: boolean;
  city: string;
  distanceKm: number | null;
  heightCm: number;
  profession: string;
  intent: string;
  drinking: string;
  smoking: string;
  children: string;
  pets: string;
  about: string;
  faith: string;
  culture: string;
  education: string;
  values: string[];
  hobbies: string[];
  photos: string[];
  /** Outside the user's stated type — triggers "Why did Mirror recommend them?". */
  outsideRange?: { reason: string; strongOn: string };
  boosted?: boolean;
  /** Several people reported this person recently → show a pattern notice before chatting. */
  patternFlag?: boolean;
  why: WhyItem[];
  whyPremium: WhyItem[];
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const arr = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string') : []);
const lower = (s: string) => s.toLowerCase();

/** Explains the fit between me and them from both profiles (no extra data leaves the server). */
export function buildWhy(me: UserProfile, type: TypePrefs, p: Omit<Profile, 'why' | 'whyPremium'>) {
  const why: WhyItem[] = [];
  const inRange = p.age >= type.ageMin && p.age <= type.ageMax;
  why.push({
    label: 'Type alignment',
    text: inRange ? 'In your preferred age range · matches characteristics you described' : `A little outside your ${type.ageMin}–${type.ageMax} range, strong on what you rank highest`,
  });
  if (p.intent) {
    why.push(
      lower(p.intent) === lower(me.intent)
        ? { label: 'Relationship goals', text: `Same intention: ${lower(p.intent)}` }
        : { label: 'Relationship goals', text: `They're looking for ${lower(p.intent)}; you said ${lower(me.intent) || 'you’re open'}`, tone: 'warn' },
    );
  }
  if (p.children && me.children && p.children !== me.children) {
    why.push({ label: 'Worth knowing', text: `On children they said: “${p.children}”`, tone: 'warn' });
  }
  const sharedHobbies = p.hobbies.filter((h) => me.hobbies.includes(h));
  why.push({
    label: 'Lifestyle',
    text: sharedHobbies.length ? `You both enjoy ${sharedHobbies.slice(0, 3).join(', ').toLowerCase()}` : 'Similar pace and social habits',
  });
  const sharedValues = p.values.filter((v) => type.mattersMost.includes(v));
  if (sharedValues.includes('Communication')) why.push({ label: 'Communication', text: 'Both said communication is a top priority' });
  why.push({
    label: 'Values',
    text: sharedValues.length ? `${sharedValues.join(' and ')} matter to you both` : 'You value different things — worth exploring in conversation',
  });
  const premium: WhyItem[] = [...why];
  if (p.faith && me.faith) {
    premium.push(
      p.faith === me.faith ? { label: 'Faith', text: `You share the same faith (${p.faith})` } : { label: 'Potential difference', text: `Different faiths: ${p.faith} and ${me.faith}`, tone: 'warn' },
    );
  }
  const theirSocial = p.drinking && me.lifestyle.drinking && p.drinking !== me.lifestyle.drinking;
  if (theirSocial) premium.push({ label: 'Potential difference', text: `Drinking: they said ${lower(p.drinking)}, you said ${lower(me.lifestyle.drinking)}`, tone: 'warn' });
  return { why, whyPremium: premium };
}

export function toProfile(c: Card, me: UserProfile, type: TypePrefs): Profile {
  const base = {
    id: c.id,
    name: str(c.name),
    age: Number(c.age) || 0,
    gender: (['man', 'woman'].includes(str(c.gender)) ? c.gender : 'other') as Profile['gender'],
    verified: !!c.verified,
    idVerified: !!c.idVerified,
    city: str(c.city),
    distanceKm: typeof c.distanceKm === 'number' ? c.distanceKm : null,
    heightCm: Number(c.heightCm) || 0,
    profession: str(c.profession),
    intent: str(c.intent),
    drinking: str(c.drinking),
    smoking: str(c.smoking),
    children: str(c.children),
    pets: str(c.pets),
    about: str(c.about),
    faith: str(c.faith),
    culture: str(c.culture),
    education: str(c.education),
    values: arr(c.values),
    hobbies: arr(c.hobbies),
    photos: arr(c.photos),
    boosted: !!c.boosted,
    patternFlag: !!c.patternFlag,
  };
  const outside = c.outsideRange === true;
  const strong = base.values.filter((v) => type.mattersMost.includes(v));
  return {
    ...base,
    outsideRange: outside
      ? {
          reason: `Outside your range: age ${base.age} (you said ${type.ageMin}–${type.ageMax})`,
          strongOn: strong.length ? `Strong on: ${strong.join(', ').toLowerCase()}` : 'Strong on the things you ranked highest',
        }
      : undefined,
    ...buildWhy(me, type, base),
  };
}

export const CITIES = [
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Riyadh, Saudi Arabia', 'Doha, Qatar', 'London, UK', 'Paris, France',
  'New York, USA', 'Amsterdam, Netherlands', 'Istanbul, Türkiye', 'Cairo, Egypt', 'Mumbai, India', 'Karachi, Pakistan',
  'Toronto, Canada', 'Singapore', 'Berlin, Germany', 'Madrid, Spain', 'Kuala Lumpur, Malaysia',
];

export const WELCOME_PHOTO = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&q=80&auto=format&fit=crop';
