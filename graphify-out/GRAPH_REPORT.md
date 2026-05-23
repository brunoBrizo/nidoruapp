# Graph Report - sleep-app  (2026-05-23)

## Corpus Check
- 135 files · ~276,363 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 402 nodes · 430 edges · 20 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 24|Community 24]]

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
Cohesion: 0.1
Nodes (24): clamp(), completeBreathSessionIfDue(), createBreathSessionController(), endBreathSessionEarly(), getBreathSessionSnapshot(), getCycleDurationMs(), getPhaseAtElapsedMs(), getSessionPhases() (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (26): canPromptForNotificationPermission(), completeFirstSessionLocally(), completeOnboardingPersonalizationLocally(), createDefaultRandomSegment(), createLocalEventId(), createLocalReflectionId(), getLocalCalendarDayDifference(), insertLocalEventQueue() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (12): fetch(), createPostValueSupabaseAuthenticator(), createPostValueSupabaseClient(), createPostValueSyncHttpError(), createSupabaseHeaders(), createSupabaseServiceUrl(), createSupabaseStorageKey(), isAllowedPostValueSyncTarget() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (11): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), capturePostHog(), captureSentry(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (9): HomeBreathingOrb(), getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), markRescueMeTapIfNeeded(), NotificationPermissionGateScreen(), splitHeadline(), markRescueMeHomeTap(), useReduceMotionEnabled() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (9): openAndMigrateLocalDatabase(), openMigratedLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite(), SqliteCliDatabase (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (11): clampEveningReminderMinuteOfDay(), createLocalDateAtMinuteOfDay(), createPersonalizedOnboardingPlan(), formatWindDownTime(), getInstructionDepthForFamiliarity(), getLocalMinuteOfDay(), getNextEveningReminderDate(), getOnboardingPlanForGoal() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (12): createBlockedEligibility(), formatDurationLabel(), getEligibleReason(), isPostSessionFeeling(), linkPostValueAccount(), loadPostRewardPaywallEligibility(), mapLocalRecordsToUser(), parseUserId() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (4): captureAudioFailedDeferred(), captureAnalyticsEventDeferred(), captureSyncFailureDeferred(), captureRescueMeSoundHandoffAudioFailedDeferred()

### Community 9 - "Community 9"
Cohesion: 0.35
Nodes (10): abandonBreathSessionLocally(), completeBreathSessionLocally(), createLocalEventId(), insertBreathSessionEventQueue(), loadPendingBreathSessionCompletion(), loadRecoverableBreathSessionDraft(), parseSourceFilterInput(), recordBreathSessionStartedLocally() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.44
Nodes (8): classifySyncError(), createBreathSessionSyncPayloads(), createSyncTableError(), getFailedRecordType(), parseUserId(), syncPostValueLocalRecords(), unwrapSyncCause(), upsertOrThrow()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (3): shouldStartFirstLaunchOnboarding(), hasCompletedOnboardingPersonalization(), getOrCreateLocalInstallIdentity()

### Community 12 - "Community 12"
Cohesion: 0.43
Nodes (5): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), createHomeOverview()

### Community 13 - "Community 13"
Cohesion: 0.6
Nodes (5): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parseFirstLaunch(), parsePlanId(), parseTechniqueId()

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (2): isDefaultPrevented(), onPress()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (3): TabLayout(), allowsIncompleteOnboardingForRoute(), parseFirstLaunch()

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (1): assertCondition()

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (2): getLocaleMessages(), normalizeLocale()

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (2): OnboardingRouteScreen(), parseOnboardingStage()

## Knowledge Gaps
- **Thin community `Community 14`** (5 nodes): `getTabIndicatorMotionConfig()`, `isDefaultPrevented()`, `onLongPress()`, `onPress()`, `app-tab-bar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (4 nodes): `assertCondition()`, `assertEquals()`, `index.test.ts`, `index.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (3 nodes): `getLocaleMessages()`, `normalizeLocale()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (3 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (3 nodes): `onboarding.tsx`, `OnboardingRouteScreen()`, `parseOnboardingStage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requestNotificationPermissionFromGate()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `captureAnalyticsEvent()` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `openMigratedLocalDatabase()` connect `Community 5` to `Community 1`, `Community 11`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `getBreathSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getBreathSessionSnapshot()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `requestNotificationPermissionFromGate()` (e.g. with `markNotificationPermissionPrompted()` and `captureAnalyticsEvent()`) actually correct?**
  _`requestNotificationPermissionFromGate()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._