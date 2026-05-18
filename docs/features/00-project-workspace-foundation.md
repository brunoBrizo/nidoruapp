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

## UX References

- [Product Strategy](../product/product-strategy.md)
- [Design System](../design/design-system.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Feature Specs Index](README.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)
- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)

## Data And Backend Needs

- Supabase local project with migrations, functions, seed data, and local config.
- RLS enabled by default for user-owned tables once tables are added.
- Development, staging, and production Supabase projects kept separate.
- Cloudflare R2 development/staging/production buckets or documented stand-ins for media setup.
- RevenueCat sandbox and production configuration separated by environment.
- PostHog staging and production configuration separated by environment.
- Sentry development/staging/production environments and source-map upload path prepared.
- Resend test mode for staging email paths.
- Help Scout support inbox planned for public launch support workflow.

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

- [ ] Initialize pnpm workspace.
- [ ] Add Turborepo configuration.
- [ ] Create `apps/mobile`.
- [ ] Create `apps/web`.
- [x] Create `packages/config`.
- [x] Create `packages/domain`.
- [x] Create `packages/i18n`.
- [x] Create `packages/ui-tokens`.
- [x] Create `packages/validation`.
- [ ] Create `supabase/migrations`.
- [ ] Create `supabase/functions`.
- [ ] Create `supabase/seed`.
- [ ] Configure TypeScript across workspace packages.
- [ ] Configure ESLint across workspace packages.
- [ ] Configure shared formatting.
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
- [ ] Add Nunito font assets.
- [ ] Add Inter font assets.
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
- [ ] Configure Next.js web app.
- [ ] Configure Netlify-ready web app structure.
- [ ] Add marketing/legal/support/admin route shells.
- [ ] Configure Supabase local development.
- [ ] Add first Supabase migration shell.
- [ ] Add RLS convention documentation or migration guard.
- [ ] Add Edge Function test harness.
- [ ] Add local SQLite migration runner.
- [ ] Add SQLite migration tests.
- [ ] Add Jest.
- [ ] Add React Native Testing Library.
- [ ] Add Maestro project structure.
- [ ] Add Supabase migration validation command.
- [ ] Add Supabase local integration test command that runs with Docker.
- [ ] Add RevenueCat webhook fixture test structure.
- [ ] Add k6 backend load-test scaffold for webhook, sync, catalog, and entitlement paths.
- [ ] Add GitHub Actions workflow for TypeScript, ESLint, tests, migrations, and i18n checks.
- [ ] Add EAS workflow configuration.
- [ ] Configure Sentry release and environment tags.
- [ ] Configure Sentry source-map upload path.
- [ ] Configure PostHog explicit-event client wrapper with autocapture off for sensitive screens.
- [ ] Add environment variable examples for development.
- [ ] Document staging and production environment requirements.
- [ ] Create first mobile proof screen for fonts, tokens, and palette.
- [ ] Verify development build can run on a real iOS device or simulator for non-device-specific checks.
- [ ] Verify development build can run on a real Android device or emulator for non-device-specific checks.
- [ ] Verify Sentry captures a test error with release context.
- [ ] Verify PostHog receives an explicit test event in non-production.
- [ ] Verify local Supabase starts through Docker.
- [ ] Verify no production data is required for local development.
