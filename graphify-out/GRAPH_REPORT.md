# Graph Report - sleep-app  (2026-05-28)

## Corpus Check
- 170 files · ~500,449 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 602 nodes · 688 edges · 22 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 83 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 38|Community 38]]

## God Nodes (most connected - your core abstractions)
1. `getBreathSessionSnapshot()` - 14 edges
2. `createSoundMixerController()` - 13 edges
3. `captureAnalyticsEventDeferred()` - 10 edges
4. `syncPostValueLocalRecords()` - 10 edges
5. `createPostValueSupabaseClient()` - 9 edges
6. `loadPostRewardPaywallEligibility()` - 8 edges
7. `linkPostValueAccount()` - 8 edges
8. `requestNotificationPermissionFromGate()` - 8 edges
9. `createSyncTableError()` - 7 edges
10. `loadRouteState()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `clampSoundMixerVolume()` --calls--> `calculateSoundMixerVolumeFromPoint()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/sleep/sound-mixer-screen.tsx
- `clampSoundMixerVolume()` --calls--> `getSoundMixerVolumeDetent()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/sleep/sound-mixer-screen.tsx
- `createSoundMixerController()` --calls--> `createInitialSoundMixerController()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/sleep/sound-mixer-screen.tsx
- `canPromptForNotificationPermission()` --calls--> `evaluateGate()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-gate-controller.tsx
- `getNextEveningReminderDate()` --calls--> `reconcileEveningReminderSchedule()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-service.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (35): activateSoundMixerLayer(), assertLaunchSoundId(), assertSoundMixerStateLabel(), assertSoundMixerTimerPreference(), clampEveningReminderMinuteOfDay(), clampSoundMixerVolume(), createLocalDateAtMinuteOfDay(), createPersonalizedOnboardingPlan() (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (27): canPromptForNotificationPermission(), getOnboardingPlanForGoal(), completeFirstSessionLocally(), completeOnboardingPersonalizationLocally(), createDefaultRandomSegment(), createLocalEventId(), createLocalReflectionId(), getLocalCalendarDayDifference() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (25): clamp(), completeBreathSessionIfDue(), createBreathSessionController(), endBreathSessionEarly(), getBreathSessionSnapshot(), getCycleDurationMs(), getPhaseAtElapsedMs(), getSessionPhases() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (13): captureAudioFailedDeferred(), captureAnalyticsEventDeferred(), captureSyncFailureDeferred(), captureRescueMeSoundHandoffAudioFailedDeferred(), captureSoundMixSavedDeferred(), createSoundMixerLayerAnalyticsProperties(), createSoundMixerSoundAnalyticsProperties(), getSoundMixerTimerOptionFromDurationSeconds() (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (15): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), HomeScreen(), markRescueMeTapIfNeeded() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (15): fetch(), loadRouteState(), createPostValueSupabaseAuthenticator(), createPostValueSupabaseClient(), createPostValueSyncHttpError(), createSupabaseHeaders(), createSupabaseServiceUrl(), createSupabaseStorageKey() (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (13): calculateSoundMixerVolumeFromPoint(), createInitialSoundMixerController(), createSavedMixFromRecord(), formatSoundMixerTimerDuration(), formatSoundMixerTimerPreference(), getDomainSavedMixes(), getInitialActiveLayersForVariant(), getInitialSavedMixes() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (13): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), ObservabilityProofScreen(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent(), containsSensitiveToken() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): completeWindDownRunLocally(), createLocalEventId(), getInitialRecoveryState(), insertWindDownEventQueue(), loadLatestRecoverableWindDownRun(), parseWindDownRunRow(), recordWindDownStartedLocally(), saveWindDownStepProgressLocally() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (9): openAndMigrateLocalDatabase(), openMigratedLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite(), SqliteCliDatabase (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (6): shouldStartFirstLaunchOnboarding(), hasCompletedOnboardingPersonalization(), getOrCreateLocalInstallIdentity(), OnboardingContinueButton(), padTimeNumber(), submitError()

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (8): AppTabBar(), getTabIndicatorMotionConfig(), NotificationPermissionGateScreen(), splitHeadline(), getOnboardingSplashOrbPulseConfig(), OnboardingSplashScreen(), useReduceMotionEnabled(), useReduceMotionPreference()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (13): classifySyncError(), createBreathSessionSyncPayloads(), createSoundMixSyncPayloads(), createSyncTableError(), createWindDownRunSyncPayloads(), getFailedRecordType(), markSoundMixesSyncedLocally(), parseSoundMixerTimerPreference() (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (12): createBlockedEligibility(), formatDurationLabel(), getEligibleReason(), isPostSessionFeeling(), linkPostValueAccount(), loadPostRewardPaywallEligibility(), mapLocalRecordsToUser(), parseUserId() (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.35
Nodes (10): abandonBreathSessionLocally(), completeBreathSessionLocally(), createLocalEventId(), insertBreathSessionEventQueue(), loadPendingBreathSessionCompletion(), loadRecoverableBreathSessionDraft(), parseSourceFilterInput(), recordBreathSessionStartedLocally() (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.47
Nodes (4): assertCondition(), assertEquals(), assertNoAuditRiskPublicCopy(), assertThrows()

### Community 19 - "Community 19"
Cohesion: 0.6
Nodes (5): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parseFirstLaunch(), parsePlanId(), parseTechniqueId()

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (2): loadSoundMixerSavedMixesLocally(), parseSoundMixerTimerPreference()

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (3): TabLayout(), allowsIncompleteOnboardingForRoute(), parseFirstLaunch()

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (2): getLocaleMessages(), normalizeLocale()

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (2): OnboardingRouteScreen(), parseOnboardingStage()

## Knowledge Gaps
- **Thin community `Community 21`** (5 nodes): `sound-mixer-local-persistence.ts`, `createSoundMixerSavedMixId()`, `loadSoundMixerSavedMixesLocally()`, `parseSoundMixerTimerPreference()`, `saveSoundMixerMixLocally()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (4 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`, `expectClassNameContains()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (3 nodes): `getLocaleMessages()`, `normalizeLocale()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (3 nodes): `onboarding.tsx`, `OnboardingRouteScreen()`, `parseOnboardingStage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getOrCreateLocalInstallIdentity()` connect `Community 10` to `Community 1`, `Community 5`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `loadRouteState()` connect `Community 5` to `Community 9`, `Community 10`, `Community 13`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `evaluateGate()` connect `Community 1` to `Community 10`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `getBreathSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getBreathSessionSnapshot()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `captureAnalyticsEventDeferred()` (e.g. with `captureSoundMixSavedDeferred()` and `captureRescueMeSoundHandoffAudioFailedDeferred()`) actually correct?**
  _`captureAnalyticsEventDeferred()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `createPostValueSupabaseClient()` (e.g. with `loadRouteState()` and `createClient()`) actually correct?**
  _`createPostValueSupabaseClient()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._