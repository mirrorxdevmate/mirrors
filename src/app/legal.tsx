import { useLocalSearchParams } from 'expo-router';

import { Header, Screen, T } from '@/components/ui';
import { colors } from '@/theme';

const DOCS = {
  terms: {
    title: 'Terms & Conditions',
    body: [
      ['Eligibility', 'Mirror is for adults only. You must be 18 or older to create an account.'],
      ['Your account', 'You are responsible for the information on your profile. Be honest about who you are and what you are looking for.'],
      ['Respect', 'Harassment, scams, requests for money and misleading intentions are not allowed and may result in removal.'],
      ['Subscriptions', 'Paid plans renew automatically unless cancelled before the next billing date. You keep paid features until the end of the period.'],
      ['Safety', 'Use reporting and blocking tools whenever something feels wrong. Our team reviews every report.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      ['What we collect', 'Your phone number, profile details, photos, preferences and the choices you make in the app.'],
      ['How we use it', 'To show you compatible introductions, keep the community safe and improve matching. Anything can be used for matching without being shown.'],
      ['What others see', 'Only what you choose to show. Your phone number, exact birthday and verification documents are never shown.'],
      ['Your control', 'Download or delete your data at any time from Settings → Privacy.'],
    ],
  },
} as const;

export default function Legal() {
  const { doc = 'terms' } = useLocalSearchParams<{ doc?: keyof typeof DOCS }>();
  const d = DOCS[doc] ?? DOCS.terms;
  return (
    <Screen scroll>
      <Header title={d.title} />
      {d.body.map(([h, b]) => (
        <T key={h} v="body" color={colors.grey800} style={{ marginBottom: 16 }}>
          <T v="bodyS">{h}. </T>
          {b}
        </T>
      ))}
    </Screen>
  );
}
