# MVP Scope and Roadmap

Related docs:

- Use [Product Strategy](product-strategy.md) for positioning and product principles.
- Use [Feature Deep Specs](feature-deep-specs.md) for detailed feature behavior.
- Use [Technical Foundation](../architecture/technical-foundation.md) for module boundaries and backend responsibilities.
- Use [Onboarding Flow Screen-by-Screen](../ux/onboarding-flow-screen-by-screen.md) and [Navigation Architecture](../ux/navigation-architecture.md) for launch-flow specifics.

## MVP Goal

Build the smallest product that proves the core loop:

> A user can start a guided breath session in under 60 seconds, transition into a sleep sound without extra effort, and complete a morning check-in that makes the next night smarter.

## Current Product Bible Update

The complete product bible describes the MVP as Features 1-6 plus onboarding and navigation:

- Breathing Visual Pacer.
- Evening Wind-Down Flow.
- Sleep Sound Mixer.
- Morning Check-In.
- Home Screen Architecture.
- Compassionate Streak System.
- Onboarding Flow.
- Bottom Navigation.

The newer competitor UI/UX intelligence report makes Rescue Me a direct response to Calm's zero-friction Breathe Bubble and the category's failure to offer immediate relief. Rescue Me is now pulled into MVP because it is technically small and strategically central.

## Launch MVP

### 1. Evening Wind-Down Flow

Required behavior:

- One tap from home, two taps maximum.
- Fixed launch sequence: breathwork, body relaxation cue, ambient sound.
- Breathwork duration: 3-5 minutes for starter wind-down, with a 10-minute Coherent Breathing / Daily Calm option for regular practice.
- Body cue duration: about 2 minutes.
- Ambient sound continues until timer or user stop.
- Phone screen dims after breathwork completion.
- Session is recorded even if the app is backgrounded after the main exercise.

Why it matters:

- This is the anchor behavior.
- It combines the two app categories instead of being only a breathwork tool or only a sound app.

### 2. Breathing Visual Pacer

Required behavior:

- Animated inhale, hold, exhale, hold states.
- Works with no voice.
- Supports audio cues and haptic cues.
- Technique names are explicit.
- Launch techniques:
  - 4-7-8 breathing for sleep.
  - Box breathing for anxiety and calm.
  - Coherent Breathing / Daily Calm, 5.5 seconds in and 5.5 seconds out, for 10-minute evening or daily practice.
  - Diaphragmatic breathing for stress.
- Animation should be attractive enough to screen record.

Why it matters:

- It creates the first value moment.
- It is the most visually shareable surface.
- It directly addresses screen-watching complaints if haptics and audio work.

### 3. Sleep Sounds And Mixer

Required behavior:

- 10-15 curated sounds.
- Include rain, ocean, white noise, brown noise, forest, fan, and fireplace.
- Users can mix 2-3 layers.
- Each layer has separate volume.
- Sleep timer supports 20, 30, 45, and 60 minutes.
- Timer fade-out is smooth.
- Core sounds work offline.

Why it matters:

- Ambient sound is a major retention behavior in sleep apps.
- Offline reliability is a direct competitor gap.

### 4. Morning Check-In

Required behavior:

- One screen.
- Sleep rating from 1 to 5.
- One mood or energy tag.
- Optional 3-minute morning breath session.
- Stores enough data to power later insight cards.

Why it matters:

- Creates the second daily habit anchor.
- Generates personalization data without passive sleep tracking.

### 5. Compassionate Streak And History

Required behavior:

- Track total breath sessions.
- Track total breath minutes.
- Track total sleep sessions.
- Show current streak without resetting to zero after one missed day.
- Missed day pauses the streak.
- Returning user can earn a comeback moment.
- Simple calendar view.

Why it matters:

- Streak reset pain is a known churn driver.
- The app should reinforce consistency without shame.

### 6. Rescue Me

Required behavior:

- One tap from Home.
- Starts 4-7-8 breathing immediately.
- No account, network call, paywall, sound choice, or setup.
- Minimal copy and minimal light.
- Session progress is saved locally.

Why it matters:

- It is the fastest path to relief.
- It directly copies what users love about Calm's Breathe Bubble while making it more visually distinctive and more reliable.
- It gives anxious users a reason to trust the app before exploring anything else.

## Phase 2: First 3 Months After MVP

### Sleep Insight Card

After 7-14 nights, surface one simple pattern:

- Later wind-down start time and lower sleep rating.
- Specific sound associated with higher rating.
- Morning energy tag trend after wind-down completion.

Do not claim causation. Phrase insights as patterns.

### Routine Builder

Let users build simple bedtime sequences. Keep the first version constrained:

- Breathwork.
- Body cue.
- Story.
- Sound.

The notification works backward from selected bedtime and routine length.

### Shareable Session Card

After breathwork, create a clean result card with session length, breaths completed, technique, and streak or comeback status.

### 7-Day Challenges

Curated sequences:

- 7 Days of Better Sleep.
- 7 Days to Calm.
- No-Scroll Bedtime Week.

Challenges should reuse existing sessions and not require a separate content system at first.

## Phase 3: Month 3-6

- Sleep stories, starting with a small set of 5-15 minute original recordings.
- Apple Health import for sleep context.
- Android health integration after iOS path is stable.
- Watch app exploration only after the phone-based cue system is proven.

## Explicit V1 Exclusions

- No CBT-I course.
- No microphone sleep tracking.
- No AI chatbot or therapist.
- No social feed.
- No wearable companion app.
- No large meditation library.
- No complex routine marketplace.
- No aggressive streak notifications.

## Prioritization

| Feature | Build Effort | User Impact | Viral Potential | Build |
| --- | --- | --- | --- | --- |
| Breathing visual pacer | Low | Very high | Very high | MVP |
| Evening wind-down flow | Medium | Very high | High | MVP |
| Sleep sounds and mixer | Low to medium | Very high | Very high | MVP |
| Morning check-in | Very low | High | Low | MVP |
| Compassionate streak | Very low | High | Medium | MVP |
| Rescue Me | Very low | Very high | Very high | MVP |
| Offline access | Medium | High | Low | MVP |
| Shareable session card | Low | Medium | Very high | Month 2 |
| Sleep insight card | Medium | Very high | High | Month 2-3 |
| Routine builder | Medium | High | Medium | Month 2-3 |
| 7-day challenges | Medium | High | Very high | Month 3 |
| Sleep stories | High content effort | Very high | Medium | Month 3-4 |
| Health integration | Medium | High | Low | Month 3-4 |
| Watch app | High | High | Medium | Month 6+ |

## MVP Acceptance Criteria

The MVP is not ready until these are true:

- A new user can complete onboarding and start the recommended breath session in 60 seconds or less.
- The evening wind-down flow can complete without looking at the screen after start.
- Ambient audio keeps working with the phone locked.
- At least the default sound pack is available offline.
- Session completion is saved even if the app is backgrounded right after the exercise.
- Morning check-in creates structured data for later insight cards.
- A missed day does not reset the streak to zero.
- No account creation or paywall appears before the first completed session.
- Rescue Me starts from Home without account, network, or paywall.
- Base sounds have no audible loop click during normal playback.
