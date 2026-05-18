## Part 4: Animation Anti-Patterns to Avoid (Competitor Lessons)

Related docs:

- Use [Animation UIUX Competitor Audit](animation-uiux-competitor-audit.md) for the evidence behind these anti-patterns.
- Use [Competitor Motion Failures](competitor-motion-failures.md) for the implementation-focused failure table.
- Use [Animation Implementation Review Notes](animation-implementation-review-notes.md) for production corrections.
- Use [Animation Engineering Index](animation-engineering-index.md) to navigate sibling animation docs.

Drawn directly from competitor analysis and user feedback:

| Anti-Pattern | Who Does It | Why It's Wrong | The Fix |
|---|---|---|---|
| Splash animation > 2 seconds | Eight Sleep app[^27] | Users resent being kept from content | Splash ≤ 1.5s, or instant load |
| Loading spinner at bedtime | Calm (audio buffering) | Communicates failure, increases anxiety | Shimmer skeleton + audio pre-buffer |
| Static session complete screen | Headspace, Calm | No reward signal = brain learns habit doesn't feel good | Lottie celebration + count-up stats |
| Removing animations in updates | Breathwrk[^9] | Destroys trust and habit routines | Never remove; offer toggle |
| Spring animations with high bounce | Many wellness apps | Fun in social apps, feels playful/wrong in sleep context | Use `damping > 15` for gentle spring |
| Ambient particles at high speed | Common mistake | Fast movement is activating, not calming | Particles max 0.8 px/second |
| Navigation without spatial cue | Headspace rebrand[^7] | Users lose their mental map of the app | Consistent directional transitions (forward = right, back = left) |
| Haptics for every touch | Common mistake | Becomes noise, loses meaning[^16] | Only 4 haptic events: inhale, exhale, success, error |
| Linear animation easing | Any app using `duration: 300` | Feels mechanical and robotic | Always use `ease-in-out` or bezier curves |
| Full-screen modal for errors | Calm, Headspace[^3] | Interrupts the pre-bed ritual | Toast only, auto-dismiss |
| Bright loading screen on night mode | Most apps | Burns eyes, breaks sleep readiness | Skeleton shimmer at 20% brightness |

***
