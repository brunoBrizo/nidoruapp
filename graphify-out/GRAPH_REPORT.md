# Graph Report - sleep-app  (2026-05-25)

## Corpus Check
- 158 files · ~428,551 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 473 nodes · 485 edges · 20 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)
1. `getBreathSessionSnapshot()` - 12 edges
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
- `canPromptForNotificationPermission()` --calls--> `evaluateGate()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-gate-controller.tsx
- `getNextEveningReminderDate()` --calls--> `reconcileEveningReminderSchedule()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-service.ts
- `fetch()` --calls--> `upsertPostValueRecords()`  [INFERRED]
  supabase/functions/foundation-health/index.ts → apps/mobile/src/paywall/post-value-supabase-auth.ts
- `getOnboardingPlanForGoal()` --calls--> `completeOnboardingPersonalizationLocally()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/onboarding/local-first-onboarding.ts
- `openMigratedLocalDatabase()` --calls--> `openDefaultLocalDatabase()`  [INFERRED]
  apps/mobile/src/storage/local-database.ts → apps/mobile/src/notifications/notification-permission-gate-controller.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (24): clamp(), completeBreathSessionIfDue(), createBreathSessionController(), endBreathSessionEarly(), getBreathSessionSnapshot(), getCycleDurationMs(), getPhaseAtElapsedMs(), getSessionPhases() (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (25): canPromptForNotificationPermission(), completeFirstSessionLocally(), createDefaultRandomSegment(), createLocalEventId(), createLocalReflectionId(), getLocalCalendarDayDifference(), insertLocalEventQueue(), insertNotificationPermissionEvent() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (10): AppTabBar(), getTabIndicatorMotionConfig(), getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), markRescueMeTapIfNeeded(), NotificationPermissionGateScreen(), splitHeadline(), markRescueMeHomeTap() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (12): fetch(), createPostValueSupabaseAuthenticator(), createPostValueSupabaseClient(), createPostValueSyncHttpError(), createSupabaseHeaders(), createSupabaseServiceUrl(), createSupabaseStorageKey(), isAllowedPostValueSyncTarget() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (11): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), capturePostHog(), captureSentry(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (12): clampEveningReminderMinuteOfDay(), createLocalDateAtMinuteOfDay(), createPersonalizedOnboardingPlan(), formatWindDownTime(), getInstructionDepthForFamiliarity(), getLocalMinuteOfDay(), getNextEveningReminderDate(), getOnboardingPlanForGoal() (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (9): openAndMigrateLocalDatabase(), openMigratedLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite(), SqliteCliDatabase (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (12): createBlockedEligibility(), formatDurationLabel(), getEligibleReason(), isPostSessionFeeling(), linkPostValueAccount(), loadPostRewardPaywallEligibility(), mapLocalRecordsToUser(), parseUserId() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (9): completeWindDownRunLocally(), createLocalEventId(), getInitialRecoveryState(), insertWindDownEventQueue(), loadLatestRecoverableWindDownRun(), parseWindDownRunRow(), recordWindDownStartedLocally(), saveWindDownStepProgressLocally() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (4): captureAudioFailedDeferred(), captureAnalyticsEventDeferred(), captureSyncFailureDeferred(), captureRescueMeSoundHandoffAudioFailedDeferred()

### Community 10 - "Community 10"
Cohesion: 0.35
Nodes (10): abandonBreathSessionLocally(), completeBreathSessionLocally(), createLocalEventId(), insertBreathSessionEventQueue(), loadPendingBreathSessionCompletion(), loadRecoverableBreathSessionDraft(), parseSourceFilterInput(), recordBreathSessionStartedLocally() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.44
Nodes (8): classifySyncError(), createBreathSessionSyncPayloads(), createSyncTableError(), getFailedRecordType(), parseUserId(), syncPostValueLocalRecords(), unwrapSyncCause(), upsertOrThrow()

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (3): shouldStartFirstLaunchOnboarding(), hasCompletedOnboardingPersonalization(), getOrCreateLocalInstallIdentity()

### Community 13 - "Community 13"
Cohesion: 0.43
Nodes (5): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), createHomeOverview()

### Community 16 - "Community 16"
Cohesion: 0.6
Nodes (5): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parseFirstLaunch(), parsePlanId(), parseTechniqueId()

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (3): TabLayout(), allowsIncompleteOnboardingForRoute(), parseFirstLaunch()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (1): assertCondition()

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (2): getLocaleMessages(), normalizeLocale()

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (2): OnboardingRouteScreen(), parseOnboardingStage()

## Knowledge Gaps
- **Thin community `Community 19`** (4 nodes): `assertCondition()`, `assertEquals()`, `index.test.ts`, `index.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (3 nodes): `getLocaleMessages()`, `normalizeLocale()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (3 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (3 nodes): `onboarding.tsx`, `OnboardingRouteScreen()`, `parseOnboardingStage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requestNotificationPermissionFromGate()` connect `Community 1` to `Community 4`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `captureAnalyticsEvent()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `openMigratedLocalDatabase()` connect `Community 6` to `Community 1`, `Community 12`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `getBreathSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getBreathSessionSnapshot()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `requestNotificationPermissionFromGate()` (e.g. with `markNotificationPermissionPrompted()` and `captureAnalyticsEvent()`) actually correct?**
  _`requestNotificationPermissionFromGate()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._