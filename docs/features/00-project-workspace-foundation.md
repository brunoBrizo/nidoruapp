# Feature: Project Workspace and Foundation Setup

Phase: Foundation

## Summary

This feature sets up the project workspace before app feature work begins. It creates the monorepo, mobile app, web app, shared packages, Supabase workspace, environment model, quality gates, observability hooks, localization baseline, design-token baseline, and first technical proof surfaces required by the current architecture docs.

The goal is not to build user-facing product features. The goal is to make the workspace ready so app features can be implemented without re-deciding structure, tooling, environments, or core integration boundaries.

## User Stories

- As a developer, I want a stable workspace layout so every feature has an obvious home.
- As a developer, I want local development and tests to run repeatably before feature work starts.
- As a developer, I want core native dependencies installed in a development build so audio, haptics, SQLite, notifications, and animation can be proven on devices.
- As a developer, I want environment separation from the start so production data and secrets never leak into local development.
- As a developer, I want CI and quality gates in place before feature work grows.

## MVP Scope

- Initialize a pnpm workspace with Turborepo.
- Create the repository layout from the tech stack:
  - `apps/mobile`
  - `apps/web`
  - `packages/config`
  - `packages/domain`
  - `packages/i18n`
  - `packages/ui-tokens`
  - `packages/validation`
  - `supabase/migrations`
  - `supabase/functions`
  - `supabase/seed`
  - `docs`
- Set up Expo React Native with TypeScript, Expo Router, development builds, and EAS.
- Set up Next.js web app for marketing, legal, support, and later admin.
- Add core mobile dependencies required by the stack:
  - React Native Reanimated.
  - React Native SVG.
  - `expo-audio`.
  - `expo-haptics`.
  - `expo-brightness`.
  - `expo-sqlite`.
  - `expo-secure-store`.
  - `expo-localization`.
  - `expo-notifications`.
  - Expo Font.
  - Lucide React Native.
  - Zustand.
  - TanStack Query.
  - Sentry.
  - PostHog.
  - Supabase client.
  - RevenueCat SDK.
- Add `packages/ui-tokens` with Product Bible colors, spacing, typography, radius, and motion tokens.
- Add `packages/domain` with shared constants for technique definitions, streak rules, insight rule types, and launch sound IDs.
- Add `packages/i18n` with English, Spanish, and Brazilian Portuguese baseline resources.
- Add `packages/validation` for shared Zod schemas.
- Add Supabase local development with Docker, migrations, Edge Functions, seeds, RLS conventions, and local config.
- Add environment separation for development, staging, and production.
- Add local SQLite migration test infrastructure.
- Add testing and CI gates from the tech stack.
- Add first development proof screen that renders Nunito, Inter, design tokens, and Midnight Indigo palette.

## Out Of Scope

- Building the actual Home, onboarding, breathwork, Rescue Me, wind-down, mixer, check-in, or subscription UX.
- NestJS API.
- Microservices.
- Kubernetes.
- Custom native audio module before `expo-audio` proof.
- Native watch app.
- HealthKit or Health Connect in MVP.
- AI chatbot or therapy engine.
- Real-time social/community features.
- Broad session replay.
- Push-marketing journey platform.

## Acceptance Criteria

- Workspace layout matches [Tech Stack Decision Record](../architecture/tech-stack-proposal.md).
- Mobile app runs as an Expo development build, not Expo Go.
- Web app exists for marketing/legal/support/admin foundation.
- Shared packages are importable by mobile and web where appropriate.
- Development, staging, and production environment boundaries are documented and represented in config.
- Local Supabase starts through Docker and can run migrations.
- CI can run TypeScript, ESLint, unit tests, component tests, SQLite migration tests, Supabase migration validation, and i18n missing-key checks.
- First technical proof screen renders Nunito, Inter, design tokens, and Midnight Indigo palette.
- Sentry captures a test error with release context in a development or staging proof.
- PostHog can receive explicit test events without broad autocapture.
- No production data is used in local development.

## Closeout Verification - 2026-05-19

Status: local foundation gates are ready for the next feature files. Device, Expo account, and live vendor proofs remain separate blockers and must not be treated as staging or public-launch proof.

Proven in this closeout pass:

- Workspace layout matches the Tech Stack Decision Record: `apps/mobile`, `apps/web`, `packages/config`, `packages/domain`, `packages/i18n`, `packages/ui-tokens`, `packages/validation`, `supabase/migrations`, `supabase/functions`, `supabase/seed`, and `docs` are present.
- Root checks passed: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:unit`, `pnpm test:component`, `pnpm test:sqlite`, `pnpm test:revenuecat:webhooks`, `pnpm i18n:check`, and `pnpm format:check`.
- Web proof passed: `pnpm --filter @nidoru/web build` completed, and the Next.js dev server returned HTTP 200 for `/`, `/legal`, `/support`, and `/admin`.
- Mobile Expo proof passed as far as local tooling allows: `pnpm --filter @nidoru/mobile exec expo config --type public`, `pnpm --filter @nidoru/mobile exec expo install --check`, and `pnpm --filter @nidoru/mobile exec expo export --platform ios --output-dir /private/tmp/nidoru-mobile-export-closeout` all completed. The Expo config includes `expo-dev-client`; the start script is `expo start --dev-client`, so local testing is configured for development builds rather than Expo Go.
- Shared package imports are proven by TypeScript/build/test coverage: mobile imports `@nidoru/domain` and `@nidoru/ui-tokens`; web imports `@nidoru/domain`, `@nidoru/i18n`, `@nidoru/ui-tokens`, and `@nidoru/validation`.
- Supabase Docker proof passed: `pnpm supabase:start`, `pnpm supabase:migrations:validate`, `pnpm supabase:test:db`, `pnpm supabase:db:lint`, and `pnpm supabase:functions:test`.
- First mobile proof screen is covered by `apps/mobile/tests/home-screen.component.jest.test.tsx` and renders Nunito, Inter, design-token values, and the Midnight Indigo palette from `@nidoru/ui-tokens`.
- Local environment files use local URLs, blank disabled optional integrations, placeholder support addresses, and no production data. `supabase/seed/00_foundation.sql` intentionally contains no rows.
- Sentry/PostHog implementation boundaries are present: Sentry tags environment/release when configured, PostHog uses an explicit-event wrapper with lifecycle capture, session replay, error autocapture, feature-flag events, and unapproved event names disabled.

Remaining blockers:

- iOS runtime proof is not complete on this machine because only Xcode Command Line Tools are selected and `xcrun simctl` is unavailable. A full Xcode install plus simulator, or a real iOS device, is required.
- Android runtime proof is not complete because `adb` is not installed or on `PATH`. Android Studio/platform tools plus an emulator or a real Android device are required.
- EAS cloud configuration/build proof is blocked until `eas login` or `EXPO_TOKEN` is available. `pnpm --filter @nidoru/mobile run eas:config` stops at Expo authentication.
- Sentry live test-error receipt is not complete until a non-production DSN and release/source-map credentials are provided, then verified through the `/observability-proof` route in a development build.
- PostHog live explicit-event receipt is not complete until a non-production PostHog key/host are provided, then verified through the `/observability-proof` route in a development build.
- R2, RevenueCat, Resend, and Help Scout credentials remain staging/public-launch blockers, not local development blockers.

## UX References

- [Product Strategy](../product/product-strategy.md)
- [Design System](../design/design-system.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Feature Specs Index](README.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Environment Model](../architecture/environment-model.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)
- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)

## Data And Backend Needs

- Supabase local project with migrations, functions, seed data, and local config.
- RLS enabled by default for user-owned tables once tables are added.
- Development, staging, and production environment boundaries follow the [Environment Model](../architecture/environment-model.md).
- Development, staging, and production Supabase projects are kept separate.
- Cloudflare R2 development/staging/production buckets or documented stand-ins are separated from bundled local media.
- RevenueCat sandbox and production configuration are separated by environment.
- PostHog staging and production configuration are separated by environment.
- Sentry development/staging/production environments and source-map upload path are documented.
- Resend test mode is required for staging email paths.
- Help Scout support inbox is a public launch blocker, not a local development blocker.

## Analytics Events

This setup feature should not add product analytics beyond explicit test instrumentation. It prepares the event governance rules and tooling for the existing event list:

- `onboarding_started`
- `onboarding_completed`
- `first_breath_started`
- `first_breath_completed`
- `rescue_me_started`
- `rescue_me_completed`
- `wind_down_started`
- `wind_down_completed`
- `audio_started`
- `audio_failed`
- `sound_mix_saved`
- `morning_check_in_completed`
- `streak_paused`
- `comeback_completed`
- `insight_card_viewed`
- `notification_permission_prompted`
- `notification_permission_accepted`
- `paywall_viewed`
- `trial_started`
- `subscription_started`
- `sync_failed`

No broad autocapture is allowed on sensitive bedtime, sleep, billing, or support screens.

## Edge Cases And Failure States

- If Expo Go cannot run required native modules, use development builds only.
- If native dependency setup changes binary runtime behavior, use a binary release or strict runtime-version gating instead of EAS Update alone.
- If Supabase local services require Docker, run integration tests with Docker access.
- If Sentry source-map upload is not configured, do not treat production release setup as complete.
- If R2, RevenueCat, PostHog, Sentry, Resend, or Help Scout credentials are missing, local feature work can continue with documented development stand-ins, but staging/public launch cannot be considered ready.
- If app audio, haptics, notifications, or lock-screen behavior only passes in simulator, treat proof as incomplete because device testing is required.

## Task Checklist

- [x] Initialize pnpm workspace.
- [x] Add Turborepo configuration.
- [x] Create `apps/mobile`.
- [x] Create `apps/web`.
- [x] Create `packages/config`.
- [x] Create `packages/domain`.
- [x] Create `packages/i18n`.
- [x] Create `packages/ui-tokens`.
- [x] Create `packages/validation`.
- [x] Create `supabase/migrations`.
- [x] Create `supabase/functions`.
- [x] Create `supabase/seed`.
- [x] Configure TypeScript across workspace packages.
- [x] Configure ESLint across workspace packages.
- [x] Configure shared formatting.
- [x] Configure Expo React Native with TypeScript.
- [x] Configure Expo Router.
- [x] Configure Expo development builds.
- [x] Configure EAS Build.
- [x] Configure EAS Submit.
- [x] Configure EAS Update with runtime-version rules.
- [x] Install React Native Reanimated.
- [x] Install React Native SVG.
- [x] Install `expo-audio`.
- [x] Install `expo-haptics`.
- [x] Install `expo-brightness`.
- [x] Install `expo-sqlite`.
- [x] Install `expo-secure-store`.
- [x] Install `expo-localization`.
- [x] Install `expo-notifications`.
- [x] Install Expo Font.
- [x] Install Lucide React Native.
- [x] Install Zustand.
- [x] Install TanStack Query.
- [x] Install Sentry React Native SDK.
- [x] Install PostHog React Native SDK.
- [x] Install Supabase client.
- [x] Install RevenueCat SDK.
- [x] Add Nunito font assets.
- [x] Add Inter font assets.
- [x] Add Midnight Indigo design tokens.
- [x] Add motion timing tokens.
- [x] Add launch breath technique definitions.
- [x] Add launch sound ID constants.
- [x] Add initial streak rule constants.
- [x] Add initial insight rule types derived from docs.
- [x] Add English locale resources.
- [x] Add Spanish locale resources.
- [x] Add Brazilian Portuguese locale resources.
- [x] Add i18n missing-key check.
- [x] Configure Next.js web app.
- [x] Configure Netlify-ready web app structure.
- [x] Add marketing/legal/support/admin route shells.
- [x] Configure Supabase local development.
- [x] Add first Supabase migration shell.
- [x] Add RLS convention documentation or migration guard.
- [x] Add Edge Function test harness.
- [x] Add local SQLite migration runner.
- [x] Add SQLite migration tests.
- [x] Add Jest.
- [x] Add React Native Testing Library.
- [x] Add Maestro project structure.
- [x] Add Supabase migration validation command.
- [x] Add Supabase local integration test command that runs with Docker.
- [x] Add RevenueCat webhook fixture test structure.
- [x] Add k6 backend load-test scaffold for webhook, sync, catalog, and entitlement paths.
- [x] Add GitHub Actions workflow for TypeScript, ESLint, tests, migrations, and i18n checks.
- [x] Add EAS workflow configuration.
- [x] Configure Sentry release and environment tags.
- [x] Configure Sentry source-map upload path.
- [x] Configure PostHog explicit-event client wrapper with autocapture off for sensitive screens.
- [x] Add environment variable examples for development.
- [x] Document staging and production environment requirements.
- [x] Create first mobile proof screen for fonts, tokens, and palette.
- [ ] Verify development build can run on a real iOS device or simulator for non-device-specific checks.
- [ ] Verify development build can run on a real Android device or emulator for non-device-specific checks.
- [ ] Verify Sentry captures a test error with release context.
- [ ] Verify PostHog receives an explicit test event in non-production.
- [x] Verify local Supabase starts through Docker.
- [x] Verify no production data is required for local development.
