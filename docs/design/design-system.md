## Part 1: The Full Design System

Related docs:

- Use [Product Bible Index](../product-bible-index.md) for source hierarchy.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for where design tokens are used.
- Use [Motion, Animation, And Haptics](motion-animation-haptics.md) for motion rules tied to the visual system.
- Use [Competitor UI/UX Color Visual Hierarchy](../research/competitor-uiux-color-visual-hierarchy.md) for the research source behind the palette.
- Use [Sleep and Breathwork Technique Audit](../research/sleep-breathwork-technique-audit.md) before turning color, motion, or breathing design rationale into nervous-system or health-effect claims.

Before a single feature is defined, the visual language must be established. Design system decisions made wrong at the start cause months of rework. The following is a complete, buildable design system based on competitor analysis, color psychology research, and dark-mode best practices.

### Color Palette: "Midnight Indigo"

The color strategy is built on a core insight from competitor research: **Calm went with muted blues and created a powerful brand**, but its colors feel dated and corporate in 2026. Headspace deliberately positioned away from the "dreary sea of blues and greys" in mental health apps. The opportunity is to use **deep indigo and violet tones** associated with sleep, twilight, and quiet nighttime context — not the tired teal-navy palette everyone else uses.[^1]

Sleep and color references can inform tone, but do not use the palette as a health claim. Deep purples and navy support a low-brightness bedtime aesthetic, while indigo adds a premium, modern feel that teal can't achieve.[^2][^3]

The full buildable palette, using Material Design principles of dark grey (never pure black) backgrounds:[^4]

**Dark Theme (Primary — Default at Night)**

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Void | `#0D0F1A` | Main screen background |
| Surface | Deep Ink | `#14172B` | Cards, bottom sheets, modals |
| Surface Raised | Midnight | `#1C2040` | Elevated cards, selected states |
| Primary | Iris | `#7C6FCD` | Primary buttons, active icons, breathing orb inner |
| Primary Glow | Lavender | `#A89CE0` | Gradients, glow effects on orb, progress rings |
| Accent | Moonstone | `#5EC4D4` | Success states, streak rings, highlights |
| Accent Warm | Dusk Gold | `#E8C97A` | Sunrise mode, morning screen, achievement badges |
| Text Primary | Cloud | `#EEF0FF` | Main text, headings |
| Text Secondary | Mist | `#8A8FA8` | Supporting text, labels, hints |
| Text Tertiary | Haze | `#4A4E6A` | Inactive icons, placeholder text |
| Danger | Ember | `#FF6B6B` | Errors only — never used in wellness UI |
| Divider | `#1E2236` | — | Subtle borders, separators |

**Light Theme (Optional — Morning Mode)**

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Dawn | `#F7F5FF` | Light mode main background |
| Surface | Parchment | `#FFFFFF` | Cards |
| Primary | Iris (adjusted) | `#6B5EC4` | Buttons, icons (slightly deeper for contrast) |
| Accent | Sky | `#3BB8CA` | Highlights |
| Text Primary | Ink | `#1A1B2E` | Headings and body |
| Text Secondary | Slate | `#5A607A` | Supporting text |

**Important dark mode rules drawn from Material Design research:**

- Never use pure black (`#000000`) — use `#0D0F1A` which reads as natural darkness, not harshness[^5][^4]
- Avoid saturated colors on dark backgrounds — the `Iris` primary is deliberately desaturated and cool to avoid eye strain[^4]
- Use lighter shades of primary colors to indicate elevation: Surface > Surface Raised > further elevation[^4]
- Avoid too many colors. Maximum 4–5 color levels in the entire interface[^4]
- The light/dark theme switch should be automatic based on system time AND user preference toggle[^6]

***

### Typography: "Rounded Sans" System

Based on deep research across 50+ wellness and health app designs:[^7][^8][^9]

**Primary Font: [Nunito](https://fonts.google.com/specimen/Nunito)**
- Open-source, free, available on Google Fonts
- Rounded terminals (the ends of letter strokes are circular, not flat)
- Soft, approachable feeling without being playful — perfect for sleep/wellness
- Excellent legibility at all sizes
- Used across the top wellness and mindfulness brands
- Specifically: "Rounded fonts foster a sense of care and comfort, ideal for mental health or self-care brands"[^7]

**Secondary / Data Font: [Inter](https://fonts.google.com/specimen/Inter)**
- Best font for numeric data on mobile — sleep scores, session durations, streak counts[^8]
- The "data font" — clean, neutral, professional
- Use for: session timers (countdown), score numbers, duration displays, stats

**Type Scale:**

| Role | Font | Size | Weight | Color |
|------|------|------|--------|-------|
| Display | Nunito | 32px | 800 ExtraBold | Cloud `#EEF0FF` |
| H1 | Nunito | 24px | 700 Bold | Cloud |
| H2 | Nunito | 20px | 600 SemiBold | Cloud |
| H3 | Nunito | 17px | 600 SemiBold | Cloud |
| Body Large | Nunito | 16px | 400 Regular | Cloud |
| Body | Nunito | 15px | 400 Regular | Mist `#8A8FA8` |
| Label | Nunito | 13px | 600 SemiBold | Mist |
| Caption | Inter | 12px | 400 Regular | Haze `#4A4E6A` |
| Timer/Score | Inter | 48px+ | 300 Light | Cloud |

**Rule:** Never use more than 2 font families. Never use more than 5 size-weight combinations. Consistent typography is what separates "polished app" from "startup project."

***

### Spacing & Grid System

- Base unit: **8px** (all spacing is multiples of 8: 8, 16, 24, 32, 40, 48)
- Screen horizontal padding: **20px** (not 16 — gives slightly more breathing room on mobile)
- Card border radius: **20px** (soft and modern, not sharp, not overly pill-shaped)
- Button border radius: **14px** for standard buttons, **9999px** for pill/floating buttons
- Bottom navigation height: **80px** (accounts for iPhone home indicator)
- Bottom sheet handle bar: `32px wide × 4px high`, centered, `#2A2E4A` color

***

### Iconography

- Icon set: **Lucide Icons** (open source, React Native compatible, consistent line weight, modern geometric style)
- Icon size: 24px for navigation, 20px for in-list/card icons
- Always pair icons with text labels in navigation (never icon-only tabs — accessibility and clarity)
- Icon color in active state: `Iris #7C6FCD`; inactive: `Haze #4A4E6A`

***

### Shadow & Elevation System (Dark Mode)

In dark mode, shadows don't work visually — you cannot use black shadows on a dark background. Instead, use the Material Design elevation principle: **lighter surface = higher elevation**.[^4]

| Level | Background Color | Use Case |
|-------|-----------------|----------|
| Level 0 | `#0D0F1A` | App background |
| Level 1 | `#14172B` | Cards, list items |
| Level 2 | `#1C2040` | Modals, floating sheets |
| Level 3 | `#22274A` | Tooltips, popovers |
| Accent Glow | Box-shadow `0 0 40px rgba(124, 111, 205, 0.3)` | Breathing orb, CTA buttons |

***

### Motion & Animation Philosophy

The app's motion language should feel like **breathing itself** — smooth, slow, and rhythmic. No snappy, fast transitions. No spring animations that bounce. Every animation should complete in 400–800ms and use `ease-in-out` curves.

Key animation principles:
- **Entrance**: elements fade in (`opacity 0 → 1`) combined with a gentle upward translation (`translateY 12px → 0`), 400ms ease-out
- **Exit**: reverse of entrance, 300ms ease-in
- **Breathing orb**: scale 1.0 → 1.18 over the inhale duration, back to 1.0 over exhale duration, `ease-in-out` — never linear (linear feels mechanical)
- **Progress rings**: stroke-dashoffset animation, 300ms for each percentage change
- **Tab bar active indicator**: slide between positions, 250ms ease-in-out
- **Haptics**: use `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on Expo for inhale transition, `Haptics.ImpactFeedbackStyle.Soft` for exhale (lighter) — this is the single most important detail that makes the breathing pacer feel real

***
