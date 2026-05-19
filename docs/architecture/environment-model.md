# Environment Model

This project uses development, staging, and production as separate operating environments. Local development must run without production credentials or production data.

## Source Files

- `.env.example` is the repo-level development template for local scripts and server-side tools.
- `apps/mobile/.env.example` is the Expo development template. Every `EXPO_PUBLIC_*` value is embedded in the mobile app and must never contain a secret.
- `apps/web/.env.example` is the Next.js development template. Every `NEXT_PUBLIC_*` value is exposed to browsers and must never contain a secret.
- `supabase/.env.local.example` is the local Supabase Edge Function template.

Do not commit `.env`, `.env.*`, `apps/*/.env`, or `supabase/.env.local`. Keep staging and production values in the deployment provider, EAS secrets, Supabase project settings, or CI secret store.

## Local Defaults Rule

Development defaults must point at local services, development-only projects, blank disabled integrations, or documented stand-ins. If an optional integration value is blank in development, code must treat that integration as disabled instead of falling back to staging or production.

The first-session app path must keep working with bundled content, local storage, and local Supabase stand-ins. Missing R2, RevenueCat, PostHog, Sentry, Resend, or Help Scout credentials do not block local feature work.

## Service Separation

| Service | Development | Staging | Production | Env names | Launch blocker when missing |
| --- | --- | --- | --- | --- | --- |
| Supabase | Local Docker stack at `http://127.0.0.1:54321`; local keys from `pnpm supabase:status`; no production seed data. | Separate hosted staging project with staging-only data and auth providers. | Separate hosted production project with production auth, RLS, migrations, backups, and data-retention policy. | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Staging/public launch cannot be claimed until staging and production projects exist and local defaults do not point at them. |
| Cloudflare R2 | Blank values use bundled/local media. A local S3-compatible mock or development bucket may be configured with non-production media. | Dedicated staging bucket with staging media and signed URL proof where required. | Dedicated production bucket with production media, lifecycle rules, and access policy. | `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE_URL`, `EXPO_PUBLIC_R2_PUBLIC_BASE_URL` | Remote media, stories, premium audio, and share assets cannot be launch-ready until staging and production buckets are configured. |
| RevenueCat | SDK keys may be blank while entitlement UI uses local fallbacks. Webhook tests use development-only fixture authorization. | Sandbox products, sandbox entitlement `premium`, staging webhook endpoint, and staging server secret. | Live products, production entitlement `premium`, production webhook endpoint, and production server secret. | `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`, `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_AUTHORIZATION` | Subscriptions and entitlement launch cannot be claimed until sandbox and live products, webhooks, and secrets are separated. |
| PostHog | Blank by default. Development keys may send explicit test events only. | Separate staging project or environment with explicit events and session replay off. | Separate production project or environment with explicit events, opt-out support, and no broad autocapture on sensitive screens. | `POSTHOG_PROJECT_API_KEY`, `POSTHOG_HOST`, `EXPO_PUBLIC_POSTHOG_API_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_OBSERVABILITY_PROOF_MODE`, `NEXT_PUBLIC_POSTHOG_API_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Analytics readiness cannot be claimed until staging and production capture are separated and sensitive-screen autocapture is disabled. |
| Sentry | Blank by default. A development DSN may capture local test errors with `development` environment tags. | Staging DSN plus source-map upload credentials in EAS or CI secrets. | Production DSN plus source-map upload credentials in EAS or CI secrets. | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_URL`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_RELEASE`, `EXPO_PUBLIC_SENTRY_DIST`, `NEXT_PUBLIC_SENTRY_DSN` | Release readiness cannot be claimed until staging and production events have environment tags and source maps upload from build/update pipelines. |
| Resend | Blank by default. Local function tests may use fixtures; no real customer email. | Test mode only, verified staging sender, restricted test recipients. | Production sender/domain, production API key, unsubscribe/compliance review where applicable. | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TEST_RECIPIENT` | Email paths cannot be public-launch-ready until staging stays in test mode and production sender/domain credentials exist. |
| Help Scout | Placeholder support email such as `support@example.invalid`; no public promise. | Private staging inbox or test workflow for support lookup. | Public launch support inbox, routing, macros, and billing lookup workflow. | `HELP_SCOUT_MAILBOX_ID`, `HELP_SCOUT_SUPPORT_EMAIL`, `EXPO_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_EMAIL` | Public launch support cannot be claimed until the production inbox and lookup workflow exist. |

## Sentry Source Maps

Sentry source-map upload is not required for local development. It is required before staging or production release readiness:

1. EAS Build and EAS Update must run with `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` from the secret store.
2. Mobile builds must tag events with the current environment and release.
3. Mobile EAS Build uses the `@sentry/react-native/expo` config plugin and `apps/mobile/metro.config.js`.
4. Mobile EAS Update must run `pnpm --filter @nidoru/mobile run sentry:sourcemaps:update` after the update creates `dist/`.
5. Web builds must upload browser source maps from the CI/deployment pipeline when Sentry is enabled.
6. Missing source-map upload means the release is not staging-ready or production-ready, even if local development works.

## Observability Proof Mode

`EXPO_PUBLIC_OBSERVABILITY_PROOF_MODE=true` enables the Expo Router `/observability-proof` route in development or staging only. The route can queue one Sentry proof error and one PostHog `observability_test_event`; both include non-production release/environment context and must not be used for product analytics.

## PostHog Event Governance

Mobile analytics must go through `apps/mobile/src/observability/posthog.ts`. The wrapper allowlists the approved product event names, keeps session replay and lifecycle autocapture disabled, and drops any SDK event name that is not explicitly approved or the non-production proof event.

## Public Versus Secret Values

Public client values:

- Supabase publishable keys.
- RevenueCat SDK keys.
- PostHog project API keys.
- Sentry DSNs.
- Public media base URLs.
- Public support email.

Secret server values:

- Supabase secret keys and database URLs.
- R2 access keys and secret keys.
- RevenueCat secret API keys and webhook authorization values.
- Sentry auth tokens.
- Resend API keys.
- Help Scout API credentials if a future integration needs them.

Never put secret server values in `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` variables.

## Verification Checklist

- Inspect example files before every release to confirm they contain placeholders, blank disabled values, or local URLs only.
- Run local app config and local backend checks from development values only.
- Confirm staging and production credentials exist in their secret stores before claiming staging or public launch readiness.
- Confirm local seed files and fixtures contain no production user, billing, health, sleep, or support data.

## Reference Notes

- Expo exposes only variables prefixed with `EXPO_PUBLIC_` to app code.
- Next.js exposes variables prefixed with `NEXT_PUBLIC_` to browsers.
- RevenueCat SDK keys are client-facing; server API keys and webhook authorization values are not.
- PostHog must use explicit events only for this product, with sensitive-screen autocapture and broad session replay disabled.
- Sentry source-map upload requires provider auth stored outside committed env files.
