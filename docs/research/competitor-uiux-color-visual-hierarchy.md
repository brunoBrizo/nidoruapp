## Part 5: The Color System and Visual Hierarchy

Related docs:

- Use [Design System](../design/design-system.md) for the current tokenized visual system.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for screen-level usage.
- Use [Competitor UI/UX Response Plan](competitor-uiux-response-plan.md) for the actionable competitor response.
- Use [Product Bible Index](../product-bible-index.md) for the broader source hierarchy.

### Color Psychology for Sleep + Breathwork

Color is not only aesthetic preference; it changes perceived mood, brightness, and trust. Treat color psychology as design input, not as a health claim: the palette should feel quiet in a dark room without claiming cortisol suppression, parasympathetic activation, or sleep treatment.[^45]

| Color | Hex | Role | Why |
|---|---|---|---|
| Deep Night | `#0D0F1A` | Primary background | Near-black indigo reduces perceived brightness versus pure white apps |
| Midnight Blue | `#0F1230` | Secondary background | Depth layer behind glassmorphism cards |
| Iris | `#7C6FCD` | Primary interactive / orb core | Purple = creativity + calm; not activating like blue |
| Lavender | `#A89CE0` | Hover states, active indicators | Lighter sister to Iris |
| Haze | `#4A4E6A` | Inactive / secondary text | Low-contrast for non-critical UI in dark mode |
| Cloud | `#E8E6F2` | Primary text | Off-white; pure white creates visual tension |
| Mist | `#B8B4CC` | Secondary text, placeholders | Low-visual-weight metadata |
| Dusk Gold | `#E8C97A` | Morning mode accent | Warm light wavelength for morning context |
| Ember | `#FF6B6B` | Error states only | Never decorative; reserved for system errors |
| Glass | `rgba(255,255,255,0.07)` | Card borders | Glassmorphism edge highlight |

**The critical rule:** Never use pure white (`#FFFFFF`) as a text color. The contrast against `#0D0F1A` is too high and creates visual tension in a dark room. Cloud (`#E8E6F2`) delivers readability with less perceived glare — important for users using the app before sleep.[^46]

### Typography Hierarchy

- **Display** (greeting, session name): 28–32px, weight 600, letter-spacing -0.5px. Rounded typeface (e.g., Nunito, DM Sans, or Poppins). Rounded letterforms signal approachability and echo Headspace's design principle of "nothing sharp or intense".[^9]
- **Body** (descriptions, labels): 16px, weight 400, line-height 1.6. Never below 14px in the app — cognitive load increases significantly below 14px in low-light environments.
- **Caption** (metadata, timestamps): 12–13px, weight 400, Mist color (`#B8B4CC`).
- **CTA buttons**: 15px, weight 600, all-caps for primary actions only. Secondary actions never all-caps.

### The 60-30-10 Color Rule Applied

- **60%**: `#0D0F1A` and `#0F1230` — the background system
- **30%**: `#4A4E6A` to `#B8B4CC` — all mid-tier UI (cards, labels, dividers)
- **10%**: `#7C6FCD` (Iris) — the only color with full saturation; used exclusively for interactive elements, the orb, and active states[^45]

Any screen that violates this ratio — too much purple, too many saturated elements — will feel stimulating rather than calming. Iris must earn its use.

***
