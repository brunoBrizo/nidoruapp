# Breathing Orb Implementation Spec

This doc extracts the breathing orb behavior from the product bible and aligns it with the current tech stack decision.

Source:

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Motion, Animation, And Haptics](motion-animation-haptics.md)
- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)

## Product Role

The breathing orb is the visual center of the product. It must be good enough to communicate the value of the app in a 15-second screen recording.

## Visual Layers

| Layer | Rest State | Active Behavior |
| --- | --- | --- |
| Core | Solid `Iris #7C6FCD`, radius 80 px | Scales to 110 px on inhale. |
| Inner glow | `rgba(124, 111, 205, 0.4)`, radius 90 px | Scales to 130 px on inhale. |
| Outer ring | 2 px stroke `rgba(168, 156, 224, 0.3)`, radius 110 px | Scales to 150 px on inhale. |
| Pulse ring | Starts at orb edge | Expands outward and fades on inhale only. |

## Phase Behavior

### Inhale

- All layers scale up together.
- Use ease-in-out.
- Pulse ring expands and fades.
- Phase label is "Inhale".
- Light haptic fires at transition.

### Hold

- Orb stays at maximum size.
- Subtle shimmer/pulse communicates "stay here".
- Phase label is "Hold".
- No aggressive or distracting motion.

### Exhale

- All layers contract smoothly to rest size.
- Exhale should feel slightly slower and more relaxing than inhale.
- Phase label is "Exhale".
- Soft haptic fires at transition where available.

## Phase Text

Rules:

- Text appears inside or below the orb.
- Font: Nunito 16 px Semibold.
- Color: Mist `#8A8FA8`.
- Fade in 200 ms before phase starts.
- Fade out during phase transitions.
- Never abruptly swap text.

## Audio Modes

Supported options:

- None: visual plus haptic only.
- Gentle bell on phase transitions.
- Soft whoosh sounds for inhale and exhale.
- Nature ambient under phase audio.

Screen-off and locked-screen sessions must use audio cues as the reliable guidance layer.

## Reanimated Pattern

Use React Native Reanimated for phase-driven animation and React Native SVG for rings.

Required pattern:

- One breath session controller owns current phase, phase start time, phase duration, cycle count, and total session duration.
- Reanimated shared values mirror phase progress.
- SVG ring stroke and orb scale derive from shared values.
- JS timers do not drive every animation frame.
- Completion is persisted before end screens, share prompts, or upsell.

The uploaded file does not include source-provided Reanimated code. This pattern is the architecture decision derived from the product bible and the tech stack record.

## Acceptance Criteria

- 4-7-8 session runs smoothly for 5 minutes on real iOS and Android devices.
- Orb remains visually synced with phase text.
- Audio cues remain phase-synced.
- App wake returns to the correct phase.
- Rescue Me can show the orb immediately without waiting on network, auth, analytics, or payment state.
- The visual remains consistent with the Midnight Indigo palette.

