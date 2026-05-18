# Feature: Notifications

Phase: MVP

## Summary

Notifications are a trust feature. Nidoru asks permission only after the user has experienced value, sends no more than one product notification per day by default, and limits default push types to Evening Anchor, Streak Milestone, and one-time Re-engagement.

## User Stories

- As a user, I want reminders only after I understand the value.
- As a bedtime user, I want calm reminders, not guilt or marketing.
- As a user who already opened the app, I do not want redundant notifications.
- As a user who declines permission, I want the app to remain fully usable.

## MVP Scope

- Ask for notification permission on Day 3 after at least two completed sessions.
- Show pre-permission screen before system prompt.
- Default push types:
  - Evening Anchor.
  - Streak Milestone.
  - Re-engagement exactly 3 days after last session, once only.
- No more than one product notification per day.
- No sends before 7 AM or after 10 PM local time.
- Suppress reminder if user already opened the app in the relevant window.
- Morning check-in and insight-ready prompts are in-app by default.
- Notification copy is localized.

## Out Of Scope

- Notification prompt during onboarding.
- Marketing pushes.
- Sale pushes.
- Feature-announcement pushes.
- Guilt pushes.
- Red app-icon badges for streak or habit pressure.
- Paywall or discount push prompts by default.

## Acceptance Criteria

- Permission prompt cannot appear before Day 3 and at least two completed sessions.
- Default product notifications are limited to three types.
- App sends at most one product notification per day.
- Re-engagement fires once after exactly 3 inactive days.
- Notification content never includes sensitive sleep details.
- Declining permission keeps the app fully usable.

## UX References

- [Notification Strategy](../ux/notification-strategy.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [Competitor UI/UX Notification Philosophy](../research/competitor-uiux-notification-philosophy.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)

## Data And Backend Needs

- Local notification permission state.
- Local wind-down reminder schedule.
- Supabase `notification_preferences` with bedtime, wake time, locale, and opt-in state.
- Expo Push only after permission is granted.
- Product reminders are separate from marketing opt-in.

## Analytics Events

- `notification_permission_prompted`
- `notification_permission_accepted`
- Existing session events for trigger suppression.

## Edge Cases And Failure States

- If user declines permission, do not ask again during the same onboarding period.
- If user opens the app before the Evening Anchor fires, suppress it.
- If timezone changes, use local user time.
- If Expo Push is unavailable, local scheduling should still cover local reminders where possible.
- If user disables notifications in system settings, reflect that state without nagging.

## Task Checklist

- [ ] Track session count and Day 3 eligibility.
- [ ] Build notification pre-permission screen.
- [ ] Add system permission prompt after pre-permission acceptance.
- [ ] Store notification preference locally.
- [ ] Sync notification preference after auth exists.
- [ ] Schedule Evening Anchor.
- [ ] Schedule Streak Milestone.
- [ ] Schedule one-time 3-day Re-engagement.
- [ ] Add one-product-notification-per-day guard.
- [ ] Add no-send window outside 7 AM-10 PM.
- [ ] Add opened-app suppression.
- [ ] Localize notification copy.
- [ ] Verify no prompt appears during onboarding.
- [ ] Verify declining permission keeps app usable.
