# Graph Report - sleep-app  (2026-05-22)

## Corpus Check
- 124 files · ~228,360 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 364 nodes · 390 edges · 18 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `getBreathSessionSnapshot()` - 9 edges
2. `createPostValueSupabaseClient()` - 8 edges
3. `requestNotificationPermissionFromGate()` - 8 edges
4. `loadPostRewardPaywallEligibility()` - 7 edges
5. `linkPostValueAccount()` - 7 edges
6. `evaluateGate()` - 7 edges
7. `createLocalEventId()` - 7 edges
8. `runSqliteMigrations()` - 6 edges
9. `syncPostValueLocalRecords()` - 6 edges
10. `createPersonalizedOnboardingPlan()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `getOnboardingPlanForGoal()` --calls--> `completeOnboardingPersonalizationLocally()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/onboarding/local-first-onboarding.ts
- `canPromptForNotificationPermission()` --calls--> `evaluateGate()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-gate-controller.tsx
- `getNextEveningReminderDate()` --calls--> `reconcileEveningReminderSchedule()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-service.ts
- `fetch()` --calls--> `upsertPostValueRecords()`  [INFERRED]
  supabase/functions/foundation-health/index.ts → apps/mobile/src/paywall/post-value-supabase-auth.ts
- `createClient()` --calls--> `createPostValueSupabaseClient()`  [INFERRED]
  apps/mobile/tests/post-value-sync.unit.jest.test.ts → apps/mobile/src/paywall/post-value-supabase-auth.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (28): shouldStartFirstLaunchOnboarding(), canPromptForNotificationPermission(), completeFirstSessionLocally(), completeOnboardingPersonalizationLocally(), createDefaultRandomSegment(), createLocalEventId(), createLocalReflectionId(), getLocalCalendarDayDifference() (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (18): clamp(), completeBreathSessionIfDue(), createBreathSessionController(), endBreathSessionEarly(), getBreathSessionSnapshot(), getCycleDurationMs(), getPhaseAtElapsedMs(), pauseBreathSession() (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (10): openAndMigrateLocalDatabase(), openMigratedLocalDatabase(), openDefaultLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (12): fetch(), createPostValueSupabaseAuthenticator(), createPostValueSupabaseClient(), createPostValueSyncHttpError(), createSupabaseHeaders(), createSupabaseServiceUrl(), createSupabaseStorageKey(), isAllowedPostValueSyncTarget() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (11): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), capturePostHog(), captureSentry(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (11): clampEveningReminderMinuteOfDay(), createLocalDateAtMinuteOfDay(), createPersonalizedOnboardingPlan(), formatWindDownTime(), getInstructionDepthForFamiliarity(), getLocalMinuteOfDay(), getNextEveningReminderDate(), getOnboardingPlanForGoal() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (12): createBlockedEligibility(), formatDurationLabel(), getEligibleReason(), isPostSessionFeeling(), linkPostValueAccount(), loadPostRewardPaywallEligibility(), mapLocalRecordsToUser(), parseUserId() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.24
Nodes (6): getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), NotificationPermissionGateScreen(), splitHeadline(), useReduceMotionEnabled(), useReduceMotionPreference()

### Community 8 - "Community 8"
Cohesion: 0.35
Nodes (10): abandonBreathSessionLocally(), completeBreathSessionLocally(), createLocalEventId(), insertBreathSessionEventQueue(), loadPendingBreathSessionCompletion(), loadRecoverableBreathSessionDraft(), parseSourceFilterInput(), recordBreathSessionStartedLocally() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (3): captureAudioFailedDeferred(), captureAnalyticsEventDeferred(), captureSyncFailureDeferred()

### Community 10 - "Community 10"
Cohesion: 0.44
Nodes (8): classifySyncError(), createBreathSessionSyncPayloads(), createSyncTableError(), getFailedRecordType(), parseUserId(), syncPostValueLocalRecords(), unwrapSyncCause(), upsertOrThrow()

### Community 11 - "Community 11"
Cohesion: 0.43
Nodes (5): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), createHomeOverview()

### Community 12 - "Community 12"
Cohesion: 0.6
Nodes (5): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parseFirstLaunch(), parsePlanId(), parseTechniqueId()

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (2): isDefaultPrevented(), onPress()

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (1): assertCondition()

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (2): getLocaleMessages(), normalizeLocale()

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (2): OnboardingRouteScreen(), parseOnboardingStage()

## Knowledge Gaps
- **Thin community `Community 13`** (5 nodes): `getTabIndicatorMotionConfig()`, `isDefaultPrevented()`, `onLongPress()`, `onPress()`, `app-tab-bar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (4 nodes): `assertCondition()`, `assertEquals()`, `index.test.ts`, `index.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (3 nodes): `getLocaleMessages()`, `normalizeLocale()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (3 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (3 nodes): `onboarding.tsx`, `OnboardingRouteScreen()`, `parseOnboardingStage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requestNotificationPermissionFromGate()` connect `Community 0` to `Community 4`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `captureAnalyticsEvent()` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `openMigratedLocalDatabase()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `getBreathSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getBreathSessionSnapshot()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `requestNotificationPermissionFromGate()` (e.g. with `markNotificationPermissionPrompted()` and `captureAnalyticsEvent()`) actually correct?**
  _`requestNotificationPermissionFromGate()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._