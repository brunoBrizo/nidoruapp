## Part 7: The Notification Philosophy

Related docs:

- Use [Notification Strategy](../ux/notification-strategy.md) for the current product decision.
- Use [Onboarding and Retention](../ux/onboarding-retention.md) for retention-loop context.
- Use [Habit Loop Architecture](../product/habit-loop-architecture.md) for trigger/action/reward context.
- Use [Competitor UI/UX Response Plan](competitor-uiux-response-plan.md) for the actionable competitor response.

Full specification based on the research finding that 71% of uninstalls are caused by bad notifications and that reducing volume from 7 to 3 notifications/week increased engagement 40%.[^34][^36]

### The Three Allowed Notifications

**Evening Anchor (one per evening, never before 7 PM):**
- Trigger: user has not opened the app in the past 4 hours AND it is between 7–10 PM
- Copy options (rotate weekly to prevent habituation):
  - "Your wind-down is ready. 🌙"
  - "Tonight's breathwork is waiting."
  - "3 minutes is all it takes. Start now."
  - "Your sleep sounds are on."
- Never: "Don't break your streak!" / "You missed yesterday!" / urgency language of any kind

**Streak Milestone (once per milestone, never again):**
- Trigger: user achieves 7, 14, 21, 30, 50, 100 consecutive sessions
- Copy: "7 nights. You're building something real." / "30 days. That's a new you."
- These should feel like a letter, not a push notification

**Re-engagement (once after 3 days of inactivity):**
- Trigger: exactly 3 days since last session, fires once at 8 PM
- Copy: "Sleep sounds are here whenever you need them. No pressure. 🌙"
- If user doesn't re-engage, never send another re-engagement notification. Zero. The user left. Nagging them drives a 1-star review, not a return session.

### Notifications to Never Send
- Any notification before 7 AM or after 10 PM
- Sale or promotional notifications of any kind
- Feature announcement notifications
- "New content added" notifications
- Badge notifications for the app icon showing a red number
- Consecutive daily notifications if the user has already opened the app that day

***
