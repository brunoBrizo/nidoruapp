## Part 3: The Onboarding Flow Blueprint

Related docs:

- Use [Onboarding Flow Screen-by-Screen](../ux/onboarding-flow-screen-by-screen.md) for the current implementation flow.
- Use [Onboarding and Retention](../ux/onboarding-retention.md) for the broader first-session and retention loop.
- Use [Technical Foundation](../architecture/technical-foundation.md) for local-first/auth timing constraints.
- Use [Competitor UI/UX Response Plan](competitor-uiux-response-plan.md) for the decision layer.

Based on research across Calm, Headspace, BetterSleep, and 13 other wellness app flows, the optimal onboarding for this app follows six principles.[^41][^42][^10][^11]

### Principle 1: Demonstrate Before You Capture

The app's first interaction is a 30-second breathing animation — before sign-up, before any questions, before any paywall. The user opens the app. The splash fades. A single animated orb appears. Text: *"Breathe in with us."* The orb expands. *"And out."* The orb contracts. Then: *"That took 30 seconds. Imagine 4 minutes."* Then the question screen begins.

This is the "breathe before you register" pattern pioneered by Headspace's original onboarding — but extended with the orb experience. The user has already used the app. They are not being asked to trust something abstract.[^11]

### Principle 2: Five Questions Maximum, Each With a Purpose

| Question | Purpose | Design Note |
|---|---|---|
| "What brings you here?" | Goal segmentation (sleep / anxiety / stress / curiosity) | Illustrated option tiles, no text input |
| "How do you sleep most nights?" | Baseline for sleep insight card | Emoji scale 1–5, one tap |
| "When do you usually wind down?" | Anchor time for home screen card and optional reminder | Time-wheel picker with pre-set options |
| "Have you tried breathwork before?" | Content depth calibration | Binary: "Yes" / "New to me" |
| "What should we call you?" | Personalization of greeting | Text input, optional — "Skip for now" always visible |

Total estimated completion time: 90 seconds. Never more than 3 options per question. Never a question that requires typing more than a name. Always show a step indicator (1 of 5) so users can see the end.

### Principle 3: Deliver a Personalized Plan Screen

After the 5 questions, show a "Your plan" screen that feels generated specifically for the user's answers. The screen is not actually AI-generated — it is one of four pre-built plans (Sleep Focused, Anxiety Relief, Stress Reset, General Wellness) mapped to the onboarding answers. But it is presented as personal:

> *"Based on what you shared, your evening routine will start with 4 minutes of breathing before a 20-minute sleep sound mix. Most people sleep 34% faster within the first week."*

Numbers grounded in real research. A progress bar showing "Your first session is ready." A single CTA: "Let's start."

This pattern — drawn from Noom and Headspace's best onboarding experiments — works because it converts onboarding from data collection into value delivery. The user does not feel interrogated; they feel understood.[^41]

### Principle 4: Paywall After First Session, Not Before

The paywall appears after the user completes their first full session. This is the moment of maximum receptivity: the user has just experienced the product, the session complete animation has played, and the streak counter shows "1." The paywall at this moment converts at significantly higher rates because users are in a positive emotional state.[^30][^43]

The paywall screen must show:
- Annual plan as the visual default (larger, highlighted, "Most Popular" label)
- Monthly plan as the secondary option
- A 14-day free trial on both (no credit card required for trial start)
- "No payment now" text prominently visible
- The refund policy: "Change your mind within 7 days for a full refund"

Annual plan A/B test: test $39.99/year vs $29.99/year vs $49.99/year in the first 3 months. The research baseline is that users strongly reject $80/year (Calm/Headspace price) but accept $10–$40/year. Start at $39.99 and adjust based on conversion data.[^29]

### Principle 5: Social Login, No Password Required on Day 1

Google Sign-In and Apple Sign-In reduce onboarding friction by eliminating email verification steps. In a category where 80% of users churn on Day 1, every tap removed from the sign-up flow meaningfully impacts Day 7 retention. Password entry requires more taps than Google OAuth on iOS. Never require password creation on the first day.[^44][^42][^40]

### Principle 6: Notification Permission on Day 3

The single most common UX mistake in wellness apps is requesting notification permission during onboarding — before the user has experienced the product's value. The iOS permission dialog cannot be customized, but the pre-permission screen (the one you control) must explain the specific value:[^44][^11]

> *"We'll send you one gentle reminder in the evening — only if you haven't opened the app yet that day. No spam, no sales. Turn it off anytime."*

Request this on the morning of Day 3, after the user has completed at least 2 sessions. Users who have experienced 2 sessions understand the value they are protecting.

***
