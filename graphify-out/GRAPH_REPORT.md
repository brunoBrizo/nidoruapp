# Graph Report - sleep-app  (2026-05-20)

## Corpus Check
- 99 files · ~212,640 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 274 nodes · 275 edges · 14 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]

## God Nodes (most connected - your core abstractions)
1. `requestNotificationPermissionFromGate()` - 8 edges
2. `getFirstSessionSnapshot()` - 8 edges
3. `loadPostRewardPaywallEligibility()` - 7 edges
4. `linkPostValueAccount()` - 7 edges
5. `evaluateGate()` - 7 edges
6. `createPersonalizedOnboardingPlan()` - 5 edges
7. `getNextEveningReminderDate()` - 5 edges
8. `getAppEnvironment()` - 5 edges
9. `captureExplicitEvent()` - 5 edges
10. `runSqliteMigrations()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `getOnboardingPlanForGoal()` --calls--> `completeOnboardingPersonalizationLocally()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/onboarding/local-first-onboarding.ts
- `canPromptForNotificationPermission()` --calls--> `evaluateGate()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-gate-controller.tsx
- `getNextEveningReminderDate()` --calls--> `reconcileEveningReminderSchedule()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-service.ts
- `initializeSentry()` --calls--> `getAppEnvironment()`  [INFERRED]
  apps/mobile/src/observability/sentry.ts → apps/mobile/src/observability/environment.ts
- `captureAnalyticsEvent()` --calls--> `requestNotificationPermissionFromGate()`  [INFERRED]
  apps/mobile/src/observability/posthog.ts → apps/mobile/src/notifications/notification-permission-service.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (22): canPromptForNotificationPermission(), completeFirstSessionLocally(), completeOnboardingPersonalizationLocally(), createDefaultRandomSegment(), createLocalEventId(), createLocalReflectionId(), getLocalCalendarDayDifference(), getOrCreateLocalInstallIdentity() (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (9): openMigratedLocalDatabase(), openDefaultLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite(), SqliteCliDatabase (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (12): clamp(), completeFirstSessionIfDue(), createFirstSessionDraftFromSnapshot(), endFirstSessionEarly(), getCycleDurationMs(), getFirstSessionSnapshot(), getPhaseAtElapsedMs(), pauseFirstSession() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (11): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), capturePostHog(), captureSentry(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (11): clampEveningReminderMinuteOfDay(), createLocalDateAtMinuteOfDay(), createPersonalizedOnboardingPlan(), formatWindDownTime(), getInstructionDepthForFamiliarity(), getLocalMinuteOfDay(), getNextEveningReminderDate(), getOnboardingPlanForGoal() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (12): createBlockedEligibility(), formatDurationLabel(), getEligibleReason(), isPostSessionFeeling(), linkPostValueAccount(), loadPostRewardPaywallEligibility(), mapLocalRecordsToUser(), parseUserId() (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.27
Nodes (6): getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), NotificationPermissionGateScreen(), splitHeadline(), useReduceMotionEnabled(), useReduceMotionPreference()

### Community 7 - "Community 7"
Cohesion: 0.43
Nodes (5): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), createHomeOverview()

### Community 8 - "Community 8"
Cohesion: 0.7
Nodes (4): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parsePlanId(), parseTechniqueId()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (2): isDefaultPrevented(), onPress()

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (2): createPostValueSupabaseAuthenticator(), isConfiguredPublicValue()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (1): assertCondition()

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (2): getLocaleMessages(), normalizeLocale()

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

## Knowledge Gaps
- **Thin community `Community 9`** (5 nodes): `getTabIndicatorMotionConfig()`, `isDefaultPrevented()`, `onLongPress()`, `onPress()`, `app-tab-bar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (5 nodes): `post-value-supabase-auth.ts`, `createPostValueSupabaseAuthenticator()`, `getOrCreateAnonymousUserId()`, `isConfiguredPublicValue()`, `startProviderLink()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (4 nodes): `assertCondition()`, `assertEquals()`, `index.test.ts`, `index.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (3 nodes): `getLocaleMessages()`, `normalizeLocale()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (3 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `evaluateGate()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `requestNotificationPermissionFromGate()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `captureAnalyticsEvent()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requestNotificationPermissionFromGate()` (e.g. with `markNotificationPermissionPrompted()` and `captureAnalyticsEvent()`) actually correct?**
  _`requestNotificationPermissionFromGate()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getFirstSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getFirstSessionSnapshot()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `evaluateGate()` (e.g. with `getOrCreateLocalInstallIdentity()` and `mapSystemNotificationPermissionState()`) actually correct?**
  _`evaluateGate()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._