import { describe, expect, it, jest } from "@jest/globals";

import {
  completeOnboardingPersonalizationLocally,
  completeFirstSessionLocally,
  createLocalInstallId,
  getOrCreateLocalInstallIdentity,
  hasCompletedOnboardingPersonalization,
  loadFirstLaunchOnboardingResumeTarget,
  loadNotificationGateReadiness,
  loadPendingPostSessionReflection,
  markNotificationPermissionAccepted,
  markNotificationPermissionDeclined,
  markNotificationPermissionPrompted,
  recordFirstBreathDemoEventLocally,
  recordFirstSessionStartedLocally,
  recordOnboardingStartedLocally,
  savePostSessionReflectionLocally,
  type LocalFirstOnboardingDatabase,
} from "../src/onboarding/local-first-onboarding";

function createMockDatabase(firstRow: Record<string, unknown> | null = null) {
  const database: LocalFirstOnboardingDatabase & {
    readonly runAsync: jest.MockedFunction<LocalFirstOnboardingDatabase["runAsync"]>;
    readonly getFirstAsync: jest.MockedFunction<LocalFirstOnboardingDatabase["getFirstAsync"]>;
  } = {
    runAsync: jest.fn<LocalFirstOnboardingDatabase["runAsync"]>().mockResolvedValue(undefined),
    getFirstAsync: jest
      .fn<LocalFirstOnboardingDatabase["getFirstAsync"]>()
      .mockResolvedValue(firstRow),
  };

  return database;
}

describe("local-first onboarding persistence", () => {
  it("creates local install identity without invoking network, auth, or permissions", async () => {
    const database = createMockDatabase();
    const localInstallId = await getOrCreateLocalInstallIdentity({
      database,
      now: new Date("2026-05-18T02:00:00.000Z"),
      createId: () => "install_0123456789abcdef",
    });

    expect(localInstallId).toBe("install_0123456789abcdef");
    expect(database.getFirstAsync).toHaveBeenCalledWith(
      "SELECT local_install_id FROM local_install_identity ORDER BY created_at LIMIT 1;",
    );
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO local_install_identity"),
      ["install_0123456789abcdef", "2026-05-18T02:00:00.000Z", "2026-05-18T02:00:00.000Z"],
    );
  });

  it("loads and validates an existing local install identity", async () => {
    const database = createMockDatabase({ local_install_id: "install_existing123" });
    const createId = jest.fn(() => "install_new12345678");

    await expect(
      getOrCreateLocalInstallIdentity({
        database,
        now: new Date("2026-05-18T02:00:00.000Z"),
        createId,
      }),
    ).resolves.toBe("install_existing123");
    expect(createId).not.toHaveBeenCalled();
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it("builds install IDs in the allowlisted local format", () => {
    expect(createLocalInstallId(() => "ABC_123-xyz")).toBe("install_ABC_123-xyz");
  });

  it("detects whether the local install already completed onboarding personalization", async () => {
    const completedDatabase = createMockDatabase({ status: "completed" });
    const incompleteDatabase = createMockDatabase(null);

    await expect(
      hasCompletedOnboardingPersonalization(completedDatabase, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toBe(true);
    await expect(
      hasCompletedOnboardingPersonalization(incompleteDatabase, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toBe(false);
    expect(completedDatabase.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("FROM onboarding_responses"),
      ["install_0123456789abcdef"],
    );
  });

  it("resumes first launch at the correct local-first boundary", async () => {
    const completedPersonalizationDatabase = createMockDatabase({
      completed_onboarding_count: 1,
      draft_session_count: 0,
      pending_reflection_count: 0,
      reflected_session_count: 0,
    });
    const pendingReflectionDatabase = createMockDatabase({
      completed_onboarding_count: 0,
      draft_session_count: 0,
      pending_reflection_count: 1,
      reflected_session_count: 0,
    });
    const draftSessionDatabase = createMockDatabase({
      completed_onboarding_count: 0,
      draft_session_count: 1,
      pending_reflection_count: 0,
      reflected_session_count: 0,
    });
    const reflectedSessionDatabase = createMockDatabase({
      completed_onboarding_count: 0,
      draft_session_count: 0,
      pending_reflection_count: 0,
      reflected_session_count: 1,
    });
    const freshInstallDatabase = createMockDatabase({
      completed_onboarding_count: 0,
      draft_session_count: 0,
      pending_reflection_count: 0,
      reflected_session_count: 0,
    });

    await expect(
      loadFirstLaunchOnboardingResumeTarget(completedPersonalizationDatabase, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toBe("home");
    await expect(
      loadFirstLaunchOnboardingResumeTarget(pendingReflectionDatabase, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toBe("first-session");
    await expect(
      loadFirstLaunchOnboardingResumeTarget(draftSessionDatabase, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toBe("first-session");
    await expect(
      loadFirstLaunchOnboardingResumeTarget(reflectedSessionDatabase, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toBe("personalization");
    await expect(
      loadFirstLaunchOnboardingResumeTarget(freshInstallDatabase, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toBe("splash");
    expect(reflectedSessionDatabase.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("reflected_session_count"),
      ["install_0123456789abcdef"],
    );
  });

  it("queues onboarding start and first-breath events with privacy-empty payloads", async () => {
    const database = createMockDatabase();

    await recordOnboardingStartedLocally(database, {
      eventId: "event_onboarding_start",
      localInstallId: "install_0123456789abcdef",
      startedAt: "2026-05-20T01:00:00.000Z",
    });
    await recordFirstBreathDemoEventLocally(database, {
      elapsedSeconds: 0,
      eventId: "event_first_breath_start",
      eventType: "started",
      localInstallId: "install_0123456789abcdef",
      occurredAt: "2026-05-20T01:00:02.000Z",
      queueEventId: "event_first_breath_started_queue",
    });
    await recordFirstBreathDemoEventLocally(database, {
      elapsedSeconds: 30,
      eventId: "event_first_breath_complete",
      eventType: "completed",
      localInstallId: "install_0123456789abcdef",
      occurredAt: "2026-05-20T01:00:32.000Z",
      queueEventId: "event_first_breath_completed_queue",
    });

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        "event_onboarding_start",
        "install_0123456789abcdef",
        "onboarding_started",
        "onboarding_response",
        "install_0123456789abcdef",
        "{}",
        "2026-05-20T01:00:00.000Z",
        "2026-05-20T01:00:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO first_breath_demo_events"),
      [
        "event_first_breath_start",
        "install_0123456789abcdef",
        "started",
        "2026-05-20T01:00:02.000Z",
        0,
      ],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        "event_first_breath_started_queue",
        "install_0123456789abcdef",
        "first_breath_started",
        "first_breath_demo_event",
        "event_first_breath_start",
        "{}",
        "2026-05-20T01:00:02.000Z",
        "2026-05-20T01:00:02.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        "event_first_breath_completed_queue",
        "install_0123456789abcdef",
        "first_breath_completed",
        "first_breath_demo_event",
        "event_first_breath_complete",
        "{}",
        "2026-05-20T01:00:32.000Z",
        "2026-05-20T01:00:32.000Z",
      ],
    );
  });

  it("queues first-session start before completion without sensitive session payloads", async () => {
    const database = createMockDatabase();

    await recordFirstSessionStartedLocally(database, {
      eventId: "event_first_session_started",
      localInstallId: "install_0123456789abcdef",
      sessionId: "session_0123456789abcdef",
      startedAt: "2026-05-20T01:01:00.000Z",
    });

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        "event_first_session_started",
        "install_0123456789abcdef",
        "first_session_started",
        "first_session_record",
        "session_0123456789abcdef",
        "{}",
        "2026-05-20T01:01:00.000Z",
        "2026-05-20T01:01:00.000Z",
      ],
    );
  });

  it("persists first-session completion before queueing the completion event", async () => {
    const database = createMockDatabase();

    await completeFirstSessionLocally(database, {
      localInstallId: "install_0123456789abcdef",
      sessionId: "session_0123456789abcdef",
      status: "completed",
      planId: "general_wellness",
      techniqueId: "coherent-breathing",
      startedAt: "2026-05-18T02:03:00.000Z",
      completedAt: "2026-05-18T02:07:00.000Z",
      durationSeconds: 240,
      completedBreathCycles: 24,
      completionPersistedAt: "2026-05-18T02:07:01.000Z",
    });

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO first_session_records"),
      [
        "session_0123456789abcdef",
        "install_0123456789abcdef",
        "completed",
        "general_wellness",
        "coherent-breathing",
        "2026-05-18T02:03:00.000Z",
        "2026-05-18T02:07:00.000Z",
        240,
        24,
        "2026-05-18T02:07:01.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        expect.stringMatching(/^event_[A-Za-z0-9_-]{8,64}$/),
        "install_0123456789abcdef",
        "first_session_completed",
        "first_session_record",
        "session_0123456789abcdef",
        "{}",
        "2026-05-18T02:07:01.000Z",
        "2026-05-18T02:07:01.000Z",
      ],
    );
  });

  it("rejects a post-session reflection until a completed first-session record exists", async () => {
    const database = createMockDatabase();

    await expect(
      savePostSessionReflectionLocally(database, {
        feeling: "better",
        localInstallId: "install_0123456789abcdef",
        reflectedAt: "2026-05-18T02:08:00.000Z",
        sessionId: "session_0123456789abcdef",
      }),
    ).rejects.toThrow(/completed first-session record/i);

    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it("validates and persists one allowlisted post-session reflection locally", async () => {
    const database = createMockDatabase({
      local_install_id: "install_0123456789abcdef",
      session_id: "session_0123456789abcdef",
    });

    await expect(
      savePostSessionReflectionLocally(database, {
        feeling: "fixed_everything",
        localInstallId: "install_0123456789abcdef",
        reflectedAt: "2026-05-18T02:08:00.000Z",
        sessionId: "session_0123456789abcdef",
      }),
    ).rejects.toThrow();
    expect(database.runAsync).not.toHaveBeenCalled();

    await savePostSessionReflectionLocally(database, {
      feeling: "better",
      localInstallId: "install_0123456789abcdef",
      reflectedAt: "2026-05-18T02:08:00.000Z",
      sessionId: "session_0123456789abcdef",
    });

    expect(database.getFirstAsync).toHaveBeenLastCalledWith(
      expect.stringContaining("status = 'completed'"),
      ["session_0123456789abcdef", "install_0123456789abcdef"],
    );
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO post_session_reflections"),
      [
        expect.stringMatching(/^reflection_[A-Za-z0-9_-]{8,64}$/),
        "install_0123456789abcdef",
        "session_0123456789abcdef",
        "2026-05-18T02:08:00.000Z",
        "better",
      ],
    );
  });

  it("loads a completed first session that still needs post-session reflection after a crash", async () => {
    const database = createMockDatabase({
      completed_at: "2026-05-18T02:07:00.000Z",
      completed_breath_cycles: 24,
      completion_persisted_at: "2026-05-18T02:07:01.000Z",
      duration_seconds: 240,
      local_install_id: "install_0123456789abcdef",
      plan_id: "general_wellness",
      session_id: "session_0123456789abcdef",
      started_at: "2026-05-18T02:03:00.000Z",
      status: "completed",
      technique_id: "coherent-breathing",
    });

    await expect(
      loadPendingPostSessionReflection(database, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toEqual({
      completedAt: "2026-05-18T02:07:00.000Z",
      completedBreathCycles: 24,
      completionPersistedAt: "2026-05-18T02:07:01.000Z",
      durationSeconds: 240,
      localInstallId: "install_0123456789abcdef",
      planId: "general_wellness",
      sessionId: "session_0123456789abcdef",
      startedAt: "2026-05-18T02:03:00.000Z",
      status: "completed",
      techniqueId: "coherent-breathing",
    });
    expect(database.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("post_session_reflections"),
      ["install_0123456789abcdef"],
    );
  });

  it("persists completed personalization answers with a typed local plan recommendation", async () => {
    const database = createMockDatabase();

    await expect(
      completeOnboardingPersonalizationLocally(database, {
        localInstallId: "install_0123456789abcdef",
        startedAt: "2026-05-20T01:00:00.000Z",
        completedAt: "2026-05-20T01:02:00.000Z",
        goal: "anxiety",
        sleepBaseline: 2,
        windDownMinutesAfterMidnight: 21 * 60 + 30,
        breathworkFamiliarity: "yes",
        displayName: " Bruno ",
      }),
    ).resolves.toMatchObject({
      breathworkFamiliarity: "yes",
      displayName: "Bruno",
      goal: "anxiety",
      recommendedPlanId: "anxiety_relief",
      recommendedTechniqueId: "box-breathing",
      sleepBaseline: 2,
      windDownMinutesAfterMidnight: 21 * 60 + 30,
    });

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO onboarding_responses"),
      [
        "install_0123456789abcdef",
        "completed",
        "2026-05-20T01:00:00.000Z",
        "2026-05-20T01:02:00.000Z",
        "anxiety",
        2,
        21 * 60 + 30,
        "yes",
        "Bruno",
        "anxiety_relief",
        "box-breathing",
        240,
        "2026-05-20T01:02:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        expect.stringMatching(/^event_[A-Za-z0-9_-]{8,64}$/),
        "install_0123456789abcdef",
        "onboarding_completed",
        "onboarding_response",
        "install_0123456789abcdef",
        "{}",
        "2026-05-20T01:02:00.000Z",
        "2026-05-20T01:02:00.000Z",
      ],
    );
  });

  it("allows display-name skip but rejects unsafe display names before persistence", async () => {
    const database = createMockDatabase();

    await expect(
      completeOnboardingPersonalizationLocally(database, {
        localInstallId: "install_0123456789abcdef",
        startedAt: "2026-05-20T01:00:00.000Z",
        completedAt: "2026-05-20T01:02:00.000Z",
        goal: "curiosity",
        sleepBaseline: 4,
        windDownMinutesAfterMidnight: 22 * 60 + 30,
        breathworkFamiliarity: "new_to_me",
        displayName: "   ",
      }),
    ).resolves.toMatchObject({
      displayName: undefined,
      recommendedPlanId: "general_wellness",
      recommendedTechniqueId: "coherent-breathing",
    });

    expect(database.runAsync).toHaveBeenCalledTimes(2);

    await expect(
      completeOnboardingPersonalizationLocally(database, {
        localInstallId: "install_0123456789abcdef",
        startedAt: "2026-05-20T01:00:00.000Z",
        completedAt: "2026-05-20T01:02:00.000Z",
        goal: "curiosity",
        sleepBaseline: 4,
        windDownMinutesAfterMidnight: 22 * 60 + 30,
        breathworkFamiliarity: "new_to_me",
        displayName: "A".repeat(41),
      }),
    ).rejects.toThrow();

    expect(database.runAsync).toHaveBeenCalledTimes(2);
  });

  it("loads Day 3 notification gate readiness from local-only state", async () => {
    const database = createMockDatabase({
      completed_session_count: 2,
      first_active_at: "2026-05-18T12:00:00.000Z",
      last_seen_at: "2026-05-20T10:00:00.000Z",
      permission_state: null,
      wind_down_minutes_after_midnight: 20 * 60 + 30,
    });

    await expect(
      loadNotificationGateReadiness({
        database,
        isInOnboarding: false,
        localInstallId: "install_0123456789abcdef",
        now: new Date("2026-05-20T12:00:00.000Z"),
        systemPermissionState: "undetermined",
      }),
    ).resolves.toMatchObject({
      eligibility: {
        completedSessionCount: 2,
        daysSinceFirstActiveDay: 2,
        isInOnboarding: false,
        localInstallId: "install_0123456789abcdef",
        permissionState: "not_shown",
        systemPermissionState: "undetermined",
      },
      windDownMinutesAfterMidnight: 20 * 60 + 30,
    });
    expect(database.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("notification_gate_state"),
      ["install_0123456789abcdef"],
    );
  });

  it("records notification prompted before acceptance events", async () => {
    const database = createMockDatabase();

    await markNotificationPermissionPrompted({
      database,
      eventId: "event_prompted123",
      localInstallId: "install_0123456789abcdef",
      now: new Date("2026-05-20T12:00:00.000Z"),
    });
    await markNotificationPermissionAccepted({
      database,
      eventId: "event_accepted123",
      localInstallId: "install_0123456789abcdef",
      now: new Date("2026-05-20T12:00:01.000Z"),
    });

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("permission_state"),
      expect.arrayContaining(["shown", "2026-05-20T12:00:00.000Z"]),
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("local_event_queue"),
      [
        "event_prompted123",
        "install_0123456789abcdef",
        "notification_permission_prompted",
        "notification_gate_state",
        "install_0123456789abcdef",
        "{}",
        "2026-05-20T12:00:00.000Z",
        "2026-05-20T12:00:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("local_event_queue"),
      [
        "event_accepted123",
        "install_0123456789abcdef",
        "notification_permission_accepted",
        "notification_gate_state",
        "install_0123456789abcdef",
        "{}",
        "2026-05-20T12:00:01.000Z",
        "2026-05-20T12:00:01.000Z",
      ],
    );
  });

  it("records notification pre-permission decline without queueing an OS-prompt event", async () => {
    const database = createMockDatabase();

    await markNotificationPermissionDeclined({
      database,
      localInstallId: "install_0123456789abcdef",
      now: new Date("2026-05-20T12:00:00.000Z"),
    });

    expect(database.runAsync).toHaveBeenCalledTimes(1);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("declined_at"),
      expect.arrayContaining(["declined", "2026-05-20T12:00:00.000Z"]),
    );
  });
});
