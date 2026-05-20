# Feature: Subscriptions, Paywall, and Entitlements

Phase: MVP

## Summary

Subscriptions use RevenueCat with a single launch entitlement, `premium`. Monetization must come after first value and avoid competitor-style billing distrust. The free tier stays useful, entitlement checks never interrupt active breathwork or audio, and cancellation must be clear.

## User Stories

- As a new user, I want to experience the app before seeing a paywall.
- As a free user, I want core breathing and Rescue Me to remain useful.
- As a subscriber, I want premium access to be reliable and restorable.
- As a user considering cancellation, I want the cancel path and renewal terms to be clear.

## MVP Scope

- RevenueCat SDK.
- Launch entitlement: `premium`.
- Products:
  - Free tier.
  - Monthly subscription.
  - Annual subscription.
  - Lifetime purchase if approved for launch positioning.
- First session has no paywall.
- Recommended first test after first completed session: 14-day full-access trial, no credit card if technically and commercially feasible.
- If no-credit-card trial is not feasible through store flow, use free first session, soft account creation after value, and paid trial only after full routine value.
- Free tier includes core breathing, Rescue Me, limited sounds, morning check-in, and basic history.
- Renewal reminders before annual renewal where platform rules allow.
- Cancel path: Profile -> Subscription -> Cancel.

## Out Of Scope

- Stripe or external in-app payment for digital mobile subscriptions.
- Paywall before first completed full session.
- Dark-pattern pricing copy.
- Entitlement checks that interrupt active breathwork or audio.
- Cancellation loop that traps the user.

## Acceptance Criteria

- Paywall appears only after first full session completion.
- Entitlement check never blocks active breathwork or audio.
- App has a safe local paywall fallback.
- Supabase mirrors RevenueCat entitlement state.
- RevenueCat webhook is authenticated, stored, idempotent, and queued for side effects.
- Cancel subscription is reachable from Profile in three taps or fewer.
- Annual price is shown anywhere monthly equivalent is shown.
- Refund policy is visible on subscription screen.

## UX References

- [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)
- [Onboarding Flow Screen-by-Screen](../ux/onboarding-flow-screen-by-screen.md)
- [Assumptions, Risks, and Open Questions](../research/assumptions-risks-open-questions.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)

## Data And Backend Needs

- RevenueCat customer ID linked to local install, anonymous user, or linked account.
- Supabase `subscription_states`.
- Append-only `revenuecat_events`.
- Edge Function for RevenueCat webhook ingestion.
- Queue worker for entitlement side effects.
- Resend for renewal reminders where platform rules allow.
- Support lookup by user ID, local install ID, RevenueCat customer ID, or email.

## Analytics Events

- `paywall_viewed`
- `trial_started`
- `subscription_started`
- RevenueCat purchase/error events through monitored integration.

## Edge Cases And Failure States

- If RevenueCat is unavailable, active session continues.
- If entitlement mirror lags, app should use RevenueCat SDK state and reconcile later.
- If webhook delivery fails, queue/retry without duplicating entitlement changes.
- If user starts on anonymous identity and later links account, preserve purchase restore path.
- If user cancels, avoid guilt copy and show clear resulting access state.

## Task Checklist

- [ ] Configure RevenueCat project and `premium` entitlement.
- [ ] Define monthly product.
- [ ] Define annual product.
- [ ] Decide whether lifetime is available at launch.
- [ ] Build post-first-session paywall gate.
- [ ] Build safe local paywall fallback.
- [ ] Build free-tier entitlement behavior.
- [ ] Add RevenueCat SDK integration.
- [ ] Add entitlement cache/mirror.
- [ ] Build RevenueCat webhook Edge Function.
- [ ] Store append-only webhook events.
- [ ] Queue webhook side effects.
- [ ] Add restore purchase flow.
- [ ] Add Profile -> Subscription -> Cancel path.
- [ ] Add renewal reminder logic where allowed.
- [ ] Add support lookup fields.
- [ ] Verify paywall cannot appear before first full session completion.
