# Mirror — React Native (Expo) app

Production-structured Expo app built from the **Mirror** Figma file ("Visual Design" page, ~140 screens).
Expo SDK 57 · Expo Router · TypeScript · Zustand (persisted with AsyncStorage) · React Compiler.

## Run it

```bash
npm install
npx expo start          # press i (iOS), a (Android), w (web)
```

Camera, photo library and location use native modules included in Expo Go. For store builds use EAS:
`npx eas-cli@latest build --profile production`.

### Sign-in
Email one-time code (Supabase Auth). For local testing without email set `EXPO_PUBLIC_DEMO_AUTH=true` (code `123456`).
App Store / Play reviewers use `EXPO_PUBLIC_REVIEW_EMAIL` + a password.

### Builds (EAS — project @mirrorxdevmate/mirror)
```bash
npx eas-cli build --profile development --platform all   # dev build (needed for push + real purchases)
npx eas-cli build --profile production --platform all    # store builds
npx eas-cli submit --platform all                         # upload to App Store Connect / Play Console
npx eas-cli update --channel production                   # over-the-air JS fix (no store review)
```

## Flows implemented (all buttons wired)

1. **Auth** — Welcome · Phone (country picker) · OTP (resend timer, error, expired, SMS failure) · Verifying · "You're verified!" · Greeting
2. **Basics 1–8** — Birthday (18+ gate) · Name · Gender (+ self-describe) · Interested in · Location (OS permission → manual city fallback) · Photos (camera/library, main photo, remove, required-photo error) · Intent · What it means → "Looking good!"
3. **Details 1–9** — Status · Children · Lifestyle · Hobbies · Faith · Height (cm / ft-in) · Education · Profession · Culture · What others see (show / use-for-matching toggles) → "Lifestyle, understood."
4. **Your type** — Describe your type · Interpreting · What we understood (edit / add / remove traits) · Preference flexibility (→ deal-breakers) · Top 3 · Mirror Moment → "Your type is taking shape."
5. **Verification** — Intro · Photo verification (selfie) · Identity (ID capture) · pending · verified → "You're all set!"
6. **Introductions** — photo carousel, expandable profile, Why you two? (Free vs Premium + tooltip), Not for me (reasons), Curious ("Why did Mirror recommend them?" incl. outside-range), Interested → mutual Match, Star / streak, Rewind (upsell on Free), Boost timer, batch-complete countdown (Free 24h / Mirror+ 8h / Premium 5h), paused account
7. **Match & Chat** — Match screen · Chats list (new matches row, Likes-you row, verified-only setting) · Chat (starter prompts, replies) · Connection & safety (Feedback, Trust signals, Remove, Report → detail → submitted, Block) · Pattern notice + summary
8. **Likes** — Who's interested (blurred on Free, unlocked on Mirror+/Premium) → full profile
9. **Profile & settings** — Preview · Edit profile (every onboarding answer re-editable) · My Type (age/distance, advanced controls gated to Mirror+) · Preferences · Discovery (Mirror+) · Travel mode (Premium) · Incognito (Premium) · Deal-breakers · Verification · Your Pattern (empty / insight / Pattern+) · Privacy · Safety · Notifications · Account (email, change number, sign out) · Delete account / Pause · Help
10. **Monetisation** — Upgrade overview · Plans (monthly/3m/annual) · Payment method (Apple/Google Pay, saved cards, crypto) · Add card (Luhn, expiry, CVV validation) · Review (VAT, renewal) · Processing · Success / Failed · Manage subscription (change plan, update payment, history, restore, cancel / resume) · Profile Boost (1/3/5 packs, member pricing, active countdown, completed)

## Structure
```
src/app/          routes (Expo Router) — one file per screen
src/components/   UI kit (ui.tsx), overlays (Sheet, Dialog, Tooltip, Confetti), profile card, step scaffold
src/store/        useApp (persisted app state & domain actions), checkout (purchase in progress)
src/services/api.ts   the ONLY backend boundary — mock implementation with realistic latency
src/data/         seed profiles and option lists
src/theme/        tokens from the Figma "DS · Foundations" (colours, radii, Urbanist / Inter / Fraunces)
```

## Backend (Supabase)

Project: `yxocopipsofpptjmdnsj`. The app uses only the **publishable** key (`.env`). The secret key is never shipped.

```
supabase/migrations/   schema, row-level security, server logic (RPCs), storage buckets, demo data
supabase/functions/    interpret-type · purchase · verify · delete-account (Edge Functions)
src/lib/supabase.ts    client (session in AsyncStorage)
src/services/api.ts    every backend call the app makes
```

**What's real now:** accounts and sessions, profiles and photos (Storage), introductions with plan limits enforced
server-side, interested/pass/strong, mutual matching, likes, real-time chat, reports, blocks, pattern notices,
streaks/stars, boosts, verification uploads, account deletion. Other users only ever receive a sanitised profile card.

**Deploy** (once): apply the three migrations in order (SQL editor or `supabase db push`), then
`supabase functions deploy interpret-type purchase verify delete-account` and `supabase functions deploy revenuecat --no-verify-jwt` (it authenticates RevenueCat webhooks itself).

**Server settings / secrets**
| Setting | Value |
| --- | --- |
| Auth → Allow anonymous sign-ins | ON while testing without SMS (`EXPO_PUBLIC_DEMO_AUTH=true`) |
| Auth → Phone provider | Twilio Verify credentials, then set `EXPO_PUBLIC_DEMO_AUTH=false` |
| `GEMINI_API_KEY` (function secret) | enables Gemini for "Describe your type" (`GEMINI_MODEL` optional; `ANTHROPIC_API_KEY` also supported; keyword fallback without either) |
| `VERIFICATION_AUTO_APPROVE` | `true` only for testing |
| `MOCK_PAYMENTS` | `false` once RevenueCat is live |

**Before launch:** `update app_config set value='false' where key='demo_mode';` and delete demo people
(`delete from auth.users where id in (select id from profiles where is_demo);`).

## Also included
- **Moderation** (Profile → Admin · Moderation, admins only): reports (dismiss / warned / ban / unban) and ID review.
  Make someone an admin: `update profiles set is_admin = true where email = '...';`
- **Verification is required**: members see nobody until both checks are submitted, and are shown to others only once approved.
- **Push notifications** (matches, messages, verification results, admin alerts) sent from the database via Expo; local reminder when the next batch is ready.
- **In-app purchases** via RevenueCat (`src/lib/billing.ts`, function `revenuecat`). Product IDs are listed at the top of `billing.ts`.
- **Sentry** crash reporting (`EXPO_PUBLIC_SENTRY_DSN`).
- Store listing, review notes, privacy policy and terms drafts in `docs/`.
