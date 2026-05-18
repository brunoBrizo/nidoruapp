# Feature Specs Index

These files are the execution-ready feature layer for Nidoru. They do not replace the product, UX, architecture, design, or research docs. They point back to those docs and translate the current decisions into feature-scoped requirements and task checklists.

## Source Rules

Use this order when a feature detail conflicts:

1. [Product Bible Index](../product-bible-index.md)
2. [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)
3. [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
4. [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
5. [Animation Source Alignment](../engineering/animation-source-alignment.md)
6. Earlier source archives in `docs/research` and `docs/engineering`

If a conflict is still unresolved, the feature file names it explicitly instead of silently choosing a new product behavior.

## Feature Files

| Phase | Feature | File |
| --- | --- | --- |
| Foundation | Project workspace and setup | [00-project-workspace-foundation.md](00-project-workspace-foundation.md) |
| MVP | App shell, navigation, and Home | [01-app-shell-navigation-home.md](01-app-shell-navigation-home.md) |
| MVP | Onboarding and first session | [02-onboarding-first-session.md](02-onboarding-first-session.md) |
| MVP | Breathing visual pacer and sessions | [03-breathing-visual-pacer.md](03-breathing-visual-pacer.md) |
| MVP | Rescue Me | [04-rescue-me.md](04-rescue-me.md) |
| MVP | Evening wind-down flow | [05-evening-wind-down-flow.md](05-evening-wind-down-flow.md) |
| MVP | Sleep sound mixer and offline audio | [06-sleep-sound-mixer.md](06-sleep-sound-mixer.md) |
| MVP | Morning check-in | [07-morning-check-in.md](07-morning-check-in.md) |
| MVP | Compassionate streak and history | [08-compassionate-streak-history.md](08-compassionate-streak-history.md) |
| MVP | Local-first offline sync | [09-local-first-offline-sync.md](09-local-first-offline-sync.md) |
| MVP | Subscriptions, paywall, and entitlements | [10-subscriptions-paywall-entitlements.md](10-subscriptions-paywall-entitlements.md) |
| MVP | Notifications | [11-notifications.md](11-notifications.md) |
| MVP | Profile, settings, privacy, and support | [12-profile-settings-privacy-support.md](12-profile-settings-privacy-support.md) |
| Phase 2 | Sleep insight cards | [13-sleep-insight-cards.md](13-sleep-insight-cards.md) |
| Phase 2 | Shareable session cards | [14-shareable-session-cards.md](14-shareable-session-cards.md) |
| Phase 2 | Routine builder | [15-routine-builder.md](15-routine-builder.md) |
| Phase 3 | 7-day challenges | [16-seven-day-challenges.md](16-seven-day-challenges.md) |
| Phase 3 | Sleep stories | [17-sleep-stories.md](17-sleep-stories.md) |
| Post-MVP | Free Breathe mode | [18-free-breathe-mode.md](18-free-breathe-mode.md) |
| Future | Health integrations | [19-health-integrations.md](19-health-integrations.md) |
| Future | Watch app | [20-watch-app.md](20-watch-app.md) |

## Standard Feature Sections

Each feature file uses the same sections:

- Summary
- User stories
- MVP scope
- Out of scope
- Acceptance criteria
- UX references
- Engineering references
- Data and backend needs
- Analytics events
- Edge cases and failure states
- Task checklist

Linear issues should be created later from these files, not the other way around.
