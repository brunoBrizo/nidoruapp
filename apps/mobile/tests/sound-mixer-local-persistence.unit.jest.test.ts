import { describe, expect, it, jest } from "@jest/globals";

import {
  loadSoundMixerSavedMixesLocally,
  saveSoundMixerMixLocally,
  type SoundMixerLocalPersistenceDatabase,
} from "../src/sleep/sound-mixer-local-persistence";

function createMockDatabase() {
  const database: SoundMixerLocalPersistenceDatabase & {
    readonly getAllAsync: jest.MockedFunction<SoundMixerLocalPersistenceDatabase["getAllAsync"]>;
    readonly getFirstAsync: jest.MockedFunction<
      SoundMixerLocalPersistenceDatabase["getFirstAsync"]
    >;
    readonly runAsync: jest.MockedFunction<SoundMixerLocalPersistenceDatabase["runAsync"]>;
  } = {
    getAllAsync: jest.fn<SoundMixerLocalPersistenceDatabase["getAllAsync"]>().mockResolvedValue([]),
    getFirstAsync: jest
      .fn<SoundMixerLocalPersistenceDatabase["getFirstAsync"]>()
      .mockResolvedValue(null),
    runAsync: jest
      .fn<SoundMixerLocalPersistenceDatabase["runAsync"]>()
      .mockResolvedValue(undefined),
  };

  return database;
}

const savedMixRecord = {
  createdAt: "2026-05-28T12:00:00.000Z",
  layers: [
    { soundId: "light-rain", volume: 72 },
    { soundId: "brown-noise", volume: 58 },
  ],
  localInstallId: "install_0123456789abcdef",
  mixId: "soundmix_0123456789abcdef",
  name: "  Rain Hearth  ",
  timerPreference: 30,
  updatedAt: "2026-05-28T12:00:00.000Z",
} as const;

describe("sound mixer local persistence", () => {
  it("loads saved mixes scoped to the local install with ordered layers", async () => {
    const database = createMockDatabase();
    database.getAllAsync.mockResolvedValue([
      {
        created_at: "2026-05-28T12:00:00.000Z",
        layer_position: 0,
        local_install_id: "install_0123456789abcdef",
        mix_id: "soundmix_0123456789abcdef",
        name: "Rain Hearth",
        sound_id: "light-rain",
        timer_preference: "30",
        updated_at: "2026-05-28T12:05:00.000Z",
        volume: 72,
      },
      {
        created_at: "2026-05-28T12:00:00.000Z",
        layer_position: 1,
        local_install_id: "install_0123456789abcdef",
        mix_id: "soundmix_0123456789abcdef",
        name: "Rain Hearth",
        sound_id: "brown-noise",
        timer_preference: "30",
        updated_at: "2026-05-28T12:05:00.000Z",
        volume: 58,
      },
    ]);

    await expect(
      loadSoundMixerSavedMixesLocally(database, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toEqual([
      {
        createdAt: "2026-05-28T12:00:00.000Z",
        layers: [
          { soundId: "light-rain", volume: 72 },
          { soundId: "brown-noise", volume: 58 },
        ],
        localInstallId: "install_0123456789abcdef",
        mixId: "soundmix_0123456789abcdef",
        name: "Rain Hearth",
        timerPreference: 30,
        updatedAt: "2026-05-28T12:05:00.000Z",
      },
    ]);

    expect(database.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE sound_mixer_saved_mixes.local_install_id = ?"),
      ["install_0123456789abcdef"],
    );
  });

  it("saves a validated mix in one transaction before inserting its layers", async () => {
    const database = createMockDatabase();
    database.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ saved_mix_count: 2 });

    await saveSoundMixerMixLocally(database, savedMixRecord);

    expect(database.runAsync).toHaveBeenNthCalledWith(1, "BEGIN IMMEDIATE;");
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO sound_mixer_saved_mixes"),
      [
        "soundmix_0123456789abcdef",
        "install_0123456789abcdef",
        "Rain Hearth",
        "30",
        "2026-05-28T12:00:00.000Z",
        "2026-05-28T12:00:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("DELETE FROM sound_mixer_saved_mix_layers"),
      ["soundmix_0123456789abcdef"],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("INSERT INTO sound_mixer_saved_mix_layers"),
      ["soundmix_0123456789abcdef", 0, "light-rain", 72],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining("INSERT INTO sound_mixer_saved_mix_layers"),
      ["soundmix_0123456789abcdef", 1, "brown-noise", 58],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(6, "COMMIT;");
  });

  it("allows replacing an existing mix at capacity without creating a fourth record", async () => {
    const database = createMockDatabase();
    database.getFirstAsync
      .mockResolvedValueOnce({ local_install_id: "install_0123456789abcdef" })
      .mockResolvedValueOnce({ saved_mix_count: 2 });

    await saveSoundMixerMixLocally(database, {
      ...savedMixRecord,
      mixId: "soundmix_existing123456",
      name: "Forest Rain",
    });

    expect(database.getFirstAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("mix_id != ?"),
      ["install_0123456789abcdef", "soundmix_existing123456"],
    );
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("ON CONFLICT(mix_id) DO UPDATE SET"),
      expect.arrayContaining(["soundmix_existing123456", "Forest Rain"]),
    );
  });

  it("rejects a fourth new mix before writing rows", async () => {
    const database = createMockDatabase();
    database.getFirstAsync
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ saved_mix_count: 3 });

    await expect(saveSoundMixerMixLocally(database, savedMixRecord)).rejects.toThrow(
      /up to 3 saved mixes/,
    );

    expect(database.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO sound_mixer_saved_mixes"),
      expect.anything(),
    );
  });

  it("rejects attempts to replace a mix owned by another local install", async () => {
    const database = createMockDatabase();
    database.getFirstAsync.mockResolvedValueOnce({ local_install_id: "install_otherinstall123" });

    await expect(saveSoundMixerMixLocally(database, savedMixRecord)).rejects.toThrow(
      /another local install/,
    );

    expect(database.runAsync).not.toHaveBeenCalled();
  });
});
