# Graph Report - sleep-app  (2026-05-28)

## Corpus Check
- 166 files · ~493,229 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 568 nodes · 637 edges · 21 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 37|Community 37]]

## God Nodes (most connected - your core abstractions)
1. `getBreathSessionSnapshot()` - 14 edges
2. `createSoundMixerController()` - 13 edges
3. `captureAnalyticsEventDeferred()` - 9 edges
4. `createPostValueSupabaseClient()` - 9 edges
5. `loadPostRewardPaywallEligibility()` - 8 edges
6. `linkPostValueAccount()` - 8 edges
7. `requestNotificationPermissionFromGate()` - 8 edges
8. `syncPostValueLocalRecords()` - 7 edges
9. `loadRouteState()` - 7 edges
10. `evaluateGate()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `calculateSoundMixerVolumeFromPoint()` --calls--> `clampSoundMixerVolume()`  [INFERRED]
  apps/mobile/src/sleep/sound-mixer-screen.tsx → packages/domain/src/index.ts
- `getSoundMixerVolumeDetent()` --calls--> `clampSoundMixerVolume()`  [INFERRED]
  apps/mobile/src/sleep/sound-mixer-screen.tsx → packages/domain/src/index.ts
- `createInitialSoundMixerController()` --calls--> `createSoundMixerController()`  [INFERRED]
  apps/mobile/src/sleep/sound-mixer-screen.tsx → packages/domain/src/index.ts
- `canPromptForNotificationPermission()` --calls--> `evaluateGate()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-gate-controller.tsx
- `getNextEveningReminderDate()` --calls--> `reconcileEveningReminderSchedule()`  [INFERRED]
  packages/domain/src/index.ts → apps/mobile/src/notifications/notification-permission-service.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (37): activateSoundMixerLayer(), assertLaunchSoundId(), assertSoundMixerStateLabel(), assertSoundMixerTimerPreference(), clampEveningReminderMinuteOfDay(), clampSoundMixerVolume(), createLocalDateAtMinuteOfDay(), createPersonalizedOnboardingPlan() (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (30): shouldStartFirstLaunchOnboarding(), canPromptForNotificationPermission(), getOnboardingPlanForGoal(), completeFirstSessionLocally(), completeOnboardingPersonalizationLocally(), createDefaultRandomSegment(), createLocalEventId(), createLocalReflectionId() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (25): clamp(), completeBreathSessionIfDue(), createBreathSessionController(), endBreathSessionEarly(), getBreathSessionSnapshot(), getCycleDurationMs(), getPhaseAtElapsedMs(), getSessionPhases() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (15): createLocalHomeState(), getLocalMinuteOfDay(), getPrimaryActionIdForMinute(), selectHomePrimaryAction(), getHomeContentEntranceMotionConfig(), HomeEntrancePolish(), HomeScreen(), markRescueMeTapIfNeeded() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (15): fetch(), loadRouteState(), createPostValueSupabaseAuthenticator(), createPostValueSupabaseClient(), createPostValueSyncHttpError(), createSupabaseHeaders(), createSupabaseServiceUrl(), createSupabaseStorageKey() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (8): captureAudioFailedDeferred(), captureAnalyticsEventDeferred(), captureSyncFailureDeferred(), captureRescueMeSoundHandoffAudioFailedDeferred(), captureSoundMixerAudioFailedDeferred(), captureSoundMixerAudioStartedDeferred(), captureWindDownAmbientAudioFailedDeferred(), captureWindDownAmbientAudioStartedDeferred()

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (12): getAppEnvironment(), isNonProductionEnvironment(), isObservabilityProofModeEnabled(), ObservabilityProofScreen(), captureAnalyticsEvent(), captureExplicitEvent(), capturePostHogProofEvent(), containsSensitiveToken() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (10): openAndMigrateLocalDatabase(), openMigratedLocalDatabase(), openDefaultLocalDatabase(), applyMigration(), runSqliteMigrations(), assertCondition(), assertRejects(), runSqlite() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (12): completeWindDownRunLocally(), createLocalEventId(), getInitialRecoveryState(), insertWindDownEventQueue(), loadLatestRecoverableWindDownRun(), parseWindDownRunRow(), recordWindDownStartedLocally(), saveWindDownStepProgressLocally() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (8): AppTabBar(), getTabIndicatorMotionConfig(), NotificationPermissionGateScreen(), splitHeadline(), getOnboardingSplashOrbPulseConfig(), OnboardingSplashScreen(), useReduceMotionEnabled(), useReduceMotionPreference()

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (12): createBlockedEligibility(), formatDurationLabel(), getEligibleReason(), isPostSessionFeeling(), linkPostValueAccount(), loadPostRewardPaywallEligibility(), mapLocalRecordsToUser(), parseUserId() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (3): createInitialSoundMixerController(), getInitialActiveLayersForVariant(), getSavedMixesForVariant()

### Community 12 - "Community 12"
Cohesion: 0.35
Nodes (10): abandonBreathSessionLocally(), completeBreathSessionLocally(), createLocalEventId(), insertBreathSessionEventQueue(), loadPendingBreathSessionCompletion(), loadRecoverableBreathSessionDraft(), parseSourceFilterInput(), recordBreathSessionStartedLocally() (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.42
Nodes (9): classifySyncError(), createBreathSessionSyncPayloads(), createSyncTableError(), createWindDownRunSyncPayloads(), getFailedRecordType(), parseUserId(), syncPostValueLocalRecords(), unwrapSyncCause() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (4): assertCondition(), assertEquals(), assertNoAuditRiskPublicCopy(), assertThrows()

### Community 18 - "Community 18"
Cohesion: 0.6
Nodes (5): BreatheTechniqueAnchorScreen(), parseDurationSeconds(), parseFirstLaunch(), parsePlanId(), parseTechniqueId()

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (2): OnboardingContinueButton(), padTimeNumber()

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (3): TabLayout(), allowsIncompleteOnboardingForRoute(), parseFirstLaunch()

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (2): answerThroughBreathworkQuestion(), continueToNextQuestion()

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (2): getLocaleMessages(), normalizeLocale()

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (2): OnboardingRouteScreen(), parseOnboardingStage()

## Knowledge Gaps
- **Thin community `Community 20`** (5 nodes): `onboarding-flow-screen.tsx`, `cn()`, `OnboardingContinueButton()`, `OnboardingFlowScreen()`, `padTimeNumber()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (4 nodes): `onboarding-personalization-flow.component.jest.test.tsx`, `answerThroughBreathworkQuestion()`, `continueToNextQuestion()`, `expectClassNameContains()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (3 nodes): `getLocaleMessages()`, `normalizeLocale()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `onboarding.tsx`, `OnboardingRouteScreen()`, `parseOnboardingStage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getOrCreateLocalInstallIdentity()` connect `Community 1` to `Community 4`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `loadRouteState()` connect `Community 4` to `Community 1`, `Community 10`, `Community 7`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `evaluateGate()` connect `Community 1` to `Community 7`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `getBreathSessionSnapshot()` (e.g. with `pauseSession()` and `resumeSession()`) actually correct?**
  _`getBreathSessionSnapshot()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `captureAnalyticsEventDeferred()` (e.g. with `captureRescueMeSoundHandoffAudioFailedDeferred()` and `captureWindDownAmbientAudioFailedDeferred()`) actually correct?**
  _`captureAnalyticsEventDeferred()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `createPostValueSupabaseClient()` (e.g. with `loadRouteState()` and `createClient()`) actually correct?**
  _`createPostValueSupabaseClient()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._