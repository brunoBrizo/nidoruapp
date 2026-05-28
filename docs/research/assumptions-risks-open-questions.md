# Assumptions, Risks, and Open Questions

Related docs:

- Use [README](../../README.md) for the project-wide doc map.
- Use [Tech Stack Decision Record](../architecture/tech-stack-proposal.md) for final technical decisions.
- Use [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md) for Nidoru metadata and brand decisions.
- Use [Source Map](source-map.md) for claims that still need re-checking before public use.
- Use [Sleep and Breathwork Technique Audit](sleep-breathwork-technique-audit.md) for technique evidence, safety guardrails, and health-claim boundaries.

## Assumptions Made For This Foundation

- The app is mobile-first.
- The first platform target is iOS and Android through Expo React Native.
- The MVP should prove the ritual loop before investing in sleep stories, health integrations, or watch apps.
- The original blueprint is strategic input, not a fully audited source pack.
- The product should avoid clinical claims and medical positioning.
- The initial backend should stay thinner than the blueprint's full React Native plus NestJS plus Supabase stack unless server complexity proves necessary.

## Ambiguity To Resolve Before Implementation

### Brand Name

Nidoru is the selected working name. The App Store title is `Nidoru`, and the subtitle is `Sleep Sounds & Breathwork`.

Remaining launch checks:

- Reserve the name in App Store Connect.
- Complete final trademark attorney review for the United States, Europe, and Brazil.
- Confirm social handle availability.

### Clinical Positioning

The app can be science-informed, but it should not claim to treat insomnia, anxiety, panic, sleep disorders, or medical conditions. Current evidence supports a wellness product that helps users start a calming bedtime routine, practice low-risk breathing, use preference-based sound masking, and notice self-reported patterns. Stronger clinical claims require a separate clinical product path, clinician review, exclusion/escalation rules, and likely CBT-I-specific scope.

### No-Credit-Card Trial

The newer competitor UI/UX decision is a 14-day full-access trial after the first completed session, with no credit card if technically and commercially feasible. App store subscription mechanics may make no-credit-card trials hard depending on the final payment flow. Validate this before finalizing pricing UX. A shorter 7-day trial remains a later pricing experiment, not the current default.

### Backend Shape

The simplest approach is Supabase plus serverless functions. A full NestJS backend is only justified if subscription, insight, scheduling, or admin needs become complex.

### Audio Rights

The product needs owned or properly licensed ambient audio and stories. Content rights are a launch blocker, not a polish item.

## Simpler Approach Worth Taking

Do not build the whole app implied by the blueprint first.

The smallest useful prototype is:

1. One onboarding path.
2. One 4-7-8 breath session with animation, haptics, and audio cues.
3. One wind-down flow into one ambient sound.
4. One morning check-in.
5. Local persistence.

Only after this feels good should the team add account creation, subscriptions, multiple sounds, and backend persistence.

## Research Gaps

| Gap | Why It Matters | How To Verify |
| --- | --- | --- |
| Competitor complaint frequency | Avoid overfitting to loud individual reviews | Mine recent App Store, Google Play, Reddit, and Trustpilot reviews into tagged counts |
| Pricing willingness | Blueprint gives a range, but users vary by segment | Run paywall tests or landing page pricing tests |
| Viral search volume | TikTok counts move quickly | Refresh TikTok, Reels, Shorts keyword data before launch content spend |
| Audio package choice | Expo audio APIs have changed | Prototype background playback, fade-out, and lock-screen behavior early |
| Health integration path | Libraries and permissions change | Build a throwaway HealthKit import proof before committing Phase 3 scope |
| Store review risk | Background audio and subscriptions can cause review issues | Create an app-store compliance checklist before beta |
| Clinical language | Wellness claims can create trust and legal risk | Review app copy before public launch |
| Technique evidence drift | Breathwork, sleep, and sound research changes over time | Refresh the Sleep and Breathwork Technique Audit before launch copy, clinical-sounding features, or paid acquisition |
| Sound-frequency claims | Colored-noise evidence is weaker than user-preference/masking value | Treat these as preference audio unless a future evidence review supports stronger claims |

## Product Risks

| Risk | Severity | Response |
| --- | --- | --- |
| First session takes too long | High | Start with a 30-second breath demo, continue into a short first full session, then keep personalization to five purposeful questions or fewer. |
| App becomes a content library | High | Keep home focused on one nightly action. |
| Audio reliability disappoints users | High | Treat audio as a core acceptance gate. |
| Subscription anxiety hurts reviews | High | Keep free tier useful and send renewal reminders. |
| Insight cards overclaim causation | Medium | Phrase as observed patterns, not medical truth. |
| Rescue Me is mistaken for crisis support or anxiety treatment | High | Keep copy minimal and non-clinical, avoid panic-treatment wording, and add appropriate escalation/safety guidance before public release. |
| Pacer looks generic | Medium | Invest in animation quality because it is both UX and growth. |
| Backend slows launch | Medium | Start with direct Supabase and serverless functions. |

## Pre-Implementation Decisions

Before writing production code, decide:

1. App name shortlist to validate.
2. Initial visual direction.
3. Whether to start with local-first prototype or backend-connected MVP.
4. Whether account creation exists at all in the first beta.
5. Licensed source files for the accepted launch Sound Mixer sounds.
6. Initial subscription products and whether lifetime is available at launch.
7. Minimum analytics schema.

## Independent Success Criteria

Someone new to the project should be able to use this documentation to answer:

- What is the app?
- Who is it for?
- What is the MVP?
- What is not in V1?
- What differentiates it from Calm, Headspace, Breathwrk, and sleep trackers?
- What should be built first?
- What must be verified before implementation?
- Which assumptions are still unproven?
