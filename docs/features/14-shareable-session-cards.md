# Feature: Shareable Session Cards

Phase: Phase 2

## Summary

Shareable session cards turn completed breathwork, comeback moments, challenges, and insight milestones into clean dark visual assets. They support TikTok, Instagram, and word-of-mouth without turning the app into a social network.

## User Stories

- As a user, I want a tasteful way to share that I completed a session.
- As a creator, I want a screen that communicates the value of the app quickly.
- As a user who returned after missing days, I want comeback status framed positively.
- As a privacy-sensitive user, I want sharing to be explicit and never automatic.

## MVP Scope

Phase 2 first version:

- Generate a clean result card after breathwork.
- Include session length, breaths or cycles completed, technique, and streak or comeback status.
- Use Midnight Indigo visual style.
- User explicitly taps to share; no automatic posting.
- Session completion is already saved before share card generation.

## Out Of Scope

- Social feed.
- Public profiles.
- Auto-share.
- Sensitive sleep details on a shared image.
- Complex image editor.

## Acceptance Criteria

- Share card never appears before session completion is persisted.
- Shared content avoids sensitive sleep details by default.
- Visual matches Nidoru dark visual system.
- Card is readable in a short-form video screenshot.
- Sharing is optional and user-initiated.

## UX References

- [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Feature Deep Specs](../product/feature-deep-specs.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)
- [Animation Implementation Review Notes](../engineering/animation-implementation-review-notes.md)

## Data And Backend Needs

- Local session summary already exists.
- Share assets can be generated on-device for MVP.
- Cloudflare R2 can store future share-card templates or assets if needed.
- Do not require backend to create the first share card.

## Analytics Events

No existing analytics event is defined specifically for sharing. If added later, it must be explicit and privacy-reviewed.

## Edge Cases And Failure States

- If image generation fails, keep the completed session saved and show a retry path.
- If sharing is unavailable on device, show card preview only.
- If user has Ghost Mode enabled, avoid streak emphasis by default.
- If user completed Rescue Me, use careful copy and avoid making distress public by default.

## Task Checklist

- [ ] Define share card content rules.
- [ ] Define visual template from design tokens.
- [ ] Build session summary card.
- [ ] Build comeback variant.
- [ ] Build challenge progress variant after the challenge progress model exists.
- [ ] Ensure completion saves before card generation.
- [ ] Add explicit share action.
- [ ] Exclude sensitive sleep details by default.
- [ ] Test screenshot readability.
- [ ] Review sharing copy for privacy and tone.
