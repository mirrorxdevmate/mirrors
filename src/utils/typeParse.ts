import type { TypeTrait } from '@/store/useApp';

/** On-device fallback for "Describe your type" when the interpret-type function is unavailable. */
export function parseTypeLocally(text: string, interestedIn: string): { traits: TypeTrait[]; ageMin: number; ageMax: number } {
  const t = text.toLowerCase();
  const range = t.match(/(\d{2})\s*(?:-|–|to|and)\s*(\d{2})/);
  let ageMin = 30;
  let ageMax = 40;
  if (range) {
    ageMin = Math.max(18, Math.min(+range[1], +range[2]));
    ageMax = Math.min(80, Math.max(+range[1], +range[2]));
  } else {
    const single = t.match(/(?:around|about|age)\s*(\d{2})/);
    if (single) {
      ageMin = Math.max(18, +single[1] - 4);
      ageMax = +single[1] + 4;
    }
  }
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  const gender = interestedIn === 'Woman' ? 'Woman' : interestedIn === 'Everyone' ? 'Everyone' : 'Man';
  const traits: TypeTrait[] = [
    { key: 'gender', label: 'Gender', value: gender },
    { key: 'age', label: 'Age', value: `${ageMin}-${ageMax}` },
    { key: 'culture', label: 'Culture', value: has('same culture', 'my culture', 'arab', 'desi', 'religious') ? 'Shared' : 'Open' },
    { key: 'lifestyle', label: 'Lifestyle', value: has('ambitious', 'driven', 'career', 'successful') ? 'Ambitious' : has('active', 'gym', 'fit', 'sport') ? 'Active' : has('calm', 'chill', 'relaxed') ? 'Easy-going' : 'Balanced' },
    { key: 'family', label: 'Family', value: has('family', 'kids', 'children') ? 'Important' : 'Open' },
    { key: 'relationship', label: 'Relationship', value: has('casual', 'fun') && !has('serious') ? 'Casual' : 'Serious' },
  ];
  if (has('kind', 'caring', 'gentle')) traits.push({ key: 'personality', label: 'Personality', value: 'Kind' });
  else if (has('funny', 'humor', 'humour', 'laugh')) traits.push({ key: 'personality', label: 'Personality', value: 'Funny' });
  if (has('tall')) traits.push({ key: 'appearance', label: 'Appearance', value: 'Tall' });
  if (has('faith', 'religious', 'pray')) traits.push({ key: 'faith', label: 'Faith', value: 'Practising' });
  return { traits, ageMin, ageMax };
}
