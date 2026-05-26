# Graph Report - sleep-app  (2026-05-26)

## Corpus Check
- 157 files · ~423,739 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 488 nodes · 506 edges · 20 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 33|Community 33]]

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
- `createClient()` --calls--> `createPostValueSupabaseClient()`  [INFERRED]
  apps/mobile/tests/post-value-sync.unit.jest.test.ts → apps/mobile/src/paywall/post-value-supabase-auth.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (29): shouldStartFirstLaunchOnboarding(), canPromptForNotificationPermission(), completeFirstSessionLocally(), completeOnboardingPersonalizationLocally(), createDefaultRandomSegment(), createLocalEventId(), createLocalReflectionId(), getLocalCalendarDayDifference() (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (24): clamp(), completeBreathSessionIfDue(), createBreathSessionController(), endBreathSessionEarly(), getBreathSessionSnapshot(), getCycleDurationMs(), getPhaseAtElapsedMs(), getSessionPhases() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (10): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), HomeScreen(), markRescueMeTapIfNeeded() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (12): fetch(), createPostValueSupabaseAuthenticator(), createPostValueSupabaseClient(), createPostValueSyncHttpError(), createSupabaseHeaders(), createSupabaseServiceUrl(), createSupabaseStorageKey(), isAllowedPostValueSyncTarget() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (10): openAndMigrateLocalDatabase(), openMigratedLocalDatabase(), openDefaultLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (11): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), capturePostHog(), captureSentry(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (11): clampEveningReminderMinuteOfDay(), createLocalDateAtMinuteOfDay(), createPersonalizedOnboardingPlan(), formatWindDownTime(), getInstructionDepthForFamiliarity(), getLocalMinuteOfDay(), getNextEveningReminderDate(), getOnboardingPlanForGoal() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (12): createBlockedEligibility(), formatDurationLabel(), getEligibleReason(), isPostSessionFeeling(), linkPostValueAccount(), loadPostRewardPaywallEligibility(), mapLocalRecordsToUser(), parseUserId() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (9): completeWindDownRunLocally(), createLocalEventId(), getInitialRecoveryState(), insertWindDownEventQueue(), loadLatestRecoverableWindDownRun(), parseWindDownRunRow(), recordWindDownStartedLocally(), saveWindDownStepProgressLocally() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (6): AppTabBar(), getTabIndicatorMotionConfig(), NotificationPermissionGateScreen(), splitHeadline(), useReduceMotionEnabled(), useReduceMotionPreference()

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (4): captureAudioFailedDeferred(), captureAnalyticsEventDeferred(), captureSyncFailureDeferred(), captureRescueMeSoundHandoffAudioFailedDeferred()

### Community 11 - "Community 11"
Cohesion: 0.35
Nodes (10): abandonBreathSessionLocally(), completeBreathSessionLocally(), createLocalEventId(), insertBreathSessionEventQueue(), loadPendingBreathSessionCompletion(), loadRecoverableBreathSessionDraft(), parseSourceFilterInput(), recordBreathSessionStartedLocally() (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.44
Nodes (8): classifySyncError(), createBreathSessionSyncPayloads(), createSyncTableError(), getFailedRecordType(), parseUserId(), syncPostValueLocalRecords(), unwrapSyncCause(), upsertOrThrow()

### Community 16 - "Community 16"
Cohesion: 0.6
Nodes (5): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parseFirstLaunch(), parsePlanId(), parseTechniqueId()

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (3): TabLayout(), allowsIncompleteOnboardingForRoute(), parseFirstLaunch()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (2): OnboardingContinueButton(), padTimeNumber()

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (1): assertCondition()

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (2): getLocaleMessages(), normalizeLocale()

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): OnboardingRouteScreen(), parseOnboardingStage()

## Knowledge Gaps
- **Thin community `Community 19`** (5 nodes): `onboarding-flow-screen.tsx`, `cn()`, `OnboardingContinueButton()`, `OnboardingFlowScreen()`, `padTimeNumber()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (4 nodes): `assertCondition()`, `assertEquals()`, `index.test.ts`, `index.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (4 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`, `expectClassNameContains()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (3 nodes): `getLocaleMessages()`, `normalizeLocale()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (3 nodes): `onboarding.tsx`, `OnboardingRouteScreen()`, `parseOnboardingStage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requestNotificationPermissionFromGate()` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `captureAnalyticsEvent()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `submitError()` connect `Community 0` to `Community 10`, `Community 19`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `getBreathSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getBreathSessionSnapshot()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `requestNotificationPermissionFromGate()` (e.g. with `markNotificationPermissionPrompted()` and `captureAnalyticsEvent()`) actually correct?**
  _`requestNotificationPermissionFromGate()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._