# Sleep And Sound Mixer UI Source Contract

Date: 2026-05-27
ClickUp task: `06.UI.00 Freeze Sound Mixer UI source contract and state matrix`

## Contract Scope

This handoff freezes the accepted Feature 06 Sleep Sound Mixer UI source contract before implementation. Every Feature 06 UI ticket must match the relevant HTML and PNG handoff 100% pixel by pixel. The HTML is the structural, typography, spacing, color, and interaction-state source. The PNG is the visual parity source for rendered screenshot proof.

This contract does not implement app UI. It records the accepted source files and the state variants that still need dedicated follow-up handoffs or implementation tickets.

## Accepted Source Files

| Surface or state | HTML source | PNG source | Contract decision |
| --- | --- | --- | --- |
| Sleep tab entry surface | `docs/design/screens/sleep/sleep.html` | `docs/design/screens/sleep/sleep.png` | Remains the accepted Sleep tab entry surface. The Sound Mixer card on this screen is the entry point into Feature 06. |
| Main Sound Mixer screen | `docs/design/screens/sleep/sound-mixer-main.html` | `docs/design/screens/sleep/sound-mixer-main.png` | Base main mixer screen. Use for the default loaded mixer with saved mixes, timer, sound category grid, active sound highlighting, active mix strip, and Save Mix entry. |
| Save Mix bottom sheet | `docs/design/screens/sleep/sound-mixer-save-mix.html` | `docs/design/screens/sleep/sound-mixer-save-mix.png` | Base Save Mix bottom sheet over the mixer. Use for the naming sheet, selected layers summary, max-3 saved-mixes copy, and sheet backdrop treatment. |
| Idle dark playback | `docs/design/screens/sleep/sound-mixer-dark.html` | `docs/design/screens/sleep/sound-mixer-dark.png` | Base idle dark playback screen after 30 seconds of inactivity. Use for the fully dimmed playback state, tap-to-wake affordance, active layer chips, and fade countdown copy. |

## State Matrix

| State | Source status | Required follow-up |
| --- | --- | --- |
| Sleep tab entry | Accepted source: `sleep.html` and `sleep.png`. | Preserve Sleep tab navigation and the Sound Mixer entry affordance when wiring the route. |
| Main mixer default | Accepted source: `sound-mixer-main.html` and `sound-mixer-main.png`. | Implement pixel parity against this base state before adding later variants. |
| Save Mix sheet | Accepted source: `sound-mixer-save-mix.html` and `sound-mixer-save-mix.png`. | Implement as a bottom sheet over the main mixer with the accepted dim/blur backdrop and stateful save limits. |
| Idle dark playback after 30 seconds | Accepted source: `sound-mixer-dark.html` and `sound-mixer-dark.png`. | Implement the inactivity transition and tap-to-wake behavior from this base state. |
| Volume editing / drag state | Variant still needed later. | Add a dedicated handoff or implementation proof for circular ring dragging, haptic detents, and live volume feedback. |
| Empty / no-active-sounds state | Variant still needed later. | Define the zero-layer mixer state before treating the route as complete. |
| Saved mixes expanded / full state | Variant still needed later. | Define expanded saved-mix management and max-capacity handling beyond the base Save Mix sheet. |
| Fade-out-started state | Variant still needed later. | Define visual countdown and volume fade behavior once the two-minute fade begins. |
| Tap-to-wake controls returned state | Variant still needed later. | Define the restored controls after the idle dark playback screen is tapped. |
| Audio interruption state | Variant still needed later. | Define interruption recovery for calls, alarms, headphone changes, Bluetooth changes, and playback failures. |
| Timer-ended state | Variant still needed later. | Define the end state after audio finishes and keep-awake or power-management locks release. |

## Evidence-Safe Copy Rules

Sound Mixer copy must frame audio as masking, preference, ambiance, and routine support. It must not claim that white noise, pink noise, brown noise, 432 Hz tones, binaural tracks, or delta-wave tracks clinically improve sleep, treat insomnia, reduce anxiety, or produce guaranteed sleep outcomes.

The accepted sources may name preference audio such as `White Noise`, `Brown Noise`, `Pink Noise`, `432Hz Tone`, and `Delta Wave Binaural`, but implementation and public copy must keep those labels descriptive and non-clinical.

## Catalog Count Discrepancy

The Feature 06 product doc says the launch library has 15 curated sounds. The named category list and the accepted Sound Mixer designs include 16 names:

| Category | Names in the source contract |
| --- | --- |
| Rain | Light Rain, Heavy Rain, Rain on Window, Thunderstorm |
| Nature | Ocean Waves, Forest, River Stream, Wind |
| Noise | White Noise, Brown Noise, Pink Noise |
| Environment | Fireplace Crackling, Cafe Ambience, Fan |
| Tones | 432Hz Tone, Delta Wave Binaural |

Implementation must resolve the 15-vs-16 discrepancy before final catalog, licensing, bundled asset, offline playback, analytics, or sync work is closed.

## Verification Expectations

- Focused docs search must show every accepted Sound Mixer source path above is referenced.
- UI proof for implementation tickets must compare rendered native output against the relevant HTML and PNG source.
- Graphify must be updated after this doc or related inventory files change.
