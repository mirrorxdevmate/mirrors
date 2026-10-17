import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env');

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Testing only: skip the emailed code (123456) and sign in anonymously. */
export const DEMO_AUTH = process.env.EXPO_PUBLIC_DEMO_AUTH === 'true';

/** App Store / Play review account: signs in with a password instead of an emailed code. */
export const REVIEW_EMAIL = process.env.EXPO_PUBLIC_REVIEW_EMAIL ?? '';

// Refresh the session only while the app is in the foreground (recommended for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const photoUrl = (path: string) =>
  !path || path.startsWith('http') ? path : supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
