# Motion, Animation, And Haptics

Related docs:

- Use [Animation Engineering Index](../engineering/animation-engineering-index.md) for code-first animation docs.
- Use [Animation Source Alignment](../engineering/animation-source-alignment.md) for source hierarchy and conflict decisions.
- Use [Design System](design-system.md) for visual tokens used by motion.
- Use [Breathing Orb Implementation Spec](breathing-orb-implementation-spec.md) for the core product animation.
- Use [Sleep and Breathwork Technique Audit](../research/sleep-breathwork-technique-audit.md) before treating technique timing as public health or outcome copy.

This doc consolidates the motion, timing, easing, and haptic rules that were present in the complete product bible. For code-first implementation, use [Animation Engineering Index](../engineering/animation-engineering-index.md) and [Animation Implementation Review Notes](../engineering/animation-implementation-review-notes.md).

Source files:

- [Complete Product Bible With Animations Source](../research/complete-product-bible-with-animations-source.md)
- [Animation UI/UX Deep Spec Source](../engineering/animation-ui-ux-deep-spec-source.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)
- [Design System](design-system.md)
- [Feature Deep Specs](../product/feature-deep-specs.md)

## Motion Philosophy

The app's motion should feel like breathing: smooth, slow, rhythmic, and calm.

Rules:

- No snappy transitions.
- No bouncy spring animations.
- Default transitions complete in 400-800 ms.
- Breath motion uses ease-in-out, not linear.
- Motion must never delay Rescue Me or first breath start.

## Timing Table

| Interaction | Timing | Easing | Notes |
| --- | --- | --- | --- |
| Screen/content entrance | 400 ms | ease-out | Fade opacity 0 to 1 plus translateY 12 px to 0. |
| Screen/content exit | 300 ms | ease-in | Reverse entrance. |
| Breathing orb inhale | Technique inhale duration | ease-in-out | Orb scales up; never linear. |
| Breathing orb exhale | Technique exhale duration | ease-in-out | Slightly slower feel than inhale when pattern allows. |
| Breathing orb hold | Technique hold duration | subtle pulse | Hold at maximum size with gentle shimmer at 50% breath-rate feel. |
| Phase label crossfade | 200 ms before next phase | fade | Text fades in before phase starts and fades out during transition. |
| Progress ring update | 300 ms per percentage change | smooth stroke-dashoffset | Used for progress rings and circular volume indicators. |
| Tab active indicator | 250 ms | ease-in-out | Indicator slides between tab positions. |
| Wind-down transition card | 5 seconds | soft fade | Auto-advances if user does nothing. |
| Sleep sound UI inactivity fade | 30 seconds idle | soft fade | Interface fades to fully dark while audio continues. |
| Sleep timer fade-out | 2 minutes | linear volume fade | Begins 2 minutes before timer end. |
| Morning mood emoji tap | One quick bounce | gentle | Must feel lightweight, not playful or cartoonish. |
| Insight card first reveal | One subtle sparkle pass | gentle | Only on first reveal. |
| Comeback animation | Short confetti + welcome back | gentle | Celebrates return without shame. |
| Rescue Me tap transition | Immediate | no delay | Orb must be visible before transition completes. |
| Rescue Me reassurance overlay | After 2 breath cycles | fade-in | Copy appears subtly at bottom. |

## Haptic Table

| Moment | Haptic |
| --- | --- |
| Inhale transition | `Haptics.ImpactFeedbackStyle.Light` |
| Exhale transition | `Haptics.ImpactFeedbackStyle.Soft` where available, otherwise the closest gentle feedback |
| Star rating tap | Light feedback |
| Mood tag tap | Light feedback plus small visual bounce |
| Session complete | Gentle completion feedback |
| Streak comeback | Gentle celebratory feedback, not aggressive |

## Breath Technique Timings

| Technique | Pattern | Primary Context |
| --- | --- | --- |
| 4-7-8 Sleep | 4s inhale / 7s hold / 8s exhale | Before bed, Rescue Me |
| Box Breathing | 4s inhale / 4s hold / 4s exhale / 4s hold | Calm/focus grounding |
| Coherent Breathing / Daily Calm | 5.5s inhale / 5.5s exhale | 10-minute Evening Wind-Down or Daily Practice |
| Physiological Sigh | 2s inhale / 1s second inhale / 8s exhale | Post-MVP acute reset candidate |

## Implementation Rules

- Use the breath phase timer as the source of truth.
- Animation derives from phase state; it must not drift independently.
- Do not animate the breath pacer with decorative loops that can desync from the real timing.
- When the app wakes from background, the orb must render the correct current phase.
- Haptics are required while active and screen-on, but audio cues are the reliable screen-off guidance layer.
- If platform behavior prevents locked-screen haptics, do not fake the guarantee. Use audio-first locked-screen guidance.

## Note On Source Evolution

The earlier uploaded product-bible file named "with animations" is byte-for-byte identical to the previous product bible already archived in the repo. It does not contain:

- A separate complete timing table beyond the rules consolidated here.
- Glassmorphism implementation code.
- Reanimated implementation code.

The later [Animation Engineering Playbook Source](../engineering/animation-engineering-playbook-source.md) contains code-first animation details. The [Animation UI/UX Deep Spec Source](../engineering/animation-ui-ux-deep-spec-source.md) adds animation rationale, competitor lessons, glass usage rules, background atmosphere guidance, and a timing reference. Treat [Animation Source Alignment](../engineering/animation-source-alignment.md) as the conflict-resolution layer before implementation.
