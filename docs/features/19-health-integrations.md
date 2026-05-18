# Feature: Health Integrations

Phase: Future

## Summary

Health integrations are explicitly not in MVP. The app starts with manual morning check-ins because they prove the insight loop without requesting sensitive permissions or delaying launch. HealthKit should be revisited first after the manual loop proves retention.

## User Stories

- As a user with device sleep data, I may eventually want Nidoru to use it for context.
- As a privacy-sensitive user, I do not want health permissions during onboarding.
- As a product team, we want the data model ready for imported sleep context without depending on it.

## MVP Scope

- No HealthKit.
- No Android Health Connect.
- No health permission request.
- Data model remains ready for later imported sleep data.
- Insight cards do not depend on health integrations.

## Out Of Scope

- Health permissions in onboarding.
- Passive microphone sleep tracking.
- Medical diagnosis.
- Required wearable data.
- Health imports before manual check-in retention is proven.

## Acceptance Criteria

- MVP app never requests health permissions.
- Morning check-in works as the primary sleep input.
- Future data model can add imported sleep data without rewriting the core insight model.
- User-facing copy stays non-clinical.

## UX References

- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Product Strategy](../product/product-strategy.md)
- [Assumptions, Risks, and Open Questions](../research/assumptions-risks-open-questions.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)

## Data And Backend Needs

- Keep insight and check-in models extensible for imported sleep context.
- No health tables are required for MVP.
- Later HealthKit proof should happen before Phase 3 commitment.

## Analytics Events

No MVP analytics events.

## Edge Cases And Failure States

- If user expects automatic tracking, explain manual check-in value without overclaiming.
- If HealthKit APIs or permissions change, re-check official docs before implementation.
- If imported data conflicts with manual rating, do not overwrite manual input silently.

## Task Checklist

- [ ] Keep health permissions out of onboarding.
- [ ] Keep health permissions out of MVP app config.
- [ ] Preserve manual check-in as primary input.
- [ ] Review data model before adding imported sleep context.
- [ ] Build throwaway HealthKit proof before Phase 3 implementation.
- [ ] Re-check Android Health Connect after iOS path is stable.
- [ ] Review privacy copy before any health import launch.
