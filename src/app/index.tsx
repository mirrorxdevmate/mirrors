import { Redirect } from 'expo-router';

import { useApp, type Stage } from '@/store/useApp';

const START: Record<Stage, string> = {
  auth: '/welcome',
  basics: '/onboarding/birthday',
  details: '/details/status',
  type: '/type/describe',
  verify: '/verify',
  home: '/(tabs)',
};

/** Resumes the user exactly where they left the flow. */
export default function Index() {
  const stage = useApp((s) => s.stage);
  return <Redirect href={START[stage] as never} />;
}
