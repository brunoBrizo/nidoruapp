# Graph Report - sleep-app  (2026-05-19)

## Corpus Check
- 42 files · ~107,630 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 81 nodes · 60 edges · 4 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]

## God Nodes (most connected - your core abstractions)
1. `getAppEnvironment()` - 5 edges
2. `captureExplicitEvent()` - 5 edges
3. `runSqliteMigrations()` - 5 edges
4. `SqliteCliDatabase` - 4 edges
5. `isNonProductionEnvironment()` - 4 edges
6. `capturePostHogProofEvent()` - 4 edges
7. `runSqlite()` - 3 edges
8. `captureSentryProofError()` - 3 edges
9. `applyMigration()` - 3 edges
10. `assertCondition()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `capturePostHog()` --calls--> `capturePostHogProofEvent()`  [INFERRED]
  apps/mobile/src/app/observability-proof.tsx → apps/mobile/src/observability/posthog.ts
- `initializeSentry()` --calls--> `getAppEnvironment()`  [INFERRED]
  apps/mobile/src/observability/sentry.ts → apps/mobile/src/observability/environment.ts
- `getAppEnvironment()` --calls--> `captureExplicitEvent()`  [INFERRED]
  apps/mobile/src/observability/environment.ts → apps/mobile/src/observability/posthog.ts
- `isNonProductionEnvironment()` --calls--> `capturePostHogProofEvent()`  [INFERRED]
  apps/mobile/src/observability/environment.ts → apps/mobile/src/observability/posthog.ts
- `openMigratedLocalDatabase()` --calls--> `runSqliteMigrations()`  [INFERRED]
  apps/mobile/src/storage/local-database.ts → apps/mobile/src/storage/sqlite-migrations.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (7): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), capturePostHog(), captureSentry(), captureSentryProofError(), initializeSentry()

### Community 1 - "Community 1"
Cohesion: 0.28
Nodes (4): assertCondition(), assertRejects(), runSqlite(), SqliteCliDatabase

### Community 2 - "Community 2"
Cohesion: 0.43
Nodes (4): openMigratedLocalDatabase(), applyMigration(), runSqliteMigrations(), validateMigrations()

### Community 3 - "Community 3"
Cohesion: 0.7
Nodes (4): captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent(), isPostHogConfigured()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getAppEnvironment()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `captureExplicitEvent()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `getAppEnvironment()` (e.g. with `initializeSentry()` and `captureSentryProofError()`) actually correct?**
  _`getAppEnvironment()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `runSqliteMigrations()` (e.g. with `openMigratedLocalDatabase()` and `.execAsync()`) actually correct?**
  _`runSqliteMigrations()` has 2 INFERRED edges - model-reasoned connections that need verification._