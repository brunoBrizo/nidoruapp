# Graph Report - sleep-app  (2026-05-20)

## Corpus Check
- 70 files · ~137,018 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 142 nodes · 101 edges · 5 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]

## God Nodes (most connected - your core abstractions)
1. `getAppEnvironment()` - 5 edges
2. `captureExplicitEvent()` - 5 edges
3. `runSqliteMigrations()` - 5 edges
4. `SqliteCliDatabase` - 4 edges
5. `selectHomePrimaryAction()` - 4 edges
6. `isNonProductionEnvironment()` - 4 edges
7. `capturePostHogProofEvent()` - 4 edges
8. `runSqlite()` - 3 edges
9. `HomeEntrancePolish()` - 3 edges
10. `createLocalHomeState()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `initializeSentry()` --calls--> `getAppEnvironment()`  [INFERRED]
  apps/mobile/src/observability/sentry.ts → apps/mobile/src/observability/environment.ts
- `openMigratedLocalDatabase()` --calls--> `runSqliteMigrations()`  [INFERRED]
  apps/mobile/src/storage/local-database.ts → apps/mobile/src/storage/sqlite-migrations.ts
- `HomeEntrancePolish()` --calls--> `useReduceMotionPreference()`  [INFERRED]
  apps/mobile/src/home/home-screen.tsx → apps/mobile/src/motion/use-reduce-motion-enabled.ts
- `createLocalHomeState()` --calls--> `createHomeOverview()`  [INFERRED]
  apps/mobile/src/home/home-actions.ts → apps/mobile/src/home/home-state.ts
- `captureSentry()` --calls--> `captureSentryProofError()`  [INFERRED]
  apps/mobile/src/app/observability-proof.tsx → apps/mobile/src/observability/sentry.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (11): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), capturePostHog(), captureSentry(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent() (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (8): openMigratedLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite(), SqliteCliDatabase, validateMigrations()

### Community 2 - "Community 2"
Cohesion: 0.38
Nodes (4): getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), useReduceMotionEnabled(), useReduceMotionPreference()

### Community 3 - "Community 3"
Cohesion: 0.43
Nodes (5): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), createHomeOverview()

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (2): isDefaultPrevented(), onPress()

## Knowledge Gaps
- **Thin community `Community 4`** (5 nodes): `getTabIndicatorMotionConfig()`, `isDefaultPrevented()`, `onLongPress()`, `onPress()`, `app-tab-bar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 3 inferred relationships involving `getAppEnvironment()` (e.g. with `initializeSentry()` and `captureSentryProofError()`) actually correct?**
  _`getAppEnvironment()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `runSqliteMigrations()` (e.g. with `openMigratedLocalDatabase()` and `.execAsync()`) actually correct?**
  _`runSqliteMigrations()` has 2 INFERRED edges - model-reasoned connections that need verification._