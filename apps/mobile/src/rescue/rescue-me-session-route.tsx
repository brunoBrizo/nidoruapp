import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";

import {
  abandonBreathSessionLocally,
  completeBreathSessionLocally,
  loadRecoverableBreathSessionDraft,
  recordBreathSessionStartedLocally,
  saveBreathSessionDraftLocally,
  type BreathSessionLocalPersistenceDatabase,
} from "../session/breath-session-local-persistence";
import { getOrCreateLocalInstallIdentity } from "../storage/local-install-identity";
import { openMigratedLocalDatabase } from "../storage/local-database";
import { RescueMeActiveSessionScreen, RescueMeScreen } from "./rescue-me-screen";

type RescueMeRouteConfig = {
  readonly database?: BreathSessionLocalPersistenceDatabase;
  readonly hasExistingLocalRecord?: boolean;
  readonly initialCompletionMode?: "completed";
  readonly localInstallId: string;
  readonly sessionId: string;
  readonly startedAtMs: number;
};

export function RescueMeSessionRoute() {
  const router = useRouter();
  const [sessionConfig, setSessionConfig] = useState<RescueMeRouteConfig>();

  useEffect(() => {
    let isMounted = true;

    openMigratedLocalDatabase()
      .then((database) => {
        const localDatabase: BreathSessionLocalPersistenceDatabase = {
          getFirstAsync: (source, values = []) => database.getFirstAsync(source, [...values]),
          runAsync: (source, values = []) => database.runAsync(source, [...values]),
        };

        return getOrCreateLocalInstallIdentity({ database: localDatabase }).then((localInstallId) =>
          loadRecoverableBreathSessionDraft(localDatabase, {
            localInstallId,
            source: "rescue_me",
          }).then((draft) => ({
            database: localDatabase,
            hasExistingLocalRecord: Boolean(draft),
            localInstallId,
            sessionId: draft?.sessionId ?? createRescueMeSessionId(),
            startedAtMs: draft ? Date.now() - draft.elapsedDurationMs : Date.now(),
          })),
        );
      })
      .catch(() => ({
        localInstallId: "install_rescuefallback",
        sessionId: createRescueMeSessionId(),
        startedAtMs: Date.now(),
      }))
      .then((nextSessionConfig) => {
        if (isMounted) {
          setSessionConfig(nextSessionConfig);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!sessionConfig) {
    return <RescueMeScreen state="active-launch" />;
  }

  return (
    <RescueMeActiveSessionScreen
      initialCompletionMode={sessionConfig.initialCompletionMode}
      hasExistingLocalRecord={sessionConfig.hasExistingLocalRecord === true}
      localInstallId={sessionConfig.localInstallId}
      onContinueWithSound={() => {
        router.replace("/rescue-me?state=sound-handoff");
      }}
      onReturnHome={() => {
        void Linking.openURL("nidoru://").catch(() => {
          router.navigate("/");
        });
      }}
      persistBreathSessionAbandoned={(record) =>
        sessionConfig.database
          ? abandonBreathSessionLocally(sessionConfig.database, record)
          : Promise.resolve()
      }
      persistBreathSessionCompletion={(record) =>
        sessionConfig.database
          ? completeBreathSessionLocally(sessionConfig.database, record)
          : Promise.resolve()
      }
      persistBreathSessionDraft={(record) =>
        sessionConfig.database
          ? saveBreathSessionDraftLocally(sessionConfig.database, record)
          : Promise.resolve()
      }
      persistBreathSessionStarted={(record) =>
        sessionConfig.database
          ? recordBreathSessionStartedLocally(sessionConfig.database, record)
          : Promise.resolve()
      }
      sessionId={sessionConfig.sessionId}
      startedAtMs={sessionConfig.startedAtMs}
    />
  );
}

function createRescueMeSessionId() {
  const randomSegment =
    globalThis.crypto?.randomUUID?.().replaceAll("-", "_") ??
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
  const sanitizedSegment = randomSegment.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const paddedSegment =
    sanitizedSegment.length >= 8
      ? sanitizedSegment
      : `${sanitizedSegment}${"0".repeat(8 - sanitizedSegment.length)}`;

  return `session_${paddedSegment}`;
}
