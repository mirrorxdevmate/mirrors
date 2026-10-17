import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** Crash & error reporting. No-op until EXPO_PUBLIC_SENTRY_DSN is set. */
export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1 : 0.2,
    sendDefaultPii: false, // never send personal data from a dating app
  });
}

export const setSentryUser = (id: string | null) => {
  if (dsn) Sentry.setUser(id ? { id } : null);
};

export { Sentry };
