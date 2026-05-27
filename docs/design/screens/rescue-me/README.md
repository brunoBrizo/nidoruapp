# Rescue Me UI Handoff

Frozen by ClickUp task `04.UI.00 Freeze Rescue Me UI source contract and design handoff`
on 2026-05-23.

## Contract

- Feature contract: `/Users/brunobrizolara/src/sleep-app/docs/features/04-rescue-me.md`
- Home entry context: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/home/home.png`
- Rescue Me screen source folder: `/Users/brunobrizolara/src/sleep-app/docs/design/screens/rescue-me`
- Downstream native UI work must match these references pixel by pixel on iOS.
- This handoff is design-only. It does not permit runtime, storage, analytics, audio, auth,
  paywall, permission, or network implementation work.

## Accepted Files

| Canonical state | Accepted file(s) | Aliases and notes |
| --- | --- | --- |
| Home urgent entry | `../home/home.png` | Home entry context only. Ember `#FF6B6B` is reserved for the Home Rescue Me entry and must not appear in active, completion, or handoff screens. |
| Active launch | `rescue-me-active.html`, `rescue-me-active.png` | Alias: `rescue-me-active-launch`. The orb is visible immediately with no setup text, technique picker, account, paywall, permission, spinner, or loading surface. |
| Active phase | `rescue-me-active2.png` | Alias: `rescue-me-active-phase`. Low-brightness 4-7-8 orb, timer, Bell, Pause, and Haptics controls. No coaching copy at launch. |
| After-two-cycles reassurance | `rescue-me-phase-2.png` | Alias: `rescue-me-active-reassurance`. Reassurance stays low-contrast bottom copy only; it must not become a card, banner, toast, or coaching panel. |
| Completion | `rescue-me-complete.png` | Alias: `rescue-me-complete`. Exact copy: `That took courage to start.` and `You completed 5 breath cycles.` Optional CTA: `Continue with a calming sound.` |
| Offline sound handoff | `rescue-me-handoff.png`, `rescue-me-handoff-2.png` | Alias: `rescue-me-sound-handoff`. Exact copy: `Rain is playing` and `Works offline. You can stop anytime.` |

## UI Review Constraints

- Rescue Me is zero-friction: no setup copy, technique picker, account, paywall, permission,
  network loading, or sound picker before/during the active session.
- Launch uses a full-screen orb immediately.
- Reassurance may appear only after two cycles and must stay visually subordinate to the orb.
- Completion copy and optional sound CTA must remain exact.
- Sound handoff must stay offline-safe and minimal.
- Ember `#FF6B6B` is a Home urgent-entry accent only.
- Avoid medical/crisis-service language, badges, streaks, rewards, and coaching panels.

## Downstream Tickets

- `04.UI.01 Home Rescue Me entry UI parity` references the Home PNG and this folder, and
  requires pixel-by-pixel iOS parity for the Home quick-action entry.
- `04.UI.02 Rescue Me active, reassurance, completion, and sound-handoff UI parity`
  references every accepted file in this folder and requires pixel-by-pixel iOS parity for
  the active, reassurance, completion, and sound-handoff states.
