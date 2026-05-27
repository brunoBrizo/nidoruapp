# Wind-Down UI Source Contract

This directory is the accepted PNG handoff for Feature 05 Evening Wind-Down Flow. Downstream native UI work must treat these files as the pixel source of truth, not loose visual inspiration.

## Required Source References

- Feature doc: `docs/features/05-evening-wind-down-flow.md`
- Research/copy safety audit: `docs/research/sleep-breathwork-technique-audit.md`
- Product deep spec: `docs/product/feature-deep-specs.md`
- MVP scope: `docs/product/mvp-scope-and-roadmap.md`
- Onboarding and retention: `docs/ux/onboarding-retention.md`
- Motion and haptics: `docs/design/motion-animation-haptics.md`
- Mixer animation notes: `docs/engineering/mixer-streak-session-onboarding-animations.md`

## Contract Rules

- Every visible Wind-Down UI state must match the accepted PNG for that state 100% pixel by pixel.
- Pixel parity includes spacing, safe-area placement, vertical rhythm, background texture, background colors, foreground colors, gradients, opacity, typography, timer digit sizing, tabular-number behavior, icons, icon stroke weight, card and pill shape, borders, shadows, blur, dim overlays, and the fading-light effect.
- Wind-Down copy must stay in wellness-routine territory. Do not introduce CBT-I, insomnia-treatment, anxiety-treatment, panic-treatment, medical-care, or guaranteed sleep-improvement claims.
- Hold-based breathing must expose the low-friction safety affordance shown in `hold-safety-guidance.png`: exact copy `Skip holds or stop if you feel dizzy, breathless, or uncomfortable.` plus the `Switch to no-hold breathing` action. This is not a blocking pre-orb safety screen.
- The accepted no-hold fallback active state is `no-hold-fallback-active.png`. The regular-practice no-hold Daily Calm state remains `10-minutes-daily-calm.png`.
- Use app-level dimming when platform brightness permission/API is unavailable; brightness permission cannot block the flow.
- Preserve the low-light, one-handed, no-scroll bedtime interaction model. Do not introduce a bright modal, account gate, paywall, notification permission gate, network loading state, or content-library browsing surface before first value.
- There are no accepted Wind-Down HTML references in this handoff. The PNGs below are authoritative for implementation parity.

## Entry Surfaces

The existing Home and Sleep PNGs are sufficient for the entry surfaces. No new Wind-Down-specific entry render is required for this contract.

| Entry state | Accepted reference | Decision |
| --- | --- | --- |
| Home night primary action entry | `../home/home.html`, `../home/home-1.png`, `../home/home-2.png` | Sufficient. `home-1.png` shows the first-viewport night primary card for `Evening Wind-Down`, the orb, `4-7-8 breathing · rain & low strings`, and the `Start now` primary CTA. `home-2.png` covers the lower continuation and shared tab bar. The repo no longer has an accepted `home.png` file. |
| Sleep tab Wind-Down entry | `../sleep/sleep.png` | Sufficient. It already shows the Sleep tab primary `Evening Wind-Down` card with `4-7-8 breath · body relax · sleep sounds` and `Start wind-down`. |

## Accepted Wind-Down State Matrix

| Required state | Accepted PNG | State aliases and implementation notes |
| --- | --- | --- |
| Optional quick context check | `quick-context-check.png` | `quick_context`, `tonight_goal`, first-use goal picker. Keep it one quiet low-light screen with one tap per choice and no text entry. `Wake up fewer times` is the no-hold Daily Calm route; `Calm racing thoughts` is the body-scan/body-relaxation route. |
| Active starter breathwork with hold safety | `hold-safety-guidance.png` | `active_winddown`, `starter_breathwork`, `hold_safety`, active 3-5 minute 4-7-8 breathwork after the 05A safety update. Full-screen orb, no visible tab bar, no visible nav bar, no visible back button. Exact headline is `Let's wind down.` Exact safety copy is `Skip holds or stop if you feel dizzy, breathless, or uncomfortable.` Exact action is `Switch to no-hold breathing`. Ambient indication is visually accepted as the subtle `Rain softly playing` line. |
| Active starter breathwork base visual | `active-winddown.png` | `active_winddown_base`, `starter_breathwork_base`. Retained as the pre-safety orb/background reference only. Current hold-based implementation must use `hold-safety-guidance.png` for visible UI parity. |
| No-hold fallback active breathwork | `no-hold-fallback-active.png` | `no_hold_fallback`, `diaphragmatic_fallback`, `wind_down_no_hold`. Use when the user chooses `Switch to no-hold breathing`; this is tonight-only no-hold diaphragmatic breathing and must not become a full technique picker. |
| Regular-practice Daily Calm option | `10-minutes-daily-calm.png` | `daily_calm`, `coherent_breathing`, 10-minute option. Use for the Coherent Breathing / Daily Calm routine state, with exact visible rhythm copy `5.5 in · 5.5 out`. |
| 5-second transition card | `winddown-transition-cue.png` | `transition_card`, `body_relax_intro`. Exact text is `Good. Now let your body relax.` Auto-advance after 5 seconds. |
| Body relaxation cue | `body-relaxation-cue.png` | `body_cue`, `body_relaxation`, `body_scan`, `pmr_cue`, about 2-minute cue. This PNG can support a simple body scan or progressive muscle relaxation interpretation for busy-mind nights. Keep the copy as body relaxation/wellness guidance, not insomnia treatment. Must remain usable without watching the screen. |
| Ambient sound handoff | `ambient-sound-handoff.png` | `ambient_handoff`, `sleep_sounds_timer`, pre-dim audio state. Shows timer plus visible stop/fade/continue state before dimming. |
| Dimmed inactivity state | `dimmed-inactivity-state.png` | `dimmed_idle`, `inactivity_dim`, audio-only dimmed state after breathwork/body cue. |
| Tap-to-wake return | `tap-to-wake.png` | `tap_to_wake`, `wake_controls`, controls returned from dimmed state. |
| Audio interruption state | `audio-interrupt-state.png` | `audio_interruption`, `audio_stopped_faded_resumed`. Use when showing whether audio stopped, faded, or resumed. |
| Full completion / timer ended | `completition-state.png` | `completion`, `timer_ended`, `wind_down_complete`. Keep the current filename even though it contains the `completition` spelling. |
| Partial body-cue stop | `partial-stop-body-cue.png` | `partial_stop`, `body_cue_exit`, manual exit during body cue without guilt copy. |
| Background recovery | `background-recovery.png` | `background_recovery`, `background_after_exercise`, saved/recoverable state after app backgrounding. |

## PNG Inventory

| File | Dimensions | SHA-256 |
| --- | --- | --- |
| `10-minutes-daily-calm.png` | 680 x 1496 | `82d1557f8258cdc02fa7435f0e294c1d99b962b93079c901b18a6197281056db` |
| `active-winddown.png` | 688 x 1498 | `597bc1e806b08da3a38b35982b58a9a66bff20c90b66be4e160b4b02e01921ea` |
| `ambient-sound-handoff.png` | 760 x 1614 | `d59ca7337d51c172672e9db9accf88b3c55793b8d6bbf34e22689d9ca1344d5f` |
| `audio-interrupt-state.png` | 762 x 1610 | `41cfdbdd3c520ce6a4a52861e221c3aaf1d338aca4b3951ea31f894263957e77` |
| `background-recovery.png` | 760 x 1614 | `3a883bb764e34d2127952178f1bf873cc9df9fe2fd90219dececf4cd6b0df673` |
| `body-relaxation-cue.png` | 672 x 1496 | `4a68610cf55eb21c335d28e30807b3d09cea53bcf4d916391b0e7bb59b556d60` |
| `completition-state.png` | 760 x 1608 | `a13cc9d2ee881535553e19652db8646992a2b3910cae25258575e4a215b5c7f7` |
| `dimmed-inactivity-state.png` | 760 x 1608 | `661d97086aa44a4470c1fc402421f603d2f2fd1d3adfea7de96d7590b971892d` |
| `hold-safety-guidance.png` | 368 x 800 | `e531ef28fde39c2005966f47033cd88354207d5b6e2451507923b245b0cc123c` |
| `no-hold-fallback-active.png` | 368 x 800 | `8c9b6b25375fae9f1fd07a6d376c3c3723b0775491c24f132214b7470943ecbe` |
| `partial-stop-body-cue.png` | 758 x 1610 | `0cba618c61c7067040ef5bcee736e87b23b21ee0aba17b61fe0556eacea1f886` |
| `quick-context-check.png` | 686 x 1494 | `f0566918c685f1f7a67fc4ee7cf87dc0529df80cb07a0a2f44bad39a7c40d8e7` |
| `tap-to-wake.png` | 754 x 1604 | `411fa111eed1bd46bab7dc41836724d164fbf1a16db44688909656f41563854d` |
| `winddown-transition-cue.png` | 674 x 1500 | `495ae1f7fb70f72a4a728d0c44f39c97a57977aa46660fc8b77a808382e5699f` |

## Downstream Ticket Rule

Every downstream Feature 05 UI or implementation ticket must reference this contract and repeat the 100% pixel-by-pixel PNG requirement before claiming pixel parity. If a later worker finds a required visible state that is not covered here, that ticket must leave the implementation blocked or Needs Review and name the exact missing state.
