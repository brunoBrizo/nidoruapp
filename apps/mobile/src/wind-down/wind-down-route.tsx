import {
  resolveWindDownRoutine,
  type WindDownContextGoal,
  type WindDownRoutine,
} from "@nidoru/domain";
import type { SQLiteDatabase } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

import { getOrCreateLocalInstallIdentity } from "../storage/local-install-identity";
import { openMigratedLocalDatabase } from "../storage/local-database";
import {
  loadRememberedWindDownContextChoiceLocally,
  recordWindDownStartedLocally,
  saveRememberedWindDownContextChoiceLocally,
  type WindDownLocalPersistenceDatabase,
} from "./wind-down-local-persistence";
import { WindDownScreen, type WindDownActiveRoutineView } from "./wind-down-screen";

type WindDownRouteState =
  | { readonly status: "preparing" }
  | {
      readonly database: WindDownLocalPersistenceDatabase;
      readonly localInstallId: string;
      readonly status: "quick_context";
    }
  | {
      readonly activeRoutine: WindDownActiveRoutineView;
      readonly status: "active";
    };

type WindDownBootstrap = {
  readonly database: WindDownLocalPersistenceDatabase;
  readonly localInstallId: string;
};

export function WindDownRoute() {
  const [routeState, setRouteState] = useState<WindDownRouteState>({ status: "preparing" });

  const startRoutine = useCallback(
    async ({
      bootstrap,
      goal,
      rememberChoice,
    }: {
      readonly bootstrap: WindDownBootstrap;
      readonly goal: WindDownContextGoal;
      readonly rememberChoice: boolean;
    }) => {
      const selectedAt = new Date().toISOString();
      const resolution = resolveWindDownRoutine({ selectedGoal: goal });

      if (rememberChoice) {
        await saveRememberedWindDownContextChoiceLocally(bootstrap.database, {
          contextGoal: goal,
          localInstallId: bootstrap.localInstallId,
          routineId: resolution.routine.id,
          selectedAt,
        });
      }

      await recordWindDownStartedLocally(bootstrap.database, {
        ambientSoundId: resolution.routine.ambient.soundId,
        contextGoal: resolution.routine.contextGoal,
        localInstallId: bootstrap.localInstallId,
        routineId: resolution.routine.id,
        runId: createWindDownRunId(),
        startedAt: selectedAt,
      });

      setRouteState({
        activeRoutine: createActiveRoutineView(resolution.routine),
        status: "active",
      });
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    openMigratedLocalDatabase()
      .then(async (database) => {
        const localDatabase = createWindDownLocalPersistenceDatabase(database);
        const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });
        const rememberedChoice = await loadRememberedWindDownContextChoiceLocally(localDatabase, {
          localInstallId,
        });

        if (!isMounted) {
          return;
        }

        if (!rememberedChoice) {
          setRouteState({
            database: localDatabase,
            localInstallId,
            status: "quick_context",
          });
          return;
        }

        const rememberedResolution = resolveWindDownRoutine({
          rememberedGoal: rememberedChoice.contextGoal,
        });

        await recordWindDownStartedLocally(localDatabase, {
          ambientSoundId: rememberedResolution.routine.ambient.soundId,
          contextGoal: rememberedResolution.routine.contextGoal,
          localInstallId,
          routineId: rememberedResolution.routine.id,
          runId: createWindDownRunId(),
          startedAt: new Date().toISOString(),
        });

        if (isMounted) {
          setRouteState({
            activeRoutine: createActiveRoutineView(rememberedResolution.routine),
            status: "active",
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setRouteState({ status: "preparing" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (routeState.status === "active") {
    return <WindDownScreen activeRoutine={routeState.activeRoutine} state="active" />;
  }

  if (routeState.status === "quick_context") {
    return (
      <WindDownScreen
        onSelectGoal={(goal) => {
          void startRoutine({
            bootstrap: {
              database: routeState.database,
              localInstallId: routeState.localInstallId,
            },
            goal,
            rememberChoice: true,
          });
        }}
        state="quick_context"
      />
    );
  }

  return <WindDownScreen state="preparing" />;
}

function createWindDownLocalPersistenceDatabase(
  database: SQLiteDatabase,
): WindDownLocalPersistenceDatabase {
  return {
    getFirstAsync: (source, values = []) => database.getFirstAsync(source, [...values]),
    runAsync: (source, values = []) => database.runAsync(source, [...values]),
  };
}

function createActiveRoutineView(routine: WindDownRoutine): WindDownActiveRoutineView {
  return {
    breathworkDurationSeconds: routine.breathwork.durationSeconds,
    phaseLabel: "Inhale",
    remainingSeconds: routine.breathwork.durationSeconds,
    soundLabel: routine.ambient.soundLabel,
    uiState: routine.breathwork.uiState,
  };
}

function createWindDownRunId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  const rawSegment = randomUuid
    ? randomUuid.replaceAll("-", "_")
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
  const randomSegment = rawSegment.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return `winddown_${paddedSegment}`;
}
