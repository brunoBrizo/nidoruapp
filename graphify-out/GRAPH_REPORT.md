# Graph Report - sleep-app  (2026-05-20)

## Corpus Check
- 86 files · ~198,254 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 208 nodes · 175 edges · 10 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `getFirstSessionSnapshot()` - 8 edges
2. `createPersonalizedOnboardingPlan()` - 5 edges
3. `getAppEnvironment()` - 5 edges
4. `captureExplicitEvent()` - 5 edges
5. `runSqliteMigrations()` - 5 edges
6. `SqliteCliDatabase` - 4 edges
7. `selectHomePrimaryAction()` - 4 edges
8. `BreatheTechniqueAnchorScreen()` - 4 edges
9. `isNonProductionEnvironment()` - 4 edges
10. `capturePostHogProofEvent()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `getOnboardingPlanForGoal()` --calls--> `completeOnboardingPersonalizationLocally()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/onboarding/local-first-onboarding.ts
- `initializeSentry()` --calls--> `getAppEnvironment()`  [INFERRED]
  apps/mobile/src/observability/sentry.ts → apps/mobile/src/observability/environment.ts
- `openMigratedLocalDatabase()` --calls--> `runSqliteMigrations()`  [INFERRED]
  apps/mobile/src/storage/local-database.ts → apps/mobile/src/storage/sqlite-migrations.ts
- `HomeEntrancePolish()` --calls--> `useReduceMotionPreference()`  [INFERRED]
  apps/mobile/src/home/home-screen.tsx → apps/mobile/src/motion/use-reduce-motion-enabled.ts
- `createLocalHomeState()` --calls--> `createHomeOverview()`  [INFERRED]
  apps/mobile/src/home/home-actions.ts → apps/mobile/src/home/home-state.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (8): createPersonalizedOnboardingPlan(), formatWindDownTime(), getInstructionDepthForFamiliarity(), getOnboardingPlanForGoal(), normalizeOptionalDisplayName(), completeOnboardingPersonalizationLocally(), createDefaultRandomSegment(), createLocalEventId()

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (11): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), capturePostHog(), captureSentry(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.2
Nodes (12): clamp(), completeFirstSessionIfDue(), createFirstSessionDraftFromSnapshot(), endFirstSessionEarly(), getCycleDurationMs(), getFirstSessionSnapshot(), getPhaseAtElapsedMs(), pauseFirstSession() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (8): openMigratedLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite(), SqliteCliDatabase, validateMigrations()

### Community 4 - "Community 4"
Cohesion: 0.43
Nodes (5): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), createHomeOverview()

### Community 5 - "Community 5"
Cohesion: 0.38
Nodes (4): getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), useReduceMotionEnabled(), useReduceMotionPreference()

### Community 6 - "Community 6"
Cohesion: 0.7
Nodes (4): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parsePlanId(), parseTechniqueId()

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (2): isDefaultPrevented(), onPress()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (1): assertCondition()

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

## Knowledge Gaps
- **Thin community `Community 7`** (5 nodes): `getTabIndicatorMotionConfig()`, `isDefaultPrevented()`, `onLongPress()`, `onPress()`, `app-tab-bar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (4 nodes): `assertCondition()`, `assertEquals()`, `index.test.ts`, `index.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (3 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `getFirstSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getFirstSessionSnapshot()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `getAppEnvironment()` (e.g. with `initializeSentry()` and `captureSentryProofError()`) actually correct?**
  _`getAppEnvironment()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `runSqliteMigrations()` (e.g. with `openMigratedLocalDatabase()` and `.execAsync()`) actually correct?**
  _`runSqliteMigrations()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._