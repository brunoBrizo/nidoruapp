import { soundMixerLimits } from "@nidoru/domain";
import {
  localInstallIdSchema,
  soundMixerSavedMixRecordSchema,
  type SoundMixerSavedMixRecord,
} from "@nidoru/validation";

export type SoundMixerLocalPersistenceBindValue = string | number | null;

export type SoundMixerLocalPersistenceDatabase = {
  getAllAsync<Row>(
    source: string,
    params?: readonly SoundMixerLocalPersistenceBindValue[],
  ): Promise<Row[]>;
  getFirstAsync<Row>(
    source: string,
    params?: readonly SoundMixerLocalPersistenceBindValue[],
  ): Promise<Row | null>;
  runAsync(
    source: string,
    params?: readonly SoundMixerLocalPersistenceBindValue[],
  ): Promise<unknown>;
};

type SoundMixerSavedMixRow = {
  readonly created_at: string;
  readonly layer_position: number | null;
  readonly local_install_id: string;
  readonly mix_id: string;
  readonly name: string;
  readonly sound_id: string | null;
  readonly timer_preference: string;
  readonly updated_at: string;
  readonly volume: number | null;
};

type SavedMixOwnerRow = {
  readonly local_install_id: string;
};

type SavedMixCountRow = {
  readonly saved_mix_count: number;
};

type MutableSavedMixRecord = Omit<SoundMixerSavedMixRecord, "layers"> & {
  layers: SoundMixerSavedMixRecord["layers"][number][];
};

export async function loadSoundMixerSavedMixesLocally(
  database: SoundMixerLocalPersistenceDatabase,
  input: { readonly localInstallId: string },
): Promise<SoundMixerSavedMixRecord[]> {
  const localInstallId = localInstallIdSchema.parse(input.localInstallId);
  const rows = await database.getAllAsync<SoundMixerSavedMixRow>(
    `
      SELECT
        sound_mixer_saved_mixes.mix_id,
        sound_mixer_saved_mixes.local_install_id,
        sound_mixer_saved_mixes.name,
        sound_mixer_saved_mixes.timer_preference,
        sound_mixer_saved_mixes.created_at,
        sound_mixer_saved_mixes.updated_at,
        sound_mixer_saved_mix_layers.layer_position,
        sound_mixer_saved_mix_layers.sound_id,
        sound_mixer_saved_mix_layers.volume
      FROM sound_mixer_saved_mixes
      LEFT JOIN sound_mixer_saved_mix_layers
        ON sound_mixer_saved_mix_layers.mix_id = sound_mixer_saved_mixes.mix_id
      WHERE sound_mixer_saved_mixes.local_install_id = ?
      ORDER BY
        sound_mixer_saved_mixes.updated_at DESC,
        sound_mixer_saved_mixes.created_at DESC,
        sound_mixer_saved_mix_layers.layer_position ASC;
    `,
    [localInstallId],
  );
  const recordsById = new Map<string, MutableSavedMixRecord>();

  for (const row of rows) {
    const existingRecord = recordsById.get(row.mix_id);
    const record =
      existingRecord ??
      ({
        createdAt: row.created_at,
        layers: [],
        localInstallId: row.local_install_id,
        mixId: row.mix_id,
        name: row.name,
        timerPreference: parseSoundMixerTimerPreference(row.timer_preference),
        updatedAt: row.updated_at,
      } satisfies MutableSavedMixRecord);

    if (!existingRecord) {
      recordsById.set(row.mix_id, record);
    }

    if (row.sound_id !== null && row.volume !== null) {
      record.layers.push({
        soundId: row.sound_id as SoundMixerSavedMixRecord["layers"][number]["soundId"],
        volume: row.volume,
      });
    }
  }

  return Array.from(recordsById.values()).map((record) =>
    soundMixerSavedMixRecordSchema.parse(record),
  );
}

export async function saveSoundMixerMixLocally(
  database: SoundMixerLocalPersistenceDatabase,
  input: SoundMixerSavedMixRecord,
): Promise<void> {
  const savedMixRecord = soundMixerSavedMixRecordSchema.parse(input);
  const ownerRow = await database.getFirstAsync<SavedMixOwnerRow>(
    `
      SELECT local_install_id
      FROM sound_mixer_saved_mixes
      WHERE mix_id = ?
      LIMIT 1;
    `,
    [savedMixRecord.mixId],
  );

  if (ownerRow && ownerRow.local_install_id !== savedMixRecord.localInstallId) {
    throw new Error("Cannot replace a sound mixer saved mix from another local install.");
  }

  await database.runAsync("BEGIN IMMEDIATE;");

  try {
    const countRow = await database.getFirstAsync<SavedMixCountRow>(
      `
        SELECT COUNT(*) AS saved_mix_count
        FROM sound_mixer_saved_mixes
        WHERE local_install_id = ?
          AND mix_id != ?;
      `,
      [savedMixRecord.localInstallId, savedMixRecord.mixId],
    );

    if ((countRow?.saved_mix_count ?? 0) >= soundMixerLimits.maxSavedMixes) {
      throw new Error("Sound mixer supports up to 3 saved mixes.");
    }

    await database.runAsync(
      `
        INSERT INTO sound_mixer_saved_mixes (
          mix_id,
          local_install_id,
          name,
          timer_preference,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(mix_id) DO UPDATE SET
          name = excluded.name,
          timer_preference = excluded.timer_preference,
          updated_at = excluded.updated_at
        WHERE sound_mixer_saved_mixes.local_install_id = excluded.local_install_id;
      `,
      [
        savedMixRecord.mixId,
        savedMixRecord.localInstallId,
        savedMixRecord.name,
        String(savedMixRecord.timerPreference),
        savedMixRecord.createdAt,
        savedMixRecord.updatedAt,
      ],
    );
    await database.runAsync(
      `
        DELETE FROM sound_mixer_saved_mix_layers
        WHERE mix_id = ?;
      `,
      [savedMixRecord.mixId],
    );

    for (const [index, layer] of savedMixRecord.layers.entries()) {
      await database.runAsync(
        `
          INSERT INTO sound_mixer_saved_mix_layers (
            mix_id,
            layer_position,
            sound_id,
            volume
          )
          VALUES (?, ?, ?, ?);
        `,
        [savedMixRecord.mixId, index, layer.soundId, layer.volume],
      );
    }

    await database.runAsync("COMMIT;");
  } catch (error) {
    await database.runAsync("ROLLBACK;").catch(() => undefined);
    throw error;
  }
}

export function createSoundMixerSavedMixId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  const rawSegment = randomUuid
    ? randomUuid.replaceAll("-", "_")
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
  const randomSegment = rawSegment.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return `soundmix_${paddedSegment}`;
}

function parseSoundMixerTimerPreference(
  value: string,
): SoundMixerSavedMixRecord["timerPreference"] {
  if (value === "infinity") {
    return value;
  }

  const parsedValue = Number(value);

  if (parsedValue === 20 || parsedValue === 30 || parsedValue === 45 || parsedValue === 60) {
    return parsedValue;
  }

  throw new Error(`Unsupported sound mixer timer: ${value}`);
}
