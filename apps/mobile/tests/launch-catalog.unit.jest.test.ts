import { describe, expect, it } from "@jest/globals";
import { breathTechniques, launchSoundIds } from "@nidoru/domain";

describe("launch catalog", () => {
  it("keeps the first sleep technique and launch sounds available", () => {
    expect(breathTechniques["4-7-8-sleep"].phases).toHaveLength(3);
    expect(launchSoundIds).toContain("light-rain");
  });

  it("defines coherent breathing as the Daily Calm steady cadence", () => {
    expect(breathTechniques["coherent-breathing"].primaryContext).toBe(
      "Daily Calm / steady practice",
    );
    expect(breathTechniques["coherent-breathing"].phases).toEqual([
      { name: "inhale", durationMs: 5500 },
      { name: "exhale", durationMs: 5500 },
    ]);
  });
});
