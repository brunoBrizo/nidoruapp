# Notification Strategy

Related docs:

- Use [Onboarding and Retention](onboarding-retention.md) for when notification permission is earned.
- Use [Habit Loop Architecture](../product/habit-loop-architecture.md) for trigger/action/reward context.
- Use [Competitor UI/UX Notification Philosophy](../research/competitor-uiux-notification-philosophy.md) for the research source.

The current notification decision comes from the product bible plus the newer [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md). The app should win trust by speaking less than competitors.

## Cardinal Rules

- Ask for notification permission on Day 3 after at least two completed sessions.
- Send no more than one product notification per day.
- Default push notifications are limited to three types.
- Never send marketing pushes, sale pushes, feature-announcement pushes, or guilt pushes.
- Never use red app-icon badges for streak or habit pressure.
- Never send before 7 AM or after 10 PM local time.
- If the user already opened the app in the relevant window, suppress the reminder.

## Allowed Push Notifications

| Notification | Trigger | Copy Direction |
| --- | --- | --- |
| Evening Anchor | User-set wind-down window, only if the user has not opened the app that evening | "Your wind-down is ready." Specific, calm, no urgency. |
| Streak Milestone | Morning after 7, 14, 21, 30, 50, or 100 consecutive sessions | "7 nights. You're building something real." One-time per milestone. |
| Re-engagement | Exactly 3 days after last session, once only | "Sleep sounds are here whenever you need them. No pressure." |

## Not Push By Default

These can appear in-app, but should not become default pushes:

- Morning check-in prompt.
- Insight-ready prompt.
- New content prompt.
- Paywall or discount prompt.
- Feature announcement.

If a later version adds explicit opt-in for extra reminders, those reminders must be separate from the default habit notification permission.

## Permission Flow

Do not ask during first launch or immediately after the first session. Ask only after the user has reason to understand the benefit:

1. User completes at least two sessions.
2. Day 3 or later arrives.
3. Show an in-app pre-permission screen with exact reminder behavior.
4. If the user accepts, show the system prompt.
5. If the user declines, keep the app fully usable and do not guilt them.

Pre-permission copy:

> We'll send you one gentle reminder in the evening, only if you have not opened the app yet that day. No spam, no sales. Turn it off anytime.

## Copy Rules

Use:

- Calm, specific language.
- User-controlled timing.
- No-pressure re-entry.
- Recognition only for real milestones.

Avoid:

- "Do not break your streak."
- "You missed yesterday."
- "Limited time offer."
- "New feature just dropped."
- "Come back now."
