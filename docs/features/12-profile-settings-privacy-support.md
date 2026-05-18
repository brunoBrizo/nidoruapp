# Feature: Profile, Settings, Privacy, and Support

Phase: MVP

## Summary

Profile is where users control account linking, subscription, notifications, sound preferences, haptics, language, analytics opt-out, support, data export, and deletion. It is also the trust surface that prevents competitor-style billing and privacy complaints.

## User Stories

- As a user, I want subscription and cancellation controls where I expect them.
- As a privacy-sensitive user, I want analytics opt-out and data deletion.
- As a multilingual user, I want language selection in Settings.
- As a user with a billing issue, I want support to find my account quickly.

## MVP Scope

- Profile tab in fixed navigation.
- Settings for:
  - Account linking.
  - Subscription.
  - Notifications.
  - Sound preferences.
  - Haptics.
  - Language selection.
  - Analytics opt-out.
  - Support.
  - Privacy policy and Terms.
  - Data export and deletion before public launch.
- Cancel subscription reachable in three taps or fewer.
- Support lookup works by Supabase user ID, local install ID, RevenueCat customer ID, or email.
- Support macros exist in English, Spanish, and Portuguese.

## Out Of Scope

- Public community profile.
- Social feed.
- Raw health-adjacent notes visible to support by default.
- Service-role key in mobile or public web.
- Complex admin console in the mobile app.

## Acceptance Criteria

- Profile tab contains subscription, notifications, sound preferences, support, and privacy controls.
- Cancel path is Profile -> Subscription -> Cancel.
- Analytics opt-out exists in Settings.
- Runtime language selection exists in Settings.
- Data export and deletion are present before public launch.
- Support can resolve billing lookup from user ID, install ID, RevenueCat ID, or email.

## UX References

- [Navigation Architecture](../ux/navigation-architecture.md)
- [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md)
- [Assumptions, Risks, and Open Questions](../research/assumptions-risks-open-questions.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)

## Data And Backend Needs

- Supabase `profiles`.
- Local install ID and account-link state.
- RevenueCat customer ID.
- Notification preference state.
- Locale preference.
- Analytics opt-out flag.
- Data export/delete workflow.
- Resend transactional emails for account linking, billing notices, export/delete confirmation, and support follow-up.
- Help Scout support inbox for public launch.

## Analytics Events

- `notification_permission_prompted`
- `notification_permission_accepted`
- `paywall_viewed`
- `trial_started`
- `subscription_started`
- No broad autocapture on sensitive settings, billing, or support screens.

## Edge Cases And Failure States

- If user is anonymous, Profile still shows local install ID-backed support and account-link option.
- If RevenueCat state is unavailable, show last known subscription state with a refresh path.
- If user opts out of analytics, stop non-essential analytics.
- If user requests deletion, confirm clearly and queue server-side deletion.
- If language changes, dates, times, subscription copy, notification copy, and accessibility labels update.

## Task Checklist

- [ ] Build Profile tab shell.
- [ ] Add account-link section.
- [ ] Add subscription section with cancel path.
- [ ] Add notification settings.
- [ ] Add sound preferences.
- [ ] Add haptics toggle.
- [ ] Add language selector for English, Spanish, and Portuguese.
- [ ] Add analytics opt-out.
- [ ] Add privacy policy and Terms links.
- [ ] Add data export entry.
- [ ] Add account/data deletion entry.
- [ ] Add support contact entry.
- [ ] Store support lookup identifiers.
- [ ] Add support macros for launch locales.
- [ ] Verify cancel path in three taps or fewer.
