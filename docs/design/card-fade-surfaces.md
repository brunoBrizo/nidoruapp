# Card Fade Surfaces

Use `CardFade` from `apps/mobile/src/surfaces/card-fade.tsx` for clipped card color washes that come from blurred HTML reference glows.

Do not approximate these effects with flat absolute `View` strips. React Native does not blur plain views, so a solid strip reads as a hard block instead of the fading corner color in the reference PNG.

Current variants:

- `profile`: profile header wash with top and right edge highlights.
- `sleep-primary`: Evening Wind-Down corner wash.

When adding another reference-card fade, add a variant to `CardFade` with the geometry from the design reference. Keep the layer `pointerEvents="none"` and render it inside a parent card with `overflow: "hidden"` so the fade clips to the card radius.
