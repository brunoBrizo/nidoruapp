import type { SoundMixerSavedMixRecord } from "@nidoru/validation";
import { useCallback, useEffect, useState } from "react";

import { getOrCreateLocalInstallIdentity } from "../onboarding/local-first-onboarding";
import type { LocalFirstOnboardingDatabase } from "../onboarding/local-first-onboarding";
import { openMigratedLocalDatabase } from "../storage/local-database";
import {
  loadSoundMixerSavedMixesLocally,
  saveSoundMixerMixLocally,
  type SoundMixerLocalPersistenceDatabase,
} from "./sound-mixer-local-persistence";
import { SoundMixerScreen, type SoundMixerUIVariant } from "./sound-mixer-screen";

type SoundMixerRouteState = {
  readonly database: SoundMixerLocalPersistenceDatabase;
  readonly localInstallId: string;
  readonly savedMixRecords: readonly SoundMixerSavedMixRecord[];
};

export function SoundMixerRouteScreen({ uiVariant }: { readonly uiVariant: SoundMixerUIVariant }) {
  const [routeState, setRouteState] = useState<SoundMixerRouteState>();

  useEffect(() => {
    let isMounted = true;

    async function prepareSavedMixes() {
      try {
        const database = await openMigratedLocalDatabase();
        const localDatabase: LocalFirstOnboardingDatabase & SoundMixerLocalPersistenceDatabase = {
          getAllAsync: (source, params = []) => database.getAllAsync(source, [...params]),
          getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
          runAsync: (source, params = []) => database.runAsync(source, [...params]),
        };
        const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });
        const savedMixRecords = await loadSoundMixerSavedMixesLocally(localDatabase, {
          localInstallId,
        });

        if (!isMounted) {
          return;
        }

        setRouteState({
          database: localDatabase,
          localInstallId,
          savedMixRecords,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setRouteState(undefined);
      }
    }

    void prepareSavedMixes();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveMix = useCallback(
    async (savedMixRecord: SoundMixerSavedMixRecord) => {
      if (!routeState) {
        return;
      }

      await saveSoundMixerMixLocally(routeState.database, savedMixRecord);
      setRouteState((currentState) =>
        currentState
          ? {
              ...currentState,
              savedMixRecords: upsertSavedMixRecord(currentState.savedMixRecords, savedMixRecord),
            }
          : currentState,
      );
    },
    [routeState],
  );

  return (
    <SoundMixerScreen
      {...(routeState
        ? {
            initialSavedMixRecords: routeState.savedMixRecords,
            localInstallId: routeState.localInstallId,
            onSaveMix: handleSaveMix,
          }
        : {})}
      uiVariant={uiVariant}
    />
  );
}

function upsertSavedMixRecord(
  records: readonly SoundMixerSavedMixRecord[],
  nextRecord: SoundMixerSavedMixRecord,
): readonly SoundMixerSavedMixRecord[] {
  const existingRecordIndex = records.findIndex((record) => record.mixId === nextRecord.mixId);

  if (existingRecordIndex === -1) {
    return [...records, nextRecord];
  }

  return records.map((record, index) => (index === existingRecordIndex ? nextRecord : record));
}
