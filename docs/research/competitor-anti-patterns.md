# Competitor Anti-Patterns

This doc consolidates the anti-patterns from the complete product bible so implementation work can avoid repeating competitor failures.

Source:

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Competitor Design Analysis](competitor-design-analysis.md)
- [Competitor UI/UX Response Plan](competitor-uiux-response-plan.md)

## Cross-Category Anti-Patterns

- Do not make users browse a content library when they need immediate support.
- Do not require account creation before first value.
- Do not show a paywall before first value.
- Do not ask for notification permission on first launch.
- Do not use guilt language in streaks or notifications.
- Do not make the user stare at the screen for breath guidance.
- Do not let network playback be required for the first sleep sound experience.
- Do not remove core visual or tracking features once users depend on them.
- Do not over-emphasize scores in a way that increases sleep anxiety.
- Do not present medical or therapeutic claims the app cannot support.
- Do not turn Home into a content library.
- Do not change primary navigation names or positions after users build muscle memory.
- Do not send promotional, feature-announcement, or sale push notifications by default.
- Do not hide cancellation, annual price, renewal timing, or refund policy.
- Do not rely on the session-complete screen as the first time a session is persisted.

## Calm Failures To Avoid

- Too many sleep stories and content choices.
- Celebrity sleep stories that feel like entertainment rather than low-stimulation sleep support.
- Basic utility features moved behind paywalls after users trusted them.
- Billing and cancellation distrust.
- Sleep content separated from breathwork instead of one nightly ritual.
- Paid-session crashes, login failures, or offline failures.
- Corporate-feeling wellness UI that lacks intimacy.

## Headspace Failures To Avoid

- Auto-enrollment into annual billing without clear renewal reminders.
- Confusing cancellation paths across web and app subscriptions.
- Replacing human voice experiences with AI-generated narration without disclosure.
- Offline download failures.
- Over-expanding into an all-in-one mental-health product that makes navigation heavy.
- Letting strong brand illustration make the actual product UI too complex.

## Breathwrk Failures To Avoid

- Crashing at the end of sessions and destroying streak trust.
- Emotion-only labels like "calm" or "focus" as the primary exercise taxonomy.
- No audio-only or haptic-friendly mode.
- No sleep journey after breathwork.
- Sterile breathing visuals that are not shareable.
- Removing visual animations or mindfulness tracking after launch.
- Slow support for billing issues.
- Forced ecosystem integrations users did not choose.

## Wind Down Competitor Gaps To Exploit

- Generic deep breathing rather than named techniques.
- No interactive ambient sound mixer.
- No morning breathwork anchor.
- No personalized insight cards from collected data.
- Functional but not distinctive enough visually for TikTok-driven discovery.

## Product Rules Derived From Anti-Patterns

- The home screen recommends one contextual action instead of dumping content.
- Rescue Me is local-only, immediate, and has no setup.
- The sound mixer has offline base sounds and per-layer volume.
- The breathing library groups by user state but still shows technique names.
- The streak model pauses instead of resetting.
- Notifications are positive, specific, capped, and limited to the allowed default types.
- Billing and renewal communication must be unusually clear.
- Human-narrated sleep stories are required if stories are built.
- Core visuals are treated as product contracts after launch.
- Cancel subscription remains reachable in three taps or fewer from Profile.
- Android back navigation, locked-screen resume, and crash-after-session recovery are launch gates.
