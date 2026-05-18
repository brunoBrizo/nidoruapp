## Part 4: The Home Screen Information Architecture

Related docs:

- Use [Navigation Architecture](../ux/navigation-architecture.md) for the current app-level structure.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for Home screen behavior.
- Use [Competitor UI/UX Response Plan](competitor-uiux-response-plan.md) for the actionable competitor response.
- Use [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md) for launch priority.

The home screen is the most important screen in the app. Every major competitor's failure stems from making the home screen a library. It must be a moment.

### The "Right Now" Home Screen Layout

```
┌─────────────────────────────────────────────────┐
│  Good evening, [Name]          [streak: 7] 🌙   │   ← Personalized greeting + streak
│  "Tonight's quality starts now"                 │   ← Rotating contextual tagline
├─────────────────────────────────────────────────┤
│                                                 │
│       PRIMARY ACTION CARD (glassmorphism)       │   ← Changes by time of day
│                                                 │
│  🌙  Evening Wind-Down                          │
│  "4 min breathwork + 20 min sounds"             │
│                                                 │
│              [Start Now →]                      │
│                                                 │
├─────────────────────────────────────────────────┤
│  Quick Access                                   │
│  [🆘 Rescue Me]  [🎵 Sounds]  [🌬️ Breathe]    │   ← 3 persistent shortcuts
├─────────────────────────────────────────────────┤
│  Your Sleep Last Night                          │
│  ⭐⭐⭐ "3/5 — rough night"           [→]       │   ← From morning check-in
│  "Box breathing may help tonight"               │   ← Data-driven suggestion
├─────────────────────────────────────────────────┤
│  7-Day Streak Calendar (horizontal strip)       │
│  ● ● ● ● ● ● ○                                 │
└─────────────────────────────────────────────────┘
```

**Key rules:**
- The Primary Action Card is always one tap to start. No sub-menus. No "choose a session length." A default is pre-set. Advanced options are available after tapping, not before.
- "Rescue Me" is always present. It launches the 4-7-8 immediately. No loading, no choice. The user is in distress — they need the thing, not a menu about the thing.
- The sleep quality card appears only if the user completed a morning check-in. If they didn't, the space shows: "How'd you sleep? [😴 Tap to log]" — a zero-friction entry point.
- The streak calendar is always visible, always the bottom element, never the primary focus. Its presence is felt, not demanded.

### What Must Not Be on the Home Screen

- A content library (move to Library tab)
- Social features / community feed (too stimulating before bed)
- Upsell banners or subscription prompts
- "Trending" or "Popular" content (creates choice paralysis)
- More than one CTA (always one primary action)
- Any red notification badges (red is activating; use indigo or off-white)

***
