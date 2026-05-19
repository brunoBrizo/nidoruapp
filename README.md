# Sleep + Breathwork App Knowledge Base

This repo is starting as the project foundation for a sleep ritual app that combines evening wind-down, breathwork, ambient sound, and morning check-ins.

The source blueprint is dense, so the project knowledge is split by future use case. Start here, then open the narrow doc for the decision you need.

## Doc Map

| Need | Open |
| --- | --- |
| Current full product bible split by topic | [Product Bible Index](docs/product-bible-index.md) |
| One-page product thesis, principles, success metrics | [Product Strategy](docs/product/product-strategy.md) |
| Exact current product bible source | [Complete Product Bible Source](docs/research/complete-product-bible-source.md) |
| Latest uploaded product bible source with animation filename | [Complete Product Bible With Animations Source](docs/research/complete-product-bible-with-animations-source.md) |
| Color, typography, spacing, iconography, elevation, motion | [Design System](docs/design/design-system.md) |
| Motion timings, easing, haptics, and animation rules | [Motion, Animation, And Haptics](docs/design/motion-animation-haptics.md) |
| Breathing orb visual and implementation spec | [Breathing Orb Implementation Spec](docs/design/breathing-orb-implementation-spec.md) |
| Animation source hierarchy and conflict decisions | [Animation Source Alignment](docs/engineering/animation-source-alignment.md) |
| Exact animation UI/UX deep specification source | [Animation UI/UX Deep Spec Source](docs/engineering/animation-ui-ux-deep-spec-source.md) |
| Full feature-by-feature product specs | [Feature Deep Specs](docs/product/feature-deep-specs.md) |
| Screen-level onboarding flow | [Onboarding Flow Screen-by-Screen](docs/ux/onboarding-flow-screen-by-screen.md) |
| Notification strategy | [Notification Strategy](docs/ux/notification-strategy.md) |
| Competitor design analysis | [Competitor Design Analysis](docs/research/competitor-design-analysis.md) |
| Competitor UI/UX response decisions | [Competitor UI/UX Response Plan](docs/research/competitor-uiux-response-plan.md) |
| Exact competitor UI/UX intelligence source | [Competitor UI/UX Intelligence Source](docs/research/competitor-uiux-intelligence-source.md) |
| Competitor failures translated into anti-patterns | [Competitor Anti-Patterns](docs/research/competitor-anti-patterns.md) |
| User pain, competitor gaps, ideal customer | [User and Market Insights](docs/research/user-and-market-insights.md) |
| What to build first, what to defer, what not to build | [MVP Scope and Roadmap](docs/product/mvp-scope-and-roadmap.md) |
| Onboarding, first-session flow, retention loop, notifications | [Onboarding and Retention](docs/ux/onboarding-retention.md) |
| TikTok/Instagram strategy, pricing, Nidoru brand metadata | [Growth, Pricing, and Brand](docs/growth/growth-pricing-brand.md) |
| Stack, module boundaries, data model, integrations | [Technical Foundation](docs/architecture/technical-foundation.md) |
| Final tech stack decision record and scale posture | [Tech Stack Decision Record](docs/architecture/tech-stack-proposal.md) |
| Development, staging, production, and external service separation | [Environment Model](docs/architecture/environment-model.md) |
| Animation engineering playbook and implementation docs | [Animation Engineering Index](docs/engineering/animation-engineering-index.md) |
| Assumptions, ambiguity, risks, research gaps | [Assumptions, Risks, and Open Questions](docs/research/assumptions-risks-open-questions.md) |
| Source links and verification notes | [Source Map](docs/research/source-map.md) |
| Execution-ready feature specs and task checklists | [Feature Specs Index](docs/features/README.md) |

## Current Product Assumptions

- The product is a sleep ritual app, not a meditation app and not a passive sleep tracker.
- The first value moment is a guided breath session within 60 seconds of launch.
- MVP is mobile-first, built around evening use, with a morning check-in loop.
- The app should work before account creation and before any paywall.
- The app name is Nidoru, with App Store subtitle "Sleep Sounds & Breathwork".
- The source blueprint is treated as strategic input, not fully audited market research.
- The complete product bible is the current detailed product source where it overlaps with the earlier blueprint.

## Working Rule

For product and engineering decisions, default to the narrowest implementation that protects the core promise:

> One tap at night, one guided breath, audio that keeps working, and a morning check-in that turns use into insight.

## Quality Gates

Local proof commands mirror the GitHub Actions workflow:

```sh
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:component
pnpm test:sqlite
pnpm test:revenuecat:webhooks
pnpm i18n:check
```

Supabase migration validation and database integration tests require Docker access:

```sh
pnpm supabase:start
pnpm supabase:migrations:validate
pnpm supabase:test:db
pnpm supabase:stop
```

k6 load-test scaffolds are opt-in until the backend endpoints exist:

```sh
BASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=local-service-role-key pnpm loadtest:k6:backend
```
