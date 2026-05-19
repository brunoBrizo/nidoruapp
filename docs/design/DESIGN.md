---
name: Nidoru Ether
colors:
  surface: '#11131e'
  surface-dim: '#11131e'
  surface-bright: '#373845'
  surface-container-lowest: '#0c0e18'
  surface-container-low: '#191b26'
  surface-container: '#1d1f2b'
  surface-container-high: '#272935'
  surface-container-highest: '#323440'
  on-surface: '#e1e1f2'
  on-surface-variant: '#c9c4d3'
  inverse-surface: '#e1e1f2'
  inverse-on-surface: '#2e303c'
  outline: '#928f9d'
  outline-variant: '#484551'
  surface-tint: '#c8bfff'
  primary: '#c8bfff'
  on-primary: '#2f1e7c'
  primary-container: '#9184e4'
  on-primary-container: '#281575'
  inverse-primary: '#5e51ad'
  secondary: '#70d5e5'
  on-secondary: '#00363d'
  secondary-container: '#2f9eae'
  on-secondary-container: '#002f35'
  tertiary: '#e2c375'
  on-tertiary: '#3d2e00'
  tertiary-container: '#c5a85d'
  on-tertiary-container: '#503d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5deff'
  primary-fixed-dim: '#c8bfff'
  on-primary-fixed: '#190064'
  on-primary-fixed-variant: '#463893'
  secondary-fixed: '#99f0ff'
  secondary-fixed-dim: '#70d5e5'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#ffdf91'
  tertiary-fixed-dim: '#e2c375'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#11131e'
  on-background: '#e1e1f2'
  surface-variant: '#323440'
  background-gradient-start: '#0d0f1a'
  background-gradient-end: '#0f1230'
  glass-surface: rgba(20, 23, 43, 0.7)
  glass-chip: rgba(255, 255, 255, 0.05)
  silk-border: rgba(255, 255, 255, 0.08)
  orb-glow: '#a89ce0'
  text-muted: '#8a8fa8'
  text-bright: '#e8e6f2'
typography:
  display-greeting:
    fontFamily: Nunito Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-card:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-main:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  metric-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  caption-tiny:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  base: 8px
  sm: 12px
  gutter: 16px
  container-padding: 20px
  md: 24px
  lg: 40px
---

## Brand & Style
Nidoru Ether is a wellness and sleep-focused brand designed to evoke a sense of "Living Atmosphere." The personality is compassionate, gentle, and quiet, targeting users seeking evening wind-downs and emotional regulation.

The design style is a sophisticated blend of **Glassmorphism** and **Atmospheric Layering**. It moves away from flat surfaces toward a "deep space" aesthetic, utilizing backdrop blurs, subtle particles, and animated orbs to create a sense of presence and calm. The UI should feel like it is floating within a low-contrast, nocturnal environment, where light is emitted rather than reflected.

## Colors
The palette is deeply rooted in nocturnal blues and soft violets. The background is not a flat color but a vertical gradient from a deep obsidian to a midnight navy. 

Primary accents utilize a soft lavender-purple (`#7C6FCD`) to signify activity and focus. Secondary and tertiary colors are used sparingly for status and variety. A critical component of this palette is the "Atmospheric Tint"—a very low-opacity version of the primary color used for particle effects and soft glows. Text contrast is intentionally softened; pure white is avoided in favor of "Bright Silver" (`#E8E6F2`) for headers and "Muted Slate" (`#8A8FA8`) for secondary information to reduce eye strain in dark environments.

## Typography
The system uses **Nunito Sans** for its friendly, rounded terminals which contribute to the "approachable" brand persona. This is used for all primary storytelling and card headers. **Inter** is employed as a functional secondary font for labels, metadata, and buttons to provide high legibility and a slight technical grounding.

Letter spacing is tightened for large display headers to maintain cohesion, while uppercase labels receive a generous 5% tracking to ensure clarity and a premium "editorial" feel.

## Layout & Spacing
The layout follows a **Fluid Grid** model designed for mobile-first containment. The maximum content width is capped at 480px for larger screens to maintain a compact, intimate feel.

The rhythm is driven by an 8px base unit. Standard horizontal page margins are set to 20px (`container-padding`). Content is grouped into sections with `lg` (40px) vertical separation, while elements within a section use `base` (8px) or `sm` (12px) spacing. The layout relies heavily on vertical stacking and a 3-column grid for secondary actions.

## Elevation & Depth
Elevation is expressed through **translucency and blurs** rather than traditional Y-axis shadows.

1.  **The Canvas:** A background gradient with a particle overlay at 5-10% opacity.
2.  **The Glass Layer:** Cards use `glass-card` styling with a 24px backdrop blur and a `silk-border` (a subtle 1px internal top-stroke of white at 12% opacity) to catch "virtual light."
3.  **The High-Focus Layer:** The main "Orb" and primary buttons use vibrant gradients and glow effects to appear as if they are emitting light from within the screen.
4.  **The Navigation Layer:** A high-blur (32px) bottom bar that partially reveals the content passing behind it, grounding the UI.

## Shapes
The shape language is dominated by high-radius curves. Main container cards use a custom 20px radius (`rounded-[20px]`). Smaller interactive elements like chips use 12px (`rounded-xl`). High-action elements like the primary "Begin" button and the navigation indicators are fully pill-shaped. This consistent roundedness reinforces the "soft" and "non-aggressive" nature of the wellness brand.

## Components

### Buttons
- **Primary:** Full pill-shape. Uses a linear gradient from `primary-container` to `primary`. Text is `label-caps`. Includes a trailing icon for momentum.
- **Ghost/Text:** High-tracking `label-caps` in the primary color, used for secondary actions like "View Insight."

### Glass Cards
Large containers with 20px rounded corners. Must include a `silk-border` (internal top stroke) and a 24px backdrop-blur. The background is a semi-transparent dark navy (`rgba(20, 23, 43, 0.7)`).

### Glass Chips
Used for quick actions. 12px rounded corners, 12px backdrop-blur, and a lighter `white/0.06` background to distinguish them from main cards.

### The Breathing Orb
A multi-layered component consisting of a core solid color, a blur-layer glow, and 2-3 concentric stroke-circles with staggered pulse animations.

### Navigation Bar
A fixed bottom element with high blur. Active states are indicated by both a primary color shift and a top-aligned "indicator bar" pill.

### Streak/Rhythm Strip
A horizontal track of 12px circles. Use high-opacity primary for success, low-opacity borders for future states, and a "nested dot" for paused or neutral states.