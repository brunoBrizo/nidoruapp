## Part 5: The Habit Loop Architecture

Related docs:

- Use [Onboarding and Retention](../ux/onboarding-retention.md) for the first-session and retention loop.
- Use [Notification Strategy](../ux/notification-strategy.md) for allowed triggers and copy.
- Use [MVP Scope and Roadmap](mvp-scope-and-roadmap.md) for which habit-loop pieces ship first.
- Use [Feature Deep Specs](feature-deep-specs.md) for streak, insight, and check-in details.

Understanding why users return daily requires designing the Nir Eyal "Hook Model" into every interaction:[^27]

**Trigger:** The optional Evening Anchor notification in the user's wind-down window. Crucially, this is not "Don't break your streak!" It says "Your wind-down is ready." Specific, positive, actionable. The app becomes the cue that bedtime is approaching without becoming nagging.

**Action:** The minimum viable action is one tap on the notification → the app opens to the Wind-Down ready to start. Maximum friction elimination. Every extra tap between notification and breathing orb is a 10–15% drop in completion rate.

**Variable Reward:** The variable reward in this app comes from:
- The sleep rating the next morning (did it work?)
- The insight card appearing after 7 days (discovery)
- Milestone badges at streak checkpoints
- Discovering a new ambient sound combination that works
- A story that feels perfectly matched to your mood

**Investment:** Every session creates data. Every data point improves the insight engine. Every morning check-in makes the app more personalized. Users who have 14 days of data have invested in this app — the switching cost (losing all their history) is real.[^28]

### The Days 3–5 Churn Problem

Research is specific: the biggest churn window is days 3–5, when initial motivation fades and the habit hasn't formed yet. The solution:[^21]

- **Day 3:** In-app card: "3 sessions in — your nervous system is already adapting. People who reach Day 7 sleep 0.8 stars better on average."
- **Day 5:** If no session in 2 days, show an in-app non-guilt card when the user returns. Default push re-engagement remains limited to the one-time 3-day inactivity notification in [Notification Strategy](../ux/notification-strategy.md).
- **Day 7:** The first Sleep Insight preview — even with limited data, show them something. "You've completed 7 sessions. We're starting to learn your sleep patterns."

The insight system is the investment mechanism. Once a user has 14 days of data, they virtually never leave. Their data is irreplaceable.

***
