# Sound Mixer UI Closeout Proof

Date: 2026-05-27
Ticket: `06.UI.05 Pixel proof, accessibility, and performance closeout for Sound Mixer UI`

## Source Contract

- `docs/design/screens/sleep/README.md`
- `docs/design/screens/sleep/sound-mixer-main.html`
- `docs/design/screens/sleep/sound-mixer-main.png`
- `docs/design/screens/sleep/sound-mixer-save-mix.html`
- `docs/design/screens/sleep/sound-mixer-save-mix.png`
- `docs/design/screens/sleep/sound-mixer-dark.html`
- `docs/design/screens/sleep/sound-mixer-dark.png`

## Native Pixel Proof

Captured from the iPhone 17 iOS 26.5 simulator through the native `Nidoru` debug build.

| State | Screenshot |
| --- | --- |
| Default mixer | `docs/engineering/sound-mixer-ui-closeout-screenshots/default.jpg` |
| Circular volume editing | `docs/engineering/sound-mixer-ui-closeout-screenshots/volume-editing.jpg` |
| Empty mixer | `docs/engineering/sound-mixer-ui-closeout-screenshots/empty-mixer.jpg` |
| Empty saved mixes | `docs/engineering/sound-mixer-ui-closeout-screenshots/empty-saved-mixes.jpg` |
| Saved mixes full | `docs/engineering/sound-mixer-ui-closeout-screenshots/full-saved-mixes.jpg` |
| Full-capacity Save Mix sheet | `docs/engineering/sound-mixer-ui-closeout-screenshots/full-save-mix-sheet.jpg` |

All screenshots were inspected for the accepted OLED shell, 20px horizontal rhythm, fixed active mixer strip, active Sleep tab, iris-only active emphasis, disabled empty-mixer controls, saved-mix capacity treatment, modal dimming, and no visible text overlap.

## Accessibility And Performance Gates

- Route proof states are addressable through the validated `uiVariant` query param on `/sleep/sounds`.
- Accessibility coverage asserts headers, labels, disabled timer/save controls, selected replacement row state, hidden background content while the Save Mix sheet is open, and active layer labels.
- Performance coverage asserts the Sound Mixer proof surface remains static: no JS animation loops, requestAnimationFrame loops, Reanimated repeat loops, network fetches, audio imports, Supabase imports, or SQLite imports.

Verification commands used:

```sh
pnpm --filter @nidoru/mobile exec jest --runInBand --selectProjects component apps/mobile/tests/sound-mixer-screen.component.jest.test.tsx
pnpm --filter @nidoru/mobile typecheck
pnpm --filter @nidoru/mobile lint
pnpm --filter @nidoru/mobile exec expo export --platform ios
git diff --check
graphify update .
```

Native simulator proof used XcodeBuildMCP `build_run_sim` against
`apps/mobile/ios/Nidoru.xcworkspace`, scheme `Nidoru`, iPhone 17 iOS 26.5, then
opened `/sleep/sounds?uiVariant=<state>` deep links for each proof state.
