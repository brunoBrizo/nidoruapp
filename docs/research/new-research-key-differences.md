# New Research Key Differences

Date: 2026-05-21

## Scope

This document compares the attached root file [`new research.md`](../../new%20research.md) with the current in-repo documentation. It is a decision aid only. It does not update the canonical product, UX, architecture, pricing, or feature docs.

Current docs used as the main comparison set:

- [README](../../README.md)
- [Product Bible Index](../product-bible-index.md)
- [Source Map](source-map.md)
- [Product Strategy](../product/product-strategy.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Navigation Architecture](../ux/navigation-architecture.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [Notification Strategy](../ux/notification-strategy.md)
- [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md)
- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)
- [Motion, Animation, and Haptics](../design/motion-animation-haptics.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)
- [Breathing Orb Code Pattern](../engineering/breathing-orb-code-pattern.md)
- [Feature: Subscriptions, Paywall, and Entitlements](../features/10-subscriptions-paywall-entitlements.md)
- [Feature: Free Breathe Mode](../features/18-free-breathe-mode.md)
- [Feature: Sleep Insight Cards](../features/13-sleep-insight-cards.md)
- [Feature: Watch App](../features/20-watch-app.md)
- [Competitor UI/UX Response Plan](competitor-uiux-response-plan.md)
- [Competitor Anti-Patterns](competitor-anti-patterns.md)

Graphify note: the current graph report is code-oriented and centers the implemented app spine around first-launch onboarding, first-session state, notification gating, local/session persistence, post-value Supabase auth/sync, paywall eligibility, home state, and observability. That matches the existing docs' local-first and value-before-capture posture. This comparison is still primarily a documentation comparison, not a full source-code audit.

## High-Level Read

The new research is broadly aligned with the current product thesis:

- First value before account, paywall, notification permission, or backend dependency.
- Avoid content-library overload and make Home show one right-now action.
- Keep Rescue Me or equivalent urgent breathing local, immediate, and setup-free.
- Treat billing clarity, cancellation, and support as trust features.
- Use React Native Reanimated, Expo Haptics, local SQLite, offline-capable audio, and device proof for core flows.
- Use a multi-layer breathing orb as the visual center of the product.
- Keep notifications quiet and avoid guilt, marketing pushes, and intrusive reminders.

The main differences are not philosophical. They are product-scope and decision-priority conflicts: navigation size, Rescue Me technique, physiological metrics, pricing, BOLT tracking, community/B2B/clinical roadmap, and how aggressively to claim haptics or health/biometric behavior.

## Key Differences

### 1. Source Hierarchy Is Not Updated For The New Research

**New research:** Presents itself as a comprehensive strategic roadmap covering competitor intelligence, MVP architecture, and future phases.

**Current docs:** The current source hierarchy says the product bible is the primary detailed source, the competitor UI/UX response plan controls competitor-response decisions, the tech stack proposal controls architecture, and older blueprint material is strategic context.

**Why this matters:** If the new research is accepted as newer source material, [Source Map](source-map.md) and [Product Bible Index](../product-bible-index.md) need an explicit hierarchy update. Without that, future agents should continue treating the current product bible and competitor response plan as authoritative where they conflict with the new research.

**Decision needed:** Is `new research.md` a new primary source, a research supplement, or just an input for selective changes?

### 2. Competitor Set Expands And Changes The Market Lens

**New research:** Focuses on Calm, Headspace, Breathwrk, Othership, Open, and Balance. It adds specific claims about Peloton SSO lockouts, Open's 30-minute cap/no queueing, Balance's rigid progression, Othership's premium-only/free-tier weakness, and payment lockouts after billing.

**Current docs:** Focus on Calm, Headspace, Breathwrk, BetterSleep, Insight Timer, and Wind Down. The current competitor response plan explicitly uses BetterSleep's mixer and Insight Timer's generous free value as design inputs.

**Why this matters:** The new research makes the app feel more like a somatic breathwork and adaptive pacing product. Current docs make it a sleep ritual product that borrows selectively from breathwork, sound-mixer, and meditation competitors.

**Possible doc updates if accepted:**

- Add Othership, Open, and Balance to competitor docs.
- Decide whether BetterSleep and Insight Timer remain core reference competitors.
- Add Open's no-queue/session-cap issue to sound mixer and routine-builder rationale.
- Add Balance's adaptive pacing strengths and rigid-progression weakness to onboarding/personalization docs.

### 3. Navigation Conflicts: Three Tabs Versus Five Fixed Tabs

**New research:** Recommends three main tabs: Home, Breathe, and Me.

**Current docs:** The navigation decision is five fixed tabs: Home, Sleep, Breathe, Progress, Profile. It is intentionally framed as a product law because competitor research says navigation churn breaks muscle memory.

**Why this matters:** This is a hard conflict. The three-tab model reduces cognitive load, but it also collapses Sleep, Progress, and Profile into fewer surfaces. That would affect current product docs, app shell tasks, route structure, design prompt, and tests that expect five tabs.

**Decision needed:** Keep the current five-tab architecture, or reopen navigation as a product decision.

**Recommendation before changing docs:** Do not update navigation casually. If three tabs are preferred, create a dedicated navigation decision doc with tradeoffs, because the current docs explicitly warn against navigation churn.

### 4. Rescue Me Technique Conflicts With The New Zero-Friction Widget

**New research:** The urgent widget starts a 60-second coherent breathing cycle with 5.5s inhale and 5.5s exhale. Elsewhere, it emphasizes 1:2 exhale ratios like 4s in and 8s out for a calmer-feeling rhythm. Treat any autonomic-nervous-system explanation as internal research language unless the [Sleep and Breathwork Technique Audit](sleep-breathwork-technique-audit.md) supports public copy.

**Current docs:** Rescue Me starts fixed 4-7-8 breathing immediately. Current breath-technique docs also include coherent breathing, but as a daytime calm/balance technique, not the Rescue Me default.

**Why this matters:** The current app has a clear contract: Rescue Me equals immediate 4-7-8. The new research suggests two alternatives:

- A 60-second coherent breathing urgent widget.
- A longer-exhale calming preset optimized for sleep or acute stress.

**Current decision:** Rescue Me remains one-tap 4-7-8 breathing. Coherent Breathing uses a 5.5s inhale / 5.5s exhale rhythm as a regular 10-minute Daily Calm session inside Evening Wind-Down or Daily Practice. HRV-oriented labels can remain internal taxonomy, but public copy should stay cautious.

**Possible doc updates if accepted:** Update [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md), [Feature Deep Specs](../product/feature-deep-specs.md), [Motion, Animation, and Haptics](../design/motion-animation-haptics.md), [Technical Foundation](../architecture/technical-foundation.md), and current domain/test expectations.

### 5. BOLT And Physiological Metrics Are New Scope

**New research:** Adds a weekly Body Oxygen Level Test (BOLT), basic BOLT history, resting heart rate correlation, sleep-quality trends, and long-term breathing-metric analytics.

**Current docs:** Progress is currently built from sessions, breath minutes, wind-down runs, morning check-ins, streak state, sound choices, sleep ratings, and later insight cards. Health integrations are deferred. The product strategy avoids medical/clinical posture and warns against overclaiming.

**Why this matters:** BOLT introduces a more physiological and health-adjacent product direction. It could create a stronger "Me" or Progress tab, but it also raises copy, safety, privacy, and medical-claim risk. It would need clear framing as self-observed wellness tracking, not diagnosis, treatment, or respiratory health scoring.

**Decision needed:** Should BOLT become MVP, Phase 2, or remain research-only?

**Possible doc updates if accepted:** Add BOLT to [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md), [Technical Foundation](../architecture/technical-foundation.md), data model docs, [Feature: Sleep Insight Cards](../features/13-sleep-insight-cards.md), privacy/safety notes, and analytics events.

### 6. Pricing And Free Tier Differ

**New research:** Recommends:

- Free: unrestricted urgent/coherent widget, four basic breathing exercises, weekly BOLT, basic history, local offline use.
- Premium: custom pacing, keep-awake sleep timer, four-channel mixer, analytics.
- Pricing: $9.99 monthly and $59.99 annual with a 14-day free trial.

**Current docs:** Recommend:

- Free: core breathing pacer, three ambient sounds, morning check-in, limited history, Rescue Me.
- Paid: full sound library, all techniques, routines, insights, stories when available.
- Pricing: $7.99 monthly, $39.99 annual, and optional $79.99 lifetime.
- Trial: 14-day full-access trial, no credit card if feasible, after first value.

**Why this matters:** The annual price difference is material. The new model pushes toward a higher ARPU and more explicitly makes BOLT/basic history free. The current model is more price-sensitive and includes a lifetime option for subscription-anxious users.

**Decision needed:** Keep current pricing, test the higher $9.99/$59.99 plan, or document both as experiment variants.

**Possible doc updates if accepted:** Update [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md), [Feature: Subscriptions, Paywall, and Entitlements](../features/10-subscriptions-paywall-entitlements.md), paywall copy, product analytics plan, and App Store metadata assumptions.

### 7. Custom Pacing Moves From Post-MVP Toward Premium Core

**New research:** Premium includes a Custom Pacing Configurator and variable inhale-to-exhale ratio control. It specifically encourages 1:2 exhale ratios for sleep prep.

**Current docs:** Free Breathe custom timing is a post-MVP feature. MVP includes fixed launch techniques and a guided breathwork flow. Free Breathe supports custom inhale, hold, exhale, hold-out, and duration, but it is not launch scope unless pulled forward.

**Why this matters:** Pulling custom pacing into premium launch scope changes both product complexity and paywall value. It may be valuable for power users but could slow the first release and complicate technique safety/copy.

**Decision needed:** Keep custom pacing post-MVP, move it into MVP premium, or add a limited "sleep ratio" slider only after core techniques are stable.

### 8. Sound Mixer Scope Differs: 2-3 Layers Versus 4 Channels

**New research:** Premium mixer supports up to four ambient loops. Free tier has three pre-mixed background loops.

**Current docs:** Mixer supports 2-3 layers, 16 launch sounds, per-layer volume, 20/30/45/60 minute timers, smooth fade-out, and offline base sounds. The tech stack proposal explicitly requires two to three simultaneous ambient layers.

**Why this matters:** Four simultaneous audio channels may be fine, but it should be treated as a device-performance and audio-mixing proof question, not just a product copy change.

**Decision needed:** Keep the current 2-3 layer launch limit, raise the target to four, or make four a premium/later device-proof goal.

### 9. Animation Details Mostly Align, But Current Docs Have An Internal Layer Count Mismatch

**New research:** Describes a 60 FPS five-layer orb, Reanimated 3, native UI thread worklets, inhale/exhale-specific easing, hold shimmer, haptics through `runOnJS`, and phase-label crossfade with a 20ms gap.

**Current docs:** The newer animation decision layer already says build the five-layer orb, use Reanimated supported by the active Expo SDK, use inhale/exhale easing curves, use a 20ms phase text gap, and keep the breath phase timer as source of truth.

**Difference:** [Feature Deep Specs](../product/feature-deep-specs.md) and [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md) still include older four-layer wording in places, while [Animation Source Alignment](../engineering/animation-source-alignment.md) and [Breathing Orb Code Pattern](../engineering/breathing-orb-code-pattern.md) define the five-layer implementation.

**Current decision:** Canonical product, design, and engineering docs use the five-layer orb and point implementation details back to Animation Source Alignment when timing, haptic, or layer details conflict.

### 10. Haptics And Locked-Screen Guarantees Need Caution

**New research:** Says haptics are essential for eyes-closed sessions, should sync with inhale/exhale/hold/completion, and should run through Reanimated `runOnJS`. It also frames haptic feedback as part of locked-screen or eyes-closed guidance.

**Current docs:** Agree on inhale/exhale haptics and restricted haptic categories, but are more cautious: audio cues are the guaranteed screen-off guidance layer, haptics are required while active and screen-on, and locked-screen haptic behavior must be proven on real devices.

**Why this matters:** The current docs are safer. Mobile operating systems can constrain haptics and background behavior. The product should not promise locked-screen haptics until device proof exists.

**Decision needed:** Keep current audio-first locked-screen guarantee. Optionally add the new research's detailed haptic pattern as implementation input, but preserve the device-proof gate.

### 11. Sleep Timer Power Management Is More Explicit In The New Research

**New research:** Calls out an "awake phone" sleep timer bug and says the app must release system wake locks after audio ends so the device can dim and lock naturally after the normal idle timeout.

**Current docs:** Already require background playback, fade-out, screen dimming, audio interruption handling, and responsible brightness restoration. They do not explicitly name wake-lock release as its own acceptance criterion.

**Why this matters:** This is a useful engineering acceptance gate. It fits the current architecture and does not conflict with product strategy.

**Current decision:** Architecture and product docs include an explicit requirement to release keep-awake or power-management locks when timer playback ends so the device can dim and lock naturally.

### 12. Onboarding Is Similar, But The New Research May Be Even Softer

**New research:** Recommends soft onboarding: first open shows one calming card like "Take three slow breaths with us"; optional account/subscription appears only after that value moment.

**Current docs:** First launch starts with a 30-second breath demo, continues into a short first full session, and defers reflection, personalization, account, and paywall surfaces until after the first full session.

**Why this matters:** This keeps first launch focused on felt value before capture, while still preserving a short personalization path after the user has experienced the product.

**Current decision:** Personalization happens after the first full session.

### 13. Roadmap Ambition Is Much Higher In The New Research

**New research:** Phase 2 adds group practice rooms and shared accountability. Phase 3 adds B2B enterprise, HIPAA-compliant therapy/clinical channels, and traditional somatic exercises/live workshops. Phase 4 adds Apple Watch/Wear OS, HRV pacing sync, wrist haptics, and AI-generated morning recommendations.

**Current docs:** Explicit V1 non-goals include no community feed, no wearable companion app, no AI therapist/chatbot/coaching claims, no clinical CBT-I product, and no large course library. Watch app is future after phone proof. Health integration is Phase 3. Community/social features are out of foundation scope.

**Why this matters:** The new roadmap changes company direction, not just feature detail. B2B, HIPAA, clinical licensing, group rooms, and AI recommendations introduce privacy, compliance, security, and operational complexity far beyond the current MVP.

**Decision needed:** Treat this as long-term opportunity research unless the product strategy is intentionally changing. Do not merge it into MVP docs without a separate strategy decision.

### 14. "Me" Tab And Progress Model Differ From Current Progress/Profile Split

**New research:** Uses "Me" as the physiological-progress tab, centered on BOLT, resting heart rate, sleep quality trends, and breathing metrics.

**Current docs:** Split Progress and Profile. Progress is for streak calendar, weekly summary, mood history, and sleep trends. Profile is for settings, subscription, notifications, preferences, and support.

**Why this matters:** If BOLT is adopted, the current Progress tab could absorb it without moving to a three-tab model. If the "Me" concept is adopted, it implies a navigation and information-architecture redesign.

**Decision needed:** Add physiological metrics to Progress later, or replace Progress/Profile with a broader Me tab.

### 15. Evidence Quality And Public Claims Need A Re-Check

**New research:** Includes specific numbers and claims such as 4.7% 30-day retention, 71% uninstalls from intrusive push alerts, hazard ratios for anchored routines, Pixel 10 audio stutter, current competitor pricing, and specific 2025 redesign effects.

**Current docs:** Source Map explicitly says many exact market, review, notification, pricing, and app-store claims must be refreshed before investor material, ads, landing pages, or public claims.

**Why this matters:** These claims may be useful directionally, but they should not be copied into public or canonical docs as verified facts without source links and a refresh pass.

**Decision needed:** If these claims matter, add the original sources to [Source Map](source-map.md) and mark what is verified versus directional.

## Suggested Update Map If You Adopt Parts Of The New Research

| Decision accepted | Primary docs to update |
| --- | --- |
| New research becomes a canonical input | `docs/research/source-map.md`, `docs/product-bible-index.md`, `README.md` |
| Add Othership, Open, Balance to competitor set | `docs/research/competitor-uiux-response-plan.md`, `docs/research/competitor-anti-patterns.md`, competitor split docs |
| Change to three tabs or "Me" tab | `docs/ux/navigation-architecture.md`, `design.md`, feature specs, app shell docs/tests |
| Change Rescue Me default technique | `docs/product/mvp-scope-and-roadmap.md`, `docs/product/feature-deep-specs.md`, `docs/design/motion-animation-haptics.md`, domain technique contracts |
| Add BOLT or respiratory progress | `docs/product/mvp-scope-and-roadmap.md`, `docs/architecture/technical-foundation.md`, `docs/features/13-sleep-insight-cards.md`, privacy/safety docs |
| Adopt higher pricing | `docs/growth/growth-pricing-brand.md`, `docs/features/10-subscriptions-paywall-entitlements.md` |
| Pull custom pacing into MVP premium | `docs/features/18-free-breathe-mode.md`, `docs/product/mvp-scope-and-roadmap.md`, `docs/product/feature-deep-specs.md` |
| Raise mixer to four channels | `docs/product/mvp-scope-and-roadmap.md`, `docs/architecture/tech-stack-proposal.md`, sound mixer feature docs |
| Clarify five-layer orb everywhere | `docs/product/feature-deep-specs.md`, `docs/design/breathing-orb-implementation-spec.md` |
| Add explicit wake-lock release proof | `docs/architecture/tech-stack-proposal.md`, `docs/architecture/technical-foundation.md`, wind-down/sound feature docs |
| Add group/B2B/clinical/AI roadmap | `docs/product/product-strategy.md`, `docs/product/mvp-scope-and-roadmap.md`, privacy/security/compliance docs |

## Recommendation

Treat the new research as a supplemental decision input, not as an automatic replacement for the current docs.

The safest immediate updates would be:

1. Refresh the source map to record the new research file and its status.
2. Fix the internal orb layer-count drift so all current docs consistently say five layers.
3. Add explicit wake-lock release and sleep-timer power-management acceptance criteria.
4. Keep Rescue Me as one-tap 4-7-8 and position Coherent Breathing as Daily Calm for regular practice; keep HRV Training as internal taxonomy unless separately validated for public copy.
5. Add a decision note for BOLT and physiological progress, but keep it out of MVP until safety, privacy, and claim language are reviewed.

The riskiest updates would be:

1. Changing five tabs to three tabs without a dedicated navigation decision.
2. Moving B2B, HIPAA, clinical networks, community rooms, HRV sync, or AI recommendations into near-term scope.
3. Copying exact market or competitor claims into public docs without source verification.
