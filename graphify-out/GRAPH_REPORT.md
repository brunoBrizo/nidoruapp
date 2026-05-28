# Graph Report - sleep-app  (2026-05-27)

## Corpus Check
- 164 files · ~487,150 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 526 nodes · 563 edges · 19 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `getBreathSessionSnapshot()` - 14 edges
2. `createPostValueSupabaseClient()` - 9 edges
3. `loadPostRewardPaywallEligibility()` - 8 edges
4. `linkPostValueAccount()` - 8 edges
5. `requestNotificationPermissionFromGate()` - 8 edges
6. `captureAnalyticsEventDeferred()` - 7 edges
7. `syncPostValueLocalRecords()` - 7 edges
8. `loadRouteState()` - 7 edges
9. `evaluateGate()` - 7 edges
10. `createLocalEventId()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `getOnboardingPlanForGoal()` --calls--> `completeOnboardingPersonalizationLocally()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/onboarding/local-first-onboarding.ts
- `canPromptForNotificationPermission()` --calls--> `evaluateGate()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-gate-controller.tsx
- `getNextEveningReminderDate()` --calls--> `reconcileEveningReminderSchedule()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-service.ts
- `fetch()` --calls--> `upsertPostValueRecords()`  [INFERRED]
  supabase/functions/foundation-health/index.ts → apps/mobile/src/paywall/post-value-supabase-auth.ts
- `openMigratedLocalDatabase()` --calls--> `openDefaultLocalDatabase()`  [INFERRED]
  apps/mobile/src/storage/local-database.ts → apps/mobile/src/notifications/notification-permission-gate-controller.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (32): shouldStartFirstLaunchOnboarding(), canPromptForNotificationPermission(), completeFirstSessionLocally(), completeOnboardingPersonalizationLocally(), createDefaultRandomSegment(), createLocalEventId(), createLocalReflectionId(), getLocalCalendarDayDifference() (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (25): clamp(), completeBreathSessionIfDue(), createBreathSessionController(), endBreathSessionEarly(), getBreathSessionSnapshot(), getCycleDurationMs(), getPhaseAtElapsedMs(), getSessionPhases() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (17): AppTabBar(), getTabIndicatorMotionConfig(), getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), markRescueMeTapIfNeeded(), markWindDownTapIfNeeded(), NotificationPermissionGateScreen(), splitHeadline() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (15): fetch(), loadRouteState(), createPostValueSupabaseAuthenticator(), createPostValueSupabaseClient(), createPostValueSyncHttpError(), createSupabaseHeaders(), createSupabaseServiceUrl(), createSupabaseStorageKey() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (12): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), ObservabilityProofScreen(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent(), containsSensitiveToken() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (14): clampEveningReminderMinuteOfDay(), createLocalDateAtMinuteOfDay(), createPersonalizedOnboardingPlan(), formatWindDownTime(), getInstructionDepthForFamiliarity(), getLocalMinuteOfDay(), getNextEveningReminderDate(), getNoHoldFallbackTechniqueId() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (12): completeWindDownRunLocally(), createLocalEventId(), getInitialRecoveryState(), insertWindDownEventQueue(), loadLatestRecoverableWindDownRun(), parseWindDownRunRow(), recordWindDownStartedLocally(), saveWindDownStepProgressLocally() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (6): captureAudioFailedDeferred(), captureAnalyticsEventDeferred(), captureSyncFailureDeferred(), captureRescueMeSoundHandoffAudioFailedDeferred(), captureWindDownAmbientAudioFailedDeferred(), captureWindDownAmbientAudioStartedDeferred()

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (9): openAndMigrateLocalDatabase(), openMigratedLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite(), SqliteCliDatabase (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (12): createBlockedEligibility(), formatDurationLabel(), getEligibleReason(), isPostSessionFeeling(), linkPostValueAccount(), loadPostRewardPaywallEligibility(), mapLocalRecordsToUser(), parseUserId() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.35
Nodes (10): abandonBreathSessionLocally(), completeBreathSessionLocally(), createLocalEventId(), insertBreathSessionEventQueue(), loadPendingBreathSessionCompletion(), loadRecoverableBreathSessionDraft(), parseSourceFilterInput(), recordBreathSessionStartedLocally() (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.42
Nodes (9): classifySyncError(), createBreathSessionSyncPayloads(), createSyncTableError(), createWindDownRunSyncPayloads(), getFailedRecordType(), parseUserId(), syncPostValueLocalRecords(), unwrapSyncCause() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.36
Nodes (6): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), HomeScreen(), createHomeOverview()

### Community 16 - "Community 16"
Cohesion: 0.6
Nodes (5): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parseFirstLaunch(), parsePlanId(), parseTechniqueId()

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (3): assertCondition(), assertEquals(), assertNoAuditRiskPublicCopy()

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (3): TabLayout(), allowsIncompleteOnboardingForRoute(), parseFirstLaunch()

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (2): getLocaleMessages(), normalizeLocale()

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (2): OnboardingRouteScreen(), parseOnboardingStage()

## Knowledge Gaps
- **Thin community `Community 23`** (4 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`, `expectClassNameContains()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (3 nodes): `getLocaleMessages()`, `normalizeLocale()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `onboarding.tsx`, `OnboardingRouteScreen()`, `parseOnboardingStage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getOrCreateLocalInstallIdentity()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `loadRouteState()` connect `Community 3` to `Community 8`, `Community 0`, `Community 9`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `getBreathSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getBreathSessionSnapshot()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `createPostValueSupabaseClient()` (e.g. with `loadRouteState()` and `createClient()`) actually correct?**
  _`createPostValueSupabaseClient()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `requestNotificationPermissionFromGate()` (e.g. with `markNotificationPermissionPrompted()` and `captureAnalyticsEvent()`) actually correct?**
  _`requestNotificationPermissionFromGate()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._