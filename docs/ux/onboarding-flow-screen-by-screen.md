# Onboarding Flow Screen-by-Screen

Related docs:

- Use [Onboarding and Retention](onboarding-retention.md) for the product-level first-session loop.
- Use [Competitor UI/UX Onboarding Blueprint](../research/competitor-uiux-onboarding-blueprint.md) for the research source.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for the breath demo, plan, account, and paywall behavior.
- Use [Technical Foundation](../architecture/technical-foundation.md) for local-first and auth timing requirements.

The current onboarding decision comes from the product bible plus the newer [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md). The user breathes and completes a first full session before questions, account creation, permissions, or paywall.

## Success Criteria

- First breath cue appears within 60 seconds of first launch.
- The first interaction demonstrates value before capture.
- No account, paywall, notification prompt, question flow, or backend dependency appears before the first full session.
- Total question count is five or fewer.
- Every question directly improves the follow-up plan or later personalization.
- Notification permission is requested on Day 3 after at least two completed sessions, not during onboarding.

## Flow

### Screen 1: Splash

Dark night background, resting orb, app name.

Rules:

- Keep this short; it exists only to cover app readiness.
- No loading spinner.
- If initialization is slow, show a calm skeleton or go straight to the local breath demo.

### Screen 2: 30-Second Breath Demo

The first product interaction is the orb:

1. "Breathe in with us."
2. Orb expands.
3. "And out."
4. Orb contracts.
5. "That took 30 seconds. Imagine 4 minutes."

Rules:

- No skip gate that blocks value.
- No data capture.
- No paywall.
- No account creation.

### Screen 3: First Full Session

Start a short local first session immediately.

Rules:

- No personalization is required to begin.
- Default duration is short enough to complete on Day 0.
- Session state is saved locally before relying on sync.
- If the app crashes near completion, the user's progress is not lost.

### Screen 4: Post-Session Reflection

Ask "How do you feel?" with three options:

- Same.
- Better.
- Much better.

Then show one short science sentence explaining why breathwork helps. Do not turn this into education mode.

### Screens 5-9: Personalization Questions

Ask up to five questions:

| Question | Purpose | Design rule |
| --- | --- | --- |
| What brings you here? | Goal segmentation: sleep, busy mind, stress, curiosity | Illustrated option tiles, no text input. |
| How do you sleep most nights? | Baseline for later insight cards | One-tap 1-5 scale. |
| When do you usually wind down? | Anchor time for Home and optional reminders | Time-wheel picker plus presets. |
| Have you tried breathwork before? | Calibrate instruction depth | Binary: yes / new to me. |
| What should we call you? | Greeting personalization | Optional text input; "Skip for now" visible. |

Rules:

- Never more than three options per question unless the control is a time picker.
- Show step count.
- Do not ask anything that does not change the plan, copy, timing, or later personalization.

### Screen 10: Personalized Plan

Show one of four prebuilt plans mapped from answers:

- Sleep Focused.
- Anxiety Relief.
- Stress Reset.
- General Wellness.

The plan screen should feel specific without pretending to be AI-generated. It includes:

- One sentence summarizing the recommended routine.
- One primary CTA: "Let's start."
- A progress cue that the first session is ready.
- No paywall.

### Screen 11: Paywall Or Account

Only after first full session completion:

- Offer social login or anonymous-to-account linking.
- Show paywall only after the reward moment.
- No password creation on Day 1.
- If paywall appears, copy must reference the value just experienced.

## Day 3 Notification Permission

After at least two completed sessions and on or after Day 3, show the pre-permission screen:

> We'll send you one gentle reminder in the evening, only if you have not opened the app yet that day. No spam, no sales. Turn it off anytime.

If the user declines, do not ask again during the same onboarding period.
